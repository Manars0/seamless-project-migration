export function formatMoney(amount: number, currency = "SAR", lang = "ar") {
  try {
    return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      numberingSystem: "latn",
    }).format(Number(amount) || 0);
  } catch {
    return `${Math.round(Number(amount) || 0)} ${currency}`;
  }
}

export function formatCompact(amount: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(amount);
}

export function formatDate(d: string | null | undefined, lang = "ar") {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
