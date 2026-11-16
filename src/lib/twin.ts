// Deterministic "financial twin" plan engine. Pure functions, no I/O.

export interface TwinInput {
  income: number;
  expenses: number;
  commitments?: number;
  savings: number;
  goal: number;
  targetMonths: number;
  /** Months of expenses kept as an emergency fund (default 3). */
  emergencyMonths?: number;
  /** Max share of disposable income that goes to saving (default 0.7). */
  safeRatio?: number;
  /** Extra monthly saving on top of the recommendation ("smart plan"). */
  boost?: number;
}

export interface TwinPlan {
  disposable: number;
  emergencyTarget: number;
  emergencyGap: number;
  remainingToGoal: number;
  neededMonthly: number;
  recommendedMonthly: number;
  onTime: boolean;
  monthsToGoal: number | null;
  boostedMonthly: number;
  boostedMonths: number | null;
  monthsSaved: number;
  progress: number;
  score: number;
}

const MAX_MONTHS = 600;
const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function twinScore(income: number, expenses: number, commitments: number, savings: number) {
  if (income <= 0) return 0;
  const savingsRate = pos(income - expenses - commitments) / income;
  const coverage = expenses > 0 ? savings / expenses : 6;
  const commitRatio = commitments / income;
  const s1 = Math.min(savingsRate / 0.3, 1) * 40;
  const s2 = Math.min(coverage / 6, 1) * 35;
  const s3 = commitRatio <= 0.2 ? 25 : commitRatio >= 0.5 ? 0 : ((0.5 - commitRatio) / 0.3) * 25;
  return Math.round(s1 + s2 + s3);
}

export function monthsFor(total: number, monthly: number) {
  if (total <= 0) return 0;
  if (monthly <= 0) return null;
  const m = Math.ceil(total / monthly);
  return m > MAX_MONTHS ? null : m;
}

export function buildPlan(i: TwinInput): TwinPlan {
  const commitments = pos(i.commitments ?? 0);
  const emergencyMonths = i.emergencyMonths ?? 3;
  const safeRatio = i.safeRatio ?? 0.7;
  const disposable = pos(i.income - i.expenses - commitments);
  const emergencyTarget = pos(i.expenses) * emergencyMonths;
  const emergencyGap = pos(emergencyTarget - i.savings);
  const towardGoal = pos(i.savings - emergencyTarget);
  const remainingToGoal = pos(i.goal - towardGoal);
  const total = emergencyGap + remainingToGoal;
  const target = Math.max(1, Math.round(i.targetMonths));
  const neededMonthly = total / target;
  const cap = disposable * safeRatio;
  const recommendedMonthly = Math.round(Math.min(cap, neededMonthly));
  const monthsToGoal = monthsFor(total, recommendedMonthly);
  const boostedMonthly = Math.min(disposable, recommendedMonthly + pos(i.boost ?? 0));
  const boostedMonths = monthsFor(total, boostedMonthly);
  const monthsSaved = monthsToGoal != null && boostedMonths != null ? monthsToGoal - boostedMonths : 0;
  return {
    disposable,
    emergencyTarget,
    emergencyGap,
    remainingToGoal,
    neededMonthly: Math.round(neededMonthly),
    recommendedMonthly,
    onTime: monthsToGoal != null && monthsToGoal <= target,
    monthsToGoal,
    boostedMonthly,
    boostedMonths,
    monthsSaved,
    progress: i.goal > 0 ? Math.min(1, towardGoal / i.goal) : 0,
    score: twinScore(i.income, i.expenses, commitments, i.savings),
  };
}

/** Cumulative goal balance per month for base vs boosted plan (for charts). */
export function projection(i: TwinInput, points = 12) {
  const p = buildPlan(i);
  const horizon = Math.max(p.monthsToGoal ?? i.targetMonths * 2, 1);
  const step = Math.max(1, Math.ceil(horizon / points));
  const start = i.goal - p.remainingToGoal;
  const rows: { m: number; base: number; smart: number }[] = [];
  for (let m = 0; m <= horizon; m += step) {
    const toGoal = (monthly: number) => {
      const saved = monthly * m - p.emergencyGap;
      return Math.min(i.goal, start + pos(saved));
    };
    rows.push({ m, base: Math.round(toGoal(p.recommendedMonthly)), smart: Math.round(toGoal(p.boostedMonthly)) });
  }
  return rows;
}

/** Standard annuity monthly payment. */
export function annuity(principal: number, annualRate: number, years: number) {
  const n = years * 12;
  const r = annualRate / 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export type AltKey = "financeNow" | "delaySave" | "cheaper";
export interface Alternative {
  key: AltKey;
  price: number;
  downPayment: number;
  monthlyPayment: number;
  commitmentRatio: number;
  liquidityAfter: number;
  monthsToStart: number | null;
  recommended: boolean;
}

export const ALT_DEFAULTS = { rate: 0.05, years: 25, safeCommitment: 0.33, cheaperFactor: 0.75 };

export function alternatives(i: TwinInput, opts = ALT_DEFAULTS): Alternative[] {
  const p = buildPlan(i);
  const commitments = pos(i.commitments ?? 0);
  const saving = p.recommendedMonthly;
  const mk = (key: AltKey, price: number, downShare: number): Alternative => {
    const downPayment = price * downShare;
    const needed = pos(downPayment + p.emergencyTarget - i.savings);
    const monthsToStart = monthsFor(needed, saving);
    const monthlyPayment = Math.round(annuity(price - downPayment, opts.rate, opts.years));
    const liquidityAfter = Math.round(pos(i.savings + saving * (monthsToStart ?? 0) - downPayment));
    const commitmentRatio = i.income > 0 ? (commitments + monthlyPayment) / i.income : 1;
    return { key, price, downPayment, monthlyPayment, commitmentRatio, liquidityAfter, monthsToStart, recommended: false };
  };
  const list = [
    mk("financeNow", i.goal, 0.1),
    mk("delaySave", i.goal, 0.3),
    mk("cheaper", Math.round(i.goal * opts.cheaperFactor), 0.1),
  ];
  const safe = list.filter((a) => a.commitmentRatio <= opts.safeCommitment && a.monthsToStart != null);
  const pick = safe.length
    ? safe.reduce((a, b) => ((a.monthsToStart ?? 0) <= (b.monthsToStart ?? 0) ? a : b))
    : list.reduce((a, b) => (a.commitmentRatio <= b.commitmentRatio ? a : b));
  pick.recommended = true;
  return list;
}
