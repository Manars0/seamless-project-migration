import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Calendar, CreditCard, Percent, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bar, Empty, PageHeader, StatCard } from "@/components/app/ui-bits";
import { FormDialog, type Field } from "@/components/app/FormDialog";
import { RowActions } from "@/components/app/RowActions";
import { useCurrency, useRows } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { opts } from "@/lib/categories";
import type { Debt as D } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/debt")({
  head: () => ({ meta: [{ title: "Debt Management — FinTwin AI" }, { name: "description", content: "Track and pay down your debts." }, { property: "og:title", content: "Debt Management — FinTwin AI" }, { property: "og:description", content: "Track and pay down your debts." }] }),
  component: Debt,
});

function payoffMonths(remaining: number, ratePct: number, payment: number) {
  if (payment <= 0) return Infinity;
  const r = ratePct / 100 / 12;
  if (r === 0) return Math.ceil(remaining / payment);
  if (payment <= remaining * r) return Infinity;
  return Math.ceil(-Math.log(1 - (r * remaining) / payment) / Math.log(1 + r));
}

function Debt() {
  const { t, i18n } = useTranslation();
  const cur = useCurrency();
  const m = (v: number) => formatMoney(v, cur, i18n.language);
  const { data = [], isLoading } = useRows("debts");
  const [edit, setEdit] = useState<Partial<D> | null>(null);
  const active = data.filter((d) => d.status !== "paid_off");
  const total = active.reduce((s, d) => s + Number(d.remaining_amount), 0);
  const monthly = active.reduce((s, d) => s + Number(d.monthly_payment), 0);
  const top = [...active].sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate))[0];
  const months = Math.max(0, ...active.map((d) => payoffMonths(Number(d.remaining_amount), Number(d.interest_rate), Number(d.monthly_payment))));
  const freeDate = Number.isFinite(months) && active.length ? new Date(new Date().getFullYear(), new Date().getMonth() + months, 1).toISOString() : null;
  const fields: Field[] = [
    { name: "name", label: t("debt.form.name"), type: "text", required: true, half: true, placeholder: t("debt.form.namePlaceholder") },
    { name: "type", label: t("debt.form.type"), type: "select", half: true, options: opts(t, ["loan", "credit_card", "mortgage", "other"], "debt.types") },
    { name: "total_amount", label: t("debt.form.totalAmount"), type: "number", required: true, half: true },
    { name: "remaining_amount", label: t("debt.form.remainingAmount"), type: "number", required: true, half: true },
    { name: "interest_rate", label: t("debt.form.interestRate"), type: "number", half: true },
    { name: "monthly_payment", label: t("debt.form.monthlyPayment"), type: "number", half: true },
    { name: "due_date", label: t("debt.form.dueDate"), type: "date", half: true },
    { name: "status", label: t("debt.form.status"), type: "select", half: true, options: opts(t, ["active", "paid_off"], "debt.status") },
  ];
  return (
    <>
      <PageHeader title={t("debt.title")} subtitle={t("debt.subtitle")} action={<Button onClick={() => setEdit({ type: "loan", status: "active" })}><Plus />{t("debt.addDebt")}</Button>} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 bg-gradient-danger text-destructive-foreground shadow-card">
          <CardContent className="p-5">
            <p className="flex items-center gap-2 text-sm opacity-90"><CreditCard className="h-4 w-4" />{t("debt.totalDebt")}</p>
            <p className="num mt-2 text-3xl font-bold">{m(total)}</p>
            <p className="mt-3 text-sm opacity-90">{t("debt.debtFreeDate")}: {freeDate ? formatDate(freeDate, i18n.language) : "—"}</p>
          </CardContent>
        </Card>
        <StatCard label={t("debt.monthlyPayments")} value={m(monthly)} icon={Calendar} />
        <StatCard label={t("debt.highestRate")} value={<span className="text-warning-foreground">{top ? `${top.interest_rate}%` : "—"}</span>} icon={Percent} tone="warning" hint={top && <span className="text-muted-foreground">{top.name}</span>} />
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? null : data.length === 0 ? <Empty>{t("debt.noDebts")}</Empty> : data.map((d, i) => {
          const p = Number(d.total_amount) > 0 ? ((Number(d.total_amount) - Number(d.remaining_amount)) / Number(d.total_amount)) * 100 : 0;
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-t-4 border-t-warning shadow-card">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{d.name}</h3>
                      <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium">{t(`debt.types.${d.type}`)}</span>
                      {d.status === "paid_off" && <span className="ms-1 inline-block rounded bg-success/12 px-2 py-0.5 text-xs font-medium text-success">{t("debt.status.paid_off")}</span>}
                    </div>
                    <div className="flex items-start">
                      <div className="text-end"><p className="num font-bold text-destructive">{d.interest_rate}%</p><p className="text-xs text-muted-foreground">APR</p></div>
                      <RowActions table="debts" id={d.id} onEdit={() => setEdit(d)} confirmText={t("debt.deleteConfirm")} />
                    </div>
                  </div>
                  <div className="mb-3 flex items-end justify-between">
                    <div><p className="text-xs text-muted-foreground">{t("debt.remainingBalance")}</p><p className="num text-xl font-bold">{m(Number(d.remaining_amount))}</p></div>
                    <div className="text-end"><p className="text-xs text-muted-foreground">{t("common.total")}</p><p className="num text-sm font-medium">{m(Number(d.total_amount))}</p></div>
                  </div>
                  <Bar value={p} tone="warning" />
                  <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                    <span><span className="num">{p.toFixed(1)}%</span> {t("debt.paid")}</span>
                    <span className="num">{m(Number(d.monthly_payment))}{t("common.perMonth")}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <FormDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? t("debt.editDebt") : t("debt.addDebt")} table="debts" fields={fields} initial={edit ?? {}} id={edit?.id} />
    </>
  );
}
