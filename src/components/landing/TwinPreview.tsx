import { useDeferredValue } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Info, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildPlan, projection, type TwinInput } from "@/lib/twin";
import { formatMoney, formatCompact } from "@/lib/format";
import { CountUp } from "./CountUp";

export type PreviewInput = Required<Pick<TwinInput, "income" | "expenses" | "savings" | "goal" | "targetMonths" | "boost">>;

const FIELDS: { key: keyof PreviewInput; min: number; max: number; step: number; money: boolean }[] = [
  { key: "income", min: 3000, max: 80000, step: 500, money: true },
  { key: "expenses", min: 1000, max: 60000, step: 500, money: true },
  { key: "savings", min: 0, max: 500000, step: 5000, money: true },
  { key: "goal", min: 100000, max: 3000000, step: 10000, money: true },
  { key: "targetMonths", min: 12, max: 240, step: 6, money: false },
  { key: "boost", min: 0, max: 5000, step: 100, money: true },
];
const LABEL: Record<keyof PreviewInput, string> = { income: "income", expenses: "expenses", savings: "savings", goal: "goal", targetMonths: "months", boost: "boost" };

export function TwinPreview({ value, onChange }: { value: PreviewInput; onChange: (v: PreviewInput) => void }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "ar";
  const v = useDeferredValue(value);
  const plan = buildPlan(v);
  const series = projection(v);
  const money = (n: number) => formatMoney(Math.round(n), "SAR", lang);
  const finish = plan.monthsToGoal == null ? t("home.twin.never")
    : new Date(new Date().getFullYear(), new Date().getMonth() + plan.monthsToGoal, 1).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "long", year: "numeric" });
  const advice = plan.disposable <= 0 ? t("home.twin.adviceNone")
    : plan.monthsSaved > 0 ? t("home.twin.adviceBoost", { boost: money(v.boost), months: plan.monthsSaved })
    : plan.onTime ? t("home.twin.adviceOnTime", { monthly: money(plan.recommendedMonthly) })
    : t("home.twin.adviceLate", { months: plan.monthsToGoal ?? "—" });
  const pct = Math.round(plan.progress * 100);
  const R = 34, C = 2 * Math.PI * R;

  return (
    <div className="relative rounded-3xl border border-border bg-card/80 p-5 shadow-glow backdrop-blur-xl md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("home.twin.title")}</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />{t("home.twin.live")}
        </span>
      </div>

      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t(`home.twin.${LABEL[f.key]}`)}</span>
              <span className="num font-medium text-foreground">{f.money ? money(value[f.key]) : value[f.key]}</span>
            </span>
            <Slider aria-label={t(`home.twin.${LABEL[f.key]}`)} min={f.min} max={f.max} step={f.step} value={[value[f.key]]}
              onValueChange={([n]) => onChange({ ...value, [f.key]: n })} />
          </label>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t("home.twin.monthly")}><CountUp value={plan.recommendedMonthly} format={(n) => money(n)} /></Kpi>
        <Kpi label={t("home.twin.finish")}><span className="text-sm">{finish}</span></Kpi>
        <Kpi label={t("home.twin.progress")}>
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 80 80" className="h-9 w-9 -rotate-90" aria-hidden>
              <circle cx="40" cy="40" r={R} className="fill-none stroke-muted" strokeWidth="9" />
              <motion.circle cx="40" cy="40" r={R} className="fill-none stroke-primary" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={C} animate={{ strokeDashoffset: C * (1 - plan.progress) }} transition={{ duration: 0.6 }} />
            </svg>
            <span className="num">{pct}%</span>
          </span>
        </Kpi>
        <Kpi label={t("home.twin.score")}><span className={plan.score >= 70 ? "text-success" : plan.score >= 45 ? "text-warning" : "text-destructive"}><CountUp value={plan.score} />/100</span></Kpi>
      </div>

      <div className="mt-5 h-36" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="gSmart" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} /></linearGradient>
            </defs>
            <XAxis dataKey="m" hide />
            <Tooltip formatter={(n: number) => formatCompact(n)} labelFormatter={(m) => `${m} ${t("home.twin.monthsUnit")}`}
              contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="base" name={t("home.twin.current")} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" fill="none" strokeWidth={2} />
            <Area type="monotone" dataKey="smart" name={t("home.twin.smart")} stroke="var(--color-primary)" fill="url(#gSmart)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex gap-4">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-muted-foreground" />{t("home.twin.current")}</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-primary" />{t("home.twin.smart")}</span>
        </span>
        <Popover>
          <PopoverTrigger className="inline-flex items-center gap-1 hover:text-foreground"><Info className="h-3.5 w-3.5" />{t("home.twin.how")}</PopoverTrigger>
          <PopoverContent className="w-72 text-sm leading-relaxed">{t("home.twin.howBody")}</PopoverContent>
        </Popover>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">{t("home.twin.twinName")}</p>
          <AnimatePresence mode="wait">
            <motion.p key={advice} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="text-sm">{advice}</motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-3">
      <p className="mb-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
      <div className="text-base font-semibold">{children}</div>
    </div>
  );
}
