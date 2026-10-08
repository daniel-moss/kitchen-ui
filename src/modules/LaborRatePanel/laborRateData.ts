import { LABOR_SUBTYPES, LaborItem, QUICKBOOKS_ACCOUNTS } from "../../data/db";
import { users } from "../../data/users";
import { money } from "../NewLaborRateForm/rateMath";
import { formatShortDateTime } from "../shared/dates";

// The QuickBooks brand tile — the same raster the Tax rate panel's "Created
// By" states export (there is no vector in the design), reused rather than
// copied so one file serves both panels.
import quickbooks from "../../assets/integrations/quickbooks.jpg";

// What the "Labor rate" side panel needs beyond the db record itself
// (Figma file qhebbfbPHDVnv8IF1EC7Zg, page "➡️ Designs").

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

/** "Hourly" / "Flat rate" — the unit type's own two option names. */
export const unitTypeOf = (rate: LaborItem) => (rate.unitType === "hourly" ? "Hourly" : "Flat rate");

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

/**
 * The markup row the Pricing module shows between Cost and Rate — one row, or
 * none at all under the manual strategy, where the rate is simply typed.
 *
 * Both values agree with Cost and Rate by construction: production derives the
 * rate in a database trigger (`cost + amount`, or `cost × (1 + percent/100)`),
 * so the module is showing the two halves of one sum.
 */
export const markupRowOf = (rate: LaborItem) => {
  if (rate.priceStrategy === "fixed") return { label: "Fixed markup", value: money(rate.priceAdjustmentAmount ?? 0) };
  if (rate.priceStrategy === "percent") return { label: "Percent markup", value: `${(rate.priceAdjustmentPercent ?? 0).toFixed(2)}%` };
  return undefined;
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

export function createdByOf(rate: LaborItem): CreatedBy {
  const user = rate.createdById == null ? undefined : users.find((row) => row.id === rate.createdById);
  if (user != null) return { value: user.name, avatar: user.avatar, avatarShape: "circle" };
  // Just the product's name, not "Imported from QuickBooks" (Daniel,
  // 2026-10-08, the same decision as the Tax rate panel): it keeps the row on
  // one line, and it makes the three values the same KIND of thing — a
  // person's name, a system's name, or an absence.
  if (rate.quickbooksId != null) return { value: "QuickBooks", avatar: quickbooks, avatarShape: "square" };
  return { value: "Unknown", color: "var(--text-placeholder)" };
}

/**
 * The accounting sync status (Figma 25-5038). Two states, and the one that
 * looks like an absence is colored like one. The timestamp is NOT part of it —
 * it is the "Last sync" row below, so a rate can say "Not synced" and still
 * report when it last succeeded.
 *
 * Production reports only `needs_syncing` + `last_synced_at`, so a FAILED sync
 * is indistinguishable from "not synced yet" — it sets `has_sync_error` too,
 * but that never reaches the client.
 */
export const syncStatusOf = (rate: LaborItem) =>
  rate.needsSyncing || rate.syncedAt == null
    ? { value: "Not synced", color: "var(--text-placeholder)", icon: undefined }
    : { value: "Synced", color: "var(--text-success)", icon: "circle-check" };

/**
 * When the rate last reached QuickBooks, or undefined when it never has — the
 * "Last sync" row is then not drawn at all ("Only shown if there is value",
 * its annotation).
 */
export const lastSyncOf = (rate: LaborItem) => (rate.syncedAt == null ? undefined : formatShortDateTime(rate.syncedAt));

/**
 * "4010: Service Revenue" — an account with no number shows its name alone,
 * the way the picker and production's own option builder write it.
 */
export const accountLabelOf = (account: { name: string; number?: string }) =>
  account.number ? `${account.number}: ${account.name}` : account.name;

/** The rate's QuickBooks revenue account, or undefined when it carries none. */
export const accountNameOf = (rate: LaborItem) => {
  const account = QUICKBOOKS_ACCOUNTS.find((row) => row.id === rate.quickbooksAccountId);
  return account == null ? undefined : accountLabelOf(account);
};
