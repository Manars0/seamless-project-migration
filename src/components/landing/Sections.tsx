import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, XAxis, Cell } from "recharts";
import {
  Check, X, Fingerprint, Landmark, Target, GitCompareArrows, PiggyBank, Repeat, Rocket, BellRing, LineChart, BadgeCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { alternatives } from "@/lib/twin";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Reveal, SectionHead } from "./Reveal";
import { CountUp } from "./CountUp";
import type { PreviewInput } from "./TwinPreview";

export function DemoBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return <span className={cn("rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning", className)}>{t("home.demo")}</span>;
}

export function Compare() {
  const { t } = useTranslation();
  const rows = t("home.compare.rows", { returnObjects: true }) as { old: string; new: string }[];
  const [side, setSide] = useState<"old" | "new">("new");
  return (
    <section id="why" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <SectionHead eyebrow={t("home.compare.eyebrow")} title={t("home.compare.title")} sub={t("home.compare.sub")} />
      <div className="mb-4 flex justify-center md:hidden">
        <div className="inline-flex rounded-full border border-border bg-card p-1" role="tablist">
          {(["old", "new"] as const).map((s) => (
            <button key={s} role="tab" aria-selected={side === s} onClick={() => setSide(s)}
              className={cn("rounded-full px-4 py-1.5 text-sm transition", side === s ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {t(`home.compare.${s}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(["old", "new"] as const).map((s) => (
          <div key={s} className={cn("rounded-3xl border p-6 md:block md:p-8", side === s ? "block" : "hidden",
            s === "new" ? "border-primary/30 bg-gradient-to-b from-primary/10 to-card shadow-glow" : "border-border bg-card")}>
            <h3 className={cn("mb-6 text-lg font-semibold", s === "new" ? "text-gradient" : "text-muted-foreground")}>{t(`home.compare.${s}`)}</h3>
            <ul className="space-y-4">
              {rows.map((r, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: s === "old" ? 12 : -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }} className="flex items-start gap-3">
                  <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    s === "new" ? "bg-success/20 text-success" : "bg-destructive/15 text-destructive")}>
                    {s === "new" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <span className={s === "new" ? "font-medium" : "text-muted-foreground"}>{r[s]}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEP_ICONS = [Fingerprint, Landmark, Target, GitCompareArrows, PiggyBank, Repeat, Rocket, BellRing, LineChart];
const DEMO_STEPS = new Set([0, 1, 5]);

export function Journey() {
  const { t } = useTranslation();
  const steps = t("home.journey.steps", { returnObjects: true }) as { t: string; d: string }[];
  return (
    <section id="how" className="scroll-mt-24 border-y border-border bg-card/40 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead eyebrow={t("home.journey.eyebrow")} title={t("home.journey.title")} />
        <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <Reveal key={i} delay={(i % 3) * 0.08}>
                <li className="group h-full rounded-2xl border border-border bg-background/60 p-5 transition hover:-translate-y-1 hover:border-primary/40">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-gradient-primary group-hover:text-primary-foreground"><Icon className="h-5 w-5" /></span>
                    <span className="flex items-center gap-2">{DEMO_STEPS.has(i) && <DemoBadge />}<span className="num text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span></span>
                  </div>
                  <h3 className="font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </li>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function AltShowcase({ input }: { input: PreviewInput }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "ar";
  const alts = alternatives({ ...input, goal: input.goal });
  const rec = alts.find((a) => a.recommended)!;
  const money = (n: number) => formatMoney(Math.round(n), "SAR", lang);
  const chart = alts.map((a) => ({ name: t(`home.alts.${a.key}`), v: a.monthlyPayment, rec: a.recommended }));
  return (
    <section id="platform" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <SectionHead eyebrow={t("home.alts.eyebrow")} title={t("home.alts.title")} sub={t("home.alts.sub")} />
      <Reveal>
        <Tabs defaultValue={rec.key} key={rec.key}>
          <TabsList className="mx-auto mb-6 flex h-auto w-fit flex-wrap justify-center rounded-full p-1">
            {alts.map((a) => (
              <TabsTrigger key={a.key} value={a.key} className="gap-1.5 rounded-full px-4 py-2">
                {t(`home.alts.${a.key}`)}{a.recommended && <BadgeCheck className="h-4 w-4 text-success" />}
              </TabsTrigger>
            ))}
          </TabsList>
          {alts.map((a) => (
            <TabsContent key={a.key} value={a.key}>
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="rounded-3xl border border-border bg-card p-6 lg:col-span-3">
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold">{t(`home.alts.${a.key}`)}</h3>
                    {a.recommended && <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">{t("home.alts.recommended")}</span>}
                    <p className="w-full text-sm text-muted-foreground">{t(`home.alts.${a.key}D`)}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3">
                    <Stat k={t("home.alts.price")} v={money(a.price)} />
                    <Stat k={t("home.alts.down")} v={money(a.downPayment)} />
                    <Stat k={t("home.alts.payment")} v={money(a.monthlyPayment)} />
                    <Stat k={t("home.alts.ratio")} v={`${Math.round(a.commitmentRatio * 100)}%`} tone={a.commitmentRatio <= 0.33 ? "good" : "bad"} />
                    <Stat k={t("home.alts.liquidity")} v={money(a.liquidityAfter)} />
                    <Stat k={t("home.alts.start")} v={a.monthsToStart === 0 ? t("home.alts.now") : a.monthsToStart == null ? t("home.twin.never") : `${a.monthsToStart} ${t("home.twin.monthsUnit")}`} />
                  </dl>
                </div>
                <div className="rounded-3xl border border-border bg-card p-6 lg:col-span-2">
                  <p className="mb-3 text-sm text-muted-foreground">{t("home.alts.payment")}</p>
                  <div className="h-56" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart}>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} interval={0} />
                        <Bar dataKey="v" radius={[10, 10, 4, 4]}>
                          {chart.map((c, i) => <Cell key={i} fill={c.rec ? "var(--color-success)" : "var(--color-primary)"} fillOpacity={c.name === t(`home.alts.${a.key}`) ? 1 : 0.35} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t("home.alts.assume")}</p>
      </Reveal>
    </section>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3.5">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className={cn("num mt-1 text-lg font-semibold", tone === "good" && "text-success", tone === "bad" && "text-destructive")}>{v}</dd>
    </div>
  );
}

export function Insights() {
  const { t } = useTranslation();
  const items = [1, 2, 3, 4].map((n) => ({
    v: Number(t(`home.insights.s${n}v`)), u: t(`home.insights.s${n}u`), l: t(`home.insights.s${n}`), n: t(`home.insights.s${n}n`),
  }));
  return (
    <section id="insights" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <SectionHead eyebrow={t("home.insights.eyebrow")} title={t("home.insights.title")} sub={t("home.insights.sub")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="h-full rounded-3xl border border-border bg-card p-6">
              <p className="text-4xl font-bold tracking-tight"><span className="text-gradient"><CountUp value={it.v} decimals={1} /></span> <span className="text-base font-medium text-muted-foreground">{it.u}</span></p>
              <p className="mt-3 font-medium">{it.l}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{it.n}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">{t("home.insights.note")}</p>
    </section>
  );
}
