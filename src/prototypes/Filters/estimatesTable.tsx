import Badge from "../../components/Badge/Badge";
import BadgeEstimateStatus, {
  BadgeEstimateStatusStatus,
  STATUS as ESTIMATE_STATUS,
} from "../../components/Badge/BadgeEstimateStatus";
import { Icon } from "../../components/Icon/Icon";
import { CellBody } from "../../components/Table/CellBody/CellBody";
import { ViewMenuColumnsState } from "../../modules/ViewMenu/ViewMenu.types";

import { EstimatesPhase } from "./estimateFilters";
import {
  ListTable,
  TableColumnDef,
  TableSort as SharedTableSort,
  viewMenuAttributes,
  viewMenuColumns,
} from "./listTable";

import {
  downPaymentCell,
  EstimateRow,
  clientOf,
  displayStatus,
  formatCurrency,
  isExpired,
  labelsOf,
  locationOf,
} from "./estimatesData";
import { formatDateTime, formatDay, locationAddress } from "./listData";


// The ESTIMATES list's TABLE — the Jobs table's twin over the estimates
// registry, split out of the Estimates page on 2026-09-11 (the
// re-organisation), the way Daniel's Figma keeps a per-object page.
//
// ONE list (`TABLE_COLUMNS`) drives the shared View Menu module's rows, the
// table's header cells and its body cells — the Jobs table's rule.
//
// The branch a sort DEFAULTS to differs per phase, which is why `sortDefault`
// takes one; the page owns the branch.

// (The phase type lives in estimateFilters.tsx — `EstimatesPhase` — the way
// `JobsPhase` lives with the jobs registry. The sort default reads it.)

// ---- sorting ---------------------------------------------------------------

// The sortable columns are production's own (EstimateTableView's
// enableSorting flags): State, Labels and Status changed do not sort.
export type SortColumn =
  | "id"
  | "client"
  | "status"
  | "service"
  | "locationName"
  | "locationAddress"
  | "total"
  | "issued"
  | "expires"
  | "downPayment"
  | "lastModified"
  | "seen";

export type TableSort = SharedTableSort<SortColumn>;

// The production default: date_due — ASCENDING on the open views (soonest to
// expire first), DESCENDING on the closed ones (most recently due first).
export const sortDefault = (branch: EstimatesPhase): TableSort => ({
  column: "expires",
  order: branch === "open" ? "ascending" : "descending",
});

// STATUS sorts by the badge map's own order — the estimate's lifecycle — not
// the alphabet, the same rule the Jobs table's Status follows.
const STATUS_RANK = new Map(
  (Object.keys(ESTIMATE_STATUS) as BadgeEstimateStatusStatus[]).map((key, index) => [key, index]),
);

/** Down payment ascends from "Not required" through Unpaid and Partial to Paid. */
const DOWN_PAYMENT_RANK = { notRequired: 0, unpaid: 1, partiallyPaid: 2, paid: 3 } as const;

const SORT_KEYS: Record<SortColumn, (est: EstimateRow) => string | number | null> = {
  id: (est) => est.id,
  client: (est) => clientOf(est).name,
  status: (est) => STATUS_RANK.get(displayStatus(est)) ?? 0,
  service: (est) => est.serviceName,
  locationName: (est) => locationOf(est).name ?? null,
  locationAddress: (est) => locationAddress(locationOf(est)),
  total: (est) => est.total,
  issued: (est) => est.issuedAt,
  expires: (est) => est.dueAt,
  downPayment: (est) => DOWN_PAYMENT_RANK[est.downPayment],
  lastModified: (est) => est.lastModifiedAt,
  seen: (est) => est.lastViewedAt ?? null,
};

export function sortEstimates(estimates: EstimateRow[], sort: TableSort): EstimateRow[] {
  const key = SORT_KEYS[sort.column];
  const direction = sort.order === "ascending" ? 1 : -1;
  return [...estimates].sort((a, b) => {
    const keyA = key(a);
    const keyB = key(b);
    const emptyA = keyA == null || keyA === "";
    const emptyB = keyB == null || keyB === "";
    // Ties and empties fall back to the ID, so the order is stable — the Jobs
    // table's rule.
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
// cells — the Jobs page's rule. The order and the widths are the production
// "Estimates → All Open" view (defaultTableViewConfig +
// EstimateTableView's column sizes), with "Down payment" folded in where the
// closed views put it (after Expires). Production only shows it on Approved and
// the closed views; here it shows on EVERY view (Daniel, 2026-09-12 — the View
// menu is where a user drops a column they do not want), and the cell itself
// says how far the estimate has got (see `downPaymentCell`).
//
// The per-transition date columns production adds per closed view (Sent /
// Approved / Won / Lost / Cancelled dates) are left out — the generic "Status
// changed" carries that story in this prototype. FLAGGED. Production's "State"
// column is left out too, on purpose — see the note in the list below.
const COLUMNS = {
  id: 144,
  client: 224,
  // 192 = `--size-48`, up from production's 176 (`--size-44`), which could not
  // hold the widest badge: "Awaiting approval" measures 149px and the cell's
  // own 16px sides leave 144 (Daniel, 2026-09-12 — "it can not handle the
  // Awaiting approval status"). 192 leaves 160 inside, so the badge sits with
  // room to spare and no status on this list has to squeeze.
  status: 192,
  service: 224,
  locationName: 288,
  locationAddress: 288,
  labels: 240,
  total: 144,
  issued: 144,
  expires: 144,
  downPayment: 160,
  statusChanged: 160,
  lastModified: 144,
  seen: 96,
};

// `TableColumnDef<EstimateRow>` and `CellPinProps` are the shared table's
// (listTable.tsx).
type EstimateColumnDef = TableColumnDef<EstimateRow>;


// (The Down payment cell's icon, copy and colour scheme live in estimatesData —
// see `downPaymentCell`, read off node 14330-66931. Six cells: Not paid and
// Partially paid turn --text-error once the estimate is approved or closed.)

export const TABLE_COLUMNS: EstimateColumnDef[] = [
  {
    key: "id", label: "ID", width: COLUMNS.id, dataType: "alphabetical", sortable: true,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.id} {...pin}>
        {est.id}
      </CellBody>
    ),
  },
  {
    key: "client", label: "Client", width: COLUMNS.client, dataType: "alphabetical", sortable: true,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.client} {...pin}>
        {clientOf(est).name}
      </CellBody>
    ),
  },
  // State — the DB status ("Pending" / "Sent" / ...), a PLAIN Badge exactly
  // like production's BadgesCell. Not sortable there either. The db value is
  // production's own label, so it prints as-is.
  // (The STATE column — a plain Badge printing the DB status — is GONE since
  // 2026-09-11: Daniel, "this concept of state is redundant and we won't use it
  // anymore". The badge below is the only status the list shows now, and the
  // view tabs group BY it. The db still stores `status` / `isDraft` /
  // `conversionPath`, because that is production's own two-level model and it
  // is what derives the badge — see `displayStatus`. FLAGGED: say the word and
  // the db can collapse to one status too.)
  {
    key: "status", label: "Status", width: COLUMNS.status, dataType: "other", sortable: true,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.status} content="badge" {...pin}>
        <BadgeEstimateStatus status={displayStatus(est)} />
      </CellBody>
    ),
  },
  // The estimate's OWN service name (the db denormalizes it, production-like).
  {
    key: "service", label: "Service", width: COLUMNS.service, dataType: "alphabetical", sortable: true,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.service} {...pin}>
        {est.serviceName}
      </CellBody>
    ),
  },
  // Both location halves are OPTIONAL, the Jobs table's rule — an empty
  // string makes CellBody draw its own "—" placeholder.
  {
    key: "locationName", label: "Location name", width: COLUMNS.locationName, dataType: "alphabetical", sortable: true,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.locationName} {...pin}>
        {locationOf(est).name ?? ""}
      </CellBody>
    ),
  },
  {
    key: "locationAddress", label: "Location address", width: COLUMNS.locationAddress, dataType: "alphabetical", sortable: true,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.locationAddress} {...pin}>
        {locationAddress(locationOf(est))}
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(est).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  // Total — currency, so `content="number"`: right-aligned with tabular
  // numerals, the DS rule for currency columns.
  {
    key: "total", label: "Total", width: COLUMNS.total, dataType: "numerical", sortable: true,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.total} content="number" {...pin}>
        {formatCurrency(est.total)}
      </CellBody>
    ),
  },
  {
    key: "issued", label: "Issued", width: COLUMNS.issued, dataType: "timing", sortable: true,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.issued} {...pin}>
        {formatDay(est.issuedAt)}
      </CellBody>
    ),
  },
  // Expires — production's date_due; a PAST due date reads as an error
  // (production's is_expired flag colours the cell), whatever the state.
  {
    key: "expires", label: "Expires", width: COLUMNS.expires, dataType: "timing", sortable: true,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.expires} colorScheme={isExpired(est) ? "error" : "default"} {...pin}>
        {formatDay(est.dueAt)}
      </CellBody>
    ),
  },
  {
    key: "downPayment", label: "Down payment", width: COLUMNS.downPayment, dataType: "other", sortable: true,
    // NO local colour overrides (Daniel, 2026-09-12): "Not required" and an
    // unpaid deposit before approval take CellBody's `subtle` scheme as it is,
    // and the escalated cells take `error`. The cell used to re-point
    // --cell-text-color at --text-subtle to match the node exactly; that is
    // gone, and the DS token the scheme carries (--text-placeholder) is the
    // answer.
    cell: (est, pin) => {
      const state = downPaymentCell(est);
      return (
        <CellBody
          width={COLUMNS.downPayment}
          colorScheme={state.scheme}
          slotLeft={
            <Icon icon={state.icon} pack={state.pack} rotate={state.rotate} size={14} container="square" />
          }
          {...pin}
        >
          {state.label}
        </CellBody>
      );
    },
  },
  {
    key: "statusChanged", label: "Status changed", width: COLUMNS.statusChanged, dataType: "timing", sortable: false,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.statusChanged} {...pin}>
        {formatDay(est.statusChangedAt)}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDay(est.lastModifiedAt)}
      </CellBody>
    ),
  },
  // Seen — the client opened the estimate: production's SeenCell, an eye and
  // the word "Seen", with the exact moment in the hover tooltip; never opened
  // = the cell's own "—" placeholder.
  {
    key: "seen", label: "Seen", width: COLUMNS.seen, dataType: "other", sortable: true,
    cell: (est, pin) =>
      est.lastViewedAt != null ? (
        <CellBody
          width={COLUMNS.seen}
          slotLeft={<Icon icon="eye" pack="regular" size={14} container="square" />}
          tooltip={`Last seen ${formatDateTime(est.lastViewedAt)}`}
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
// above — the Jobs table's rule. The page wires the module itself; see
// `EstimatesViewMenu` in EstimatesPage.tsx.
export const VIEW_COLUMNS = viewMenuColumns(TABLE_COLUMNS);
export const VIEW_ATTRIBUTES = viewMenuAttributes(TABLE_COLUMNS);
// ---- the table -------------------------------------------------------------

interface EstimatesTableProps {
  estimates: EstimateRow[];
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  onSortChange: (column: string) => void;
  /** MOBILE has no pin functionality — see the shared table. */
  mobile?: boolean;
}

// A STABLE reference, not an inline lambda: the shared table is memoised on
// its props, and a new function every render would defeat it.
const estimateKey = (est: EstimateRow) => est.id;

// The shared `ListTable` over the registry above — the Jobs table's twin, and
// literally the same component since 2026-09-11 (see listTable.tsx).
export const EstimatesTable = ({ estimates, columnsState, sort, onSortChange, mobile }: EstimatesTableProps) => (
  <ListTable
    rows={estimates}
    rowKey={estimateKey}
    columns={TABLE_COLUMNS}
    columnsState={columnsState}
    sort={sort}
    onSortChange={onSortChange}
    mobile={mobile}
  />
);