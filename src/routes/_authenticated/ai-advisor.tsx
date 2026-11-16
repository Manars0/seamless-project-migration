import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { BrainCircuit, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { askAdvisor } from "@/lib/advisor.functions";
import { useAllData } from "@/lib/data";
import { computeOverview, recommendations, type Lang } from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai-advisor")({
  head: () => ({ meta: [{ title: "AI Advisor — FinTwin AI" }, { name: "description", content: "Chat with an AI advisor that knows your numbers." }, { property: "og:title", content: "AI Advisor — FinTwin AI" }, { property: "og:description", content: "Chat with an AI advisor that knows your numbers." }] }),
  component: Advisor,
});

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

function Advisor() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const ask = useServerFn(askAdvisor);
  const d = useAllData();
  const recs = useMemo(() => recommendations(computeOverview(d), d.debts, d.budgets, lang), [d, lang]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...msgs.filter((m) => !m.error), { role: "user" as const, content: q }];
    setMsgs((p) => [...p, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const r = await ask({ data: { lang, messages: history.slice(-20).map(({ role, content }) => ({ role, content })) } });
      setMsgs((p) => [...p, r.error ? { role: "assistant", content: r.error, error: true } : { role: "assistant", content: r.text }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: t("misc.aiError"), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const prompts = ["budget", "savings", "debt", "invest", "score", "emergency"].map((k) => t(`aiAdvisor.quickPrompts.${k}`));

  return (
    <div className="grid h-[calc(100vh-9rem)] gap-6 lg:grid-cols-3">
      <Card className="flex min-h-0 flex-col overflow-hidden shadow-card lg:col-span-2">
        <div className="flex items-center gap-3 border-b bg-muted/40 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground"><BrainCircuit className="h-5 w-5" /></span>
          <div>
            <h2 className="font-bold">{t("aiAdvisor.advisorName")}</h2>
            <p className="flex items-center gap-1.5 text-xs text-success"><span className="h-2 w-2 animate-pulse rounded-full bg-success" />{t("aiAdvisor.online")}</p>
          </div>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {msgs.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <BrainCircuit className="mb-4 h-12 w-12 text-primary/50" />
              <h3 className="text-xl font-bold">{t("aiAdvisor.welcomeTitle")}</h3>
              <p className="mt-2 max-w-md text-muted-foreground">{t("aiAdvisor.welcomeMessage")}</p>
              <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {prompts.slice(0, 4).map((p) => (
                  <button key={p} onClick={() => void send(p)} className="rounded-xl border p-3 text-start text-sm transition-colors hover:border-primary/40 hover:bg-primary/5">{p}</button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", m.role === "user" ? "bg-primary/15 text-primary" : "bg-success/15 text-success")}>
                {m.role === "user" ? <User className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
              </span>
              <div className={cn("max-w-[80%] whitespace-pre-wrap rounded-2xl p-3.5 text-sm leading-relaxed", m.role === "user" ? "bg-primary text-primary-foreground" : m.error ? "bg-destructive/10 text-destructive" : "bg-muted")}>{m.content}</div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success"><BrainCircuit className="h-4 w-4" /></span>
              <div className="flex items-center gap-1 rounded-2xl bg-muted p-4">
                {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={end} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="flex gap-2 border-t bg-muted/40 p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("aiAdvisor.inputPlaceholder")} className="h-11 flex-1 rounded-full border border-input bg-card px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          <Button type="submit" size="icon" className="h-11 w-11 rounded-full" disabled={!input.trim() || busy} aria-label={t("aiAdvisor.send")}><Send className="rtl:rotate-180" /></Button>
        </form>
      </Card>
      <Card className="hidden min-h-0 flex-col overflow-y-auto bg-muted/30 p-4 shadow-card lg:flex">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-warning" />{t("aiAdvisor.recommendations")}</h3>
        {recs.length === 0 ? <p className="mt-8 text-center text-sm text-muted-foreground">{t("aiAdvisor.noRecommendations")}</p> : (
          <div className="space-y-3">
            {recs.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{r.category}</span>
                  {r.priority === "high" && <span className="h-2 w-2 rounded-full bg-destructive" />}
                </div>
                <h4 className="text-sm font-bold">{r.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                <button onClick={() => void send(r.title)} className="mt-2 text-xs font-medium text-primary hover:underline">{t("aiAdvisor.send")} →</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
