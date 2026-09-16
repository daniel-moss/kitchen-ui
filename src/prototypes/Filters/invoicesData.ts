import { BadgeInvoiceStatusStatus, STATUS } from "../../components/Badge/BadgeInvoiceStatus";
import {
  CLIENTS,
  INVOICE_LABELS,
  INVOICES as DB_INVOICES,
  Invoice,
  LOCATIONS,
} from "../../data/db";
import { dayOffset } from "./listData";

// The Invoices list's data door — a READER over the shared demo database,
// like jobsData and estimatesData (Daniel, 2026-09-11: "each row gets the
// data from the db"). The invoices table lives in src/data/db (seven curated
// rows plus the materialized mass, written against the db's one demo clock);
// this module derives the display values and keeps the lookups.
//
// STATUS — ONE level, the estimates decision applied here from day one
// (2026-09-14): the db row carries the status the badge shows. Production's
// stored five (Pending/Sent/Paid/Voided/Forgiven) + `is_draft` + `is_overdue`
// never made it into the schema, and neither did a State column.
//
// `displayStatus` survives for ONE job: OVERDUE. It is the only status that
// cannot be stored, because it depends on the clock — an outstanding invoice
// whose `dueAt` has passed (production's `is_overdue` annotation, applied to
// `status == sent`). The estimates' Expired, one for one.

/** The db row itself — the list renders it directly. */
export type InvoiceRow = Invoice;

/**
 * Every invoice in the database, sorted the view's own way — the production
 * "Invoices → All Open" default, date_due ascending.
 */
export const INVOICE_ROWS: InvoiceRow[] = [...DB_INVOICES].sort((a, b) =>
  a.dueAt === b.dueAt ? a.id.localeCompare(b.id) : a.dueAt.localeCompare(b.dueAt),
);

// ---- derivations -----------------------------------------------------------

/**
 * Past its due date — production's `is_overdue` annotation
 * (invoices/managers.py: `date_due < today`). Unlike the estimates' red
 * "Expires" cell, the Due date cell escalates ONLY through the derived status
 * (production keys the dangerous cell off `state_label === "Overdue"`, which
 * needs the invoice to be out with the client) — a paid invoice past its due
 * date is not a problem.
 */
export const isOverdue = (inv: InvoiceRow) => dayOffset(inv.dueAt) < 0;

/**
 * The badge's status: the stored one, except that an OUTSTANDING invoice past
 * its due date reads Overdue. The only derivation — see the note above.
 */
export function displayStatus(inv: InvoiceRow): BadgeInvoiceStatusStatus {
  return inv.status === "outstanding" && isOverdue(inv) ? "overdue" : inv.status;
}

/** The status's own label, straight from BadgeInvoiceStatus — never a second copy. */
export const invoiceStatusLabel = (status: BadgeInvoiceStatusStatus) => STATUS[status].label;

/**
 * What the client still owes — production's trigger-maintained `amount_due`
 * (`total − amount_paid − amount_credited`; the demo does not model credit
 * notes, so the credited part is 0 by construction).
 */
export const amountDueOf = (inv: InvoiceRow) => inv.total - inv.amountPaid;

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const CLIENT_BY_ID = byId(CLIENTS);
const LOCATION_BY_ID = byId(LOCATIONS);
const LABEL_BY_ID = byId(INVOICE_LABELS);

export const locationOf = (inv: InvoiceRow) => LOCATION_BY_ID.get(inv.locationId)!;
export const clientOf = (inv: InvoiceRow) => CLIENT_BY_ID.get(locationOf(inv).clientId)!;
export const labelsOf = (inv: InvoiceRow) => inv.labelIds.map((id) => LABEL_BY_ID.get(id)!);
