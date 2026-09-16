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
  ClientRow,
  billingAddressOf,
  billsToDisplayOf,
  billingIntentionOf,
  billsToClientOf,
  creditBalanceOf,
  creditLimitOf,
  formatEstimateNet,
  labelsOf,
  locationsDisplayOf,
  outstandingBalanceOf,
  taxRateOf,
} from "./clientsData";

// The CLIENTS list's TABLE — the ninth list's registry over the shared
// `listTable` (added 2026-09-16, Daniel: "Build"). ONE registry for BOTH
// phases — nothing on this list is phase-only, the Vendors arrangement.
//
// ONE list drives the shared View Menu module's rows, the table's header
// cells and its body cells — the other tables' rule.

// ---- sorting ---------------------------------------------------------------

// Production's ordering_fields plus the added columns: Labels and Locations
// do not sort — production's UI disables Labels and never sorts the Location
// display. (Production's Type sort is a silent no-op there — the frontend
// sends a field the backend strips — but the INTENT is a sortable column, so
// here it works.)
export type SortColumn =
  | "name"
  | "clientType"
  | "industry"
  | "billsTo"
  | "billingAddress"
  | "paymentTerms"
  | "estimateExpiration"
  | "taxRate"
  | "creditLimit"
  | "outstandingBalance"
  | "availableCredit"
  | "createdAt"
  | "lastModified";

export type TableSort = SharedTableSort<SortColumn>;

// The production default: `name` ASCENDING — on BOTH phases (the two view
// configs there are identical), the Vendors arrangement again.
export const SORT_DEFAULT: TableSort = { column: "name", order: "ascending" };

const SORT_KEYS: Record<SortColumn, (client: ClientRow) => string | number | null> = {
  name: (client) => client.name,
  clientType: (client) => client.clientType,
  industry: (client) => client.industryType ?? null,
  // Production's ordering_map: the intention first, the billing client's
  // name second — one composite key here.
  billsTo: (client) => {
    const intention = billingIntentionOf(client);
    const rank = intention === "client" ? 0 : intention === "location" ? 1 : 2;
    return `${rank} ${billsToClientOf(client)?.name ?? ""}`;
  },
  billingAddress: (client) => billingAddressOf(client) || null,
  // 0 ("Same Day") is a real value and sorts first; only NO default falls to
  // the end with the other empties.
  paymentTerms: (client) => client.defaultInvoiceNet ?? null,
  estimateExpiration: (client) => client.defaultEstimateNet ?? null,
  taxRate: (client) => taxRateOf(client)?.name ?? null,
  creditLimit: (client) => creditLimitOf(client),
  outstandingBalance: (client) => outstandingBalanceOf(client),
  availableCredit: (client) => creditBalanceOf(client),
  createdAt: (client) => client.createdAt,
  lastModified: (client) => client.lastModifiedAt,
};

export function sortClients(clients: ClientRow[], sort: TableSort): ClientRow[] {
  const key = SORT_KEYS[sort.column];
  const direction = sort.order === "ascending" ? 1 : -1;
  return [...clients].sort((a, b) => {
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

// The base is production's clients view (defaultTableViewConfig
// clients_table__* + ClientTableView's column sizes: Client 224 pinned ·
// Type 112 pinned · Labels 240 · Location 288 · Bills To 224 · Terms 144 ·
// Credit Limit 144 · Last Modified 144) with the properties production
// leaves unlisted folded in — Industry, Billing address, the two other
// defaults, the money trio's other two, Created at — per Daniel's 2026-09-16
// rulings:
//
//   - "LOCATIONS" heads production's "Location" (Daniel: "I prefer
//     'Locations'"), and the cell is the production concept on his copy:
//     one site prints its address, several print "N locations", none
//     prints nothing;
//   - "DEFAULT PAYMENT TERMS" heads production's "Terms" — the column and
//     the filter share one name (the Est. duration rule); the written-out
//     header needs 224. Its two sibling defaults size the same way
//     (Default estimate expiration 256 — the longest header on any list —
//     and Default tax rate 176);
//   - the BILLS TO cell prints the filter's own words — "Same client" /
//     "Location" / the billing client's name — where production prints
//     "This Client" / a BLANK cell / the name (the blank-for-a-real-value
//     gap is the Bills-via lesson; Daniel's option copy wins);
//   - the three MONEY columns right-align, header included (the
//     money-column rule): Credit limit (production's own column, empty when
//     no limit is configured), Outstanding balance and Available invoice
//     credit (both render an EMPTY cell for zero — the legacy card prints
//     "--" for a zero credit balance; the filters still see the number).
//     FLAGGED: the Outstanding balance cell does NOT escalate when it
//     exceeds the Credit limit — production's deleted "Balance Due" column
//     painted exactly that red (`isAlerting`), and no node here draws it;
//     one comparison away if Daniel wants it back;
//   - CREATED AT joins Last modified at the end (Daniel: "Clients and
//     Vendors should have a 'Created at' column") — both date + time at 192,
//     the timestamp rule.
const COLUMNS = {
  name: 224,
  clientType: 112,
  industry: 144,
  labels: 240,
  locations: 288,
  billsTo: 224,
  billingAddress: 288,
  paymentTerms: 224,
  estimateExpiration: 256,
  taxRate: 176,
  creditLimit: 144,
  outstandingBalance: 192,
  availableCredit: 224,
  createdAt: 192,
  lastModified: 192,
};

type ClientColumnDef = TableColumnDef<ClientRow>;

export const TABLE_COLUMNS: ClientColumnDef[] = [
  {
    key: "name", label: "Client", width: COLUMNS.name, dataType: "alphabetical", sortable: true,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.name} {...pin}>
        {client.name}
      </CellBody>
    ),
  },
  // "Business" / "Individual" — production `client_type_label`, pinned with
  // the name there and here.
  {
    key: "clientType", label: "Type", width: COLUMNS.clientType, dataType: "other", sortable: true,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.clientType} {...pin}>
        {client.clientType}
      </CellBody>
    ),
  },
  // Optional in production — an empty cell is a client with no industry set.
  {
    key: "industry", label: "Industry", width: COLUMNS.industry, dataType: "alphabetical", sortable: true,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.industry} {...pin}>
        {client.industryType}
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(client).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  {
    key: "locations", label: "Locations", width: COLUMNS.locations, dataType: "alphabetical", sortable: false,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.locations} {...pin}>
        {locationsDisplayOf(client)}
      </CellBody>
    ),
  },
  {
    key: "billsTo", label: "Bills to", width: COLUMNS.billsTo, dataType: "alphabetical", sortable: true,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.billsTo} {...pin}>
        {billsToDisplayOf(client)}
      </CellBody>
    ),
  },
  // Production generates `billing_address_formatted` for clients too — see
  // billingAddressOf for the print rules (recipient first, the unit IN).
  {
    key: "billingAddress", label: "Billing address", width: COLUMNS.billingAddress, dataType: "alphabetical", sortable: true,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.billingAddress} {...pin}>
        {billingAddressOf(client)}
      </CellBody>
    ),
  },
  // "Same Day" / "Net 30" — the shared formatter, so the column and the
  // filter's options can never disagree. Empty = no default (the company's
  // applies).
  {
    key: "paymentTerms", label: "Default payment terms", width: COLUMNS.paymentTerms, dataType: "numerical", sortable: true,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.paymentTerms} {...pin}>
        {formatPaymentTerms(client.defaultInvoiceNet ?? null)}
      </CellBody>
    ),
  },
  {
    key: "estimateExpiration", label: "Default estimate expiration", width: COLUMNS.estimateExpiration, dataType: "numerical", sortable: true,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.estimateExpiration} {...pin}>
        {formatEstimateNet(client.defaultEstimateNet ?? null)}
      </CellBody>
    ),
  },
  {
    key: "taxRate", label: "Default tax rate", width: COLUMNS.taxRate, dataType: "alphabetical", sortable: true,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.taxRate} {...pin}>
        {taxRateOf(client)?.name}
      </CellBody>
    ),
  },
  // Production's own column: right-aligned currency, empty when no limit is
  // configured.
  {
    key: "creditLimit", label: "Credit limit", width: COLUMNS.creditLimit, dataType: "numerical", sortable: true, align: "right",
    cell: (client, pin) => (
      <CellBody width={COLUMNS.creditLimit} content="number" {...pin}>
        {creditLimitOf(client) == null ? null : formatCurrency(creditLimitOf(client)!)}
      </CellBody>
    ),
  },
  {
    key: "outstandingBalance", label: "Outstanding balance", width: COLUMNS.outstandingBalance, dataType: "numerical", sortable: true, align: "right",
    cell: (client, pin) => (
      <CellBody width={COLUMNS.outstandingBalance} content="number" {...pin}>
        {outstandingBalanceOf(client) === 0 ? null : formatCurrency(outstandingBalanceOf(client))}
      </CellBody>
    ),
  },
  {
    key: "availableCredit", label: "Available invoice credit", width: COLUMNS.availableCredit, dataType: "numerical", sortable: true, align: "right",
    cell: (client, pin) => (
      <CellBody width={COLUMNS.availableCredit} content="number" {...pin}>
        {creditBalanceOf(client) === 0 ? null : formatCurrency(creditBalanceOf(client))}
      </CellBody>
    ),
  },
  {
    key: "createdAt", label: "Created at", width: COLUMNS.createdAt, dataType: "timing", sortable: true,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.createdAt} {...pin}>
        {formatDateTime(client.createdAt)}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (client, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDateTime(client.lastModifiedAt)}
      </CellBody>
    ),
  },
];

// ---- what the View menu is fed ----------------------------------------------

export const VIEW_COLUMNS = viewMenuColumns(TABLE_COLUMNS);
export const VIEW_ATTRIBUTES = viewMenuAttributes(TABLE_COLUMNS);

// ---- the table -------------------------------------------------------------

interface ClientsTableProps {
  clients: ClientRow[];
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  onSortChange: (column: string) => void;
  /** MOBILE has no pin functionality — see the shared table. */
  mobile?: boolean;
}

// A STABLE reference, not an inline lambda: the shared table is memoised on
// its props, and a new function every render would defeat it.
const clientKey = (client: ClientRow) => client.id;

// The shared `ListTable` over the one registry — the ninth consumer of the
// one table module (listTable.tsx).
export const ClientsTable = ({ clients, columnsState, sort, onSortChange, mobile }: ClientsTableProps) => (
  <ListTable
    rows={clients}
    rowKey={clientKey}
    columns={TABLE_COLUMNS}
    columnsState={columnsState}
    sort={sort}
    onSortChange={onSortChange}
    mobile={mobile}
  />
);
