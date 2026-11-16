import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, CHART_COLORS, Empty, PageHeader } from "@/components/app/ui-bits";
import { FormDialog, type Field } from "@/components/app/FormDialog";
import { RowActions } from "@/components/app/RowActions";
import { useCurrency, useRows } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { EXPENSE_CATS, catLabel, opts } from "@/lib/categories";
import { monthKey, type Budget as B } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/budget")({
  head: () => ({ meta: [{ title: "Budget Planner — FinTwin AI" }, { name: "description", content: "Plan and track monthly spending." }, { property: "og:title", content: "Budget Planner — FinTwin AI" }, { property: "og:description", content: "Plan and track monthly spending." }] }),
  component: Budget,
});

function Budget() {
  const { t, i18n } = useTranslation();
  const cur = useCurrency();
  const m = (v: number) => formatMoney(v, cur, i18n.language);
  const { data: all = [], isLoading } = useRows("budgets");
  const months = [...new Set([monthKey(new Date()), ...all.map((b) => b.month)])].sort().reverse();
  const [month, setMonth] = useState(monthKey(new Date()));
  const data = all.filter((b) => b.month === month);
  const [edit, setEdit] = useState<Partial<B> | null>(null);
  const alloc = data.reduce((s, b) => s + Number(b.allocated_amount), 0);
  const spent = data.reduce((s, b) => s + Number(b.spent_amount), 0);
  const fields: Field[] = [
    { name: "category", label: t("budget.form.category"), type: "select", half: true, options: opts(t, EXPENSE_CATS) },
    { name: "month", label: t("budget.monthSelector"), type: "text", half: true, placeholder: "2026-11" },
    { name: "allocated_amount", label: t("budget.form.allocatedAmount"), type: "number", required: true, half: true },
    { name: "spent_amount", label: t("budget.form.spentAmount"), type: "number", half: true },
  ];
  return (
    <>
      <PageHeader
        title={t("budget.title")}
        subtitle={t("budget.subtitle")}
        action={
          <div className="flex gap-2">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="num h-9 rounded-md border border-input bg-card px-3 text-sm" aria-label={t("budget.monthSelector")}>
              {months.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <Button onClick={() => setEdit({ category: "food", month, period: "monthly" })}><Plus />{t("budget.addCategory")}</Button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-0 bg-gradient-primary text-primary-foreground shadow-glow">
          <CardHeader><CardTitle className="opacity-90">{t("budget.monthlyOverview")}</CardTitle></CardHeader>
          <CardContent>
            <p className="num text-4xl font-bold">{m(alloc - spent)}</p>
            <p className="mt-1 opacity-80">{t("budget.remainingBudget")}</p>
            <div className="mt-6 space-y-3 border-t border-primary-foreground/20 pt-4 text-sm">
              <div className="flex justify-between"><span className="opacity-80">{t("budget.totalBudgeted")}</span><span className="num font-semibold">{m(alloc)}</span></div>
              <div className="flex justify-between"><span className="opacity-80">{t("budget.totalSpent")}</span><span className="num font-semibold">{m(spent)}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card lg:col-span-2">
          <CardHeader><CardTitle>{t("budget.spendingDistribution")}</CardTitle></CardHeader>
          <CardContent>
            {data.length === 0 ? <Empty>{t("misc.emptyHint")}</Empty> : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-[230px] w-full sm:w-1/2" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.map((b) => ({ name: catLabel(t, b.category), value: Number(b.spent_amount) }))} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                        {data.map((b, i) => <Cell key={b.id} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => m(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-3">
                  {data.map((b, i) => (
                    <div key={b.id} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <div><p className="text-sm font-medium">{catLabel(t, b.category)}</p><p className="num text-xs text-muted-foreground">{m(Number(b.spent_amount))}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <h3 className="mb-4 mt-8 text-xl font-bold">{t("budget.budgetCategories")}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? null : data.length === 0 ? <Empty>{t("budget.noCategories")}</Empty> : data.map((b) => {
          const p = Number(b.allocated_amount) > 0 ? (Number(b.spent_amount) / Number(b.allocated_amount)) * 100 : 0;
          return (
            <Card key={b.id} className="shadow-card">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold">{catLabel(t, b.category)}</h4>
                  <div className="flex items-center"><span className="num text-sm text-muted-foreground">{Math.round(p)}%</span><RowActions table="budgets" id={b.id} onEdit={() => setEdit(b)} confirmText={t("budget.deleteCategory") + "?"} /></div>
                </div>
                <div className="mb-2 flex items-end justify-between">
                  <span className="num text-lg font-bold">{m(Number(b.spent_amount))}</span>
                  <span className="num text-xs text-muted-foreground">/ {m(Number(b.allocated_amount))}</span>
                </div>
                <Bar value={p} tone={p >= 100 ? "destructive" : p >= 85 ? "warning" : "success"} />
              </CardContent>
            </Card>
          );
        })}
      </div>
      <FormDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? t("budget.editCategory") : t("budget.addCategory")} table="budgets" fields={fields} initial={edit ?? {}} id={edit?.id} />
    </>
  );
}
