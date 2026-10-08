// The "General" module's two field rules, in one place because two forms
// collect them: the "New tax rate" form and the panel's "General" edit form —
// whose own annotation points AT this form for its inputs, so the two must
// agree.
//
// Percentage (Figma 44-3125): "Numerical value only · from 0 to 100 · 2 decimal
// places max · Negative value is not allowed · The input doesn't support
// anything except digits and dot · Mobile keyboard is 'decimal'".
//
// Production: `default_price` is a number input with min 0 and a 0.25 step,
// stored as DECIMAL(10,3), and `PriceBookItem.clean` rejects a tax rate over
// 100 ("This value may not exceed 100%."). The step is only the spinner's
// increment — 5.73 is accepted — so the real rules are the range and the
// precision. NOTE: the column keeps THREE decimals and the node now says two
// (it used to say three) — flagged to Daniel, because a real rate like NYC's
// 8.875% needs the third one.
//
// Name (Figma 44-3119): "Caps at 50 characters · Characters counter shows up
// only when 10 characters left · Mobile keyboard is 'text'", and the cap
// "doesn't switch to an error state. It just stops accepting input."

/**
 * The Name's ceiling. Production's `description` column takes 100, but the name
 * is copied into a line item's `service_name`, which is 50 — so 50 is the real
 * limit, and the node caps there. (Same ceiling as the labor rate's Name.)
 */
export const MAX_NAME = 50;

/** The counter only appears in the last stretch (the node: 10 characters). */
export const NAME_COUNTER_FROM = 10;

export const MAX_RATE = 100;

/** The decimals the percentage may carry (the node, 2026-10-08). */
export const MAX_DECIMALS = 2;

const withinDecimals = (value: string) => (value.split(".")[1] ?? "").length <= MAX_DECIMALS;

/**
 * True while the text is something the field may hold ("", "8", "8.63").
 *
 * The precision is enforced on the way INTO state, like the Name's cap: a third
 * decimal is simply not accepted, so there is no error state for it (the node
 * draws none — only the empty and the over-100 ones).
 */
export const isRateText = (value: string) => (value === "" || /^\d*\.?\d*$/.test(value)) && withinDecimals(value);

/**
 * What is wrong with the typed percentage — or undefined when nothing is.
 *
 * The empty case returns `null` instead of a message: "Enter Percentage" is
 * what TextField already derives from its label, so the field needs no
 * override for it.
 */
export function rateIssue(value: string): { message: string } | null | undefined {
  const text = value.trim();
  if (text === "") return null;
  if (Number(text) > MAX_RATE) return { message: `Up to ${MAX_RATE}%` };
  return undefined;
}
