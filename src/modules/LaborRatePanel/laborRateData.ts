import { LABOR_SUBTYPES, LaborItem } from "../../data/db";
import { HistoryRow } from "../EquipmentPanel/equipmentData";
import { users } from "../../data/users";
import { money } from "../NewLaborRateForm/rateMath";
import { PricebookAccounting } from "../shared/pricebookAccounting";
import { pricebookHistoryRows } from "../shared/pricebookHistory";

// The QuickBooks brand tile — the same raster the Tax rate panel's "Created
// By" states export (there is no vector in the design), reused rather than
// copied so one file serves both panels.
import quickbooks from "../../assets/integrations/quickbooks.jpg";

// What the "Labor rate" side panel needs beyond the db record itself
// (Figma file qhebbfbPHDVnv8IF1EC7Zg, page "Labor Rate" → Side Panel).

/**
 * The status the panel shows — `BadgePricebookStatus` / `AvatarLaborRate` take
 * exactly these three.
 *
 * Production keeps the two halves separate and the panel folds them into one
 * word: `is_active` is the PHASE (Active / Inactive) and `confirmed` is the
 * state inside the active phase (Review until someone accepts the item). An
 * inactive rate reads "Inactive" whichever it was before.
 */
export type LaborRateStatus = "active" | "review" | "inactive";

export const laborRateStatusOf = (rate: LaborItem): LaborRateStatus =>
  !rate.isActive ? "inactive" : rate.status === "review" ? "review" : "active";

/** The rate's subtype name, or undefined — the row then reads "No Subtype". */
export const subtypeNameOf = (rate: LaborItem) =>
  LABOR_SUBTYPES.find((subtype) => subtype.id === rate.subtypeId)?.name;

/** "Hourly" / "Flat" — the Type's own two option names. */
export const rateTypeOf = (rate: LaborItem) => (rate.unitType === "hourly" ? "Hourly" : "Flat");

/**
 * The per-unit suffix on a money value: "/hr" on an hourly rate, nothing on a
 * flat one (Daniel, 2026-10-08). It is the COMPACT form here and the spelled
 * out "per hour" inside the edit form — a panel row is a dense read-only value
 * next to the same number the Labor rates list already prints as "$165.00/hr",
 * while the form's suffix is a hint beside a field someone is typing in.
 */
export const perUnitSuffix = (rate: LaborItem) => (rate.unitType === "hourly" ? "/hr" : "");

/** "$100.00/hr", "$260.00" — a money field as the Pricing module prints it. */
export const formatAmount = (value: number, rate: LaborItem) => `${money(value)}${perUnitSuffix(rate)}`;

/** The price strategy, in the words the form's three options use. */
export const priceStrategyOf = (rate: LaborItem) =>
  rate.priceStrategy === "fixed" ? "Fixed markup" : rate.priceStrategy === "percent" ? "Percent markup" : "Manual";

/**
 * The markup of a Fixed / Percent markup rate: "$50.00" (no "/hr" — it is an
 * amount added to the cost) or "50.00%" — two to three decimals, like the
 * money, and a negative carries the true minus sign.
 */
export const formatMarkup = (rate: LaborItem) => {
  if (rate.priceStrategy === "fixed") return money(rate.priceAdjustmentAmount ?? 0);
  const value = rate.priceAdjustmentPercent ?? 0;
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).replace(/^-/, "−")}%`;
};

/** Production `default_is_taxable`, in the words the form's two options use. */
export const taxabilityOf = (rate: LaborItem) => (rate.taxable ? "Taxable" : "Non-taxable");

/**
 * The "Created by" value, which has three cases (Figma 24-4654).
 *
 * Production's `created_by` is nullable, and three different things leave it
 * empty. The pair of fields tells the first one apart: `quickbooks_desktop_id`
 * is written in BOTH sync directions, so on its own it means nothing — but no
 * creator PLUS a QuickBooks key can only be an import, because everything
 * created through the app or the API carries its user.
 *
 * The other two are an item bulk-loaded during onboarding and a REVIEW item
 * the system minted from a free-text line item (that path writes no creator
 * either). Nothing distinguishes them, so they share the placeholder-colored
 * "Unknown".
 */
export interface CreatedBy {
  value: string;
  /**
   * Artwork for the value's left-slot avatar: the person's photo, or the logo
   * of the system that imported the rate. "Unknown" has neither.
   */
  avatar?: string;
  /**
   * The avatar's shape, which says WHAT created the rate — a round user avatar
   * for a person, a square object avatar for a system (node 24-4654 pairs
   * AvatarUser with the generic object Avatar).
   */
  avatarShape?: "circle" | "square";
  /** Set only for "Unknown" — the value is an absence, not a name. */
  color?: string;
}

// Takes only the two fields it reads, so every pricebook panel (the Product
// panel's "Info" module too) shares the one rule.
export function createdByOf(rate: { createdById?: number; quickbooksId?: string }): CreatedBy {
  const user = rate.createdById == null ? undefined : users.find((row) => row.id === rate.createdById);
  if (user != null) return { value: user.name, avatar: user.avatar, avatarShape: "circle" };
  // The system's name, not "Imported from …": it keeps the row on one line,
  // and makes the three values the same KIND of thing — a person, a system, or
  // an absence. "QuickBooks Desktop", because only the Desktop integration
  // imports pricebook items (Daniel, 2026-10-21; it was "QuickBooks").
  if (rate.quickbooksId != null) return { value: "QuickBooks Desktop", avatar: quickbooks, avatarShape: "square" };
  return { value: "Unknown", color: "var(--text-placeholder)" };
}

// "Sync status", "Last sync" and the revenue account's name moved to the SHARED
// pricebook Accounting module (modules/shared/pricebookAccounting, 2026-11-20).

/**
 * The two "Warning" states (General and Accounting): a required value the
 * record lacks. Not a Review rule — an ACTIVE item can lack them too (one
 * created before the company required subtypes, or before QuickBooks was
 * connected). In Review they also keep Confirm disabled.
 */
export const missingRequiredOf = (rate: LaborItem, { requireSubtypes, hasAccounting }: { requireSubtypes: boolean; hasAccounting: boolean }) => ({
  subtype: requireSubtypes && LABOR_SUBTYPES.length > 0 && rate.subtypeId == null,
  account: hasAccounting && rate.quickbooksAccountId == null,
});

/** The rate's QuickBooks half, as the SHARED Accounting module reads it. */
export const accountingOf = (rate: LaborItem): PricebookAccounting => ({
  revenueAccountId: rate.quickbooksAccountId,
  needsSyncing: rate.needsSyncing,
  syncedAt: rate.syncedAt,
});

/**
 * The "History" tab's rows — the SHARED pricebook rule
 * (modules/shared/pricebookHistory): the jobs and invoices that billed this
 * rate (`laborRateId` on a charge line).
 */
export const laborRateHistoryRows = (rateId: string): HistoryRow[] =>
  pricebookHistoryRows((line) => line.laborRateId === rateId);
