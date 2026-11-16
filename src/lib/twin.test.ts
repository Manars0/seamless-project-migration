import { describe, it, expect } from "vitest";
import { buildPlan, alternatives, annuity, twinScore } from "./twin";

const base = { income: 20000, expenses: 9000, commitments: 2000, savings: 60000, goal: 900000, targetMonths: 60 };

describe("twin plan", () => {
  it("disposable = income - expenses - commitments", () => {
    expect(buildPlan(base).disposable).toBe(9000);
  });
  it("reserves 3 months of expenses as emergency fund before the goal", () => {
    const p = buildPlan(base);
    expect(p.emergencyTarget).toBe(27000);
    expect(p.remainingToGoal).toBe(900000 - 33000);
  });
  it("fills a missing emergency fund first", () => {
    const p = buildPlan({ ...base, savings: 10000 });
    expect(p.emergencyGap).toBe(17000);
    expect(p.remainingToGoal).toBe(900000);
  });
  it("caps recommended saving at disposable x safe ratio", () => {
    expect(buildPlan(base).recommendedMonthly).toBe(6300);
  });
  it("uses the needed amount when it is lower than the cap", () => {
    const p = buildPlan({ ...base, goal: 60000, targetMonths: 12 });
    expect(p.recommendedMonthly).toBe(Math.round(27000 / 12));
    expect(p.onTime).toBe(true);
  });
  it("months to goal = remaining / monthly, and a boost saves months", () => {
    const p = buildPlan({ ...base, boost: 800 });
    expect(p.monthsToGoal).toBe(Math.ceil(867000 / 6300));
    expect(p.boostedMonths).toBe(Math.ceil(867000 / 7100));
    expect(p.monthsSaved).toBeGreaterThan(0);
  });
  it("no disposable income means the goal is not reachable", () => {
    expect(buildPlan({ ...base, expenses: 18000 }).monthsToGoal).toBeNull();
  });
  it("score: 30% savings rate, 6 months cover, low commitments = 100", () => {
    expect(twinScore(10000, 7000, 0, 42000)).toBe(100);
  });
  it("annuity payment for 810k over 25y at 5%", () => {
    expect(Math.round(annuity(810000, 0.05, 25))).toBe(4735);
  });
  it("recommends exactly one alternative within the 33% commitment limit", () => {
    const alts = alternatives(base);
    const rec = alts.filter((a) => a.recommended);
    expect(rec).toHaveLength(1);
    expect(rec[0].commitmentRatio).toBeLessThanOrEqual(0.33);
  });
});
