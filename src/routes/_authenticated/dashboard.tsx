import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, BrainCircuit, CreditCard, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, StatCard, Bar, Empty } from "@/components/app/ui-bits";
import { useAllData, useCurrency } from "@/lib/data";
import { calculateScore, computeOverview, pctChange, periodSeries, type Lang } from "@/lib/finance";
import { formatCompact, formatDate, formatMoney } from "@/lib/format";
import { catLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FinTwin AI" }, { name: "description", content: "Your financial overview and AI score." }, { property: "og:title", content: "Dashboard — FinTwin AI" }, { property: "og:description", content: "Your financial overview and AI score." }] }),
  component: Dashboard,
});

function Trend({ value, invert }: { value: number; invert?: boolean }) {
  const { t } = useTranslation();
  const good = invert ? value <= 0 : value >= 0;
  return (
    <span className="text-muted-foreground">
      <span className={cn("num font-semibold", good ? "text-success" : "text-destructive")}>{value >= 0 ? "+" : ""}{value.toFixed(1)}%</span> {t("common.vsLastMonth")}
    </span>
  );
}

function Dashboard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const cur = useCurrency();
  const d = useAllData();
  const o = useMemo(() => computeOverview(d), [d]);
  const score = useMemo(() => calculateScore(o, lang), [o, lang]);
  const series = useMemo(() => periodSeries(d.tx, "monthly", lang), [d.tx, lang]);
  const m = (v: number) => formatMoney(v, cur, lang);

  return (
    <>
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t("dashboard.totalBalance")} value={m(o.totalBalance)} icon={Wallet} />
        <StatCard label={t("dashboard.monthlyIncome")} value={m(o.monthlyIncome)} icon={ArrowUpRight} tone="success" hint={<Trend value={pctChange(o.monthlyIncome, o.prevIncome)} />} />
        <StatCard label={t("dashboard.monthlyExpenses")} value={m(o.monthlyExpenses)} icon={ArrowDownRight} tone="destructive" hint={<Trend value={pctChange(o.monthlyExpenses, o.prevExpenses)} invert />} />
        <StatCard label={t("dashboard.totalSavings")} value={m(o.totalSavings)} icon={PiggyBank} tone="success" />
        <StatCard label={t("dashboard.totalDebt")} value={m(o.totalDebt)} icon={CreditCard} tone="warning" />
        <StatCard label={t("dashboard.totalInvestments")} value={m(o.totalInvestments)} icon={TrendingUp} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-0 bg-gradient-ink text-sidebar-foreground shadow-card">
          <div className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-sidebar-primary" />{t("dashboard.aiScore.title")}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-col items-center">
              <div className="relative h-40 w-40">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth="8" />
                  <motion.circle cx="50" cy="50" r="45" fill="none" stroke="var(--success)" strokeWidth="8" strokeLinecap="round" strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 - (283 * score.score) / 100 }} transition={{ duration: 1.2, ease: "easeOut" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="num text-4xl font-bold">{score.score}</span>
                  <span className="text-sm text-sidebar-primary">{t("dashboard.aiScore.grade")} <span className="num">{score.grade}</span></span>
                </div>
              </div>
              <ul className="mt-5 w-full space-y-2">
                {score.insights.slice(0, 3).map((s) => (
                  <li key={s} className="flex gap-2 text-sm text-sidebar-foreground/80"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />{s}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-2">
          <CardHeader><CardTitle>{t("dashboard.cashFlow")}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[290px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} /><stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickFormatter={formatCompact} />
                  <Tooltip formatter={(v: number) => m(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                  <Area type="monotone" dataKey="income" name={t("dashboard.income")} stroke="var(--chart-2)" strokeWidth={2} fill="url(#gi)" />
                  <Area type="monotone" dataKey="expenses" name={t("dashboard.expenses")} stroke="var(--chart-4)" strokeWidth={2} fill="url(#ge)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
            <Link to="/transactions" className="text-sm text-primary hover:underline">{t("dashboard.viewAll")}</Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {d.tx.length === 0 ? <Empty>{t("dashboard.noTransactions")}</Empty> : d.tx.slice(0, 6).map((x) => (
              <div key={x.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/60">
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-lg p-2", x.type === "income" ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive")}>
                    {x.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{x.description || catLabel(t, x.category)}</p>
                    <p className="text-xs text-muted-foreground">{catLabel(t, x.category)} · {formatDate(x.date, lang)}</p>
                  </div>
                </div>
                <span className={cn("num text-sm font-semibold", x.type === "income" ? "text-success" : "text-foreground")}>{x.type === "income" ? "+" : "−"}{m(Number(x.amount))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t("dashboard.goalsOverview")}</CardTitle>
            <Link to="/goals" className="text-sm text-primary hover:underline">{t("dashboard.viewAll")}</Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.goals.length === 0 ? <Empty>{t("dashboard.noGoals")}</Empty> : d.goals.slice(0, 4).map((g) => {
              const p = Number(g.target_amount) > 0 ? (Number(g.current_amount) / Number(g.target_amount)) * 100 : 0;
              return (
                <div key={g.id}>
                  <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{g.title}</span><span className="num text-muted-foreground">{p.toFixed(0)}%</span></div>
                  <Bar value={p} tone="success" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
