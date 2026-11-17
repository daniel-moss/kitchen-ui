import { DimensionUnit, WeightUnit } from "../../../data/db/types";
import { TEXT_SEPARATOR } from "../../../utils/textSeparator";

// Every field rule of the "New product" form in one place (Figma file
// n4FkA98uVyhbOJeLY0AXZV — each input's own annotation), because five modules
// collect numbers and text that obey the same handful of rules.
//
//   Name              50 characters
//   Manufacturer      100 characters
//   Manufacturer #    100 characters
//   Barcode           255 characters · unique per company · control characters dropped
//   Image URL         200 characters · must read as a URL
//   Vendor part #     100 characters
//   Bin location      50 characters
//   Cost / Price      3 decimals · 7 digits before the dot · NEGATIVE NOT allowed
//   Fixed markup      3 decimals · 7 digits · negative IS allowed
//   Percent markup    3 decimals · 3 digits · negative IS allowed · max 999.999%
//   Weight / L·W·H    4 decimals · 6 digits · NEGATIVE NOT allowed
//   On hand           3 decimals · 4 digits · negative IS allowed
//   On order / Target / Alert at   3 decimals · 4 digits · NEGATIVE NOT allowed
//
// A CHARACTER LIMIT NEVER STOPS THE TYPING (Daniel, 2026-10-16, and every
// "Characters Limit" annotation since): the field takes the text and turns
// red in real time with "60 / 50 characters" while it is over. The NUMBER
// rules are different — the characters each one accepts are part of its
// annotation, so they are enforced on the way INTO state and a value the rules
// could not judge never exists. The digit limits are production's columns —
// money is DECIMAL(10,3) (7 before the dot), the percent DECIMAL(6,3) (3), the
// measurements DECIMAL(10,4) (6), and the stock quantities DECIMAL(7,3) (4).

/**
 * Spread on every free-text field of the form: no autocomplete, autocorrect,
 * auto-capitalisation or spell check. Turning all four off is what keeps the
 * iPhone keyboard from drawing its suggestions bar over a field that holds a
 * name, a code or a number (Daniel, 2026-10-17).
 */
export const NO_SUGGESTIONS = { autoComplete: "off", autoCorrect: "off", autoCapitalize: "off", spellCheck: false } as const;

/**
 * The iPhone "decimal" keyboard shows the separator of the phone's REGION — a
 * comma in much of Europe — and a web page can not change that key. So every
 * number field here reads a typed comma as the dot it means.
 */
export const decimalText = (value: string) => value.replace(/,/g, ".");

export const MAX_NAME = 50;
export const MAX_TEXT = 100;
export const MAX_BARCODE = 255;
export const MAX_IMAGE_URL = 200;
export const MAX_BIN = 50;

/**
 * The error a field shows while its text is over the limit — "60 / 50
 * characters" — and undefined while it fits. One wording for every field.
 */
export const overLimitError = (value: string, max: number) =>
  value.length > max ? `${value.length} / ${max} characters` : undefined;

/** "The value can't be greater than this" — the Percent markup's top value. */
export const MAX_PERCENT = 999.999;

export type CostStrategy = "manual" | "minVendorCost" | "maxVendorCost" | "avgVendorCost";
export type PriceStrategy = "manual" | "fixedMarkup" | "percentMarkup";

const digitsBefore = (value: string) => (value.replace("-", "").split(".")[0] ?? "").length;
const digitsAfter = (value: string) => (value.split(".")[1] ?? "").length;

/** True while the text is something an UNSIGNED numeric field may hold. */
const isNumberText = (value: string, decimals: number, integers: number) =>
  (value === "" || /^\d*\.?\d*$/.test(value)) && digitsAfter(value) <= decimals && digitsBefore(value) <= integers;

/** Money: "", "8", "8.5", "1234567.125" — no minus, 3 decimals, 7 digits. */
export const isMoneyText = (value: string) => isNumberText(value, 3, 7);

/** The same, plus a leading minus — the Fixed markup accepts one. */
export const isSignedMoneyText = (value: string) =>
  (value === "" || value === "-" || /^-?\d*\.?\d*$/.test(value)) && digitsAfter(value) <= 3 && digitsBefore(value) <= 7;

/** The percent markup: signed, 3 decimals, 3 digits (DECIMAL(6,3)). */
export const isPercentText = (value: string) =>
  (value === "" || value === "-" || /^-?\d*\.?\d*$/.test(value)) && digitsAfter(value) <= 3 && digitsBefore(value) <= 3;

/** Weight and the three dimensions: 4 decimals, 6 digits, never negative. */
export const isMeasureText = (value: string) => isNumberText(value, 4, 6);

/** On order, Target and Alert at: 3 decimals, 4 digits, never negative. */
export const isQuantityText = (value: string) => isNumberText(value, 3, 4);

/** On hand — the one stock number that may go below zero. */
export const isSignedQuantityText = (value: string) =>
  (value === "" || value === "-" || /^-?\d*\.?\d*$/.test(value)) && digitsAfter(value) <= 3 && digitsBefore(value) <= 4;

/**
 * "Automatically removes control characters to avoid error states" — a
 * scanned GS1 code can carry them, and the server rejects the code if it does.
 */
// eslint-disable-next-line no-control-regex
export const stripControlCharacters = (value: string) => value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

/**
 * The Image URL's "Invalid URL" check. The field draws "https://" as its
 * prefix, so the user types the rest — a host with a dot and no spaces is
 * enough; a pasted full link with its own scheme is accepted too.
 */
export const isImageUrl = (value: string) => {
  const text = value.trim();
  if (text === "") return true;
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`);
    return /^https?:$/.test(url.protocol) && url.hostname.includes(".") && !/\s/.test(text);
  } catch {
    return false;
  }
};

/** "No value = 0", and a half-typed "-" or "." is worth 0 too. */
export const numberOf = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** True when the field holds nothing a number could be read from. */
export const isBlank = (value: string) => value.trim() === "" || value.trim() === "-" || value.trim() === ".";

/**
 * What a MONEY or PERCENT field holds after it loses focus: the typed value
 * padded to at least two decimals — "100" → "100.00", "100.5" → "100.50",
 * "100.046" unchanged, and "50%" → "50.00%" (Daniel, 2026-10-13; the percent
 * joined on 2026-10-17). An empty field stays empty, so a placeholder keeps
 * showing.
 *
 * NOTE this is the opposite of the Labor rate and Tax rate forms, where the
 * blur formatter was deleted on 2026-10-09. Daniel: the pad-to-2 is the
 * correct rule for the product, and those two forms follow later.
 */
export const padMoneyOnBlur = (value: string) => {
  if (isBlank(value)) return "";
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return value;
  return digitsAfter(value.trim()) >= 2 ? value.trim() : parsed.toFixed(2);
};

/**
 * Money, the display rule shared by every calculated value here: at least two
 * decimals, at most three — "$100.00", "$100.06", "$100.046" — the US
 * thousands comma, and a NEGATIVE carrying the true MINUS SIGN (U+2212), not
 * the hyphen the formatter emits (the DS money rule, Daniel 2026-09-16).
 */
export const money = (value: number) =>
  value
    .toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 3 })
    .replace(/^-/, "−");

/** A percent as typed, up to its three decimals and never padded: "20%", "7.125%". */
export const percent = (value: number) => `${Number(value.toFixed(3))}%`;

/** The precision production keeps money at (DECIMAL(10,3)). */
const roundMoney = (value: number) => Math.round(value * 1000) / 1000;

/**
 * The product's cost: typed under "Manual", and under a vendor strategy the
 * lowest / highest / average of the cards — the same three sums production's
 * database trigger runs, which also falls back to 0 with no cards at all.
 */
export function resolveCost(strategy: CostStrategy, typed: number, vendorCosts: number[]): number {
  if (strategy === "manual") return typed;
  if (vendorCosts.length === 0) return 0;
  if (strategy === "minVendorCost") return roundMoney(Math.min(...vendorCosts));
  if (strategy === "maxVendorCost") return roundMoney(Math.max(...vendorCosts));
  return roundMoney(vendorCosts.reduce((sum, cost) => sum + cost, 0) / vendorCosts.length);
}

/**
 * The Price the module shows under a markup — the math the two ValueDisplay
 * annotations spell out, and the same the database trigger runs ("Cost" +
 * "Fixed markup", and cost × (1 + percent/100)).
 */
export function computePrice(strategy: PriceStrategy, cost: number, fixed: number, percentValue: number): number {
  if (strategy === "fixedMarkup") return roundMoney(cost + fixed);
  if (strategy === "percentMarkup") return roundMoney(cost * (1 + percentValue / 100));
  return roundMoney(cost);
}

/**
 * The weight units, in production's own order (`core.choices.WeightUnit`).
 * `value` is the code production STORES; `tag` is what the list and the field
 * show. The two differ twice, on purpose: production stores "st" and "Kg",
 * which read as STONE and a wrong-case kilogram, so the design shows "ton"
 * and "kg" (Figma 4054-11871).
 */
export const WEIGHT_UNITS: { value: WeightUnit; name: string; tag: string }[] = [
  { value: "oz", name: "Ounces", tag: "oz" },
  { value: "lb", name: "Pounds", tag: "lb" },
  { value: "st", name: "Tons (US)", tag: "ton" },
  { value: "g", name: "Grams", tag: "g" },
  { value: "Kg", name: "Kilograms", tag: "kg" },
  { value: "Mg", name: "Megagrams (Tonnes)", tag: "Mg" },
];

/** The dimension units (`core.choices.DimensionUnit`). Here code = tag. */
export const DIMENSION_UNITS: { value: DimensionUnit; name: string; tag: string }[] = [
  { value: "in", name: "Inches", tag: "in" },
  { value: "ft", name: "Feet", tag: "ft" },
  { value: "yd", name: "Yards", tag: "yd" },
  { value: "mm", name: "Millimeters", tag: "mm" },
  { value: "cm", name: "Centimeters", tag: "cm" },
  { value: "m", name: "Meters", tag: "m" },
];

/**
 * The Dimensions help text, which "adapts accordingly to typed in values":
 * each part reads its own value with the unit after it, and falls back to the
 * bare word while that field is empty —
 *
 *   Length  ·  Width  ·  Height
 *   Length: 10 in  ·  Width  ·  Height
 *   Length: 10.56 in  ·  Width: 5.456 in  ·  Height: 9.54 in
 *
 * The parts are joined with the DS text separator, never a hand-typed dot.
 */
export function dimensionsHelpText(length: string, width: string, height: string, unit: DimensionUnit): string {
  const part = (label: string, value: string) => (isBlank(value) ? label : `${label}: ${Number(value)} ${unit}`);
  return [part("Length", length), part("Width", width), part("Height", height)].join(TEXT_SEPARATOR);
}

/**
 * The Dimensions error, which "lists the missing properties": "Enter Width
 * and Height", "Enter Height". Undefined while all three or none are set.
 */
export function missingDimensionsError(length: string, width: string, height: string): string | undefined {
  const parts: [string, string][] = [["Length", length], ["Width", width], ["Height", height]];
  const missing = parts.filter(([, value]) => isBlank(value)).map(([label]) => label);
  if (missing.length === 0 || missing.length === 3) return undefined;
  return `Enter ${missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`}`;
}

// ---- inventory ---------------------------------------------------------------

/**
 * A location's stock status — the four "Inventory Location" Card statuses,
 * judged on ON HAND + ON ORDER against the target (Figma 4121-34006):
 *
 *   full      on hand + on order ≥ target
 *   limited   alert < on hand + on order < target
 *   low       0 < on hand + on order ≤ alert
 *   depleted  on hand + on order ≤ 0
 *
 * No target = no status (the card says "No target"). Without an alert the
 * "low" band does not exist, so anything above zero and below the target is
 * "limited".
 */
export type StockLevel = "full" | "limited" | "low" | "depleted";

export function stockLevel(onHand: number, onOrder: number, target?: number, alertAt?: number): StockLevel | undefined {
  if (target == null) return undefined;
  const stock = onHand + onOrder;
  if (stock <= 0) return "depleted";
  if (stock >= target) return "full";
  if (alertAt != null && stock <= alertAt) return "low";
  return "limited";
}

/**
 * A stock quantity as the card prints it: up to its three decimals, never
 * padded, and a negative with the true MINUS SIGN (U+2212).
 */
export const quantity = (value: number) => `${Number(value.toFixed(3))}`.replace(/^-/, "−");
