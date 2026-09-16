import Badge from "../../components/Badge/Badge";
import BadgeCreditNoteStatus, {
  BadgeCreditNoteStatusStatus,
  STATUS as CREDIT_NOTE_STATUS,
} from "../../components/Badge/BadgeCreditNoteStatus";
import { CellBody } from "../../components/Table/CellBody/CellBody";
import { ViewMenuColumnsState } from "../../modules/ViewMenu/ViewMenu.types";

import {
  ListTable,
  TableColumnDef,
  TableSort as SharedTableSort,
  viewMenuAttributes,
  viewMenuColumns,
} from "./listTable";

import { CreditNotesPhase } from "./creditNoteFilters";
import { clientOf, CreditNoteRow, labelsOf, typeLabelOf } from "./creditNotesData";
import { formatCurrency, formatDateTime } from "./listData";

// The CREDIT NOTES list's TABLE — the fourth list's registry over the shared
// `listTable` (added 2026-09-14, with the Invoices list's pattern).
//
// ONE list (`TABLE_COLUMNS`) drives the shared View Menu module's rows, the
// table's header cells and its body cells — the other tables' rule.

// ---- sorting ---------------------------------------------------------------

// The sortable columns are production's own (CreditNoteTableView's
// enableSorting flags): everything sorts but Labels.
export type SortColumn = "id" | "invoiceId" | "client" | "status" | "type" | "total" | "issued" | "lastModified";

export type TableSort = SharedTableSort<SortColumn>;

// The production default: date_issued — ASCENDING on the open views (the
// production tab's `ordering=date_issued`), DESCENDING on the closed ones
// (`-date_issued`, most recently issued first).
export const sortDefault = (branch: CreditNotesPhase): TableSort => ({
  column: "issued",
  order: branch === "open" ? "ascending" : "descending",
});

// STATUS sorts by the badge map's own order — the credit note's lifecycle —
// not the alphabet, the same rule the other tables' Status follows.
const STATUS_RANK = new Map(
  (Object.keys(CREDIT_NOTE_STATUS) as BadgeCreditNoteStatusStatus[]).map((key, index) => [key, index]),
);

const SORT_KEYS: Record<SortColumn, (creditNote: CreditNoteRow) => string | number | null> = {
  id: (creditNote) => creditNote.id,
  invoiceId: (creditNote) => creditNote.invoiceId ?? null,
  client: (creditNote) => clientOf(creditNote).name,
  status: (creditNote) => STATUS_RANK.get(creditNote.status) ?? 0,
  type: (creditNote) => (typeLabelOf(creditNote) === "" ? null : typeLabelOf(creditNote)),
  total: (creditNote) => creditNote.total,
  issued: (creditNote) => creditNote.issuedAt,
  lastModified: (creditNote) => creditNote.lastModifiedAt,
};

export function sortCreditNotes(creditNotes: CreditNoteRow[], sort: TableSort): CreditNoteRow[] {
  const key = SORT_KEYS[sort.column];
  const direction = sort.order === "ascending" ? 1 : -1;
  return [...creditNotes].sort((a, b) => {
    const keyA = key(a);
    const keyB = key(b);
    const emptyA = keyA == null || keyA === "";
    const emptyB = keyB == null || keyB === "";
    // Ties and empties fall back to the ID, so the order is stable — the
    // other tables' rule.
    if (emptyA || emptyB) return emptyA && emptyB ? a.id.localeCompare(b.id) : emptyA ? 1 : -1;
    const compared =
      typeof keyA === "number" && typeof keyB === "number"
        ? keyA - keyB
        : String(keyA).localeCompare(String(keyB), "en", { numeric: true });
    return compared !== 0 ? compared * direction : a.id.localeCompare(b.id);
  });
}

// ---- the column registry ---------------------------------------------------

// ONE list PER PHASE drives the View menu's rows, the table's header cells
// and its body cells. The order and the widths are the production Credit
// Notes view (defaultTableViewConfig credit_notes_table__* and
// CreditNoteTableView's column sizes): ID 144, Invoice ID 144, Client 288,
// Status 176, Type 144, Labels 240, Total 144, Date issued 144, Last
// modified 144. Production pins ID + Client, the default arrangement below.
//
// The TYPE column exists on the CLOSED phase only (Daniel, 2026-09-14:
// "remove the 'Type' column from the 'open' views. Show it on the 'closed'
// views only") — an open credit note has no type yet (production computes it
// at issue), so the open phase showed a whole column of placeholders. This
// DIVERGES from production, whose views all share one column set; and it is
// a PHASE-level difference, not the retired per-view hiding — every view of
// a phase still shows every column its phase has.
//
// Production heads the date column "Date Issued"; here it is "Issued" — the
// name the Invoices list already gave the same production field
// (`date_issued`) and the shared filter's name, so one word covers both
// lists. FLAGGED.
const COLUMNS = {
  id: 144,
  invoiceId: 144,
  client: 288,
  status: 176,
  type: 144,
  labels: 240,
  total: 144,
  issued: 192,
  lastModified: 192,
};

type CreditNoteColumnDef = TableColumnDef<CreditNoteRow>;

const ALL_COLUMNS: CreditNoteColumnDef[] = [
  {
    key: "id", label: "ID", width: COLUMNS.id, dataType: "alphabetical", sortable: true,
    cell: (creditNote, pin) => (
      <CellBody width={COLUMNS.id} {...pin}>
        {creditNote.id}
      </CellBody>
    ),
  },
  // The linked invoice, or nothing — the link is optional in production, and
  // an empty string makes CellBody draw its own "—" placeholder.
  {
    key: "invoiceId", label: "Invoice ID", width: COLUMNS.invoiceId, dataType: "alphabetical", sortable: true,
    cell: (creditNote, pin) => (
      <CellBody width={COLUMNS.invoiceId} {...pin}>
        {creditNote.invoiceId ?? ""}
      </CellBody>
    ),
  },
  {
    key: "client", label: "Client", width: COLUMNS.client, dataType: "alphabetical", sortable: true,
    cell: (creditNote, pin) => (
      <CellBody width={COLUMNS.client} {...pin}>
        {clientOf(creditNote).name}
      </CellBody>
    ),
  },
  {
    key: "status", label: "Status", width: COLUMNS.status, dataType: "other", sortable: true,
    cell: (creditNote, pin) => (
      <CellBody width={COLUMNS.status} content="badge" {...pin}>
        <BadgeCreditNoteStatus status={creditNote.status} />
      </CellBody>
    ),
  },
  // CLOSED phase only (see the registry note): production computes the type
  // from the allocation at issue time, so only an issued / voided row has
  // one to show.
  {
    key: "type", label: "Type", width: COLUMNS.type, dataType: "alphabetical", sortable: true,
    cell: (creditNote, pin) => (
      <CellBody width={COLUMNS.type} {...pin}>
        {typeLabelOf(creditNote)}
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (creditNote, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(creditNote).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  // RIGHT-aligned, cells and header both — the money-column rule (Daniel,
  // 2026-09-14): the cells through `content="number"`'s own default, the
  // HEADER through the registry's `align`.
  {
    key: "total", label: "Total", width: COLUMNS.total, dataType: "numerical", sortable: true, align: "right",
    cell: (creditNote, pin) => (
      <CellBody width={COLUMNS.total} content="number" {...pin}>
        {formatCurrency(creditNote.total)}
      </CellBody>
    ),
  },
  {
    key: "issued", label: "Issued", width: COLUMNS.issued, dataType: "timing", sortable: true,
    cell: (creditNote, pin) => (
      <CellBody width={COLUMNS.issued} {...pin}>
        {formatDateTime(creditNote.issuedAt)}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (creditNote, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDateTime(creditNote.lastModifiedAt)}
      </CellBody>
    ),
  },
];

/** The phase's own column set — the closed phase's Type column is dropped
 *  from the open one (see the registry note above). */
export const TABLE_COLUMNS: Record<CreditNotesPhase, CreditNoteColumnDef[]> = {
  open: ALL_COLUMNS.filter((def) => def.key !== "type"),
  closed: ALL_COLUMNS,
};

// ---- what the View menu is fed ----------------------------------------------

// The shared View Menu module's column lists, derived from the registries
// above — per PHASE, like the table. The page wires the module itself; see
// `CreditNotesViewMenu` in CreditNotesPage.tsx.
export const VIEW_COLUMNS = {
  open: viewMenuColumns(TABLE_COLUMNS.open),
  closed: viewMenuColumns(TABLE_COLUMNS.closed),
};
export const VIEW_ATTRIBUTES = {
  open: viewMenuAttributes(TABLE_COLUMNS.open),
  closed: viewMenuAttributes(TABLE_COLUMNS.closed),
};

// ---- the table -------------------------------------------------------------

interface CreditNotesTableProps {
  creditNotes: CreditNoteRow[];
  /** The branch the page is on — picks the phase's own column registry. */
  phase: CreditNotesPhase;
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  onSortChange: (column: string) => void;
  /** MOBILE has no pin functionality — see the shared table. */
  mobile?: boolean;
}

// A STABLE reference, not an inline lambda: the shared table is memoised on
// its props, and a new function every render would defeat it.
const creditNoteKey = (creditNote: CreditNoteRow) => creditNote.id;

// The shared `ListTable` over the phase's registry — the fourth consumer of
// the one table module (listTable.tsx). `TABLE_COLUMNS[phase]` is a module
// constant, so the memoised table keeps its identity.
export const CreditNotesTable = ({ creditNotes, phase, columnsState, sort, onSortChange, mobile }: CreditNotesTableProps) => (
  <ListTable
    rows={creditNotes}
    rowKey={creditNoteKey}
    columns={TABLE_COLUMNS[phase]}
    columnsState={columnsState}
    sort={sort}
    onSortChange={onSortChange}
    mobile={mobile}
  />
);
