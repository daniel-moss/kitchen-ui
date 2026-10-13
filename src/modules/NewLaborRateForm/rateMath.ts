// The money / percent rules and the Rate math of the "New Labor Rate" form,
// in one place because the Pricing module collects four numbers that all obey
// the same two or three rules (Figma file U2V0ZqWOhV89yql8GKRmjy — each input's
// own annotation).
//
//   Cost            numeric · 3 decimals max · no value = $0 · NEGATIVE NOT allowed
//   Rate (manual)   numeric · 3 decimals max · no value = $0 · NEGATIVE NOT allowed
//   Fixed markup    numeric · 3 decimals max · negative IS allowed
//   Percent markup  numeric · 3 decimals max · negative IS allowed · max 999%
//
// The characters each field accepts are part of the annotation, so they are
// enforced on the way INTO state: a value the rules could not judge never
// exists. (The Cost annotation still lists a comma among its characters while
// the other three have dropped it — flagged to Daniel; we follow the three.)
//
// The precision is THREE decimals (Daniel, 2026-10-09) — production stores
// `cost` and `default_price` as DECIMAL(10,3). The nodes still say two.
// Nothing is REFORMATTED when a field loses focus: a field keeps the text that
// was typed ("100" stays "100"), because padding to three decimals would read
// oddly on money ("100.000").

/**
 * The Name's ceiling. Production's `description` column takes 100, but the
 * name is copied into a job / estimate / invoice `service_name`, which is 50 —
 * so 50 is the real limit, and the node caps there.
 */
export const MAX_NAME = 50;

/** The counter only appears in the last stretch (the node: 10 characters). */
export const NAME_COUNTER_FROM = 10;

/** The decimals every number in this form may carry. */
export const MAX_DECIMALS = 3;

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
 * The precision production keeps money at, so 62 × 1.345 can not leave a float
 * tail in the comparison — and so a rate derived from a 3-decimal cost is not
 * quietly rounded BELOW it (which would raise the "less than cost" warning on a
 * $0 markup).
 */
const roundMoney = (value: number) => Math.round(value * 1000) / 1000;

export type PriceStrategy = "manual" | "fixed" | "percent";

/**
 * The Rate the Pricing module shows, from the strategy and its input — the
 * math the two ValueDisplay annotations spell out, and the same the database
 * trigger runs ("Cost" + "Fixed markup", and cost × (1 + percent/100)).
 */
export function computeRate(strategy: PriceStrategy, cost: number, fixed: number, percent: number): number {
  if (strategy === "fixed") return roundMoney(cost + fixed);
  if (strategy === "percent") return roundMoney(cost * (1 + percent / 100));
  return roundMoney(cost);
}

/**
 * Money: "$150.00", "$1,100.00", "−$50.00" — the sign before the currency
 * symbol, the US thousands comma, and a NEGATIVE carrying the true MINUS SIGN
 * (U+2212), not the hyphen the formatter emits. That is the DS rule Daniel set
 * on 2026-09-16 for every money column (`Filters/listData.formatCurrency`);
 * the Figma node writes a hyphen here, which is the drift — flagged.
 *
 * Always two decimals, and a THIRD when the value carries one ("$62.125") —
 * production's own `formatCurrency` (min 2 / max 3) does exactly this, which is
 * what lets a 3-decimal cost or rate be shown instead of silently rounded.
 */
export const money = (value: number) =>
  value
    .toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 3 })
    .replace(/^-/, "−");
