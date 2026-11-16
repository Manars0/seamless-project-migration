import type { TFunction } from "i18next";

export const EXPENSE_CATS = ["housing", "food", "transport", "utilities", "healthcare", "shopping", "entertainment", "education", "insurance", "savings", "other"];
export const INCOME_CATS = ["salary", "business", "freelance", "gift", "other"];
export const GOAL_CATS = ["emergency", "retirement", "education", "travel", "home", "car", "business", "other"];

export function catLabel(t: TFunction, key: string) {
  const k = key.toLowerCase();
  return t(`budget.categories.${k}`, { defaultValue: t(`tx.cats.${k}`, { defaultValue: key }) });
}
export function opts(t: TFunction, keys: string[], prefix?: string) {
  return keys.map((k) => ({ value: k, label: prefix ? t(`${prefix}.${k}`) : catLabel(t, k) }));
}
