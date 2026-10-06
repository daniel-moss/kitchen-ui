// The "Percentage" field's rules, in one place because two forms collect it:
// the "New tax rate" form and the panel's "General details" edit form — whose
// own annotation points AT this form for its inputs, so the two must agree.
//
// Production: `default_price` is a number input with min 0, max 100 and a 0.25
// step, stored as a decimal with 3 decimal places. The step is only the
// spinner's increment — 5.73 is accepted — so the real rules are the range and
// the precision. Daniel's annotation says the same: "Numerical value only ·
// from 0 to 100 · Up to 3 decimals".

export const MAX_RATE = 100;
export const MAX_DECIMALS = 3;

/** True while the text is something the field may hold ("", "8", "8.63"). */
export const isRateText = (value: string) => value === "" || /^\d*\.?\d*$/.test(value);

const decimalsOf = (value: string) => (value.split(".")[1] ?? "").length;

/**
 * What is wrong with the typed percentage, as the Validation frame words it
 * (node 1-7840) — or undefined when nothing is.
 *
 * The empty case returns `null` instead of a message: "Enter Percentage" is
 * what TextField already derives from its label, so the field needs no
 * override for it.
 */
export function rateIssue(value: string): { message: string } | null | undefined {
  const text = value.trim();
  if (text === "") return null;
  if (Number(text) > MAX_RATE) return { message: `Up to ${MAX_RATE}%` };
  if (decimalsOf(text) > MAX_DECIMALS) return { message: `Up to ${MAX_DECIMALS} decimal places` };
  return undefined;
}
