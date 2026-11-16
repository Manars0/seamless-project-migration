import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Coins, LineChart, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS, Empty, PageHeader, StatCard } from "@/components/app/ui-bits";
import { FormDialog, type Field } from "@/components/app/FormDialog";
import { RowActions } from "@/components/app/RowActions";
import { useCurrency, useRows } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { opts } from "@/lib/categories";
import type { Investment } from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/investments")({
  head: () => ({ meta: [{ title: "Investments — FinTwin AI" }, { name: "description", content: "Your portfolio and allocation." }, { property: "og:title", content: "Investments — FinTwin AI" }, { property: "og:description", content: "Your portfolio and allocation." }] }),
  component: Investments,
});

const TYPES = ["stock", "crypto", "real_estate", "bond", "fund", "other"];

function Investments() {
  const { t, i18n } = useTranslation();
  const cur = useCurrency();
  const m = (v: number) => formatMoney(v, cur, i18n.language);
  const { data = [], isLoading } = useRows("investments");
  const [edit, setEdit] = useState<Partial<Investment> | null>(null);
  const invested = data.reduce((s, x) => s + Number(x.amount_invested), 0);
  const value = data.reduce((s, x) => s + Number(x.current_value), 0);
  const gain = value - invested;
  const pct = invested > 0 ? (gain / invested) * 100 : 0;
  const alloc = TYPES.map((ty) => ({ type: ty, value: data.filter((x) => x.type === ty).reduce((s, x) => s + Number(x.current_value), 0) })).filter((x) => x.value > 0);
  const fields: Field[] = [
    { name: "name", label: t("investments.form.name"), type: "text", required: true, half: true, placeholder: t("investments.form.namePlaceholder") },
    { name: "ticker", label: t("investments.form.ticker"), type: "text", half: true, placeholder: t("investments.form.tickerPlaceholder") },
    { name: "type", label: t("investments.form.type"), type: "select", half: true, options: opts(t, TYPES, "investments.types") },
    { name: "purchase_date", label: t("investments.form.purchaseDate"), type: "date", required: true, half: true },
    { name: "amount_invested", label: t("investments.form.amountInvested"), type: "number", required: true, half: true },
    { name: "current_value", label: t("investments.form.currentValue"), type: "number", required: true, half: true },
    { name: "notes", label: t("investments.form.notes"), type: "textarea" },
  ];
  return (
    <>
      <PageHeader title={t("investments.title")} subtitle={t("investments.subtitle")} action={<Button onClick={() => setEdit({ type: "fund", purchase_date: new Date().toISOString().slice(0, 10) })}><Plus />{t("investments.addAsset")}</Button>} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t("investments.portfolioValue")} value={m(value)} icon={LineChart} />
        <StatCard label={t("investments.totalInvested")} value={m(invested)} icon={Coins} tone="warning" />
        <StatCard label={t("investments.totalGainLoss")} value={<span className={gain >= 0 ? "text-success" : "text-destructive"}>{gain >= 0 ? "+" : ""}{m(gain)}</span>} icon={TrendingUp} tone={gain >= 0 ? "success" : "destructive"} hint={<span className="num text-muted-foreground">{pct >= 0 ? "+" : ""}{pct.toFixed(1)}% {t("investments.allTimeReturn")}</span>} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader><CardTitle>{t("investments.assetAllocation")}</CardTitle></CardHeader>
          <CardContent>
            {alloc.length === 0 ? <Empty>{t("misc.emptyHint")}</Empty> : (
              <>
                <div className="h-[220px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={alloc.map((a) => ({ name: t(`investments.types.${a.type}`), value: a.value }))} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {alloc.map((a, i) => <Cell key={a.type} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => m(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-2">
                  {alloc.map((a, i) => (
                    <div key={a.type} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{t(`investments.types.${a.type}`)}</span>
                      <span className="num font-medium">{((a.value / value) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-card lg:col-span-2">
          <CardHeader><CardTitle>{t("investments.holdings")}</CardTitle></CardHeader>
          <CardContent className="divide-y p-0">
            {isLoading ? <div className="h-40 animate-pulse" /> : data.length === 0 ? <div className="p-6"><Empty>{t("investments.noAssets")}</Empty></div> : data.map((x) => {
              const g = Number(x.current_value) - Number(x.amount_invested);
              const gp = Number(x.amount_invested) > 0 ? (g / Number(x.amount_invested)) * 100 : 0;
              return (
                <div key={x.id} className="flex items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{x.name} {x.ticker && <span className="num ms-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{x.ticker}</span>}</p>
                    <p className="text-xs text-muted-foreground">{t(`investments.types.${x.type}`)} · {formatDate(x.purchase_date, i18n.language)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-end">
                    <div>
                      <p className="num font-semibold">{m(Number(x.current_value))}</p>
                      <p className={cn("num text-xs font-medium", g >= 0 ? "text-success" : "text-destructive")}>{g >= 0 ? "+" : ""}{gp.toFixed(1)}%</p>
                    </div>
                    <RowActions table="investments" id={x.id} onEdit={() => setEdit(x)} confirmText={t("investments.deleteConfirm")} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <FormDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? t("investments.editAsset") : t("investments.addAsset")} table="investments" fields={fields} initial={edit ?? {}} id={edit?.id} />
    </>
  );
}
