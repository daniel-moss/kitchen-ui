import Badge from "../../components/Badge/Badge";
import { CellBody } from "../../components/Table/CellBody/CellBody";
import { ViewMenuColumnsState } from "../../modules/ViewMenu/ViewMenu.types";

import {
  ListTable,
  TableColumnDef,
  TableSort as SharedTableSort,
  viewMenuAttributes,
  viewMenuColumns,
} from "./listTable";

import { formatCurrency, formatDateTime, formatPaymentTerms } from "./listData";
import {
  VendorRow,
  billingAddressOf,
  billsViaOf,
  commitmentsOf,
  currentPOsOf,
  labelsOf,
  payablesOf,
} from "./vendorsData";

// The VENDORS list's TABLE — the eighth list's registry over the shared
// `listTable` (added 2026-09-15, Daniel: "Build"). ONE registry for BOTH
// phases — nothing on this list is phase-only, the POs arrangement.
//
// ONE list drives the shared View Menu module's rows, the table's header
// cells and its body cells — the other tables' rule.

// ---- sorting ---------------------------------------------------------------

// The sortable columns are production's own (VendorTableView's enableSorting
// flags): Labels and Website do not sort — production's UI disables both,
// even though its backend could sort the website string.
export type SortColumn =
  | "name"
  | "accountId"
  | "billingAddress"
  | "paymentTerms"
  | "billsVia"
  | "currentPOs"
  | "commitments"
  | "payables"
  | "createdAt"
  | "lastModified";

export type TableSort = SharedTableSort<SortColumn>;

// The production default: `name` ASCENDING — on BOTH phases (the two view
// configs there are identical), so unlike the document lists nothing flips
// on the inactive branch.
export const SORT_DEFAULT: TableSort = { column: "name", order: "ascending" };

const SORT_KEYS: Record<SortColumn, (vendor: VendorRow) => string | number | null> = {
  name: (vendor) => vendor.name,
  accountId: (vendor) => vendor.accountId ?? null,
  billingAddress: (vendor) => billingAddressOf(vendor) || null,
  // 0 ("Same Day") is a real value and sorts first; only NO terms falls to
  // the end with the other empties.
  paymentTerms: (vendor) => vendor.paymentTerms,
  billsVia: (vendor) => billsViaOf(vendor)?.name ?? null,
  currentPOs: (vendor) => currentPOsOf(vendor),
  commitments: (vendor) => commitmentsOf(vendor),
  payables: (vendor) => payablesOf(vendor),
  createdAt: (vendor) => vendor.createdAt,
  lastModified: (vendor) => vendor.lastModifiedAt,
};

export function sortVendors(vendors: VendorRow[], sort: TableSort): VendorRow[] {
  const key = SORT_KEYS[sort.column];
  const direction = sort.order === "ascending" ? 1 : -1;
  return [...vendors].sort((a, b) => {
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

// The base is production's vendors view (defaultTableViewConfig
// vendors_table__* + VendorTableView's column sizes) with the standing rules
// applied:
//
//   - "PAYMENT TERMS", not production's "Terms" — the column and the filter
//     share one name (the Est. duration rule), and the written-out header
//     needed 160 where production's short word sat at 144;
//   - "Bills via" sentence case where production writes "Bills Via" — the
//     other lists' header-casing rule;
//   - LAST MODIFIED prints date + time (production's own DateTimeCell on
//     this list) at 192 — the width every date+time column moved to when
//     the year joined the format (2026-09-15; 176 clipped the longest
//     strings, measured);
//   - the three NUMBER columns right-align, header included (the
//     money-column rule); Commitments and Payables render an EMPTY cell for
//     zero (production's `ignoreZero`) where Current POs prints its 0
//     (production's own split);
//   - WEBSITE is plain text — production draws a LinkCell (an anchor), and
//     nothing in this prototype's tables is interactive. FLAGGED.
//   - CREATED AT (2026-09-16, Daniel: "Clients and Vendors should have a
//     'Created at' column") is a prototype ADDITION — production's vendors
//     table has no created column at all. Date + time at 192 (the timestamp
//     rule), right before Last modified so the two record dates sit
//     together; pairs with the Created at filter added the same day.
//
// Production gates Current POs + Commitments behind the purchase-orders
// entitlement and Payables behind the bills one; the demo company has both,
// so nothing is gated here.
const COLUMNS = {
  name: 224,
  accountId: 128,
  billingAddress: 288,
  labels: 240,
  paymentTerms: 160,
  billsVia: 224,
  currentPOs: 144,
  commitments: 160,
  payables: 160,
  website: 224,
  createdAt: 192,
  lastModified: 192,
};

type VendorColumnDef = TableColumnDef<VendorRow>;

export const TABLE_COLUMNS: VendorColumnDef[] = [
  {
    key: "name", label: "Vendor", width: COLUMNS.name, dataType: "alphabetical", sortable: true,
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.name} {...pin}>
        {vendor.name}
      </CellBody>
    ),
  },
  // The company's account number WITH the vendor — production `account_id`.
  {
    key: "accountId", label: "Account ID", width: COLUMNS.accountId, dataType: "alphabetical", sortable: true,
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.accountId} {...pin}>
        {vendor.accountId}
      </CellBody>
    ),
  },
  // Production's generated `billing_address_formatted` — see billingAddressOf
  // for the print rules (the unit stays IN, unlike the location columns).
  {
    key: "billingAddress", label: "Billing address", width: COLUMNS.billingAddress, dataType: "alphabetical", sortable: true,
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.billingAddress} {...pin}>
        {billingAddressOf(vendor)}
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(vendor).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  // "Same Day" / "Net 30" — the shared formatter, so the column and the
  // filter's options can never disagree. Empty = no terms.
  {
    key: "paymentTerms", label: "Payment terms", width: COLUMNS.paymentTerms, dataType: "other", sortable: true,
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.paymentTerms} {...pin}>
        {formatPaymentTerms(vendor.paymentTerms)}
      </CellBody>
    ),
  },
  // Production `default_billing_vendor_name` — the vendor the bills arrive
  // from. EMPTY = bills come from the vendor itself (production's cell is
  // blank too; the FILTER's "Same vendor" row is where the concept gets
  // words — FLAGGED: the cell could print "Same as vendor" instead, the
  // legacy detail card's copy).
  {
    key: "billsVia", label: "Bills via", width: COLUMNS.billsVia, dataType: "alphabetical", sortable: true,
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.billsVia} {...pin}>
        {billsViaOf(vendor)?.name}
      </CellBody>
    ),
  },
  // The count PRINTS its zero (production type="number", no ignoreZero) —
  // "no orders" is an answer, where an empty money cell means "nothing owed".
  {
    key: "currentPOs", label: "Current POs", width: COLUMNS.currentPOs, dataType: "numerical", sortable: true, align: "right",
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.currentPOs} content="number" {...pin}>
        {/* A STRING, not the raw number — the cell styles (and sets the
            tabular typography token on) string children only, the other
            count columns' gotcha (Daniel caught it here 2026-09-15). */}
        {String(currentPOsOf(vendor))}
      </CellBody>
    ),
  },
  {
    key: "commitments", label: "Commitments", width: COLUMNS.commitments, dataType: "numerical", sortable: true, align: "right",
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.commitments} content="number" {...pin}>
        {commitmentsOf(vendor) === 0 ? null : formatCurrency(commitmentsOf(vendor))}
      </CellBody>
    ),
  },
  {
    key: "payables", label: "Payables", width: COLUMNS.payables, dataType: "numerical", sortable: true, align: "right",
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.payables} content="number" {...pin}>
        {payablesOf(vendor) === 0 ? null : formatCurrency(payablesOf(vendor))}
      </CellBody>
    ),
  },
  // Plain text where production draws a LinkCell — see the registry note.
  {
    key: "website", label: "Website", width: COLUMNS.website, dataType: "alphabetical", sortable: false,
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.website} {...pin}>
        {vendor.website}
      </CellBody>
    ),
  },
  {
    key: "createdAt", label: "Created at", width: COLUMNS.createdAt, dataType: "timing", sortable: true,
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.createdAt} {...pin}>
        {formatDateTime(vendor.createdAt)}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (vendor, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDateTime(vendor.lastModifiedAt)}
      </CellBody>
    ),
  },
];

// ---- what the View menu is fed ----------------------------------------------

export const VIEW_COLUMNS = viewMenuColumns(TABLE_COLUMNS);
export const VIEW_ATTRIBUTES = viewMenuAttributes(TABLE_COLUMNS);

// ---- the table -------------------------------------------------------------

interface VendorsTableProps {
  vendors: VendorRow[];
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  onSortChange: (column: string) => void;
  /** MOBILE has no pin functionality — see the shared table. */
  mobile?: boolean;
}

// A STABLE reference, not an inline lambda: the shared table is memoised on
// its props, and a new function every render would defeat it.
const vendorKey = (vendor: VendorRow) => vendor.id;

// The shared `ListTable` over the one registry — the eighth consumer of the
// one table module (listTable.tsx).
export const VendorsTable = ({ vendors, columnsState, sort, onSortChange, mobile }: VendorsTableProps) => (
  <ListTable
    rows={vendors}
    rowKey={vendorKey}
    columns={TABLE_COLUMNS}
    columnsState={columnsState}
    sort={sort}
    onSortChange={onSortChange}
    mobile={mobile}
  />
);
