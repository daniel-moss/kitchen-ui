import { ChargeItem, DISCOUNT_LABELS, DISCOUNT_SUBTYPES } from "../../../data/db";
import { PricebookAccounting } from "../../shared/pricebookAccounting";
import { pricebookHistoryRows } from "../../shared/pricebookHistory";

// What the "Discount" side panel needs beyond the db record itself (Figma file
// qhebbfbPHDVnv8IF1EC7Zg, page "↳ Discount" → Side Panel 3251-77853).

/**
 * The status the panel shows — `BadgePricebookStatus` / `AvatarDiscount` take
 * exactly these three. Production's `is_active` (the phase) and `confirmed`
 * (Review until someone accepts the item) folded into one word.
 */
export type DiscountStatus = "active" | "review" | "inactive";

export const discountStatusOf = (discount: ChargeItem): DiscountStatus =>
  !discount.isActive ? "inactive" : discount.status === "review" ? "review" : "active";

/** The discount's subtype name, or undefined — the row then reads "No Subtype". */
export const subtypeNameOf = (discount: ChargeItem) => DISCOUNT_SUBTYPES.find((subtype) => subtype.id === discount.subtypeId)?.name;

/** The discount's labels, by name. */
export const labelNamesOf = (discount: ChargeItem) =>
  discount.labelIds.map((id) => DISCOUNT_LABELS.find((label) => label.id === id)?.name ?? id);

/**
 * The required values the record can lack — the modules' "Warning" states,
 * and in Review what keeps Confirm disabled.
 */
export const missingRequiredOf = (
  discount: ChargeItem,
  { requireSubtypes, hasAccounting }: { requireSubtypes: boolean; hasAccounting: boolean },
) => ({
  subtype: requireSubtypes && DISCOUNT_SUBTYPES.length > 0 && discount.subtypeId == null,
  account: hasAccounting && discount.quickbooksAccountId == null,
});

/** The discount's QuickBooks half, as the SHARED Accounting module reads it. */
export const accountingOf = (discount: ChargeItem): PricebookAccounting => ({
  revenueAccountId: discount.quickbooksAccountId,
  needsSyncing: discount.needsSyncing,
  syncedAt: discount.syncedAt,
});

/** The "History" tab's rows — the SHARED pricebook rule, for charge lines that point at this discount. */
export const discountHistoryRows = (discountId: string) => pricebookHistoryRows((line) => line.discountId === discountId);
