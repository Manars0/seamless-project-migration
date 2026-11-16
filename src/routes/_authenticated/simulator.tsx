import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/ui-bits";
import { useAllData, useCurrency } from "@/lib/data";
import { computeOverview, scenarioRecommendation, simulate, type Lang, type ScenarioType } from "@/lib/finance";
import { formatCompact, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/simulator")({
  head: () => ({ meta: [{ title: "Scenario Simulator — FinTwin AI" }, { name: "description", content: "Model decisions before you make them." }, { property: "og:title", content: "Scenario Simulator — FinTwin AI" }, { property: "og:description", content: "Model decisions before you make them." }] }),
  component: Simulator,
});

const TYPES: ScenarioType[] = ["salary_increase", "extra_payment", "new_loan", "investment", "expense_cut"];

function Simulator() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const cur = useCurrency();
  const m = (v: number) => formatMoney(v, cur, lang);
  const d = useAllData();
  const o = useMemo(() => computeOverview(d), [d]);
  const [type, setType] = useState<ScenarioType>("salary_increase");
  const [amount, setAmount] = useState(1000);
  const [run, setRun] = useState<{ type: ScenarioType; amount: number } | null>(null);
  const result = useMemo(() => (run ? simulate(run.type, run.amount, o) : null), [run, o]);
  const baseline = useMemo(() => (run ? simulate(run.type, 0, o) : null), [run, o]);
  const chart = result?.projections.map((p, i) => ({ ...p, baseline: baseline?.projections[i]?.netWorth }));

  return (
    <>
      <PageHeader title={t("simulator.title")} subtitle={t("simulator.subtitle")} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5 shadow-card">
          <CardHeader><CardTitle className="text-lg">{t("simulator.parameters")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1.5 block">{t("simulator.scenarioType")}</Label>
              <div className="grid gap-2">
                {TYPES.map((ty) => (
                  <button key={ty} onClick={() => setType(ty)} className={cn("rounded-lg border px-3 py-2 text-start text-sm transition-colors", type === ty ? "border-primary bg-card font-semibold text-primary shadow-card" : "border-transparent hover:bg-card")}>
                    {t(`simulator.scenarioTypes.${ty}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="amt" className="mb-1.5 block">{t("simulator.params.amount")} ({cur}){type !== "new_loan" && <span className="text-muted-foreground"> {t("common.perMonth")}</span>}</Label>
              <Input id="amt" type="number" min={0} dir="ltr" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <Button className="w-full" onClick={() => setRun({ type, amount })}>{t("simulator.runSimulation")}</Button>
          </CardContent>
        </Card>
        <Card className="min-h-[420px] shadow-card lg:col-span-2">
          {result && chart && run ? (
            <>
              <CardHeader><CardTitle>{t("simulator.projection")} — {t(`simulator.scenarioTypes.${run.type}`)}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[290px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                      <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                      <Tooltip formatter={(v: number) => m(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="netWorth" name={t("simulator.netWorth")} stroke="var(--chart-1)" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="baseline" name={lang === "ar" ? "بدون السيناريو" : "Without scenario"} stroke="var(--muted-foreground)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="savings" name={t("simulator.savings")} stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="debt" name={t("simulator.debt")} stroke="var(--chart-4)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-muted p-4"><p className="text-sm text-muted-foreground">{t("simulator.projectedNetWorth")}</p><p className="num mt-1 text-xl font-bold">{m(result.projectedNetWorth)}</p></div>
                  <div className="rounded-xl bg-muted p-4"><p className="text-sm text-muted-foreground">{lang === "ar" ? "الفرق عن الوضع الحالي" : "Difference vs. today's path"}</p><p className={cn("num mt-1 text-xl font-bold", result.projectedNetWorth - (baseline?.projectedNetWorth ?? 0) >= 0 ? "text-success" : "text-destructive")}>{m(result.projectedNetWorth - (baseline?.projectedNetWorth ?? 0))}</p></div>
                  <div className="rounded-xl bg-muted p-4"><p className="text-sm text-muted-foreground">{t("simulator.riskLevel")}</p><p className={cn("mt-1 text-xl font-bold", result.risk === "high" ? "text-destructive" : result.risk === "medium" ? "text-warning-foreground" : "text-success")}>{t(`simulator.risk.${result.risk}`)}</p></div>
                </div>
                <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium text-primary">{t("simulator.recommendation")}: {scenarioRecommendation(run.type, m(run.amount), lang)}</p>
              </CardContent>
            </>
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center p-6 text-center text-muted-foreground">{t("simulator.noResults")}</div>
          )}
        </Card>
      </div>
    </>
  );
}
