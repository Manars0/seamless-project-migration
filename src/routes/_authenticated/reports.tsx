import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Area, AreaChart, Bar as RBar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS, Empty, PageHeader } from "@/components/app/ui-bits";
import { useAllData, useCurrency } from "@/lib/data";
import { pctChange, periodSeries, spendingByCategory, type Lang, type Period } from "@/lib/finance";
import { formatCompact, formatMoney } from "@/lib/format";
import { catLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Financial Reports — FinTwin AI" }, { name: "description", content: "Analyze income, spending and savings over time." }, { property: "og:title", content: "Financial Reports — FinTwin AI" }, { property: "og:description", content: "Analyze income, spending and savings over time." }] }),
  component: Reports,
});

function Reports() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const cur = useCurrency();
  const m = (v: number) => formatMoney(v, cur, lang);
  const d = useAllData();
  const [period, setPeriod] = useState<Period>("monthly");
  const series = useMemo(() => periodSeries(d.tx, period, lang), [d.tx, period, lang]);
  const k0 = series[0]?.key ?? "";
  const firstKey = period === "monthly" ? k0 : period === "quarterly" ? `${k0.slice(0, 4)}-${String((Number(k0.slice(6)) - 1) * 3 + 1).padStart(2, "0")}` : `${k0}-01`;
  const cats = useMemo(() => spendingByCategory(d.tx, firstKey), [d.tx, firstKey]);
  const goalTarget = d.goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const savingsData = series.map((s) => ({ label: s.label, actual: s.cumulative, target: goalTarget }));
  const last = series[series.length - 1], prev = series[series.length - 2];
  const metrics = [
    { label: t("reports.incomeGrowth"), v: pctChange(last?.income ?? 0, prev?.income ?? 0), goodUp: true },
    { label: t("reports.expenseGrowth"), v: pctChange(last?.expenses ?? 0, prev?.expenses ?? 0), goodUp: false },
    { label: t("reports.savingsGrowth"), v: pctChange(last?.net ?? 0, prev?.net ?? 0), goodUp: true },
    { label: t("reports.netWorthGrowth"), v: pctChange(last?.cumulative ?? 0, prev?.cumulative ?? 0), goodUp: true },
  ];

  const exportCsv = () => {
    const rows = [["period", "income", "expenses", "net"], ...series.map((s) => [s.label, s.income, s.expenses, s.net]), [], ["category", "amount", "percent"], ...cats.map((c) => [c.category, c.amount, c.percentage.toFixed(1)]), [], ["date", "type", "category", "amount", "description"], ...d.tx.map((x) => [x.date, x.type, x.category, x.amount, x.description ?? ""])];
    const csv = "\ufeff" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `fintwin-report-${period}.csv`;
    a.click();
    toast.success(t("misc.exported"));
  };

  const axis = { axisLine: false, tickLine: false, tick: { fontSize: 12, fill: "var(--muted-foreground)" } } as const;
  return (
    <>
      <PageHeader
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
        action={
          <div className="flex gap-2">
            <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="h-9 rounded-md border border-input bg-card px-3 text-sm" aria-label={t("reports.period")}>
              <option value="monthly">{t("reports.period_monthly")}</option>
              <option value="quarterly">{t("reports.period_quarterly")}</option>
              <option value="yearly">{t("reports.period_yearly")}</option>
            </select>
            <Button onClick={exportCsv}><Download />{t("reports.export")}</Button>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((x) => {
          const good = x.goodUp ? x.v >= 0 : x.v <= 0;
          return (
            <Card key={x.label} className="shadow-card">
              <CardContent className="flex items-center justify-between p-5">
                <div><p className="text-sm text-muted-foreground">{x.label}</p><p className="num mt-1 text-2xl font-bold">{x.v >= 0 ? "+" : ""}{x.v.toFixed(1)}%</p></div>
                <span className={cn("rounded-xl p-2.5", good ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive")}>{x.v >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle>{t("reports.incomeVsExpenses")}</CardTitle></CardHeader>
          <CardContent><div className="h-[280px]" dir="ltr"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={formatCompact} /><Tooltip formatter={(v: number) => m(v)} cursor={{ fill: "var(--muted)" }} /><Legend />
              <RBar dataKey="income" name={t("reports.income")} fill="var(--chart-2)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <RBar dataKey="expenses" name={t("reports.expenses")} fill="var(--chart-4)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart></ResponsiveContainer></div></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle>{t("reports.cashFlowTrend")}</CardTitle></CardHeader>
          <CardContent><div className="h-[280px]" dir="ltr"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}><defs><linearGradient id="gn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={formatCompact} /><Tooltip formatter={(v: number) => m(v)} /><Legend />
              <Area type="monotone" dataKey="net" name={t("reports.cashFlow")} stroke="var(--chart-1)" strokeWidth={3} fill="url(#gn)" />
            </AreaChart></ResponsiveContainer></div></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle>{t("reports.spendingByCategory")}</CardTitle></CardHeader>
          <CardContent>
            {cats.length === 0 ? <Empty>{t("misc.emptyHint")}</Empty> : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-[240px] w-full sm:w-1/2" dir="ltr"><ResponsiveContainer width="100%" height="100%"><PieChart>
                  <Pie data={cats.map((c) => ({ name: catLabel(t, c.category), value: c.amount }))} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>{cats.map((c, i) => <Cell key={c.category} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie>
                  <Tooltip formatter={(v: number) => m(v)} /></PieChart></ResponsiveContainer></div>
                <div className="w-full flex-1 space-y-2">{cats.map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{catLabel(t, c.category)}</span><span className="num font-medium">{c.percentage.toFixed(1)}%</span></div>
                ))}</div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle>{t("reports.savingsProgress")}</CardTitle></CardHeader>
          <CardContent><div className="h-[280px]" dir="ltr"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={savingsData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={formatCompact} /><Tooltip formatter={(v: number) => m(v)} /><Legend />
              <Line type="monotone" dataKey="actual" name={t("dashboard.actual")} stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="target" name={t("dashboard.target")} stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart></ResponsiveContainer></div></CardContent>
        </Card>
      </div>
    </>
  );
}
