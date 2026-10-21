import { chargesOf, INVOICES, JOBS, LABOR_SUBTYPES, LaborItem, QUICKBOOKS_ACCOUNTS } from "../../data/db";
import { HistoryRow, invoiceHistoryRow, jobHistoryRow } from "../EquipmentPanel/equipmentData";
import { users } from "../../data/users";
import { money } from "../NewLaborRateForm/rateMath";
import { accountLabel } from "../Product/NewProductForm/AccountField";
import { formatShortDateTime } from "../shared/dates";

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

/** "Hourly" / "Flat" — the Rate type's own two option names. */
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
  // The system's name, not "Imported from …": it keeps the row on one line,
  // and makes the three values the same KIND of thing — a person, a system, or
  // an absence. "QuickBooks Desktop", because only the Desktop integration
  // imports pricebook items (Daniel, 2026-10-21; it was "QuickBooks").
  if (rate.quickbooksId != null) return { value: "QuickBooks Desktop", avatar: quickbooks, avatarShape: "square" };
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
 * The rate's revenue account as the shared field writes it ("4010 · Service
 * Revenue", or the name alone), or undefined when it carries none — the row
 * then reads "No Revenue account".
 */
export const accountNameOf = (rate: LaborItem) => {
  const account = QUICKBOOKS_ACCOUNTS.find((row) => row.id === rate.quickbooksAccountId);
  return account == null ? undefined : accountLabel(account);
};

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

/**
 * The "History" tab's rows — where the labor rate was billed (the module's
 * annotation): "Only jobs and invoices. Only completed jobs without an
 * invoice — when an invoice is created out of that job, only the invoice is
 * shown. Every non-draft invoice."
 *
 * A job "uses" the rate when its charges were billed on it (`laborRateId`);
 * an invoice inherits its job's charges — the demo keeps no line items of its
 * own, so an invoice without a job never lists. (Production matches by the
 * line item's NAME instead of a link, so renaming a rate loses its history —
 * flagged to the devs.) Newest first, like the Equipment panel's History.
 */
export function laborRateHistoryRows(rateId: string): HistoryRow[] {
  const usesRate = new Set(
    JOBS.filter((job) => chargesOf(job).some((group) => group.items.some((item) => item.laborRateId === rateId))).map((job) => job.id),
  );
  // A job is REPLACED by its invoice (Daniel, 2026-10-21) — so it leaves the
  // list only once that invoice can show, i.e. is no longer a draft. A job
  // whose invoice is still a draft stays listed. (Production drops the job as
  // soon as any invoice exists, draft or not, which hides the work until the
  // invoice is sent.) A job finalized WITHOUT an invoice — an estimate made
  // from it, or "marked as invoiced" — stays listed too.
  const invoiced = new Set(
    INVOICES.filter((invoice) => invoice.jobId != null && invoice.status !== "draft").map((invoice) => invoice.jobId!),
  );

  const rows: HistoryRow[] = [];
  for (const job of JOBS) {
    if (!usesRate.has(job.id) || invoiced.has(job.id)) continue;
    if (job.status !== "completed" && job.status !== "finalized") continue;
    const row = jobHistoryRow(job);
    if (row != null) rows.push(row);
  }
  for (const invoice of INVOICES) {
    if (invoice.status === "draft" || invoice.jobId == null || !usesRate.has(invoice.jobId)) continue;
    rows.push(invoiceHistoryRow(invoice));
  }
  return rows.sort((a, b) => b.changedAt - a.changedAt);
}
