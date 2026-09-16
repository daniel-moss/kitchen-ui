import Badge from "../../components/Badge/Badge";
import BadgePOStatus, { STATUS as PO_STATUS } from "../../components/Badge/BadgePOStatus";
import { Icon } from "../../components/Icon/Icon";
import { POStatus } from "../../data/db";
import { CellBody } from "../../components/Table/CellBody/CellBody";
import { ViewMenuColumnsState } from "../../modules/ViewMenu/ViewMenu.types";

import {
  ListTable,
  TableColumnDef,
  TableSort as SharedTableSort,
  viewMenuAttributes,
  viewMenuColumns,
} from "./listTable";

import { POsPhase } from "./poFilters";
import { PORow, formatPaymentTerms, labelsOf, paymentTermsOf, shippingOf, vendorOf } from "./posData";
import { dayOffset, formatCurrency, formatDateTime, formatDay } from "./listData";

// The POs list's TABLE — the seventh list's registry over the shared
// `listTable` (added 2026-09-15). ONE registry for both phases — unlike
// Credit notes' Type or Bills' Status changed, nothing here is phase-only:
// Status changed carries data through the whole open phase (Daniel's
// ruling), so every view shows every column.
//
// The base is production's PurchaseOrderTableView + defaultTableViewConfig
// (purchase_orders_table__*), the per-tab default sets MERGED into one list
// in their relative order (every view shows every column, the 2026-09-12
// rule), with Daniel's 2026-09-15 rulings applied:
//
//   - production's "State" column is left out — the standing estimates
//     decision (the badge status is the only status);
//   - production's TWO shipping columns ("Shipping Preference" on the
//     Pending/Open tabs, "Shipping" from In Transit on — the requested vs
//     actual field sets) collapse into ONE column named "Shipping"
//     everywhere ("Keep 'Shipping Preference' but name it 'Shipping' on all
//     views" — each production view only ever shows one of the two);
//   - production's SEVEN per-status date columns (Sent / Acknowledged / In
//     Transit / Delivered / Stocked / Paid / Cancelled dates) collapse into
//     the ONE generic Status changed column ("Per-status columns are
//     'Status changed' data") — the Bills ruling, applied here on both
//     phases;
//   - Tracking number and Seen stay (production's own).
//
// Widths are production's; headers sentence case ("Purchasing vendor",
// "Est. arrival", "Tracking number") where production capitalizes every
// word — the other lists' rule.

// ---- sorting ---------------------------------------------------------------

// The sortable columns are production's own (PurchaseOrderTableView's
// enableSorting flags + the backend's ordering_fields): Labels, Shipping,
// Tracking number, the three Associated columns and Status changed do not
// sort — none of them is server-sortable there either (`shipping` is a
// computed string, the associations are per-line M2M sets, and
// `last_status_transition_time` is derived per row).
export type SortColumn =
  | "id"
  | "vendor"
  | "status"
  | "items"
  | "amount"
  | "estArrival"
  | "paymentTerms"
  | "issued"
  | "lastModified"
  | "seen";

export type TableSort = SharedTableSort<SortColumn>;

// The production default: date_issued — ASCENDING on EVERY tab, the closed
// ones included (production's own choice; Daniel 2026-09-15: "follow
// production"). The one list whose closed views do not flip to descending.
export const sortDefault = (): TableSort => ({ column: "issued", order: "ascending" });

// STATUS sorts by the badge map's own order — the PO's lifecycle — not the
// alphabet, the same rule the other tables' Status follows.
const STATUS_RANK = new Map((Object.keys(PO_STATUS) as POStatus[]).map((key, index) => [key, index]));

const SORT_KEYS: Record<SortColumn, (po: PORow) => string | number | null> = {
  id: (po) => po.id,
  vendor: (po) => vendorOf(po).name,
  status: (po) => STATUS_RANK.get(po.status) ?? 0,
  items: (po) => po.itemCount,
  amount: (po) => po.amount,
  estArrival: (po) => po.estimatedArrivalAt,
  // Production remaps this sort to `vendor__payment_terms` — the live vendor
  // value, the same one the cell prints.
  paymentTerms: (po) => paymentTermsOf(po),
  issued: (po) => po.issuedAt,
  lastModified: (po) => po.lastModifiedAt,
  seen: (po) => po.lastViewedAt ?? null,
};

export function sortPOs(pos: PORow[], sort: TableSort): PORow[] {
  const key = SORT_KEYS[sort.column];
  const direction = sort.order === "ascending" ? 1 : -1;
  return [...pos].sort((a, b) => {
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

const COLUMNS = {
  id: 144,
  vendor: 224,
  // 176, not production's 160 (Daniel, 2026-09-15): the "Acknowledged" badge
  // — icon + the longest status word — clipped at 160. The Est. duration /
  // Amount due / Vendor invoice ID precedent, and the width the other
  // lists' Status already uses.
  status: 176,
  labels: 240,
  items: 96,
  amount: 128,
  estArrival: 144,
  shipping: 224,
  tracking: 176,
  paymentTerms: 160,
  issued: 144,
  associatedEstimates: 176,
  associatedJobs: 176,
  associatedInvoices: 176,
  statusChanged: 192,
  lastModified: 192,
  seen: 96,
};

type POColumnDef = TableColumnDef<PORow>;

/** ID badges for one Associated column — production's BadgesCell, without
 *  its +N overflow: the demo's orders link to at most three objects, so
 *  every id fits as its own badge (the Labels cells' shape). */
const associatedCell = (width: number, ids: string[], pin: object) => (
  <CellBody width={width} content="badge" {...pin}>
    {ids.map((id) => (
      <Badge key={id}>{id}</Badge>
    ))}
  </CellBody>
);

export const TABLE_COLUMNS: POColumnDef[] = [
  {
    key: "id", label: "ID", width: COLUMNS.id, dataType: "alphabetical", sortable: true,
    cell: (po, pin) => (
      <CellBody width={COLUMNS.id} {...pin}>
        {po.id}
      </CellBody>
    ),
  },
  // The supplier the order goes to — production `vendor_name` ("Purchasing
  // Vendor").
  {
    key: "vendor", label: "Purchasing vendor", width: COLUMNS.vendor, dataType: "alphabetical", sortable: true,
    cell: (po, pin) => (
      <CellBody width={COLUMNS.vendor} {...pin}>
        {vendorOf(po).name}
      </CellBody>
    ),
  },
  {
    key: "status", label: "Status", width: COLUMNS.status, dataType: "other", sortable: true,
    cell: (po, pin) => (
      <CellBody width={COLUMNS.status} content="badge" {...pin}>
        <BadgePOStatus status={po.status} />
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (po, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(po).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  // The line-item count — production's `item_count` annotation. RIGHT-aligned,
  // cells and header both: a number-only column (the money-column rule).
  {
    key: "items", label: "Items", width: COLUMNS.items, dataType: "numerical", sortable: true, align: "right",
    cell: (po, pin) => (
      <CellBody width={COLUMNS.items} content="number" {...pin}>
        {String(po.itemCount)}
      </CellBody>
    ),
  },
  // Production stores this as `subtotal` (the line items' rollup, a PO's only
  // money field) and heads it "Amount", like here.
  {
    key: "amount", label: "Amount", width: COLUMNS.amount, dataType: "numerical", sortable: true, align: "right",
    cell: (po, pin) => (
      <CellBody width={COLUMNS.amount} content="number" {...pin}>
        {formatCurrency(po.amount)}
      </CellBody>
    ),
  },
  // Est. arrival — production `estimated_arrival_time`. The cell reads red
  // while the order is IN TRANSIT and the date has passed (production's
  // `isDangerous`: state "In Transit" and the time before now) — a late
  // shipment; once delivered the old date is not a problem.
  {
    key: "estArrival", label: "Est. arrival", width: COLUMNS.estArrival, dataType: "timing", sortable: true,
    cell: (po, pin) => (
      <CellBody
        width={COLUMNS.estArrival}
        colorScheme={
          po.status === "inTransit" && po.estimatedArrivalAt != null && dayOffset(po.estimatedArrivalAt) < 0
            ? "error"
            : "default"
        }
        {...pin}
      >
        {formatDay(po.estimatedArrivalAt)}
      </CellBody>
    ),
  },
  // ONE shipping column under the one name — see the registry note. The
  // string is DERIVED from the carrier + method pair since the 2026-09-15
  // filter split (`shippingOf`, production's get_shipping_details shape);
  // empty = neither half set (the cell's own placeholder).
  {
    key: "shipping", label: "Shipping", width: COLUMNS.shipping, dataType: "alphabetical", sortable: false,
    cell: (po, pin) => (
      <CellBody width={COLUMNS.shipping} {...pin}>
        {shippingOf(po) ?? ""}
      </CellBody>
    ),
  },
  {
    key: "tracking", label: "Tracking number", width: COLUMNS.tracking, dataType: "alphabetical", sortable: false,
    cell: (po, pin) => (
      <CellBody width={COLUMNS.tracking} {...pin}>
        {po.trackingNumber ?? ""}
      </CellBody>
    ),
  },
  // The VENDOR's terms, read live (production
  // `PurchaseOrderListSerializer.get_payment_terms`) — "Same Day" / "Net 30"
  // through the same formatter the filter's options use; empty for a vendor
  // with none.
  {
    key: "paymentTerms", label: "Payment terms", width: COLUMNS.paymentTerms, dataType: "other", sortable: true,
    cell: (po, pin) => (
      <CellBody width={COLUMNS.paymentTerms} {...pin}>
        {formatPaymentTerms(paymentTermsOf(po))}
      </CellBody>
    ),
  },
  {
    key: "issued", label: "Issued", width: COLUMNS.issued, dataType: "timing", sortable: true,
    cell: (po, pin) => (
      <CellBody width={COLUMNS.issued} {...pin}>
        {formatDay(po.issuedAt)}
      </CellBody>
    ),
  },
  // The three Associated columns — deduplicated id badges, production's
  // serializer fields (the links live on the LINE ITEMS there; the demo
  // stores the union the columns show).
  {
    key: "associatedEstimates", label: "Associated estimates", width: COLUMNS.associatedEstimates, dataType: "other", sortable: false,
    cell: (po, pin) => associatedCell(COLUMNS.associatedEstimates, po.associatedEstimateIds, pin),
  },
  {
    key: "associatedJobs", label: "Associated jobs", width: COLUMNS.associatedJobs, dataType: "other", sortable: false,
    cell: (po, pin) => associatedCell(COLUMNS.associatedJobs, po.associatedJobIds, pin),
  },
  {
    key: "associatedInvoices", label: "Associated invoices", width: COLUMNS.associatedInvoices, dataType: "other", sortable: false,
    cell: (po, pin) => associatedCell(COLUMNS.associatedInvoices, po.associatedInvoiceIds, pin),
  },
  // One generic transition date instead of production's seven per-status
  // columns — see the registry note. Empty on Draft/Unsent (born pending,
  // the statusChangedAt rule).
  {
    key: "statusChanged", label: "Status changed", width: COLUMNS.statusChanged, dataType: "timing", sortable: false,
    cell: (po, pin) => (
      <CellBody width={COLUMNS.statusChanged} {...pin}>
        {formatDateTime(po.statusChangedAt)}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (po, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDateTime(po.lastModifiedAt)}
      </CellBody>
    ),
  },
  // Seen — the vendor opened the order: production's SeenCell, an eye and
  // the word "Seen", with the exact moment in the hover tooltip; never
  // opened = the cell's own "—" placeholder.
  {
    key: "seen", label: "Seen", width: COLUMNS.seen, dataType: "other", sortable: true,
    cell: (po, pin) =>
      po.lastViewedAt != null ? (
        <CellBody
          width={COLUMNS.seen}
          slotLeft={<Icon icon="eye" pack="regular" size={14} container="square" />}
          tooltip={`Last seen ${formatDateTime(po.lastViewedAt)}`}
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

// The shared View Menu module's column lists, derived from the registry
// above — the other tables' rule. The page wires the module itself; see
// `POsViewMenu` in POsPage.tsx.
export const VIEW_COLUMNS = viewMenuColumns(TABLE_COLUMNS);
export const VIEW_ATTRIBUTES = viewMenuAttributes(TABLE_COLUMNS);

// ---- the table -------------------------------------------------------------

interface POsTableProps {
  pos: PORow[];
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  onSortChange: (column: string) => void;
  /** MOBILE has no pin functionality — see the shared table. */
  mobile?: boolean;
}

// A STABLE reference, not an inline lambda: the shared table is memoised on
// its props, and a new function every render would defeat it.
const poKey = (po: PORow) => po.id;

// The shared `ListTable` over the registry — the seventh consumer of the one
// table module (listTable.tsx).
export const POsTable = ({ pos, columnsState, sort, onSortChange, mobile }: POsTableProps) => (
  <ListTable
    rows={pos}
    rowKey={poKey}
    columns={TABLE_COLUMNS}
    columnsState={columnsState}
    sort={sort}
    onSortChange={onSortChange}
    mobile={mobile}
  />
);
