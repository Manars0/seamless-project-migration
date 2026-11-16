import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, Empty } from "@/components/app/ui-bits";
import { FormDialog, type Field } from "@/components/app/FormDialog";
import { RowActions } from "@/components/app/RowActions";
import { useCurrency, useRows } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { EXPENSE_CATS, INCOME_CATS, catLabel, opts } from "@/lib/categories";
import type { Tx } from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transactions — FinTwin AI" }, { name: "description", content: "Record income and expenses." }, { property: "og:title", content: "Transactions — FinTwin AI" }, { property: "og:description", content: "Record income and expenses." }] }),
  component: Transactions,
});

function Transactions() {
  const { t, i18n } = useTranslation();
  const cur = useCurrency();
  const { data = [], isLoading } = useRows("transactions");
  const [edit, setEdit] = useState<Partial<Tx> | null>(null);
  const fields: Field[] = [
    { name: "type", label: t("common.type"), type: "select", half: true, options: [{ value: "expense", label: t("tx.expense") }, { value: "income", label: t("tx.income") }] },
    { name: "amount", label: t("common.amount"), type: "number", required: true, half: true },
    { name: "category", label: t("common.category"), type: "select", half: true, options: [...new Map([...opts(t, INCOME_CATS), ...opts(t, EXPENSE_CATS)].map((o) => [o.value, o])).values()] },
    { name: "date", label: t("common.date"), type: "date", required: true, half: true },
    { name: "description", label: t("common.description"), type: "text" },
  ];
  return (
    <>
      <PageHeader title={t("tx.title")} subtitle={t("tx.subtitle")} action={<Button onClick={() => setEdit({ type: "expense", category: "food", date: new Date().toISOString().slice(0, 10) })}><Plus />{t("tx.add")}</Button>} />
      <Card className="shadow-card">
        <CardContent className="divide-y p-0">
          {isLoading ? <div className="h-40 animate-pulse" /> : data.length === 0 ? <div className="p-6"><Empty>{t("tx.none")}</Empty></div> : data.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn("rounded-lg p-2", x.type === "income" ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive")}>
                  {x.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{x.description || catLabel(t, x.category)}</p>
                  <p className="text-xs text-muted-foreground">{catLabel(t, x.category)} · {formatDate(x.date, i18n.language)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("num font-semibold", x.type === "income" && "text-success")}>{x.type === "income" ? "+" : "−"}{formatMoney(Number(x.amount), cur, i18n.language)}</span>
                <RowActions table="transactions" id={x.id} onEdit={() => setEdit(x)} confirmText={t("tx.deleteConfirm")} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <FormDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? t("tx.edit") : t("tx.add")} table="transactions" fields={fields} initial={edit ?? {}} id={edit?.id} />
    </>
  );
}
