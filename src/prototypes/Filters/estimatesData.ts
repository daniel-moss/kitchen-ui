import { BadgeEstimateStatusStatus, STATUS } from "../../components/Badge/BadgeEstimateStatus";
import {
  CLIENTS,
  ESTIMATE_LABELS,
  ESTIMATES as DB_ESTIMATES,
  Estimate,
  EstimateDownPayment,
  EstimateStatus,
  LOCATIONS,
} from "../../data/db";
import { dayOffset } from "./jobsData";

// The Estimates list's data door — a READER over the shared demo database,
// like jobsData (2026-09-11, Daniel: "each row gets the data from the db").
// The estimates table lives in src/data/db (the six curated rows plus the
// former seeded mass, materialized there against the db's one demo clock);
// this module derives the display values and keeps the lookups.
//
// TWO status levels, mirroring production (see the Estimate schema note in
// types.ts): the row's `status` is the DB status — also the phase split and
// the "State" column — and the badge's DISPLAY status is derived from it
// below (`displayStatus`), exactly like production's `get_status_display`.

/** The db row itself — the list renders it directly. */
export type EstimateRow = Estimate;

/** The phase/state values — production `Estimate.Statuses`, label-cased. */
export type EstimateState = EstimateStatus;

/**
 * Every estimate in the database, sorted the view's own way — the production
 * "Estimates → All Open" default, date_due ascending.
 */
export const ESTIMATES: EstimateRow[] = [...DB_ESTIMATES].sort((a, b) =>
  a.dueAt === b.dueAt ? a.id.localeCompare(b.id) : a.dueAt.localeCompare(b.dueAt),
);

// ---- derivations -----------------------------------------------------------

/**
 * Past its due date — production's `is_expired` annotation
 * (estimates/managers.py: `date_due < today`, whatever the state). The
 * "Expires" cell reads red on it; the STATUS only turns Expired for a SENT
 * estimate, exactly like production.
 */
export const isExpired = (est: EstimateRow) => dayOffset(est.dueAt) < 0;

/** Production `get_status_display`, mapped onto the DS badge keys. */
export function displayStatus(est: EstimateRow): BadgeEstimateStatusStatus {
  switch (est.status) {
    case "Pending":
      return est.isDraft === true ? "draft" : "unsent";
    case "Sent":
      return isExpired(est) ? "expired" : "awaitingApproval";
    case "Approved":
    case "Won":
      return est.conversionPath ?? "unconverted";
    case "Lost":
      return "lost";
    default:
      return "cancelled";
  }
}

/** The status's own label, straight from BadgeEstimateStatus — never a second copy. */
export const estimateStatusLabel = (status: BadgeEstimateStatusStatus) => STATUS[status].label;

/**
 * "$1,250.00" — US currency with cents, like production's Total column
 * (NumericalDataCell type="currency").
 */
export function formatCurrency(dollars: number): string {
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/**
 * The Down payment cell's icon + copy, from the production DownPaymentCell
 * (icons verbatim; the copy moved to the DS's sentence case — production
 * prints "Not Required" / "Partially Paid").
 */
export const DOWN_PAYMENT: Record<EstimateDownPayment, { icon: string; label: string }> = {
  notRequired: { icon: "minus", label: "Not required" },
  unpaid: { icon: "circle-xmark", label: "Unpaid" },
  partiallyPaid: { icon: "circle-half-stroke", label: "Partially paid" },
  paid: { icon: "circle-check", label: "Paid" },
};

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const CLIENT_BY_ID = byId(CLIENTS);
const LOCATION_BY_ID = byId(LOCATIONS);
const LABEL_BY_ID = byId(ESTIMATE_LABELS);

export const locationOf = (est: EstimateRow) => LOCATION_BY_ID.get(est.locationId)!;
export const clientOf = (est: EstimateRow) => CLIENT_BY_ID.get(locationOf(est).clientId)!;
export const labelsOf = (est: EstimateRow) => est.labelIds.map((id) => LABEL_BY_ID.get(id)!);
