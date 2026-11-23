import { ChargeItem, OTHER_LABELS, OTHER_SUBTYPES, PriceStrategy } from "../../../data/db";
import { money, padMoneyOnBlur } from "../../Product/NewProductForm/productRules";
import { PricebookAccounting } from "../../shared/pricebookAccounting";
import { pricebookHistoryRows } from "../../shared/pricebookHistory";

// What the "Other charge" side panel needs beyond the db record itself (Figma
// file qhebbfbPHDVnv8IF1EC7Zg, page "↳ Other Charges" → Side Panel 3249-73484).

/**
 * The status the panel shows — `BadgePricebookStatus` / `AvatarOther` take
 * exactly these three. Production's `is_active` (the phase) and `confirmed`
 * (Review until someone accepts the item) folded into one word, the Labor
 * rate panel's rule: an inactive charge reads "Inactive" whatever it was.
 */
export type OtherChargeStatus = "active" | "review" | "inactive";

export const otherChargeStatusOf = (charge: ChargeItem): OtherChargeStatus =>
  !charge.isActive ? "inactive" : charge.status === "review" ? "review" : "active";

/** The charge's subtype name, or undefined — the row then reads "No Subtype". */
export const subtypeNameOf = (charge: ChargeItem) => OTHER_SUBTYPES.find((subtype) => subtype.id === charge.subtypeId)?.name;

/** The charge's labels, by name. */
export const labelNamesOf = (charge: ChargeItem) =>
  charge.labelIds.map((id) => OTHER_LABELS.find((label) => label.id === id)?.name ?? id);

const PRICE_STRATEGY_NAMES: Record<PriceStrategy, string> = {
  manual: "Manual",
  fixedMarkup: "Fixed markup",
  percentMarkup: "Percent markup",
};

/** The price strategy, in the words the Pricing form's three options use. */
export const priceStrategyOf = (charge: ChargeItem) => PRICE_STRATEGY_NAMES[charge.priceStrategy ?? "manual"];

/**
 * The markup of a Fixed / Percent markup charge: "$50.00" or "50.00%" — two
 * to three decimals, like the money, and a negative carries the true minus
 * sign (the Product panel's rule).
 */
export const formatMarkup = (charge: ChargeItem) => {
  if (charge.priceStrategy === "fixedMarkup") return money(charge.fixedMarkup ?? 0);
  const value = charge.percentMarkup ?? 0;
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).replace(/^-/, "−")}%`;
};

/** Production `default_is_taxable`, in the words the form's two options use. */
export const taxabilityOf = (charge: ChargeItem) => (charge.taxable ? "Taxable" : "Non-taxable");

/** A stored amount as the money fields edit it: "100.00", "12.125". */
export const moneyText = (value: number | undefined) => (value == null ? "" : padMoneyOnBlur(String(value)));

/**
 * The required values the record can lack — the modules' "Warning" states,
 * and in Review what keeps Confirm disabled. Not a Review rule: an ACTIVE
 * charge created before the company required subtypes, or before QuickBooks
 * was connected, lacks them too.
 */
export const missingRequiredOf = (
  charge: ChargeItem,
  { requireSubtypes, hasAccounting }: { requireSubtypes: boolean; hasAccounting: boolean },
) => ({
  subtype: requireSubtypes && OTHER_SUBTYPES.length > 0 && charge.subtypeId == null,
  account: hasAccounting && charge.quickbooksAccountId == null,
});

/** The charge's QuickBooks half, as the SHARED Accounting module reads it. */
export const accountingOf = (charge: ChargeItem): PricebookAccounting => ({
  revenueAccountId: charge.quickbooksAccountId,
  needsSyncing: charge.needsSyncing,
  syncedAt: charge.syncedAt,
});

/** The "History" tab's rows — the SHARED pricebook rule, for charge lines that point at this charge. */
export const otherChargeHistoryRows = (chargeId: string) => pricebookHistoryRows((line) => line.otherChargeId === chargeId);
