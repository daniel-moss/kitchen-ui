import { QUICKBOOKS_VENDORS, TaxRateItem } from "../../data/db";
import { users } from "../../data/users";
import { formatShortDateTime } from "../shared/dates";

// The QuickBooks brand tile, exported from the panel's "Created By" states
// (node 24-4654) at its own 100×100. It is a raster in the design — there is no
// vector to export — so it ships as the JPEG it is. One file for both themes:
// the green tile reads the same way in each, like the Corrigo and ResQ source
// logos.
import quickbooks from "../../assets/integrations/quickbooks.jpg";

// What the "Tax rate" side panel needs beyond the db record itself.

/**
 * The status the panel shows — `BadgePricebookStatus` / `AvatarTaxRate` take
 * exactly these three.
 *
 * Production keeps the two halves separate, and the panel folds them into one
 * word: `is_active` is the PHASE (Active / Inactive) and `confirmed` is the
 * state inside the active phase (Review until someone accepts the rate). An
 * inactive rate reads "Inactive" whichever it was before.
 */
export type TaxRateStatus = "active" | "review" | "inactive";

export const taxRateStatusOf = (rate: TaxRateItem): TaxRateStatus =>
  !rate.isActive ? "inactive" : rate.status === "review" ? "review" : "active";

/** The rate's percentage, as production renders it: "8.63%", "0%". */
export const formatRate = (rate: number) => `${rate}%`;

/**
 * The "Created by" value, which has three cases (Figma 24-4654).
 *
 * Production's `created_by` is nullable, and two different things leave it
 * empty. The pair of fields tells them apart: `quickbooks_desktop_id` is
 * written in BOTH sync directions, so on its own it means nothing — but no
 * creator PLUS a QuickBooks key can only be an import, because everything
 * created through the app or the API carries its user.
 *
 * The third case is a rate bulk-loaded during onboarding (or, in theory, one
 * whose creator was deleted). Nothing distinguishes those, so they share the
 * placeholder-colored "Unknown".
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

export function createdByOf(rate: TaxRateItem): CreatedBy {
  const user = rate.createdById == null ? undefined : users.find((row) => row.id === rate.createdById);
  if (user != null) return { value: user.name, avatar: user.avatar, avatarShape: "circle" };
  // Just the product's name, not "Imported from QuickBooks": it keeps the row
  // on one line, and it makes the three values the same KIND of thing — a
  // person's name, a system's name, or an absence (Daniel, 2026-10-05).
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
 * but that never reaches the client. Flagged to the dev team; the panel can
 * only draw what the payload carries.
 */
export const syncStatusOf = (rate: TaxRateItem) =>
  rate.needsSyncing || rate.syncedAt == null
    ? { value: "Not synced", color: "var(--text-placeholder)", icon: undefined }
    : { value: "Synced", color: "var(--text-success)", icon: "circle-check" };

/**
 * When the rate last reached the accounting system, or undefined when it never
 * has — the "Last sync" row is then not drawn at all ("Only shown if there is
 * value", its annotation).
 */
export const lastSyncOf = (rate: TaxRateItem) => (rate.syncedAt == null ? undefined : formatShortDateTime(rate.syncedAt));

/** The chosen QuickBooks collection agency's name. */
export const vendorNameOf = (rate: TaxRateItem) =>
  QUICKBOOKS_VENDORS.find((vendor) => vendor.id === rate.quickbooksVendorId)?.name;
