import { AvatarEstimateStatus } from "../../components/Avatar/AvatarEstimate.types";
import { AvatarInvoiceStatus } from "../../components/Avatar/AvatarInvoice.types";
import { AvatarJobStatus } from "../../components/Avatar/AvatarJob.types";
import { STATUS as ESTIMATE_STATUS } from "../../components/Badge/BadgeEstimateStatus";
import { STATUS as INVOICE_STATUS } from "../../components/Badge/BadgeInvoiceStatus";
import { STATUS as JOB_STATUS } from "../../components/Badge/BadgeJobStatus";
import {
  Equipment,
  EquipmentFile,
  Estimate,
  Invoice,
  Job,
  TODAY,
  Warranty,
  WarrantyState,
  clientOfLocation,
  equipmentFilesOf,
  equipmentLabelsOf,
  estimatesForEquipment,
  invoicesForEquipment,
  jobsForEquipment,
  locationById,
  warrantiesOf,
  warrantyStateOf,
} from "../../data/db";
import { users } from "../../data/users";
import { formatShortDate } from "../shared/dates";
import { ModuleFile } from "../FilesModule/FilesModule.types";

// Everything the Equipment side panel reads out of the demo database, plus the
// two date formats the design uses. Nothing here renders — the modules take
// these shapes as props, so a story can hand over its own rows.

// ---- dates -----------------------------------------------------------------

// The two formats moved to `modules/shared/dates.ts` on 2026-09-28, when the
// Warranty panel needed the same LONG format. Re-exported so the modules that
// already import them from here keep working.
export { formatLongDate, formatShortDate } from "../shared/dates";

/** "Lorne R." — the History and Files captions' author form. */
export function shortUserName(userId: number | undefined): string | undefined {
  const user = users.find((row) => row.id === userId);
  return user == null ? undefined : `${user.firstName} ${user.lastName.charAt(0)}.`;
}

/** "Finalized on Aug 22, 2026 by Lorne R." — the "by" half drops when unknown. */
function transitionCaption(statusLabel: string, iso: string, userId?: number): string {
  const author = shortUserName(userId);
  const base = `${statusLabel} on ${formatShortDate(iso)}`;
  return author == null ? base : `${base} by ${author}`;
}

// ---- warranties ------------------------------------------------------------

/** One warranty row of the Warranties tab. */
export interface WarrantyRow {
  id: string;
  name: string;
  state: WarrantyState;
  /** "Jan 1, 2025 → Jan 1, 2026", or "From Jan 1, 2025" when it never ends. */
  range: string;
}

/**
 * The arrow between the two dates. A real right arrow (U+2192) — the Figma
 * node still carries the ASCII "->" placeholder (Daniel, 2026-09-28: "it
 * should be arrow right").
 */
export const DATE_RANGE_ARROW = "→";

export function warrantyRow(warranty: Warranty): WarrantyRow {
  const start = formatShortDate(warranty.startDate);
  return {
    id: warranty.id,
    name: warranty.name,
    state: warrantyStateOf(warranty),
    range: warranty.endDate == null ? `From ${start}` : `${start} ${DATE_RANGE_ARROW} ${formatShortDate(warranty.endDate)}`,
  };
}

// ---- history ---------------------------------------------------------------

/** The three object kinds the History tab lists, in the order it shows them. */
export type HistoryKind = "estimate" | "job" | "invoice";

export const HISTORY_KINDS: HistoryKind[] = ["estimate", "job", "invoice"];

/** Group heading, filter-button label and filter icon, per kind. */
export const HISTORY_KIND_META: Record<HistoryKind, { label: string; icon: string }> = {
  estimate: { label: "Estimates", icon: "clock" },
  job: { label: "Jobs", icon: "wrench-simple" },
  invoice: { label: "Invoices", icon: "circle-dollar" },
};

export interface HistoryRow {
  id: string;
  kind: HistoryKind;
  /** The status feeding the avatar's corner icon. */
  status: string;
  /** "Finalized on Aug 22, 2026 by Lorne R." */
  caption: string;
  /** Sort key — the object's own status-change date, newest first. */
  changedAt: number;
}

/**
 * An estimate's DISPLAY status — "expired" is derived from `dueAt`, never
 * stored (the db's own rule). Kept local because the History avatar needs the
 * derived value, not the row's.
 */
function estimateDisplayStatus(estimate: Estimate): keyof typeof ESTIMATE_STATUS {
  const expired = estimate.status === "awaitingApproval" && new Date(estimate.dueAt).getTime() < TODAY.getTime();
  return expired ? "expired" : estimate.status;
}

/** An invoice's DISPLAY status — "overdue" is derived from `dueAt`. */
function invoiceDisplayStatus(invoice: Invoice): keyof typeof INVOICE_STATUS {
  const overdue = invoice.status === "outstanding" && new Date(invoice.dueAt).getTime() < TODAY.getTime();
  return overdue ? "overdue" : invoice.status;
}

/** AvatarEstimate has no "lost" corner icon — it shares Cancelled's mark. */
const estimateAvatarStatus = (status: keyof typeof ESTIMATE_STATUS): AvatarEstimateStatus =>
  status === "lost" ? "cancelled" : status;

export function historyRows(equipmentId: string): HistoryRow[] {
  const rows: HistoryRow[] = [];

  for (const estimate of estimatesForEquipment(equipmentId)) {
    const status = estimateDisplayStatus(estimate);
    rows.push({
      id: estimate.id,
      kind: "estimate",
      status: estimateAvatarStatus(status),
      caption: transitionCaption(ESTIMATE_STATUS[status].label, estimate.statusChangedAt!, estimate.statusChangedById),
      changedAt: new Date(estimate.statusChangedAt!).getTime(),
    });
  }

  for (const job of jobsForEquipment(equipmentId)) {
    // A job in its first status has no transition to report, like the
    // estimates and invoices above ("Pending state objects are not shown").
    if (job.statusChangedAt == null) continue;
    rows.push({
      id: job.id,
      kind: "job",
      status: job.status,
      caption: transitionCaption(JOB_STATUS[job.status].label, job.statusChangedAt, job.statusChangedById),
      changedAt: new Date(job.statusChangedAt).getTime(),
    });
  }

  for (const invoice of invoicesForEquipment(equipmentId)) {
    const status = invoiceDisplayStatus(invoice);
    rows.push({
      id: invoice.id,
      kind: "invoice",
      status,
      caption: transitionCaption(INVOICE_STATUS[status].label, invoice.statusChangedAt!, invoice.statusChangedById),
      changedAt: new Date(invoice.statusChangedAt!).getTime(),
    });
  }

  // "By status change date. The most recent go on top." (the module's own
  // annotation) — the groups keep their fixed order, this sorts inside them.
  return rows.sort((a, b) => b.changedAt - a.changedAt);
}

/** The avatar status prop is typed per object — narrow at the call site. */
export type HistoryAvatarStatus = AvatarEstimateStatus | AvatarJobStatus | AvatarInvoiceStatus;

// ---- files -----------------------------------------------------------------

/** db rows → the shared FilesModule's shape, ordered inside each group. */
export function fileRows(equipmentId: string): ModuleFile[] {
  return equipmentFilesOf(equipmentId)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((file: EquipmentFile) => ({
      id: file.id,
      name: file.name,
      type: file.fileType,
      size: file.size,
      visibility: file.visibility,
      meta: `Added on ${formatShortDate(file.addedAt)}${shortUserName(file.addedById) == null ? "" : ` by ${shortUserName(file.addedById)}`}`,
    }));
}

// ---- the whole panel -------------------------------------------------------

/** Everything one equipment shows, already resolved. */
export interface EquipmentPanelData {
  equipment: Equipment;
  /** The Location module's title — the client that owns the site. */
  clientName: string;
  /**
   * The Location module's caption: the location's name, falling back to its
   * street address when it has none (the module's own annotation).
   */
  locationCaption: string;
  labels: string[];
  /**
   * The warranty RECORDS. The panel keeps these (not the rows) because opening
   * a row swaps the panel's content for the warranty view, which needs the
   * whole record; the list rows are derived from them with `warrantyRow`.
   */
  warranties: Warranty[];
  files: ModuleFile[];
  history: HistoryRow[];
  jobs: Job[];
}

export function equipmentPanelData(equipment: Equipment): EquipmentPanelData {
  const location = locationById(equipment.locationId);
  const client = location == null ? undefined : clientOfLocation(location);
  const address = location == null ? "" : [location.street, location.city, `${location.state} ${location.postalCode}`].filter(Boolean).join(", ");

  return {
    equipment,
    clientName: client?.name ?? "",
    locationCaption: location?.name ?? address,
    labels: equipmentLabelsOf(equipment).map((label) => label.name),
    warranties: warrantiesOf(equipment.id),
    files: fileRows(equipment.id),
    history: historyRows(equipment.id),
    jobs: jobsForEquipment(equipment.id),
  };
}
