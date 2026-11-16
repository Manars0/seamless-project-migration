import type { Tables } from "@/integrations/supabase/types";

export type Tx = Tables<"transactions">;
export type Goal = Tables<"goals">;
export type Budget = Tables<"budgets">;
export type Investment = Tables<"investments">;
export type Debt = Tables<"debts">;
export type Lang = "ar" | "en";

const n = (v: unknown) => Number(v) || 0;
export const monthKey = (d: Date | string) => {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
};

export interface Overview {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  prevIncome: number;
  prevExpenses: number;
  totalSavings: number;
  totalDebt: number;
  totalInvestments: number;
  monthlyDebtPayments: number;
  goalsCount: number;
  goalsOnTrack: number;
}

export function computeOverview(
  d: { tx: Tx[]; goals: Goal[]; debts: Debt[]; investments: Investment[] },
  now = new Date(),
): Overview {
  const cur = monthKey(now);
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = monthKey(prevD);
  let inc = 0, exp = 0, pInc = 0, pExp = 0, bal = 0;
  for (const t of d.tx) {
    const a = n(t.amount);
    const k = t.date.slice(0, 7);
    bal += t.type === "income" ? a : -a;
    if (k === cur) t.type === "income" ? (inc += a) : (exp += a);
    if (k === prev) t.type === "income" ? (pInc += a) : (pExp += a);
  }
  const active = d.debts.filter((x) => x.status !== "paid_off");
  const goalsOnTrack = d.goals.filter((g) => goalOnTrack(g, now)).length;
  return {
    totalBalance: bal,
    monthlyIncome: inc,
    monthlyExpenses: exp,
    prevIncome: pInc,
    prevExpenses: pExp,
    totalSavings: d.goals.reduce((s, g) => s + n(g.current_amount), 0),
    totalDebt: active.reduce((s, x) => s + n(x.remaining_amount), 0),
    totalInvestments: d.investments.reduce((s, x) => s + n(x.current_value), 0),
    monthlyDebtPayments: active.reduce((s, x) => s + n(x.monthly_payment), 0),
    goalsCount: d.goals.length,
    goalsOnTrack,
  };
}

/** A goal is on track when it is complete, or its saved share is at least the share of time elapsed. */
export function goalOnTrack(g: Goal, now = new Date()) {
  const target = n(g.target_amount);
  const cur = n(g.current_amount);
  if (g.status === "completed" || (target > 0 && cur >= target)) return true;
  if (!g.deadline) return target > 0 && cur / target >= 0.25;
  const start = new Date(g.created_at).getTime();
  const end = new Date(g.deadline).getTime();
  if (end <= start) return false;
  const elapsed = Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
  return target > 0 && cur / target >= elapsed;
}

export function pctChange(cur: number, prev: number) {
  if (prev === 0) return cur === 0 ? 0 : 100;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

// ---------------- Financial score (ported from the original scoring engine) ----------------

const INSIGHTS = {
  expenseHigh: { en: "Your expenses are consuming over 80% of your income — this leaves little room for savings.", ar: "مصروفاتك تستهلك أكثر من 80% من دخلك، مما يترك مجالاً ضيقاً للادخار." },
  expenseGood: { en: "Excellent expense control — you're keeping costs well below your income.", ar: "تحكم ممتاز في المصروفات — تحافظ على نفقاتك أقل بكثير من دخلك." },
  debtHigh: { en: "Your debt-to-income ratio is above the recommended level, which may limit future borrowing.", ar: "نسبة الدين إلى الدخل لديك أعلى من المستوى الموصى به، مما قد يحد من اقتراضك مستقبلاً." },
  debtFree: { en: "Debt-free status — outstanding financial discipline.", ar: "أنت خالٍ من الديون — انضباط مالي استثنائي." },
  savingsLow: { en: "Your savings are below 10% of annual income. Building an emergency fund should be a priority.", ar: "مدخراتك أقل من 10% من دخلك السنوي. بناء صندوق طوارئ يجب أن يكون أولويتك." },
  hasInvestments: { en: "You have investments working for you — keep contributing regularly for compound growth.", ar: "لديك استثمارات تعمل لصالحك — استمر في المساهمة بانتظام لتحقيق النمو المركب." },
  noIncome: { en: "Add this month's income to get an accurate score.", ar: "أضف دخل هذا الشهر للحصول على مؤشر دقيق." },
};
const ACTIONS = {
  reviewExpenses: { en: "Review and categorize your monthly expenses to find areas to cut.", ar: "راجع مصروفاتك الشهرية وصنّفها للعثور على مجالات يمكن تخفيضها." },
  payDebt: { en: "Prioritize paying down high-interest debt using the avalanche or snowball method.", ar: "أعطِ الأولوية لسداد الديون ذات الفائدة العالية باستخدام أسلوب الانهيار أو كرة الثلج." },
  automatedSavings: { en: "Set up an automatic transfer to savings on each payday.", ar: "أنشئ تحويلاً تلقائياً للمدخرات في كل يوم راتب." },
  startInvesting: { en: "Consider starting an investment portfolio to grow wealth over time.", ar: "فكّر في البدء بمحفظة استثمارية لتنمية ثروتك بمرور الوقت." },
};

export interface ScoreResult {
  score: number;
  grade: string;
  breakdown: { savingsRatio: number; debtToIncome: number; expenseRatio: number; investmentGrowth: number; goalProgress: number };
  insights: string[];
  nextActions: string[];
}

export function calculateScore(o: Overview, lang: Lang = "en"): ScoreResult {
  const { monthlyIncome, monthlyExpenses, totalDebt, totalSavings, totalInvestments, goalsCount, goalsOnTrack } = o;
  const annual = monthlyIncome * 12;
  const savingsRate = monthlyIncome > 0 ? totalSavings / annual : 0;
  const savingsScore = Math.min(25, savingsRate * 25 * 5);
  const dti = annual > 0 ? totalDebt / annual : totalDebt > 0 ? 1 : 0;
  const debtScore = Math.max(0, 25 - dti * 25);
  const expenseRatio = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 1;
  const expenseScore = Math.max(0, 25 - Math.max(0, expenseRatio - 0.5) * 50);
  const invRatio = annual > 0 ? totalInvestments / annual : 0;
  const invScore = Math.min(15, invRatio * 15 * 2);
  const goalScore = goalsCount > 0 ? (goalsOnTrack / goalsCount) * 10 : 5;
  const score = Math.max(0, Math.min(100, Math.round(savingsScore + debtScore + expenseScore + invScore + goalScore)));
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";

  const insights: string[] = [];
  const nextActions: string[] = [];
  if (monthlyIncome === 0) insights.push(INSIGHTS.noIncome[lang]);
  if (expenseRatio > 0.8 && monthlyIncome > 0) {
    insights.push(INSIGHTS.expenseHigh[lang]);
    nextActions.push(ACTIONS.reviewExpenses[lang]);
  } else if (expenseRatio < 0.6) insights.push(INSIGHTS.expenseGood[lang]);
  if (dti > 0.4) {
    insights.push(INSIGHTS.debtHigh[lang]);
    nextActions.push(ACTIONS.payDebt[lang]);
  } else if (totalDebt === 0) insights.push(INSIGHTS.debtFree[lang]);
  if (savingsRate < 0.1) {
    insights.push(INSIGHTS.savingsLow[lang]);
    nextActions.push(ACTIONS.automatedSavings[lang]);
  }
  if (totalInvestments === 0) nextActions.push(ACTIONS.startInvesting[lang]);
  else insights.push(INSIGHTS.hasInvestments[lang]);

  return {
    score,
    grade,
    breakdown: {
      savingsRatio: Math.round(savingsScore),
      debtToIncome: Math.round(debtScore),
      expenseRatio: Math.round(expenseScore),
      investmentGrowth: Math.round(invScore),
      goalProgress: Math.round(goalScore),
    },
    insights,
    nextActions,
  };
}

// ---------------- Period series for charts / reports ----------------

export type Period = "monthly" | "quarterly" | "yearly";

export function periodSeries(tx: Tx[], period: Period, lang: Lang, now = new Date()) {
  const buckets: { key: string; label: string; income: number; expenses: number; net: number }[] = [];
  const locale = lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US";
  if (period === "monthly") {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: monthKey(d), label: d.toLocaleDateString(locale, { month: "short" }), income: 0, expenses: 0, net: 0 });
    }
  } else if (period === "quarterly") {
    const q = Math.floor(now.getMonth() / 3);
    for (let i = 3; i >= 0; i--) {
      const idx = now.getFullYear() * 4 + q - i;
      const y = Math.floor(idx / 4), qq = idx % 4;
      buckets.push({ key: `${y}-Q${qq + 1}`, label: `Q${qq + 1} ${String(y).slice(2)}`, income: 0, expenses: 0, net: 0 });
    }
  } else {
    for (let i = 2; i >= 0; i--) {
      const y = now.getFullYear() - i;
      buckets.push({ key: String(y), label: String(y), income: 0, expenses: 0, net: 0 });
    }
  }
  const keyOf = (date: string) => {
    const y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7));
    if (period === "monthly") return date.slice(0, 7);
    if (period === "quarterly") return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
    return String(y);
  };
  const map = new Map(buckets.map((b) => [b.key, b]));
  for (const t of tx) {
    const b = map.get(keyOf(t.date));
    if (!b) continue;
    if (t.type === "income") b.income += n(t.amount);
    else b.expenses += n(t.amount);
  }
  let cumulative = 0;
  return buckets.map((b) => {
    b.net = b.income - b.expenses;
    cumulative += b.net;
    return { ...b, cumulative };
  });
}

export function spendingByCategory(tx: Tx[], sinceKey?: string) {
  const m = new Map<string, number>();
  for (const t of tx) {
    if (t.type !== "expense") continue;
    if (sinceKey && t.date.slice(0, 7) < sinceKey) continue;
    m.set(t.category, (m.get(t.category) ?? 0) + n(t.amount));
  }
  const total = [...m.values()].reduce((a, b) => a + b, 0);
  return [...m.entries()]
    .map(([category, amount]) => ({ category, amount, percentage: total ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

// ---------------- Scenario simulator ----------------

export type ScenarioType = "salary_increase" | "extra_payment" | "new_loan" | "investment" | "expense_cut";

export function simulate(type: ScenarioType, amount: number, o: Overview, months = 12) {
  let income = o.monthlyIncome, expenses = o.monthlyExpenses;
  let savings = o.totalSavings + Math.max(0, o.totalBalance);
  let debt = o.totalDebt, investments = o.totalInvestments;
  let debtPay = Math.min(o.monthlyDebtPayments, debt);
  let extraInvest = 0, extraDebt = 0;
  if (type === "salary_increase") income += amount;
  if (type === "expense_cut") expenses = Math.max(0, expenses - amount);
  if (type === "extra_payment") extraDebt = amount;
  if (type === "investment") extraInvest = amount;
  if (type === "new_loan") {
    debt += amount;
    savings += amount;
    debtPay += amount / 24;
  }
  const startNet = savings + investments - debt;
  const rows = [];
  for (let m = 1; m <= months; m++) {
    const pay = Math.min(debt, debtPay + extraDebt);
    debt -= pay;
    investments = investments * (1 + 0.08 / 12) + extraInvest;
    savings += income - expenses - pay - extraInvest;
    rows.push({ month: m, savings: Math.round(savings), debt: Math.round(debt), investments: Math.round(investments), netWorth: Math.round(savings + investments - debt) });
  }
  const last = rows[rows.length - 1];
  const monthlyNet = income - expenses - debtPay - extraDebt - extraInvest;
  const risk: "low" | "medium" | "high" =
    monthlyNet < 0 || last.savings < 0 ? "high" : income > 0 && monthlyNet / income < 0.1 ? "medium" : "low";
  return { projections: rows, projectedNetWorth: last.netWorth, netWorthGain: last.netWorth - startNet, risk };
}

const RECS: Record<ScenarioType, Record<Lang, (a: string) => string>> = {
  salary_increase: {
    en: (a) => `A raise of ${a} per month strengthens your position. Direct at least half of it to savings and investments.`,
    ar: (a) => `زيادة الدخل بمقدار ${a} شهرياً تعزز وضعك المالي. خصّص نصفها على الأقل للادخار والاستثمار.`,
  },
  extra_payment: {
    en: (a) => `Paying an extra ${a} toward debt each month cuts interest and frees cash flow sooner. Target the highest rate first.`,
    ar: (a) => `سداد ${a} إضافية شهرياً للديون يقلل الفوائد ويحرّر التدفق النقدي أسرع. ابدأ بالدين الأعلى فائدة.`,
  },
  new_loan: {
    en: (a) => `A new ${a} loan raises your debt-to-income ratio. Make sure its purpose returns more than its interest.`,
    ar: (a) => `قرض جديد بقيمة ${a} يرفع نسبة دينك إلى الدخل. تأكد أن عائده يفوق تكلفة فائدته.`,
  },
  investment: {
    en: (a) => `Investing ${a} monthly at ~8% a year compounds steadily. Diversify across asset classes to manage risk.`,
    ar: (a) => `استثمار ${a} شهرياً بعائد سنوي يقارب 8% ينمو بشكل مركب. نوّع بين فئات الأصول لإدارة المخاطر.`,
  },
  expense_cut: {
    en: (a) => `Cutting ${a} of monthly spending improves cash flow immediately. Send the difference to your top goal.`,
    ar: (a) => `خفض المصروفات بمقدار ${a} شهرياً يحسّن التدفق النقدي فوراً. وجّه الفرق نحو هدفك الأهم.`,
  },
};
export const scenarioRecommendation = (t: ScenarioType, formattedAmount: string, lang: Lang) => RECS[t][lang](formattedAmount);

// ---------------- Recommendations & notifications ----------------

export interface Rec {
  id: string;
  category: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}

export function recommendations(o: Overview, debts: Debt[], budgets: Budget[], lang: Lang): Rec[] {
  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const out: Rec[] = [];
  const emergencyTarget = o.monthlyExpenses * 6;
  if (o.monthlyIncome > 0 && o.monthlyExpenses / o.monthlyIncome > 0.7)
    out.push({ id: "spend", category: L("Budget", "الميزانية"), priority: "high", title: L("Reduce monthly spending", "خفّض الإنفاق الشهري"), description: L(`You spend ${Math.round((o.monthlyExpenses / o.monthlyIncome) * 100)}% of income. Aim for under 70%.`, `تنفق ${Math.round((o.monthlyExpenses / o.monthlyIncome) * 100)}% من دخلك. استهدف أقل من 70%.`) });
  const topDebt = [...debts].filter((d) => d.status !== "paid_off").sort((a, b) => n(b.interest_rate) - n(a.interest_rate))[0];
  if (topDebt && n(topDebt.interest_rate) >= 10)
    out.push({ id: "debt", category: L("Debt", "الديون"), priority: "high", title: L(`Pay down ${topDebt.name} first`, `ابدأ بسداد ${topDebt.name}`), description: L(`At ${topDebt.interest_rate}% it is your most expensive debt.`, `بفائدة ${topDebt.interest_rate}% هو أغلى ديونك.`) });
  if (emergencyTarget > 0 && o.totalSavings < emergencyTarget)
    out.push({ id: "emergency", category: L("Savings", "الادخار"), priority: "medium", title: L("Build a 6-month emergency fund", "ابنِ صندوق طوارئ لستة أشهر"), description: L(`Target about ${Math.round(emergencyTarget)} in easily accessible savings.`, `استهدف حوالي ${Math.round(emergencyTarget)} في مدخرات سهلة الوصول.`) });
  const over = budgets.filter((b) => n(b.allocated_amount) > 0 && n(b.spent_amount) > n(b.allocated_amount));
  if (over.length)
    out.push({ id: "budget", category: L("Budget", "الميزانية"), priority: "medium", title: L("Some categories are over budget", "بعض الفئات تجاوزت الميزانية"), description: over.map((b) => b.category).join("، ") });
  if (o.totalInvestments === 0 && o.monthlyIncome > o.monthlyExpenses)
    out.push({ id: "invest", category: L("Investing", "الاستثمار"), priority: "low", title: L("Start investing your surplus", "ابدأ باستثمار الفائض"), description: L("Even a small monthly amount in a diversified fund compounds over time.", "حتى مبلغ شهري صغير في صندوق متنوع ينمو بمرور الوقت.") });
  return out;
}

export interface Notice {
  id: string;
  type: "warning" | "alert" | "goal" | "achievement" | "tip";
  title: string;
  message: string;
}

export function notices(d: { goals: Goal[]; budgets: Budget[]; debts: Debt[] }, lang: Lang, now = new Date()): Notice[] {
  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const out: Notice[] = [];
  for (const b of d.budgets) {
    const p = n(b.allocated_amount) > 0 ? n(b.spent_amount) / n(b.allocated_amount) : 0;
    if (p >= 1) out.push({ id: `b-over-${b.id}-${b.month}`, type: "alert", title: L("Over budget", "تجاوز الميزانية"), message: `${b.category}: ${Math.round(p * 100)}%` });
    else if (p >= 0.85) out.push({ id: `b-warn-${b.id}-${b.month}`, type: "warning", title: L("Budget almost used", "الميزانية شارفت على النفاد"), message: `${b.category}: ${Math.round(p * 100)}%` });
  }
  for (const g of d.goals) {
    if (n(g.current_amount) >= n(g.target_amount) && n(g.target_amount) > 0)
      out.push({ id: `g-done-${g.id}`, type: "achievement", title: L("Goal reached", "تحقق الهدف"), message: g.title });
    else if (g.deadline) {
      const days = (new Date(g.deadline).getTime() - now.getTime()) / 86400000;
      if (days >= 0 && days <= 30) out.push({ id: `g-soon-${g.id}`, type: "goal", title: L("Goal deadline approaching", "موعد الهدف يقترب"), message: g.title });
    }
  }
  for (const x of d.debts) {
    if (x.status === "paid_off" || !x.due_date) continue;
    const days = (new Date(x.due_date).getTime() - now.getTime()) / 86400000;
    if (days >= 0 && days <= 7) out.push({ id: `d-due-${x.id}-${x.due_date}`, type: "warning", title: L("Payment due soon", "دفعة مستحقة قريباً"), message: x.name });
  }
  return out;
}
