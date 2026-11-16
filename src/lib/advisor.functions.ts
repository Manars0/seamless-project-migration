import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeOverview } from "./finance";

const Input = z.object({
  lang: z.enum(["ar", "en"]),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(30),
});

export const askAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [tx, goals, debts, investments, budgets, profile] = await Promise.all([
      sb.from("transactions").select("*").order("date", { ascending: false }).limit(500),
      sb.from("goals").select("*"),
      sb.from("debts").select("*"),
      sb.from("investments").select("*"),
      sb.from("budgets").select("*"),
      sb.from("profiles").select("full_name,currency").eq("user_id", context.userId).maybeSingle(),
    ]);
    const o = computeOverview({ tx: tx.data ?? [], goals: goals.data ?? [], debts: debts.data ?? [], investments: investments.data ?? [] });
    const currency = profile.data?.currency ?? "SAR";
    const snapshot = {
      currency,
      name: profile.data?.full_name,
      overview: o,
      goals: (goals.data ?? []).map((g) => ({ title: g.title, target: g.target_amount, saved: g.current_amount, deadline: g.deadline, priority: g.priority })),
      debts: (debts.data ?? []).map((d) => ({ name: d.name, type: d.type, remaining: d.remaining_amount, rate: d.interest_rate, monthly: d.monthly_payment, status: d.status })),
      investments: (investments.data ?? []).map((i) => ({ name: i.name, type: i.type, invested: i.amount_invested, value: i.current_value })),
      budgets: (budgets.data ?? []).map((b) => ({ category: b.category, allocated: b.allocated_amount, spent: b.spent_amount, month: b.month })),
    };
    const instructions = `You are FinTwin Advisor, a friendly personal finance assistant. Reply in ${data.lang === "ar" ? "Arabic" : "English"}. Base every answer on the user's real data below; amounts are in ${currency}. Be concise and practical (short paragraphs or bullets, plain text, no markdown headings). If data is missing, say what to add. This is general guidance, not regulated financial advice.\n\nUSER DATA:\n${JSON.stringify(snapshot)}`;

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "AI is not configured." as string, text: "" };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input: data.messages.map((m) => ({ role: m.role, content: m.content })),
        reasoning: { effort: "low" },
        store: false,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      console.error("advisor gateway error", res.status, body.slice(0, 300));
      const msg = res.status === 429 ? "Too many requests, please wait a moment." : res.status === 402 ? "AI credits are used up for this workspace." : "The advisor is unavailable right now.";
      return { error: msg, text: "" };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta" && typeof ev.delta === "string") text += ev.delta;
          if (ev.type === "response.failed" || ev.type === "error") return { error: "The advisor couldn't answer.", text };
        } catch {
          /* partial */
        }
      }
    }
    if (!text.trim()) return { error: "The advisor couldn't answer.", text: "" };
    return { error: null, text };
  });
