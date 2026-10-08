// The money / percent rules and the Rate math of the "New Labor Rate" form,
// in one place because the Pricing module collects four numbers that all obey
// the same two or three rules (Figma file U2V0ZqWOhV89yql8GKRmjy — each input's
// own annotation).
//
//   Cost            numeric · 2 decimals max · no value = $0 · NEGATIVE NOT allowed
//   Rate (manual)   numeric · 2 decimals max · no value = $0 · NEGATIVE NOT allowed
//   Fixed markup    numeric · 2 decimals max · negative IS allowed
//   Percent markup  numeric · 2 decimals max · negative IS allowed · max 999%
//
// The characters each field accepts are part of the annotation, so they are
// enforced on the way INTO state: a value the rules could not judge never
// exists. (The Cost annotation still lists a comma among its characters while
// the other three have dropped it — flagged to Daniel; we follow the three.)

/**
 * The Name's ceiling. Production's `description` column takes 100, but the
 * name is copied into a job / estimate / invoice `service_name`, which is 50 —
 * so 50 is the real limit, and the node caps there.
 */
export const MAX_NAME = 50;

/** The counter only appears in the last stretch (the node: 10 characters). */
export const NAME_COUNTER_FROM = 10;

/** The decimals every number in this form may carry. */
export const MAX_DECIMALS = 2;

/** "Can not be greater than 999%" — the Percent markup's own error state. */
export const MAX_PERCENT = 999;

/** Production stores the percent as DECIMAL(6,3); below −100 the rate goes negative. */
export const MIN_PERCENT = -100;

const withinDecimals = (value: string) => (value.split(".")[1] ?? "").length <= MAX_DECIMALS;

/** True while the text is something an UNSIGNED field may hold ("", "8", "8.5"). */
export const isAmountText = (value: string) => (value === "" || /^\d*\.?\d*$/.test(value)) && withinDecimals(value);

/** The same, plus a leading minus — the two markups accept one ("digits, dot and minus"). */
export const isSignedText = (value: string) =>
  (value === "" || value === "-" || /^-?\d*\.?\d*$/.test(value)) && withinDecimals(value);

/** "No value = $0", and a half-typed "-" or "." is worth 0 too. */
export const numberOf = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * What a money / percent field holds after it loses focus: the value typed in
 * the format the form stores it in — "100" → "100.00", "56.46" unchanged,
 * ".5" → "0.50". An empty field (or a lone "-" / ".") stays empty, so the
 * Cost placeholder keeps showing.
 */
export const formatOnBlur = (value: string) => {
  const text = value.trim();
  if (text === "" || text === "-" || text === "." || text === "-.") return "";
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed.toFixed(MAX_DECIMALS) : text;
};

/** Cents, so 62 × 1.345 can not leave a float tail in the comparison. */
const round2 = (value: number) => Math.round(value * 100) / 100;

export type PriceStrategy = "manual" | "fixed" | "percent";

/**
 * The Rate the Pricing module shows, from the strategy and its input — the
 * math the two ValueDisplay annotations spell out, and the same the database
 * trigger runs ("Cost" + "Fixed markup", and cost × (1 + percent/100)).
 */
export function computeRate(strategy: PriceStrategy, cost: number, fixed: number, percent: number): number {
  if (strategy === "fixed") return round2(cost + fixed);
  if (strategy === "percent") return round2(cost * (1 + percent / 100));
  return round2(cost);
}

/**
 * Money: "$150.00", "$1,100.00", "−$50.00" — the sign before the currency
 * symbol, the US thousands comma, and a NEGATIVE carrying the true MINUS SIGN
 * (U+2212), not the hyphen the formatter emits. That is the DS rule Daniel set
 * on 2026-09-16 for every money column (`Filters/listData.formatCurrency`);
 * the Figma node writes a hyphen here, which is the drift — flagged.
 */
export const money = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" }).replace(/^-/, "−");
