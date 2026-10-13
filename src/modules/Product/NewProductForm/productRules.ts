import { DimensionUnit, WeightUnit } from "../../../data/db/types";
import { TEXT_SEPARATOR } from "../../../utils/textSeparator";

// Every field rule of the "New product" form in one place (Figma file
// n4FkA98uVyhbOJeLY0AXZV — each input's own annotation), because four modules
// collect numbers and text that obey the same handful of rules.
//
//   Name              50 characters  · counter in the last 10 · no error at the cap
//   Manufacturer      100 characters · the same counter rule
//   Manufacturer #    100 characters · the same counter rule
//   Barcode           255 characters · the same counter rule · unique per company
//   Image URL         200 characters · the same counter rule
//   Cost / Price      3 decimals · 7 digits before the dot · NEGATIVE NOT allowed
//   Fixed markup      3 decimals · 7 digits · negative IS allowed
//   Percent markup    3 decimals · 3 digits · negative IS allowed · max 999%
//   Weight / L·W·H    4 decimals · 6 digits · NEGATIVE NOT allowed
//
// The characters each field accepts are part of the annotation, so they are
// enforced on the way INTO state: a value the rules could not judge never
// exists. The digit limits are production's columns — money is DECIMAL(10,3)
// (7 before the dot), the percent DECIMAL(6,3) (3), and the measurements
// DECIMAL(10,4) (6).

export const MAX_NAME = 50;
export const MAX_TEXT = 100;
export const MAX_BARCODE = 255;
export const MAX_IMAGE_URL = 200;

/** The counter only appears in the last stretch, on every capped field. */
export const COUNTER_FROM = 10;

/** "Can not be greater than 999%" — the Percent markup's own error state. */
export const MAX_PERCENT = 999;

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

/** "No value = 0", and a half-typed "-" or "." is worth 0 too. */
export const numberOf = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** True when the field holds nothing a number could be read from. */
export const isBlank = (value: string) => value.trim() === "" || value.trim() === "-" || value.trim() === ".";

/**
 * What a MONEY field holds after it loses focus: the typed value padded to at
 * least two decimals — "100" → "100.00", "100.5" → "100.50", "100.046"
 * unchanged (Daniel, 2026-10-13). An empty field stays empty, so the Cost
 * placeholder keeps showing.
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

/** The weight units, in production's own order (`core.choices.WeightUnit`). */
export const WEIGHT_UNITS: { value: WeightUnit; name: string }[] = [
  { value: "oz", name: "Ounces" },
  { value: "lb", name: "Pounds" },
  { value: "st", name: "Tons (US)" },
  { value: "g", name: "Grams" },
  { value: "Kg", name: "Kilograms" },
  { value: "Mg", name: "Megagrams (Tonnes)" },
];

/** The dimension units (`core.choices.DimensionUnit`). */
export const DIMENSION_UNITS: { value: DimensionUnit; name: string }[] = [
  { value: "in", name: "Inches" },
  { value: "ft", name: "Feet" },
  { value: "yd", name: "Yards" },
  { value: "mm", name: "Millimeters" },
  { value: "cm", name: "Centimeters" },
  { value: "m", name: "Meters" },
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
