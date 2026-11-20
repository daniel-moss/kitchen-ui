import { ProductItem, VENDOR_PART_COSTS } from "../../../data/db";
import { NewProductVendorCost } from "../NewProductForm/NewProductForm.types";
import { computePrice, money, resolveCost } from "../NewProductForm/productRules";

import { ProductPricing } from "./ProductPanel.types";

// The rules of the product panel's "Vendor costs" tab (Figma 3200-51187),
// kept apart from the UI so the tab, the panel and the app store agree.
//
//   Order        the preferred vendor on top, then A → Z by vendor name.
//   Preferred    exactly ONE while the product has vendor costs. The first one
//                added gets it; deleting it hands it to the next vendor A → Z.
//   The cost     under Min / Max / Avg vendor cost the product's cost follows
//                the vendor costs (production's database trigger), and a
//                markup price follows the cost. Deleting the LAST vendor cost
//                moves the strategy to Manual and brings back the last manual
//                cost — $0.00 if none was ever set (production, Daniel
//                2026-11-19).

type NameOf = (vendorId: string) => string;

/** The product's vendor costs from the demo database, with the preferred flag. */
export const vendorCostRowsOf = (product: ProductItem): NewProductVendorCost[] => {
  const rows = VENDOR_PART_COSTS.filter((row) => row.productId === product.id);
  const preferredId = product.preferredVendorId ?? rows[0]?.vendorId;
  return rows.map((row) => ({
    vendorId: row.vendorId,
    cost: row.cost,
    partNumber: row.partNumber,
    isPreferred: row.vendorId === preferredId,
  }));
};

/** The preferred vendor on top, then A → Z by vendor name. */
export const sortVendorCosts = (costs: NewProductVendorCost[], nameOf: NameOf) =>
  [...costs].sort((a, b) => Number(b.isPreferred) - Number(a.isPreferred) || nameOf(a.vendorId).localeCompare(nameOf(b.vendorId)));

/** Keeps ONE preferred vendor: with none left, the first vendor A → Z takes it. */
export const withPreferred = (costs: NewProductVendorCost[], nameOf: NameOf) => {
  if (costs.length === 0 || costs.some((cost) => cost.isPreferred)) return costs;
  const next = [...costs].sort((a, b) => nameOf(a.vendorId).localeCompare(nameOf(b.vendorId)))[0].vendorId;
  return costs.map((cost) => ({ ...cost, isPreferred: cost.vendorId === next }));
};

/** The cost last typed under "Manual" — what switching back to Manual restores. */
export const manualCostOf = (product: ProductItem) =>
  product.manualCost ?? ((product.costStrategy ?? "manual") === "manual" ? product.cost : 0);

/**
 * The Pricing module after the vendor costs changed: under a vendor strategy
 * the cost is re-derived (and a markup price with it); with no vendor costs
 * left the strategy falls back to Manual with the last manual cost. Under
 * Manual nothing moves.
 */
export function pricingAfter(product: ProductItem, costs: NewProductVendorCost[]): ProductPricing {
  const pricing: ProductPricing = {
    costStrategy: product.costStrategy ?? "manual",
    cost: product.cost,
    priceStrategy: product.priceStrategy,
    price: product.price,
    fixedMarkup: product.fixedMarkup,
    percentMarkup: product.percentMarkup,
    taxable: product.taxable,
  };
  const strategy = product.costStrategy ?? "manual";
  if (strategy === "manual") return pricing;

  if (costs.length === 0) {
    pricing.costStrategy = "manual";
    pricing.cost = manualCostOf(product);
  } else {
    pricing.cost = resolveCost(strategy, 0, costs.map((cost) => cost.cost));
  }
  const priceStrategy = product.priceStrategy ?? "manual";
  if (priceStrategy !== "manual") {
    pricing.price = computePrice(priceStrategy, pricing.cost, product.fixedMarkup ?? 0, product.percentMarkup ?? 0);
  }
  return pricing;
}

/**
 * Everything a "Delete [vendor] cost?" Prompt needs: the list and the Pricing
 * module after the delete, and the body — one of the three designed Prompts
 * (the Delete menu item's annotation; rule 3 wins over 1 and 2):
 *
 *   1. a vendor strategy, and the cost changes   → "changes from $X to $Y"
 *   2. Manual, or the cost stays the same         → the purchase order sentence
 *   3. a vendor strategy, the LAST vendor cost    → Manual + the last manual cost
 *
 * Deleting the preferred vendor adds "[next] becomes the preferred vendor" to
 * 1 and 2 — only when another vendor is left to take it.
 */
export function deleteOutcome(product: ProductItem, costs: NewProductVendorCost[], vendorId: string, nameOf: NameOf) {
  const removed = costs.find((cost) => cost.vendorId === vendorId);
  const next = withPreferred(
    costs.filter((cost) => cost.vendorId !== vendorId),
    nameOf,
  );
  const pricing = pricingAfter(product, next);
  const followsVendors = (product.costStrategy ?? "manual") !== "manual";

  const lead = "This vendor’s cost and part # will be deleted from this product.";
  const newPreferred = removed?.isPreferred ? next.find((cost) => cost.isPreferred) : undefined;
  const preferredLine = newPreferred ? ` ${nameOf(newPreferred.vendorId)} becomes the preferred vendor.` : "";

  let body: string;
  if (followsVendors && next.length === 0) {
    body = `${lead} The cost strategy changes to Manual, and the cost changes to ${money(pricing.cost)}.`;
  } else if (followsVendors && pricing.cost !== product.cost) {
    body = `${lead} The product cost changes from ${money(product.cost)} to ${money(pricing.cost)}.${preferredLine}`;
  } else {
    body = `${lead} A new purchase order from this vendor adds them back.${preferredLine}`;
  }

  return { next, pricing, body, title: `Delete ${nameOf(vendorId)} cost?` };
}
