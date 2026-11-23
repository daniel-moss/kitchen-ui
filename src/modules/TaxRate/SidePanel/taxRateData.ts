import { TAX_RATE_LABELS, TaxRateItem } from "../../../data/db";
import { PricebookAccounting } from "../../shared/pricebookAccounting";

// What the "Tax rate" side panel needs beyond the db record itself (Figma file
// qhebbfbPHDVnv8IF1EC7Zg, page "↳ Tax Rate" → Side Panel 3254-80299).

/** The status the panel shows — `BadgePricebookStatus` / `AvatarTaxRate` take exactly these three. */
export type TaxRateStatus = "active" | "review" | "inactive";

export const taxRateStatusOf = (rate: TaxRateItem): TaxRateStatus =>
  !rate.isActive ? "inactive" : rate.status === "review" ? "review" : "active";

/** The rate's labels, by name. */
export const labelNamesOf = (rate: TaxRateItem) => rate.labelIds.map((id) => TAX_RATE_LABELS.find((label) => label.id === id)?.name ?? id);

/**
 * The one required value a tax rate can lack — the Accounting "Warning", and
 * in Review what keeps Confirm disabled: the tax collection agency, on
 * QuickBooks Desktop. (No subtype: a tax rate has none.)
 */
export const missingRequiredOf = (rate: TaxRateItem, { hasAccounting }: { hasAccounting: boolean }) => ({
  account: hasAccounting && rate.quickbooksVendorId == null,
});

/** The rate's QuickBooks half, as the SHARED Accounting module reads it (its tax rate mode). */
export const accountingOf = (rate: TaxRateItem): PricebookAccounting => ({
  taxAgencyVendorId: rate.quickbooksVendorId,
  needsSyncing: rate.needsSyncing,
  syncedAt: rate.syncedAt,
});
