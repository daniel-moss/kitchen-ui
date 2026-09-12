import { BadgeEstimateStatusStatus, STATUS } from "../../components/Badge/BadgeEstimateStatus";
import { CellColorScheme } from "../../components/Table/CellBody/CellBody.types";
import {
  CLIENTS,
  ESTIMATE_LABELS,
  ESTIMATES as DB_ESTIMATES,
  Estimate,
  EstimateDownPayment,
  EstimateStatus,
  LOCATIONS,
} from "../../data/db";
import { dayOffset } from "./listData";

// The Estimates list's data door — a READER over the shared demo database,
// like jobsData (2026-09-11, Daniel: "each row gets the data from the db").
// The estimates table lives in src/data/db (the six curated rows plus the
// former seeded mass, materialized there against the db's one demo clock);
// this module derives the display values and keeps the lookups.
//
// STATUS — ONE level (Daniel, 2026-09-11: "this concept of state is redundant
// and we won't use it anymore"). The db row carries the status the badge
// shows; production's STATE + `is_draft` + conversion path are gone from the
// schema, and with them the State column, the state-based view tabs and the
// state string in the keyword search.
//
// `displayStatus` survives for ONE job: EXPIRED. It is the only status that
// cannot be stored, because it depends on the clock — a sent estimate whose
// `dueAt` has passed.

/** The db row itself — the list renders it directly. */
export type EstimateRow = Estimate;


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

/**
 * The badge's status: the stored one, except that a SENT estimate past its due
 * date reads Expired. That is the only derivation left — see the note above.
 */
export function displayStatus(est: EstimateRow): BadgeEstimateStatusStatus {
  return est.status === "awaitingApproval" && isExpired(est) ? "expired" : est.status;
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
 * The Down payment cell — icon, copy and colour scheme, read off the node
 * (14330-66931, re-read 2026-09-12 after Daniel's update). The copy is sentence
 * case, where production prints "Not Required" / "Partially Paid".
 *
 * Six cells, not four: an UNPAID or PARTIALLY PAID down payment reads
 * differently depending on how far the estimate has got. The node's two
 * annotations say it — "Not Paid / On 'Unconverted' and closed statuses" and
 * the same for Partially Paid — so:
 *
 *   before approval (draft · unsent · sent, expired included)
 *     Not paid        regular `circle-xmark`, --text-subtle — nothing is owed
 *                     yet, so it is a neutral fact
 *     Partially paid  solid rotated `circle-half-stroke`, --text-warning
 *   approved and beyond (unconverted · jobbed · invoiced · lost · cancelled)
 *     Not paid        SOLID `circle-xmark`, --text-error
 *     Partially paid  the same icon, --text-error — the estimate went ahead
 *                     without the money
 *
 * The two states that do not depend on the status: NOT REQUIRED (regular
 * `minus`, --text-subtle — it gained the icon in this update; it used to be the
 * words alone) and PAID (solid `circle-check`, --text-success).
 *
 * FLAGGED, unchanged from the first read: the node colours both neutral cells
 * `--text-subtle`, and the closest CellBody scheme is `subtle`, which maps to
 * `--text-placeholder` — one step lighter (gray-a9 against gray-a11). The
 * component has no `--text-subtle` scheme; either its `subtle` should BE that
 * (the name says so, and a separate scheme could carry the placeholder "—"), or
 * the node should use the placeholder token. A DS decision, not a prototype
 * one — the cell overrides the token locally until it is made.
 */
export interface DownPaymentCell {
  icon: string;
  /** Font Awesome weight — REGULAR on the two neutral cells, solid elsewhere. */
  pack: "regular" | "solid";
  rotate?: number;
  label: string;
  scheme: CellColorScheme;
}

/**
 * The four values' COPY and GLYPH — the one place both readers take them from:
 * this cell, and the Estimates list's Down payment filter (its option rows, node
 * 14293-45032). Only the weight and the colour differ between the two, so each
 * decides those for itself.
 *
 * FLAGGED: the filter's list node calls the last one **"Unpaid"**, where the
 * cell node (14330-66931) calls it "Not paid". One value cannot be spelled two
 * ways in one list, so both read "Not paid" here — the newer copy, and the one
 * the column shows. The filter node is the one to update.
 */
const DOWN_PAYMENT_VALUES: Record<EstimateDownPayment, { label: string; icon: string; rotate?: number }> = {
  notRequired: { label: "Not required", icon: "minus" },
  paid: { label: "Paid", icon: "circle-check" },
  // Turned 180°, so the filled half sits on the left — the same treatment the
  // status badges give `circle-half-stroke`.
  partiallyPaid: { label: "Partially paid", icon: "circle-half-stroke", rotate: 180 },
  unpaid: { label: "Not paid", icon: "circle-xmark" },
};

/**
 * The FILTER's four option rows, in the node's order (14293-45034): Not required
 * · Paid · Partially paid · Not paid. A row is a checkbox, the value's icon and
 * its label — no counts.
 *
 * The colours are the node's, and they are the STATUS-BADGE family (`jade-a9` /
 * `amber-a9` / `tomato-a9`), not the cell's text tokens: a filter row is the
 * VALUE itself, so it never escalates the way a cell does. "Not required" takes
 * no colour at all — the node draws it `--gray-12`, the icon's default.
 */
export const DOWN_PAYMENT_OPTIONS: {
  id: EstimateDownPayment;
  label: string;
  icon: string;
  pack: "regular" | "solid";
  rotate?: number;
  /** A Radix scale name — the icon is painted `--<scheme>-a9`. Unset = default. */
  scheme?: string;
}[] = [
  { id: "notRequired", ...DOWN_PAYMENT_VALUES.notRequired, pack: "regular" },
  { id: "paid", ...DOWN_PAYMENT_VALUES.paid, pack: "solid", scheme: "jade" },
  { id: "partiallyPaid", ...DOWN_PAYMENT_VALUES.partiallyPaid, pack: "solid", scheme: "amber" },
  { id: "unpaid", ...DOWN_PAYMENT_VALUES.unpaid, pack: "solid", scheme: "tomato" },
];

/** Approved and beyond: an unpaid down payment is a problem from here on. */
const DOWN_PAYMENT_ESCALATES: EstimateStatus[] = ["unconverted", "jobbed", "invoiced", "lost", "cancelled"];

export function downPaymentCell(est: EstimateRow): DownPaymentCell {
  const escalated = DOWN_PAYMENT_ESCALATES.includes(est.status);
  const value = DOWN_PAYMENT_VALUES[est.downPayment];
  switch (est.downPayment) {
    case "notRequired":
      return { ...value, pack: "regular", scheme: "subtle" };
    case "paid":
      return { ...value, pack: "solid", scheme: "success" };
    case "partiallyPaid":
      return { ...value, pack: "solid", scheme: escalated ? "error" : "warning" };
    default:
      return escalated
        ? { ...value, pack: "solid", scheme: "error" }
        : { ...value, pack: "regular", scheme: "subtle" };
  }
}

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const CLIENT_BY_ID = byId(CLIENTS);
const LOCATION_BY_ID = byId(LOCATIONS);
const LABEL_BY_ID = byId(ESTIMATE_LABELS);

export const locationOf = (est: EstimateRow) => LOCATION_BY_ID.get(est.locationId)!;
export const clientOf = (est: EstimateRow) => CLIENT_BY_ID.get(locationOf(est).clientId)!;
export const labelsOf = (est: EstimateRow) => est.labelIds.map((id) => LABEL_BY_ID.get(id)!);
