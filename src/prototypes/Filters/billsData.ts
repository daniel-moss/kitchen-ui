import { BadgeBillStatusStatus, STATUS } from "../../components/Badge/BadgeBillStatus";
import { BILL_LABELS, BILLS as DB_BILLS, Bill, VENDORS, Vendor } from "../../data/db";
import { dayOffset } from "./listData";

// The Bills list's data door — a READER over the shared demo database, like
// the other five (Daniel, 2026-09-11: "each row gets the data from the db").
// The bills table lives in src/data/db (six curated rows plus the
// materialized BILL-61xx mass); this module derives the display values and
// keeps the lookups.
//
// BILLS ARE ACCOUNTS PAYABLE — the one list whose rows hang off a VENDOR (the
// supplier billing the company), not off a client or a location. So the
// lookups here go to the VENDORS table, and there is no client, location or
// service door at all.
//
// STATUS — ONE level, the standing decision applied from day one
// (2026-09-15): the db row carries the status the badge shows. Production
// stores four (bills/choices.py: Pending / Received / Paid / Voided), splits
// Pending into Draft/Unsent by `is_draft` and Received into
// Outstanding/Overdue by the annotated `is_overdue` — and Daniel ruled the
// UNSENT half out entirely ("a bill can not be sent"), so the demo's set is
// draft / outstanding / paid / voided.
//
// `displayStatus` survives for ONE job: OVERDUE. It is the only status that
// cannot be stored, because it depends on the clock — an outstanding bill
// whose `dueAt` has passed (production's `is_overdue` annotation, date_due
// against today in the company timezone). The invoices' twin, one for one.

/** The db row itself — the list renders it directly. */
export type BillRow = Bill;

/**
 * Every bill in the database, sorted the view's own way — the production
 * "Bills → All Open" default, date_due ascending.
 */
export const BILL_ROWS: BillRow[] = [...DB_BILLS].sort((a, b) =>
  a.dueAt === b.dueAt ? a.id.localeCompare(b.id) : a.dueAt.localeCompare(b.dueAt),
);

// ---- derivations -----------------------------------------------------------

/**
 * Past its due date — production's `is_overdue` annotation (bills/managers.py:
 * `date_due < today`). The Due date cell escalates ONLY through the derived
 * status (the Invoices list's rule) — a paid or voided bill past its due date
 * is not a problem. Production's own bills table draws NO danger styling on
 * the column at all, which Daniel called a production gap, so the invoices
 * rule is applied here rather than mirrored off production.
 */
export const isOverdue = (bill: BillRow) => dayOffset(bill.dueAt) < 0;

/**
 * The badge's status: the stored one, except that an OUTSTANDING bill past
 * its due date reads Overdue. The only derivation — see the note above.
 */
export function displayStatus(bill: BillRow): BadgeBillStatusStatus {
  return bill.status === "outstanding" && isOverdue(bill) ? "overdue" : bill.status;
}

/** The status's own label, straight from BadgeBillStatus — never a second copy. */
export const billStatusLabel = (status: BadgeBillStatusStatus) => STATUS[status].label;

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const VENDOR_BY_ID = byId(VENDORS);
const LABEL_BY_ID = byId(BILL_LABELS);

/** The vendor is DIRECT — production `vendor`, the "Billing Vendor". Every bill has one. */
export const vendorOf = (bill: BillRow): Vendor => VENDOR_BY_ID.get(bill.vendorId)!;
export const labelsOf = (bill: BillRow) => bill.labelIds.map((id) => LABEL_BY_ID.get(id)!);
