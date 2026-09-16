import { BadgeCreditNoteStatusStatus, STATUS } from "../../components/Badge/BadgeCreditNoteStatus";
import { CLIENTS, CREDIT_NOTE_LABELS, CREDIT_NOTES as DB_CREDIT_NOTES, CreditNote, CreditNoteType } from "../../data/db";

// The Credit notes list's data door — a READER over the shared demo database,
// like the other three (Daniel, 2026-09-11: "each row gets the data from the
// db"). The credit-note table lives in src/data/db (six curated rows plus the
// materialized CN-41xx mass); this module derives the display values and
// keeps the lookups.
//
// STATUS — ONE level, the standing decision applied from day one: the db row
// carries the status the badge shows (production's Pending splits into
// Draft/Unsent by `is_draft`). Nothing is derived from the clock — a credit
// note has no due date, so there is no Overdue/Expired twin and no
// `displayStatus` here.
//
// TYPE — production computes it when the credit note is ISSUED (see the db
// type), so a draft or unsent row has none: its Type cell shows the
// placeholder and no Type filter option ever matches it.

/** The db row itself — the list renders it directly. */
export type CreditNoteRow = CreditNote;

/**
 * Every credit note in the database, sorted the view's own way — the
 * production "Credit notes → All Open" default, date_issued ascending.
 */
export const CREDIT_NOTE_ROWS: CreditNoteRow[] = [...DB_CREDIT_NOTES].sort((a, b) =>
  a.issuedAt === b.issuedAt ? a.id.localeCompare(b.id) : a.issuedAt.localeCompare(b.issuedAt),
);

// ---- derivations -----------------------------------------------------------

/** The status's own label, straight from BadgeCreditNoteStatus — never a second copy. */
export const creditNoteStatusLabel = (status: BadgeCreditNoteStatusStatus) => STATUS[status].label;

/**
 * The three types, in production's enum order, with the DESIGN's labels — the
 * Type section's rows (14759-71944) write "Pre-payment", where production's
 * own labels capitalize both words ("Pre-Payment"). The design wins; FLAGGED.
 * One table feeds the Type column and the Type filter, so the two can never
 * spell a type two ways.
 */
export const CREDIT_NOTE_TYPES: { id: CreditNoteType; label: string }[] = [
  { id: "prePayment", label: "Pre-payment" },
  { id: "postPayment", label: "Post-payment" },
  { id: "mixed", label: "Mixed" },
];

const TYPE_LABEL = new Map(CREDIT_NOTE_TYPES.map((type) => [type.id, type.label]));

/** The Type cell's text — empty until the credit note is issued (the cell draws its own placeholder). */
export const typeLabelOf = (creditNote: CreditNoteRow) =>
  creditNote.type == null ? "" : (TYPE_LABEL.get(creditNote.type) ?? "");

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const CLIENT_BY_ID = byId(CLIENTS);
const LABEL_BY_ID = byId(CREDIT_NOTE_LABELS);

/** The client is DIRECT (production `external_client`) — no location in between. */
export const clientOf = (creditNote: CreditNoteRow) => CLIENT_BY_ID.get(creditNote.clientId)!;
export const labelsOf = (creditNote: CreditNoteRow) => creditNote.labelIds.map((id) => LABEL_BY_ID.get(id)!);
