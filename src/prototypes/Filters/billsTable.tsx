import Badge from "../../components/Badge/Badge";
import BadgeBillStatus, {
  BadgeBillStatusStatus,
  STATUS as BILL_STATUS,
} from "../../components/Badge/BadgeBillStatus";
import { CellBody } from "../../components/Table/CellBody/CellBody";
import { ViewMenuColumnsState } from "../../modules/ViewMenu/ViewMenu.types";

import {
  ListTable,
  TableColumnDef,
  TableSort as SharedTableSort,
  viewMenuAttributes,
  viewMenuColumns,
} from "./listTable";

import { BillsPhase } from "./billFilters";
import { BillRow, displayStatus, labelsOf, vendorOf } from "./billsData";
import { formatCurrency, formatDateTime, formatDay } from "./listData";

// The BILLS list's TABLE — the sixth list's registry over the shared
// `listTable` (added 2026-09-15, with the Credit Notes pattern: ONE registry
// per phase).
//
// ONE list drives the shared View Menu module's rows, the table's header
// cells and its body cells — the other tables' rule.

// ---- sorting ---------------------------------------------------------------

// The sortable columns are production's own (BillTableView's enableSorting
// flags + the backend's ordering_fields, which carry date_received and
// date_issued too): Labels and Status changed do not sort —
// `last_status_transition_time` is not server-sortable there either.
export type SortColumn =
  | "id"
  | "vendor"
  | "vendorInvoiceId"
  | "status"
  | "total"
  | "issued"
  | "received"
  | "dueDate"
  | "lastModified";

export type TableSort = SharedTableSort<SortColumn>;

// The production default: date_due — ASCENDING on the open views (soonest due
// first), DESCENDING on the closed ones (most recently due first).
export const sortDefault = (branch: BillsPhase): TableSort => ({
  column: "dueDate",
  order: branch === "open" ? "ascending" : "descending",
});

// STATUS sorts by the badge map's own order — the bill's lifecycle — not the
// alphabet, the same rule the other tables' Status follows.
const STATUS_RANK = new Map(
  (Object.keys(BILL_STATUS) as BadgeBillStatusStatus[]).map((key, index) => [key, index]),
);

const SORT_KEYS: Record<SortColumn, (bill: BillRow) => string | number | null> = {
  id: (bill) => bill.id,
  vendor: (bill) => vendorOf(bill).name,
  vendorInvoiceId: (bill) => bill.vendorInvoiceId,
  status: (bill) => STATUS_RANK.get(displayStatus(bill)) ?? 0,
  total: (bill) => bill.total,
  issued: (bill) => bill.issuedAt,
  received: (bill) => bill.receivedAt,
  dueDate: (bill) => bill.dueAt,
  lastModified: (bill) => bill.lastModifiedAt,
};

export function sortBills(bills: BillRow[], sort: TableSort): BillRow[] {
  const key = SORT_KEYS[sort.column];
  const direction = sort.order === "ascending" ? 1 : -1;
  return [...bills].sort((a, b) => {
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
// and its body cells. The base is production's bills view
// (defaultTableViewConfig bills_table__* + BillTableView's column sizes) with
// Daniel's 2026-09-15 rulings applied:
//
//   - production's "State" column is left out — the standing estimates
//     decision (the badge status is the only status);
//   - production's THREE transition-date columns ("Received" =
//     last_received_at, "Paid", "Voided") collapse into the ONE generic
//     Status changed column ("all those relate to the 'Status changed'
//     concept. It's wrong" — a production gap, flagged there);
//   - RECEIVED here is production's `date_received` — the user-entered
//     arrival date, which production never lists at all ("We need to show
//     that data. The column which shows the actual Received data will be
//     named 'Received'");
//   - ISSUED (production `date_issued`, also unlisted there) joins it — the
//     Invoices list's own column, and Daniel added its filter to the design;
//   - STATUS CHANGED is CLOSED-phase only ("If Status changed is gonna be
//     empty on the open phase, do not show the column and the filter") — a
//     bill is born outstanding, so only Paid / Voided carry a date. The
//     Credit Notes' Type arrangement: a PHASE-level difference, not the
//     retired per-view hiding.
//
// The three dates sit in CHRONOLOGICAL order — Issued (the vendor wrote it),
// Received (it arrived), Due date — where production leads with date_due.
//
// Widths are production's (144/224 pattern); "Vendor invoice ID" gets 192
// where production's IDCell sits at 144 — the written-out three-word header
// clipped at 144, and at 176 it still clipped while PINNED (the default: the
// pin glyph joins the sort affordance in the header, leaving ~110px for a
// ~118px label) — the Est. duration / Amount due precedent, measured on the
// screenshot 2026-09-15. Headers are sentence case ("Billing vendor",
// "Vendor invoice ID") where production capitalizes every word — the other
// lists' rule.
const COLUMNS = {
  id: 144,
  vendor: 224,
  vendorInvoiceId: 192,
  status: 176,
  labels: 240,
  total: 144,
  issued: 144,
  received: 144,
  dueDate: 144,
  statusChanged: 192,
  lastModified: 192,
};

type BillColumnDef = TableColumnDef<BillRow>;

const ALL_COLUMNS: BillColumnDef[] = [
  {
    key: "id", label: "ID", width: COLUMNS.id, dataType: "alphabetical", sortable: true,
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.id} {...pin}>
        {bill.id}
      </CellBody>
    ),
  },
  // The supplier billing us — production `vendor_name` ("Billing Vendor").
  {
    key: "vendor", label: "Billing vendor", width: COLUMNS.vendor, dataType: "alphabetical", sortable: true,
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.vendor} {...pin}>
        {vendorOf(bill).name}
      </CellBody>
    ),
  },
  // The vendor's OWN invoice number — production `vendor_invoice_id`,
  // required there (max 20 chars).
  {
    key: "vendorInvoiceId", label: "Vendor invoice ID", width: COLUMNS.vendorInvoiceId, dataType: "alphabetical", sortable: true,
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.vendorInvoiceId} {...pin}>
        {bill.vendorInvoiceId}
      </CellBody>
    ),
  },
  {
    key: "status", label: "Status", width: COLUMNS.status, dataType: "other", sortable: true,
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.status} content="badge" {...pin}>
        <BadgeBillStatus status={displayStatus(bill)} />
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(bill).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  // RIGHT-aligned, cells and header both — the money-column rule (Daniel,
  // 2026-09-14). Production stores this as `subtotal` (a bill's only amount
  // field — no tax, no partial payments) and heads it "Total", like here.
  {
    key: "total", label: "Total", width: COLUMNS.total, dataType: "numerical", sortable: true, align: "right",
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.total} content="number" {...pin}>
        {formatCurrency(bill.total)}
      </CellBody>
    ),
  },
  {
    key: "issued", label: "Issued", width: COLUMNS.issued, dataType: "timing", sortable: true,
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.issued} {...pin}>
        {formatDay(bill.issuedAt)}
      </CellBody>
    ),
  },
  // The user-entered arrival date (`date_received`) — NOT production's
  // transition-timestamp "Received" column. See the registry note.
  {
    key: "received", label: "Received", width: COLUMNS.received, dataType: "timing", sortable: true,
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.received} {...pin}>
        {formatDay(bill.receivedAt)}
      </CellBody>
    ),
  },
  // Due date — production's date_due. The cell reads red through the DERIVED
  // status only (the Invoices list's rule) — a paid or voided bill past its
  // due date is not a problem. Production's bills column has no danger
  // styling at all; the invoices rule is applied here on purpose.
  {
    key: "dueDate", label: "Due date", width: COLUMNS.dueDate, dataType: "timing", sortable: true,
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.dueDate} colorScheme={displayStatus(bill) === "overdue" ? "error" : "default"} {...pin}>
        {formatDay(bill.dueAt)}
      </CellBody>
    ),
  },
  // CLOSED phase only (see the registry note): a bill is born outstanding, so
  // only Paid / Voided ever carry a transition date.
  {
    key: "statusChanged", label: "Status changed", width: COLUMNS.statusChanged, dataType: "timing", sortable: false,
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.statusChanged} {...pin}>
        {formatDateTime(bill.statusChangedAt)}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (bill, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDateTime(bill.lastModifiedAt)}
      </CellBody>
    ),
  },
];

/** The phase's own column set — the closed phase's Status changed column is
 *  dropped from the open one (see the registry note above). */
export const TABLE_COLUMNS: Record<BillsPhase, BillColumnDef[]> = {
  open: ALL_COLUMNS.filter((def) => def.key !== "statusChanged"),
  closed: ALL_COLUMNS,
};

// ---- what the View menu is fed ----------------------------------------------

// The shared View Menu module's column lists, derived from the registries
// above — per PHASE, like the table. The page wires the module itself; see
// `BillsViewMenu` in BillsPage.tsx.
export const VIEW_COLUMNS = {
  open: viewMenuColumns(TABLE_COLUMNS.open),
  closed: viewMenuColumns(TABLE_COLUMNS.closed),
};
export const VIEW_ATTRIBUTES = {
  open: viewMenuAttributes(TABLE_COLUMNS.open),
  closed: viewMenuAttributes(TABLE_COLUMNS.closed),
};

// ---- the table -------------------------------------------------------------

interface BillsTableProps {
  bills: BillRow[];
  /** The branch the page is on — picks the phase's own column registry. */
  phase: BillsPhase;
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  onSortChange: (column: string) => void;
  /** MOBILE has no pin functionality — see the shared table. */
  mobile?: boolean;
}

// A STABLE reference, not an inline lambda: the shared table is memoised on
// its props, and a new function every render would defeat it.
const billKey = (bill: BillRow) => bill.id;

// The shared `ListTable` over the phase's registry — the sixth consumer of
// the one table module (listTable.tsx). `TABLE_COLUMNS[phase]` is a module
// constant, so the memoised table keeps its identity.
export const BillsTable = ({ bills, phase, columnsState, sort, onSortChange, mobile }: BillsTableProps) => (
  <ListTable
    rows={bills}
    rowKey={billKey}
    columns={TABLE_COLUMNS[phase]}
    columnsState={columnsState}
    sort={sort}
    onSortChange={onSortChange}
    mobile={mobile}
  />
);
