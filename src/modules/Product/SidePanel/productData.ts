import { PRODUCT_ITEMS, PRODUCT_LABELS, PRODUCT_SUBTYPES, ProductItem, VENDOR_PART_COSTS } from "../../../data/db";
import { CostStrategy, money, padMoneyOnBlur, PriceStrategy } from "../NewProductForm/productRules";
import { PricebookAccounting } from "../../shared/pricebookAccounting";
import { pricebookHistoryRows } from "../../shared/pricebookHistory";

// What the "Product" side panel needs beyond the db record itself (Figma file
// qhebbfbPHDVnv8IF1EC7Zg, page "↳ Product" → Side Panel → "Details" 3167-22730).

/**
 * The status the panel shows — `BadgePricebookStatus` / `AvatarProduct` take
 * exactly these three. Production's `is_active` (the phase) and `confirmed`
 * (Review until someone accepts the item) folded into one word, the Labor
 * rate panel's rule: an inactive product reads "Inactive" whatever it was.
 */
export type ProductStatus = "active" | "review" | "inactive";

export const productStatusOf = (product: ProductItem): ProductStatus =>
  !product.isActive ? "inactive" : product.status === "review" ? "review" : "active";

/** The product's subtype name, or undefined — the row then reads "No Subtype". */
export const subtypeNameOf = (product: ProductItem) =>
  PRODUCT_SUBTYPES.find((subtype) => subtype.id === product.subtypeId)?.name;

/** The product's labels, by name. */
export const labelNamesOf = (product: ProductItem) =>
  product.labelIds.map((id) => PRODUCT_LABELS.find((label) => label.id === id)?.name ?? id);

/** "Inventory" / "Non-inventory" — the Stock type field's own option names. */
export const stockTypeOf = (product: ProductItem) => (product.trackInventory ? "Inventory" : "Non-inventory");

const COST_STRATEGY_NAMES: Record<CostStrategy, string> = {
  manual: "Manual",
  minVendorCost: "Min vendor cost",
  maxVendorCost: "Max vendor cost",
  avgVendorCost: "Avg vendor cost",
};

/** The cost strategy, in the words the Pricing form's four options use. */
export const costStrategyOf = (product: ProductItem) => COST_STRATEGY_NAMES[product.costStrategy ?? "manual"];

const PRICE_STRATEGY_NAMES: Record<PriceStrategy, string> = {
  manual: "Manual",
  fixedMarkup: "Fixed markup",
  percentMarkup: "Percent markup",
};

/** The price strategy, in the words the Pricing form's three options use. */
export const priceStrategyOf = (product: ProductItem) => PRICE_STRATEGY_NAMES[product.priceStrategy ?? "manual"];

/**
 * The markup of a Fixed / Percent markup product: "$50.00" or "50.00%" — two
 * to three decimals, like the money (the Figma frames 3167-22906 / 3167-22917),
 * and a negative carries the true minus sign.
 */
export const formatMarkup = (product: ProductItem) => {
  if (product.priceStrategy === "fixedMarkup") return money(product.fixedMarkup ?? 0);
  const value = product.percentMarkup ?? 0;
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).replace(/^-/, "−")}%`;
};

/** Production `default_is_taxable`, in the words the form's two options use. */
export const taxabilityOf = (product: ProductItem) => (product.taxable ? "Taxable" : "Non-taxable");

/** What each vendor charges for this product — the three vendor cost strategies read these. */
export const vendorCostsOf = (productId: string) =>
  VENDOR_PART_COSTS.filter((row) => row.productId === productId).map((row) => row.cost);

/**
 * Every OTHER product's barcode, mapped to that product's name — the General
 * form's "Already registered to …" check (production's barcode is unique per
 * company). The product's own code is left out, so re-saving it is never an
 * error.
 */
export const barcodeOwnersExcept = (productId: string, products: ProductItem[] = PRODUCT_ITEMS): Record<string, string> =>
  Object.fromEntries(
    products.filter((row) => row.id !== productId && row.barcode != null && row.barcode !== "").map((row) => [row.barcode!, row.name]),
  );

/** A stored amount as the money fields edit it: "100.00", "12.125". */
export const moneyText = (value: number | undefined) => (value == null ? "" : padMoneyOnBlur(String(value)));

/** A stored percent as the percent field edits it: "150.00", "7.125" (the same pad-to-2 rule). */
export const percentText = moneyText;

/**
 * The required value the record can lack — the General module's "Warning"
 * state, and in Review what keeps Confirm disabled. Not a Review rule: an
 * ACTIVE product created before the company required subtypes lacks one too.
 * (The revenue account is the Accounting tab's, not built yet.)
 */
export const missingRequiredOf = (
  product: ProductItem,
  { requireSubtypes, hasAccounting = false }: { requireSubtypes: boolean; hasAccounting?: boolean },
) => ({
  subtype: requireSubtypes && PRODUCT_SUBTYPES.length > 0 && product.subtypeId == null,
  // The Accounting "Warning": the revenue account is the only required one.
  account: hasAccounting && product.quickbooksAccountId == null,
});

/** The product's QuickBooks half, as the SHARED Accounting module reads it. */
export const accountingOf = (product: ProductItem): PricebookAccounting => ({
  revenueAccountId: product.quickbooksAccountId,
  cogsAccountId: product.quickbooksCogsAccountId,
  assetAccountId: product.quickbooksAssetAccountId,
  needsSyncing: product.needsSyncing,
  syncedAt: product.syncedAt,
});

/** The "History" tab's rows — the SHARED pricebook rule, for charge lines that point at this product. */
export const productHistoryRows = (productId: string) => pricebookHistoryRows((line) => line.productId === productId);
