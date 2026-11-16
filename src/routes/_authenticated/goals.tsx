import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bar, Empty, PageHeader } from "@/components/app/ui-bits";
import { FormDialog, type Field } from "@/components/app/FormDialog";
import { RowActions } from "@/components/app/RowActions";
import { useCurrency, useRows } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { GOAL_CATS, opts } from "@/lib/categories";
import { goalOnTrack, type Goal } from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Financial Goals — FinTwin AI" }, { name: "description", content: "Track your savings goals." }, { property: "og:title", content: "Financial Goals — FinTwin AI" }, { property: "og:description", content: "Track your savings goals." }] }),
  component: Goals,
});

const PRI = { high: "bg-destructive/10 text-destructive", medium: "bg-warning/15 text-warning-foreground", low: "bg-primary/10 text-primary" } as const;

function Goals() {
  const { t, i18n } = useTranslation();
  const cur = useCurrency();
  const { data = [], isLoading } = useRows("goals");
  const [edit, setEdit] = useState<Partial<Goal> | null>(null);
  const fields: Field[] = [
    { name: "title", label: t("goals.form.title"), type: "text", required: true, placeholder: t("goals.form.titlePlaceholder") },
    { name: "target_amount", label: t("goals.form.targetAmount"), type: "number", required: true, half: true },
    { name: "current_amount", label: t("goals.form.currentAmount"), type: "number", half: true },
    { name: "category", label: t("goals.form.category"), type: "select", half: true, options: opts(t, GOAL_CATS, "goals.categories") },
    { name: "deadline", label: t("goals.form.deadline"), type: "date", half: true },
    { name: "priority", label: t("goals.form.priority"), type: "select", half: true, options: opts(t, ["high", "medium", "low"], "goals.priority") },
    { name: "status", label: t("goals.form.status"), type: "select", half: true, options: opts(t, ["active", "completed", "paused"], "goals.status") },
    { name: "description", label: t("goals.form.description"), type: "textarea", placeholder: t("goals.form.descriptionPlaceholder") },
  ];
  return (
    <>
      <PageHeader title={t("goals.title")} subtitle={t("goals.subtitle")} action={<Button onClick={() => setEdit({ category: "emergency", priority: "medium", status: "active" })}><Plus />{t("goals.addGoal")}</Button>} />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? [1, 2, 3].map((i) => <Card key={i} className="h-48 animate-pulse" />) : data.length === 0 ? <Empty>{t("goals.noGoals")}</Empty> : data.map((g, i) => {
          const p = Number(g.target_amount) > 0 ? (Number(g.current_amount) / Number(g.target_amount)) * 100 : 0;
          const done = p >= 100 || g.status === "completed";
          const ok = goalOnTrack(g);
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="relative overflow-hidden shadow-card">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-growth" />
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="rounded-xl bg-primary/10 p-2 text-primary"><Target className="h-5 w-5" /></span>
                    <div className="flex items-center gap-1">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", PRI[g.priority as keyof typeof PRI])}>{t(`goals.priority.${g.priority}`)}</span>
                      <RowActions table="goals" id={g.id} onEdit={() => setEdit(g)} confirmText={t("goals.deleteConfirm")} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold">{g.title}</h3>
                  <p className="mb-5 text-sm text-muted-foreground">{t(`goals.categories.${g.category}`, { defaultValue: g.category })} · {t("goals.deadline")}: {formatDate(g.deadline, i18n.language)}</p>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="num font-semibold text-primary">{formatMoney(Number(g.current_amount), cur, i18n.language)}</span>
                    <span className="text-muted-foreground">{t("common.of")} <span className="num">{formatMoney(Number(g.target_amount), cur, i18n.language)}</span></span>
                  </div>
                  <Bar value={p} tone={done ? "success" : ok ? "primary" : "warning"} />
                  <div className="mt-2 flex justify-between text-xs">
                    <span className={cn("font-medium", done ? "text-success" : ok ? "text-primary" : "text-warning-foreground")}>{done ? t("goals.achieved") : ok ? t("goals.onTrack") : t("goals.behind")}</span>
                    <span className="num font-semibold">{p.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <FormDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? t("goals.editGoal") : t("goals.addGoal")} table="goals" fields={fields} initial={edit ?? {}} id={edit?.id} />
    </>
  );
}
