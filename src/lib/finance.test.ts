import { describe, expect, it } from "vitest";
import { calculateScore, computeOverview, simulate, type Overview } from "./finance";

const base: Overview = {
  totalBalance: 0, monthlyIncome: 10000, monthlyExpenses: 5000, prevIncome: 0, prevExpenses: 0,
  totalSavings: 24000, totalDebt: 0, totalInvestments: 60000, monthlyDebtPayments: 0, goalsCount: 0, goalsOnTrack: 0,
};

describe("financial score", () => {
  it("gives a debt-free, saving, investing profile the full 95 points (A+)", () => {
    // savings 25 + debt 25 + expenses 25 + investments 15 + no goals 5
    const r = calculateScore(base, "en");
    expect(r.score).toBe(95);
    expect(r.grade).toBe("A+");
  });
  it("scores zero expense points when spending equals income", () => {
    const r = calculateScore({ ...base, monthlyExpenses: 10000 }, "en");
    expect(r.breakdown.expenseRatio).toBe(0);
  });
});

describe("overview", () => {
  it("counts only this month's transactions as monthly income and expenses", () => {
    const now = new Date(2026, 10, 16);
    const mk = (type: "income" | "expense", amount: number, date: string) =>
      ({ id: date + amount, user_id: "u", type, amount, category: "x", description: null, date, created_at: "2026-01-01" });
    const o = computeOverview({ tx: [mk("income", 8000, "2026-11-01"), mk("expense", 500, "2026-11-05"), mk("income", 7000, "2026-10-01")], goals: [], debts: [], investments: [] }, now);
    expect(o.monthlyIncome).toBe(8000);
    expect(o.monthlyExpenses).toBe(500);
    expect(o.prevIncome).toBe(7000);
    expect(o.totalBalance).toBe(14500);
  });
});

describe("simulator", () => {
  it("adds a salary increase to every month's savings", () => {
    const flat = simulate("salary_increase", 0, base);
    const raise = simulate("salary_increase", 1000, base);
    expect(raise.projections[11]!.savings - flat.projections[11]!.savings).toBe(12000);
  });
});
