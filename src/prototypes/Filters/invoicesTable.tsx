import Badge from "../../components/Badge/Badge";
import BadgeInvoiceStatus, {
  BadgeInvoiceStatusStatus,
  STATUS as INVOICE_STATUS,
} from "../../components/Badge/BadgeInvoiceStatus";
import { Icon } from "../../components/Icon/Icon";
import { CellBody } from "../../components/Table/CellBody/CellBody";
import { ViewMenuColumnsState } from "../../modules/ViewMenu/ViewMenu.types";

import {
  ListTable,
  TableColumnDef,
  TableSort as SharedTableSort,
  viewMenuAttributes,
  viewMenuColumns,
} from "./listTable";

import { InvoicesPhase } from "./invoiceFilters";
import {
  amountDueOf,
  clientOf,
  displayStatus,
  InvoiceRow,
  labelsOf,
  locationOf,
} from "./invoicesData";
import { formatCurrency, formatDateTime, formatDay, locationAddress } from "./listData";

// The INVOICES list's TABLE — the third list's registry over the shared
// `listTable` (added 2026-09-14; the shared module was "generic over the row,
// ready for the third list" since the re-organisation).
//
// ONE list (`TABLE_COLUMNS`) drives the shared View Menu module's rows, the
// table's header cells and its body cells — the other two tables' rule.

// (The phase type lives in invoiceFilters.tsx — `InvoicesPhase` — since the
// filters arrived, the way the other two registries own theirs. The sort
// default reads it.)

// ---- sorting ---------------------------------------------------------------

// The sortable columns are production's own (InvoiceTableView's enableSorting
// flags + the backend's ordering_fields): Labels and Status changed do not
// sort — `last_status_transition_time` is not server-sortable there either.
export type SortColumn =
  | "id"
  | "client"
  | "status"
  | "amountDue"
  | "total"
  | "service"
  | "locationName"
  | "locationAddress"
  | "issued"
  | "dueDate"
  | "lastModified"
  | "seen";

export type TableSort = SharedTableSort<SortColumn>;

// The production default: date_due — ASCENDING on the open views (soonest due
// first), DESCENDING on the closed ones (most recently due first).
export const sortDefault = (branch: InvoicesPhase): TableSort => ({
  column: "dueDate",
  order: branch === "open" ? "ascending" : "descending",
});

// STATUS sorts by the badge map's own order — the invoice's lifecycle — not
// the alphabet, the same rule the other two tables' Status follows.
const STATUS_RANK = new Map(
  (Object.keys(INVOICE_STATUS) as BadgeInvoiceStatusStatus[]).map((key, index) => [key, index]),
);

const SORT_KEYS: Record<SortColumn, (inv: InvoiceRow) => string | number | null> = {
  id: (inv) => inv.id,
  client: (inv) => clientOf(inv).name,
  status: (inv) => STATUS_RANK.get(displayStatus(inv)) ?? 0,
  amountDue: (inv) => amountDueOf(inv),
  total: (inv) => inv.total,
  service: (inv) => inv.serviceName,
  locationName: (inv) => locationOf(inv).name ?? null,
  locationAddress: (inv) => locationAddress(locationOf(inv)),
  issued: (inv) => inv.issuedAt,
  dueDate: (inv) => inv.dueAt,
  lastModified: (inv) => inv.lastModifiedAt,
  seen: (inv) => inv.lastViewedAt ?? null,
};

export function sortInvoices(invoices: InvoiceRow[], sort: TableSort): InvoiceRow[] {
  const key = SORT_KEYS[sort.column];
  const direction = sort.order === "ascending" ? 1 : -1;
  return [...invoices].sort((a, b) => {
    const keyA = key(a);
    const keyB = key(b);
    const emptyA = keyA == null || keyA === "";
    const emptyB = keyB == null || keyB === "";
    // Ties and empties fall back to the ID, so the order is stable — the
    // other two tables' rule.
    if (emptyA || emptyB) return emptyA && emptyB ? a.id.localeCompare(b.id) : emptyA ? 1 : -1;
    const compared =
      typeof keyA === "number" && typeof keyB === "number"
        ? keyA - keyB
        : String(keyA).localeCompare(String(keyB), "en", { numeric: true });
    return compared !== 0 ? compared * direction : a.id.localeCompare(b.id);
  });
}

// ---- the column registry ---------------------------------------------------

// ONE list drives the View menu's rows, the table's header cells and its body
// cells. The order and the widths are the production "Invoices → All Open"
// view (defaultTableViewConfig invoices_table__open_all_open +
// InvoiceTableView's column sizes), with the two columns the other views add
// folded in where the master registry keeps them: TOTAL right after Amount
// due (the closed views swap one for the other; here every view shows every
// column — Daniel, 2026-09-12, the estimates rule) and SEEN at the end (the
// outstanding/overdue and closed views' last column).
//
// Production's "State" column is left out on purpose — the estimates decision
// (2026-09-11, "this concept of state is redundant") applied here from day
// one: the badge status is the only status, and the view tabs group by it.
// The per-transition date columns production adds per view (Sent / Paid /
// Voided / Forgiven dates) are left out too — the generic "Status changed"
// carries that story, the estimates rule. FLAGGED both.
const COLUMNS = {
  id: 144,
  client: 224,
  // Production's 176 — the widest label here ("Outstanding") fits, so the
  // estimates' 192 bump (made for "Awaiting approval") is not needed.
  status: 176,
  // 144, up from production's 128: production heads it "Amt. Due", which
  // fits — the written-out "Amount due" clipped at 128 (the sort affordance
  // leaves ~74px for the label there), the Est. duration precedent. See the
  // flag on the column below.
  amountDue: 144,
  total: 144,
  service: 224,
  locationName: 288,
  locationAddress: 288,
  labels: 240,
  issued: 192,
  dueDate: 192,
  statusChanged: 192,
  lastModified: 192,
  seen: 96,
};

type InvoiceColumnDef = TableColumnDef<InvoiceRow>;

export const TABLE_COLUMNS: InvoiceColumnDef[] = [
  {
    key: "id", label: "ID", width: COLUMNS.id, dataType: "alphabetical", sortable: true,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.id} {...pin}>
        {inv.id}
      </CellBody>
    ),
  },
  {
    key: "client", label: "Client", width: COLUMNS.client, dataType: "alphabetical", sortable: true,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.client} {...pin}>
        {clientOf(inv).name}
      </CellBody>
    ),
  },
  {
    key: "status", label: "Status", width: COLUMNS.status, dataType: "other", sortable: true,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.status} content="badge" {...pin}>
        <BadgeInvoiceStatus status={displayStatus(inv)} />
      </CellBody>
    ),
  },
  // What the client still owes (total − paid). FLAGGED: production heads this
  // "Amt. Due" — the only abbreviated header on the list — where every other
  // header here is written out, so this one is too. Say the word to shorten
  // it back.
  //
  // RIGHT-aligned, cells and header both (Daniel, 2026-09-14 — he first
  // wrote "left" and corrected it to right the same day): the cells through
  // `content="number"`'s own default, the HEADER through the registry's
  // `align` (CellHeader defaults left and must match the column's cells —
  // its own doc rule). Production aligns these the same way.
  {
    key: "amountDue", label: "Amount due", width: COLUMNS.amountDue, dataType: "numerical", sortable: true, align: "right",
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.amountDue} content="number" {...pin}>
        {formatCurrency(amountDueOf(inv))}
      </CellBody>
    ),
  },
  {
    key: "total", label: "Total", width: COLUMNS.total, dataType: "numerical", sortable: true, align: "right",
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.total} content="number" {...pin}>
        {formatCurrency(inv.total)}
      </CellBody>
    ),
  },
  // The invoice's OWN service name (the db denormalizes it, production-like).
  {
    key: "service", label: "Service", width: COLUMNS.service, dataType: "alphabetical", sortable: true,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.service} {...pin}>
        {inv.serviceName}
      </CellBody>
    ),
  },
  // Both location halves are OPTIONAL, the other lists' rule — an empty
  // string makes CellBody draw its own "—" placeholder.
  {
    key: "locationName", label: "Location name", width: COLUMNS.locationName, dataType: "alphabetical", sortable: true,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.locationName} {...pin}>
        {locationOf(inv).name ?? ""}
      </CellBody>
    ),
  },
  {
    key: "locationAddress", label: "Location address", width: COLUMNS.locationAddress, dataType: "alphabetical", sortable: true,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.locationAddress} {...pin}>
        {locationAddress(locationOf(inv))}
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(inv).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  {
    key: "issued", label: "Issued", width: COLUMNS.issued, dataType: "timing", sortable: true,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.issued} {...pin}>
        {formatDateTime(inv.issuedAt)}
      </CellBody>
    ),
  },
  // Due date — production's date_due. The cell reads red through the DERIVED
  // status only (production: `isDangerous={state_label === "Overdue"}`) — an
  // invoice that is paid, voided or forgiven past its due date is not a
  // problem, unlike the estimates' Expires cell, which escalates on the bare
  // date whatever the status. Each list follows its own production rule.
  {
    key: "dueDate", label: "Due date", width: COLUMNS.dueDate, dataType: "timing", sortable: true,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.dueDate} colorScheme={displayStatus(inv) === "overdue" ? "error" : "default"} {...pin}>
        {formatDateTime(inv.dueAt)}
      </CellBody>
    ),
  },
  {
    key: "statusChanged", label: "Status changed", width: COLUMNS.statusChanged, dataType: "timing", sortable: false,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.statusChanged} {...pin}>
        {formatDateTime(inv.statusChangedAt)}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (inv, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDateTime(inv.lastModifiedAt)}
      </CellBody>
    ),
  },
  // Seen — the client opened the invoice: production's SeenCell, an eye and
  // the word "Seen", with the exact moment in the hover tooltip; never opened
  // = the cell's own "—" placeholder.
  {
    key: "seen", label: "Seen", width: COLUMNS.seen, dataType: "other", sortable: true,
    cell: (inv, pin) =>
      inv.lastViewedAt != null ? (
        <CellBody
          width={COLUMNS.seen}
          slotLeft={<Icon icon="eye" pack="regular" size={14} container="square" />}
          tooltip={`Last seen ${formatDateTime(inv.lastViewedAt)}`}
          {...pin}
        >
          Seen
        </CellBody>
      ) : (
        <CellBody width={COLUMNS.seen} {...pin} />
      ),
  },
];

// ---- what the View menu is fed ----------------------------------------------

// The shared View Menu module's two column lists, derived from the registry
// above — the other two tables' rule. The page wires the module itself; see
// `InvoicesViewMenu` in InvoicesPage.tsx.
export const VIEW_COLUMNS = viewMenuColumns(TABLE_COLUMNS);
export const VIEW_ATTRIBUTES = viewMenuAttributes(TABLE_COLUMNS);

// ---- the table -------------------------------------------------------------

interface InvoicesTableProps {
  invoices: InvoiceRow[];
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  onSortChange: (column: string) => void;
  /** MOBILE has no pin functionality — see the shared table. */
  mobile?: boolean;
}

// A STABLE reference, not an inline lambda: the shared table is memoised on
// its props, and a new function every render would defeat it.
const invoiceKey = (inv: InvoiceRow) => inv.id;

// The shared `ListTable` over the registry above — the third consumer of the
// one table module (listTable.tsx).
export const InvoicesTable = ({ invoices, columnsState, sort, onSortChange, mobile }: InvoicesTableProps) => (
  <ListTable
    rows={invoices}
    rowKey={invoiceKey}
    columns={TABLE_COLUMNS}
    columnsState={columnsState}
    sort={sort}
    onSortChange={onSortChange}
    mobile={mobile}
  />
);
