// The inline text separator — THE single source of truth (Daniel, 2026-09-04,
// after the separator research). Change the separator product-wide by
// changing this file only.
//
// The rule it encodes:
//   - The separator is the MIDDLE DOT `·` (U+00B7) with TWO spaces on each
//     side. The spaces are PART of the separator — the dot must never appear
//     without them — which is why consumers write `a + TEXT_SEPARATOR + b`
//     (or `parts.join(TEXT_SEPARATOR)`) and never type the dot by hand.
//   - It joins UNRELATED pieces sharing one line: email · phone,
//     name · manufacturer, model · serial, type · industry, name · address.
//   - A date with its TIME is NOT a pair — it is one compound value, joined
//     by a comma ("Aug 12, 9:00 AM"; see the Filters prototype's
//     `formatDateTime`) or by "at" where the string already carries commas
//     ("Mon, Jan 1, 2026 at 12:00 PM" — ActivityLog's tooltip). Style guides
//     (Atlassian, Google) join it the same two ways, never with a symbol.
//
// Why the middle dot: it is one of the few dot characters Inter actually
// CONTAINS (bullet •, middle dot ·, small square ▪, white bullet ◦, black
// circle ●) — anything else (・ ∙ ⋅) falls back to a different font in every
// app and cannot match Figma. The two-space padding is what gives the small
// dot its separating power.
//
// The inner space on each side is a NO-BREAK SPACE (U+00A0): HTML collapses
// runs of ordinary spaces to one, so a plain "  ·  " would render
// single-spaced. nbsp + space renders as two, and the nbsp keeps the dot
// glued to its neighbours if a line ever wraps.
//
// In FIGMA, type it as: space, space, · (Option+Shift+9), space, space —
// Figma does not collapse spaces, so ordinary spaces are fine there.
//
// FLAGGED: the production app (roopairs_api, read-only) hardcodes its own
// separators (e.g. DateTimeCell's " • "); adopting this rule there means
// creating the same constant in the PWA.

/** `"A  ·  B"` — the dot with its two baked-in spaces per side. */
export const TEXT_SEPARATOR = "  ·  ";

/** The non-empty pieces, joined: `joinWithSeparator("HQ", null)` → `"HQ"`. */
export const joinWithSeparator = (...parts: (string | null | undefined)[]): string =>
  parts.filter((part) => part != null && part !== "").join(TEXT_SEPARATOR);
