import { Fragment, ReactNode, memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import Badge from "../../components/Badge/Badge";
import BadgeEstimateStatus, { STATUS as ESTIMATE_STATUS, BadgeEstimateStatusStatus } from "../../components/Badge/BadgeEstimateStatus";
import EmptyState from "../../components/EmptyState/EmptyState";
import { Icon } from "../../components/Icon/Icon";
import { CellBody } from "../../components/Table/CellBody/CellBody";
import { CellHeader } from "../../components/Table/CellHeader/CellHeader";
import { CellDataType, CellSortOrder } from "../../components/Table/CellHeader/CellHeader.types";
import { Table } from "../../components/Table/Table/Table";
import { TableRow } from "../../components/Table/TableRow/TableRow";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import TopBarNav from "../../components/TopBarNav/TopBarNav";
import TopBarNavLeftElements from "../../components/TopBarNav/TopBarNavLeftElements";
import TopBarNavTitle from "../../components/TopBarNav/TopBarNavTitle";
import TopBarView from "../../components/TopBarView/TopBarView";
import ViewMenuModule from "../../modules/ViewMenu/ViewMenu";
import {
  ViewMenuAttribute,
  ViewMenuColumn,
  ViewMenuColumnType,
  ViewMenuColumnsState,
  ViewMenuView,
} from "../../modules/ViewMenu/ViewMenu.types";
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import { semanticIcons } from "../../styles/semanticIcons";
import { noop } from "../../stories/helpers";

import { AppBottomBar, Page, useAnchoredCard, useSingleAxisScroll } from "./appShell";
import { buildEstimateFilters } from "./estimateFilterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard } from "./Filters";
import { FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import {
  DOWN_PAYMENT,
  ESTIMATES,
  EstimateRow,
  EstimateState,
  clientOf,
  displayStatus,
  estimateStatusLabel,
  formatCurrency,
  isExpired,
  labelsOf,
  locationOf,
} from "./estimatesData";
import { formatDateTime, formatDay, locationAddress } from "./jobsData";

import styles from "./Filters.module.scss";

// The ESTIMATES list page — added 2026-09-11 (Daniel: "add the Estimates list
// to the Filters prototype. No filters yet. Just the list with View
// settings"). The same shell as the Jobs page — the DS SidebarNav / TopBarNav
// / TopBarView / Table over the shared app-shell chrome — with the Estimates
// content read off production (roopairs_api EstimateTableView +
// defaultTableViewConfig's estimates_table__* views):
//
//   BRANCH tabs   Open · Closed — production's phases.
//   VIEW tabs     Open: All / Pending / Sent / Approved; Closed: All / Won /
//                 Lost / Cancelled — production's TableViewTabs, verbatim.
//                 Each view filters by the estimate's STATE (the DB status).
//                 When the filter system arrives here, these become locked
//                 Status filters exactly like the Jobs page's.
//   Table         the production All-Open column set (widths and order), with
//                 Down payment folded in from the closed views — see
//                 TABLE_COLUMNS.
//   View menu     the shared module, fully functional: columns show / hide /
//                 pin / reorder, Sort by, Table / Cards switcher. NO Schedule
//                 horizon row and NO Timeline view (Daniel, 2026-09-11:
//                 estimates have neither — the module's jobs-only props are
//                 simply not passed).
//
//   Filters      SEVEN of them since 2026-09-11 (Daniel: "Address, Location,
//                 Last modified, Status changed, Client, Labels and Service.
//                 Those are exactly the same as for the Jobs") — and they are
//                 literally the jobs filters: the registry is derived from the
//                 jobs one (see estimateFilterDefs) and the menu, the option
//                 lists, the chips and the filter bar are the same components
//                 the Jobs page renders, exported from Filters.tsx.
//
// Still missing next to the Jobs page, and flagged: the view tabs are not
// LOCKED Status filters yet (they filter by state directly), and there is no
// Hidden Data Bar under a partly filtered table.

// The filters this page offers — the seven the Jobs list has that an estimate
// can answer, derived from the jobs registry so they cannot drift (see
// estimateFilterDefs). One registry for the whole page: unlike jobs, estimates
// have no open/closed split in their filters, because the only filter that
// differed between the jobs branches was Status, which is not one of these.
const FILTERS = buildEstimateFilters();

// ---- the view bar's tabs ---------------------------------------------------

interface EstimateViewTab {
  id: string;
  label: string;
  /** The states this view lists. Empty = the whole branch ("All"). */
  states: EstimateState[];
}

interface EstimateBranch {
  id: EstimatesBranchId;
  label: string;
  tabs: EstimateViewTab[];
}

const BRANCHES: EstimateBranch[] = [
  {
    id: "open",
    label: "Open",
    tabs: [
      { id: "all", label: "All", states: [] },
      { id: "pending", label: "Pending", states: ["Pending"] },
      { id: "sent", label: "Sent", states: ["Sent"] },
      { id: "approved", label: "Approved", states: ["Approved"] },
    ],
  },
  {
    id: "closed",
    label: "Closed",
    tabs: [
      { id: "closedAll", label: "All", states: [] },
      { id: "won", label: "Won", states: ["Won"] },
      { id: "lost", label: "Lost", states: ["Lost"] },
      { id: "cancelled", label: "Cancelled", states: ["Cancelled"] },
    ],
  },
];
type EstimatesBranchId = "open" | "closed";

const branchById = (id: EstimatesBranchId) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

const tabById = (branch: EstimatesBranchId, id: string) => {
  const tabs = branchById(branch).tabs;
  return tabs.find((t) => t.id === id) ?? tabs[0]!;
};

/** The phase's whole state set — what the branch's "All" view lists. */
const branchStates = (branch: EstimatesBranchId) => branchById(branch).tabs.flatMap((t) => t.states);

const branchViews = (branch: EstimatesBranchId) =>
  branchById(branch).tabs.map((item) => ({ value: item.id, label: item.label }));

// ---- the list top bar ------------------------------------------------------

// The Jobs page's TopBar, for estimates: the DS TopBarNav `list` variant with
// the [Open · Closed] branch tabs in its `tabs` slot. The title is plain —
// Estimates has no sub-pages (the sidebar holds it as a single item, where
// Jobs is a stack).
const EstimatesTopBar = ({
  mobile = false,
  branch,
  onBranchChange,
}: {
  mobile?: boolean;
  branch: EstimatesBranchId;
  onBranchChange: (next: EstimatesBranchId) => void;
}) => (
  <TopBarNav
    className={styles.topBar}
    variant="list"
    breakpoint={mobile ? "mobile" : "desktop"}
    onSearch={mobile ? undefined : noop}
    onCreate={noop}
    tabs={
      <TabGroup
        variant="default"
        value={branch}
        onChange={(next) => onBranchChange(next as EstimatesBranchId)}
        aria-label="Open or closed estimates"
      >
        {BRANCHES.map((entry) => (
          <TabItem key={entry.id} value={entry.id}>
            {entry.label}
          </TabItem>
        ))}
      </TabGroup>
    }
  >
    <TopBarNavLeftElements>
      <TopBarNavTitle title="Estimates" />
    </TopBarNavLeftElements>
  </TopBarNav>
);

// ---- sorting ---------------------------------------------------------------

// The sortable columns are production's own (EstimateTableView's
// enableSorting flags): State, Labels and Status changed do not sort.
type SortColumn =
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

interface TableSort {
  column: SortColumn;
  order: CellSortOrder;
}

// The production default: date_due — ASCENDING on the open views (soonest to
// expire first), DESCENDING on the closed ones (most recently due first).
const sortDefault = (branch: EstimatesBranchId): TableSort => ({
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

function sortEstimates(estimates: EstimateRow[], sort: TableSort): EstimateRow[] {
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
// closed views put it (after Expires) — production only shows it on Approved
// and the closed views, so it starts HIDDEN here (see defaultViewSettings)
// and the View menu can switch it on.
//
// The per-transition date columns production adds per closed view (Sent /
// Approved / Won / Lost / Cancelled dates) are left out — the generic "Status
// changed" carries that story in this prototype. FLAGGED.
const COLUMNS = {
  id: 144,
  client: 224,
  state: 128,
  status: 176,
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

interface TableColumnDef {
  key: string;
  label: string;
  width: number;
  dataType: CellDataType;
  sortable: boolean;
  cell: (est: EstimateRow, pin: CellPinProps) => ReactNode;
}

interface CellPinProps {
  isPinned?: boolean;
  pinnedOffset?: number;
  isLastPinned?: boolean;
}

// The Down payment cell's colour, production's DownPaymentCell scss mapped
// onto CellBody's schemes: paid → success, partially paid → warning, unpaid →
// error. Production dims "Not Required" to --text-placeholder; CellBody has
// no placeholder scheme, so `subtle` stands in — FLAGGED.
const DOWN_PAYMENT_SCHEME = {
  notRequired: "subtle",
  unpaid: "error",
  partiallyPaid: "warning",
  paid: "success",
} as const;

const TABLE_COLUMNS: TableColumnDef[] = [
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
  {
    key: "state", label: "State", width: COLUMNS.state, dataType: "other", sortable: false,
    cell: (est, pin) => (
      <CellBody width={COLUMNS.state} content="badge" {...pin}>
        <Badge>{est.status}</Badge>
      </CellBody>
    ),
  },
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
    cell: (est, pin) => (
      <CellBody
        width={COLUMNS.downPayment}
        colorScheme={DOWN_PAYMENT_SCHEME[est.downPayment]}
        slotLeft={<Icon icon={DOWN_PAYMENT[est.downPayment].icon} pack="regular" size={14} container="square" />}
        {...pin}
      >
        {DOWN_PAYMENT[est.downPayment].label}
      </CellBody>
    ),
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

const COLUMN_BY_KEY = new Map(TABLE_COLUMNS.map((def) => [def.key, def]));

// ---- the View menu (the shared module) --------------------------------------

// The shared View Menu module, wired exactly like the Jobs page's — Columns,
// Sort by and the view switcher all work — MINUS the two jobs-only pieces
// (Daniel, 2026-09-11): no `scheduled` prop, so there is no Schedule horizon
// row, and no `timeline` prop, so the switcher offers Table / Cards alone.
// Cards is DISABLED like on the Jobs page — the view is not designed here, so
// switching to it would change nothing.

/** The header's sort-icon pairs, mapped onto the menu's column types. */
const MENU_TYPE: Record<CellDataType, ViewMenuColumnType> = {
  alphabetical: "text",
  numerical: "number",
  timing: "date",
  other: "generic",
};

const VIEW_COLUMNS: ViewMenuColumn[] = TABLE_COLUMNS.map((def) => ({
  key: def.key,
  label: def.label,
  type: MENU_TYPE[def.dataType],
  sortable: def.sortable,
}));

// FLAGGED, same as the Jobs page: the Cards attributes are the table's own
// columns — my mapping, no node names one; unreachable while Cards is off.
const VIEW_ATTRIBUTES: ViewMenuAttribute[] = TABLE_COLUMNS.filter((def) => def.key !== "id").map((def) => ({
  key: def.key,
  label: def.label,
}));

/** Everything the View menu edits, kept PER VIEW like on the Jobs page. */
interface ViewSettings {
  view: ViewMenuView;
  columns: ViewMenuColumnsState;
  activeAttributes: string[];
}

const defaultViewSettings = (): ViewSettings => ({
  view: "table",
  // The production default: ID and Client pinned; Down payment starts HIDDEN
  // (the open views' default omits it — see the registry note), so the View
  // menu shows it unchecked, ready to switch on.
  columns: {
    pinned: ["id", "client"],
    unpinned: TABLE_COLUMNS.map((def) => def.key).filter((key) => key !== "id" && key !== "client"),
    hidden: ["downPayment"],
  },
  activeAttributes: ["status", "client", "total"],
});

/** One shared default, so an untouched view keeps a stable reference. */
const DEFAULT_VIEW_SETTINGS = defaultViewSettings();

interface EstimatesViewMenuProps {
  open: boolean;
  onClose: () => void;
  breakpoint: "desktop" | "mobile";
  settings: ViewSettings;
  onSettingsChange: (next: ViewSettings) => void;
  /** The same per-view sort the header cells edit — one state, two editors. */
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
}

const EstimatesViewMenu = ({ open, onClose, breakpoint, settings, onSettingsChange, sort, onSortChange }: EstimatesViewMenuProps) => (
  <ViewMenuModule
    open={open}
    onClose={onClose}
    breakpoint={breakpoint}
    columns={VIEW_COLUMNS}
    columnsState={settings.columns}
    onColumnsStateChange={(columns) => onSettingsChange({ ...settings, columns })}
    sort={{ key: sort.column, ascending: sort.order === "ascending" }}
    onSortChange={(next) =>
      onSortChange({ column: next.key as SortColumn, order: next.ascending ? "ascending" : "descending" })
    }
    view={settings.view}
    onViewChange={(view) => onSettingsChange({ ...settings, view })}
    disabledViews={["cards"]}
    attributes={VIEW_ATTRIBUTES}
    activeAttributes={settings.activeAttributes}
    onActiveAttributesChange={(activeAttributes) => onSettingsChange({ ...settings, activeAttributes })}
  />
);

// ---- the table -------------------------------------------------------------

interface EstimatesTableProps {
  estimates: EstimateRow[];
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  onSortChange: (column: SortColumn) => void;
  /** MOBILE has no pin functionality — the Jobs table's rule. */
  mobile?: boolean;
}

// The Jobs table's twin: the same DS Table / CellHeader / CellBody assembly,
// the same pinned-region maths, over the estimates registry. (`.jobsTable` in
// the scss is the shared table sizing — both pages' tables use it.)
// MEMOISED for the same reason as the Jobs table — see the note there: without
// it the 62 rows rebuilt on every keystroke in the view bar's search, even
// though the filtering is deferred and `estimates` had not changed.
const EstimatesTable = memo(function EstimatesTable({
  estimates,
  columnsState,
  sort,
  onSortChange,
  mobile = false,
}: EstimatesTableProps) {
  const sortable = (column: string) => ({
    isSortable: true,
    sortOrder: sort.column === column ? sort.order : undefined,
    onClick: () => onSortChange(column as SortColumn),
  });

  const visibleDefs = (keys: string[]) =>
    keys.filter((key) => !columnsState.hidden.includes(key)).flatMap((key) => COLUMN_BY_KEY.get(key) ?? []);
  const pinnedDefs = visibleDefs(columnsState.pinned);
  const unpinnedDefs = visibleDefs(columnsState.unpinned);
  const ordered = [...pinnedDefs, ...unpinnedDefs];

  const pinPropsByKey = new Map<string, CellPinProps>();
  if (!mobile) {
    let pinnedOffset = 0;
    for (const [index, def] of pinnedDefs.entries()) {
      pinPropsByKey.set(def.key, {
        isPinned: true,
        pinnedOffset,
        isLastPinned: index === pinnedDefs.length - 1,
      });
      pinnedOffset += def.width;
    }
  }
  const pinProps = (key: string): CellPinProps => pinPropsByKey.get(key) ?? {};

  return (
    <Table
      className={styles.jobsTable}
      header={
        <TableRow variant="header">
          {ordered.map((def) => (
            <CellHeader
              key={def.key}
              label={def.label}
              width={def.width}
              dataType={def.dataType}
              {...pinProps(def.key)}
              {...(def.sortable ? sortable(def.key) : {})}
            />
          ))}
        </TableRow>
      }
    >
      {estimates.map((est) => (
        <TableRow key={est.id} isClickable onClick={noop}>
          {ordered.map((def) => (
            <Fragment key={def.key}>{def.cell(est, pinProps(def.key))}</Fragment>
          ))}
        </TableRow>
      ))}
    </Table>
  );
});

// ---- the view bar ----------------------------------------------------------

interface ViewBarProps {
  branch: EstimatesBranchId;
  tab: string;
  onTabChange: (next: string) => void;
  viewSettings: ViewSettings;
  onViewSettingsChange: (next: ViewSettings) => void;
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
  search: string;
  onSearchChange: (next: string) => void;
  /** The filters the user has applied to THIS view. */
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
}

// DESKTOP: the View button opens the shared module in an anchored card, and
// Filters opens the shared menu — the Jobs page's wiring, the same components.
function DesktopViewBar({
  branch,
  tab,
  onTabChange,
  viewSettings,
  onViewSettingsChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  selection,
  onSelectionChange,
}: ViewBarProps) {
  // The module's dropdown lists live in [data-floating-list] body portals;
  // the ignore selector keeps a click inside them from closing the card.
  const viewCard = useAnchoredCard("right", "[data-floating-list]");
  // The Filters menu, anchored under the bar's own Filters button — the Jobs
  // page's card, with this page's registry in it.
  const filtersCard = useAnchoredCard("right", "[data-concept-filters-sub]");
  return (
    <>
      <TopBarView
        className={styles.viewBar}
        breakpoint="desktop"
        views={branchViews(branch)}
        view={tab}
        onViewChange={onTabChange}
        search={search}
        onSearchChange={onSearchChange}
        onFiltersClick={(e) => {
          filtersCard.anchorRef.current = e.currentTarget as unknown as HTMLDivElement;
          filtersCard.setOpen(!filtersCard.open);
        }}
        filtersPressed={filtersCard.open}
        onViewMenuClick={(e) => {
          viewCard.anchorRef.current = e.currentTarget as unknown as HTMLDivElement;
          viewCard.setOpen(!viewCard.open);
        }}
        viewMenuPressed={viewCard.open}
      />
      <FiltersMenuCard
        card={filtersCard}
        defs={FILTERS}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      {viewCard.pos != null &&
        createPortal(
          <div ref={viewCard.cardRef} className={styles.filtersSub} style={viewCard.pos}>
            <EstimatesViewMenu
              open={viewCard.open}
              onClose={() => viewCard.setOpen(false)}
              breakpoint="desktop"
              settings={viewSettings}
              onSettingsChange={onViewSettingsChange}
              sort={sort}
              onSortChange={onSortChange}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

// MOBILE: the View menu arrives as the module's own drawer.
function MobileViewBar({
  branch,
  tab,
  onTabChange,
  viewSettings,
  onViewSettingsChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  selection,
  onSelectionChange,
}: ViewBarProps) {
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <>
      <TopBarView
        className={styles.viewBar}
        breakpoint="mobile"
        views={branchViews(branch)}
        view={tab}
        onViewChange={onTabChange}
        search={search}
        onSearchChange={onSearchChange}
        // The phone has no filter bar, so the button carries the count — the
        // Jobs page's rule. Estimates lock no Status filter, so it counts only
        // what the user applied.
        filtersCount={activeFilterCount(selection)}
        onFiltersClick={() => setFiltersOpen(true)}
        filtersPressed={filtersOpen}
        onViewMenuClick={() => setViewMenuOpen(true)}
        viewMenuPressed={viewMenuOpen}
      />
      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        defs={FILTERS}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      <EstimatesViewMenu
        open={viewMenuOpen}
        onClose={() => setViewMenuOpen(false)}
        breakpoint="mobile"
        settings={viewSettings}
        onSettingsChange={onViewSettingsChange}
        sort={sort}
        onSortChange={onSortChange}
      />
    </>
  );
}

// ---- the table's empty states ----------------------------------------------

// NO OBJECTS EXIST — the Jobs page's node template ("No Objects Exist",
// 14192-55585) with the [objects] placeholders filled for estimates: the
// sidebar's object icon, "No estimates", "There are no estimates here yet",
// "Create estimate" with the regular plus. Create goes nowhere — no create
// flow in this prototype, the standing rule.
const NoEstimatesYet = () => (
  <div className={styles.noResults}>
    <EmptyState
      className={styles.tableEmptyState}
      icon={semanticIcons.estimate}
      title="No estimates"
      caption="There are no estimates here yet"
      primaryAction={{ label: "Create estimate", leftIcon: "plus", onClick: noop }}
    />
  </div>
);

// NO MATCH — the view has estimates, but the applied filters hide all of them.
// Without this the page would claim "There are no estimates here yet", which is
// not what happened. It follows the Jobs page's No Match state (nodes
// 14118-59272 and its siblings): the regular `bars-filter` icon, a title naming
// the filters, the hidden count with the number strong, and a subtle button
// that clears them.
//
// FLAGGED: the Jobs page also shows a Hidden Data Bar under a PARTIALLY
// filtered table ("N jobs hidden by filters"). Estimates do not have one yet —
// say the word and it is the same component.
const NoMatchingEstimates = ({ hidden, onClearFilters }: { hidden: number; onClearFilters: () => void }) => (
  <div className={styles.noResults}>
    <EmptyState
      className={styles.tableEmptyState}
      icon="bars-filter"
      title="No estimates matching the filters"
      caption={
        <>
          <strong>
            {hidden} {hidden === 1 ? "estimate" : "estimates"}
          </strong>{" "}
          hidden by filters
        </>
      }
      primaryAction={{ label: "Clear filters", onClick: onClearFilters }}
    />
  </div>
);

// NO SEARCH RESULTS — with no filters and no schedule horizon on this page,
// only the simple half of the Jobs page's Search section exists: nothing in
// the view matches, one subtle "Clear search". The layered "matching but
// hidden" states arrive with the filters.
const NoSearchResults = ({ onClearSearch }: { onClearSearch: () => void }) => (
  <div className={styles.noResults}>
    <EmptyState
      className={styles.tableEmptyState}
      icon="search"
      title="No estimates matching the search"
      caption="No estimates exist that match the search"
      primaryAction={{ label: "Clear search", onClick: onClearSearch }}
    />
  </div>
);

// ---- layouts ---------------------------------------------------------------

interface ShellProps {
  estimates: EstimateRow[];
  searchEmptied: boolean;
  search: string;
  onSearchChange: (next: string) => void;
  branch: EstimatesBranchId;
  onBranchChange: (next: EstimatesBranchId) => void;
  tab: string;
  onTabChange: (next: string) => void;
  sort: TableSort;
  onSortChange: (column: SortColumn) => void;
  onSortSet: (next: TableSort) => void;
  viewSettings: ViewSettings;
  onViewSettingsChange: (next: ViewSettings) => void;
  /** The filters applied to the current view, and how many rows they hide. */
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  hiddenByFilters: number;
  onNavigate: (next: Page) => void;
}

const DesktopShell = ({
  estimates,
  searchEmptied,
  search,
  onSearchChange,
  branch,
  onBranchChange,
  tab,
  onTabChange,
  sort,
  onSortChange,
  onSortSet,
  viewSettings,
  onViewSettingsChange,
  selection,
  onSelectionChange,
  hiddenByFilters,
}: ShellProps) => (
  // The WORK AREA only — `Filters` renders the sidebar once, outside the page
  // switch, so it survives a move between pages and its stack can animate shut.
  <>
    <div className={styles.workArea}>
      <EstimatesTopBar branch={branch} onBranchChange={onBranchChange} />
      <DesktopViewBar
        branch={branch}
        tab={tab}
        onTabChange={onTabChange}
        viewSettings={viewSettings}
        onViewSettingsChange={onViewSettingsChange}
        sort={sort}
        onSortChange={onSortSet}
        search={search}
        onSearchChange={onSearchChange}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      {/* Only rendered while something is applied — the component's own rule.
          Estimates lock no Status filter, so it has no fixed first chip. */}
      <FilterBar defs={FILTERS} selection={selection} onSelectionChange={onSelectionChange} />
      <div className={styles.mainArea}>
        {estimates.length > 0 ? (
          <EstimatesTable
            estimates={estimates}
            columnsState={viewSettings.columns}
            sort={sort}
            onSortChange={onSortChange}
          />
        ) : searchEmptied ? (
          <NoSearchResults onClearSearch={() => onSearchChange("")} />
        ) : hiddenByFilters > 0 ? (
          <NoMatchingEstimates hidden={hiddenByFilters} onClearFilters={() => onSelectionChange([])} />
        ) : (
          <NoEstimatesYet />
        )}
      </div>
    </div>
  </>
);

const MobileShell = ({
  estimates,
  searchEmptied,
  search,
  onSearchChange,
  branch,
  onBranchChange,
  tab,
  onTabChange,
  sort,
  onSortChange,
  onSortSet,
  viewSettings,
  onViewSettingsChange,
  selection,
  onSelectionChange,
  hiddenByFilters,
  onNavigate,
}: ShellProps) => {
  // A drag scrolls the table one way at a time — the shared hook.
  const tableRef = useSingleAxisScroll(true);
  return (
    <div className={styles.mobile}>
      <EstimatesTopBar mobile branch={branch} onBranchChange={onBranchChange} />
      <MobileViewBar
        branch={branch}
        tab={tab}
        onTabChange={onTabChange}
        viewSettings={viewSettings}
        onViewSettingsChange={onViewSettingsChange}
        sort={sort}
        onSortChange={onSortSet}
        search={search}
        onSearchChange={onSearchChange}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      <div className={styles.mainArea} ref={tableRef}>
        {estimates.length > 0 ? (
          <EstimatesTable
            estimates={estimates}
            columnsState={viewSettings.columns}
            sort={sort}
            onSortChange={onSortChange}
            mobile
          />
        ) : searchEmptied ? (
          <NoSearchResults onClearSearch={() => onSearchChange("")} />
        ) : hiddenByFilters > 0 ? (
          <NoMatchingEstimates hidden={hiddenByFilters} onClearFilters={() => onSelectionChange([])} />
        ) : (
          <NoEstimatesYet />
        )}
      </div>
      <AppBottomBar page="estimates" onNavigate={onNavigate} />
    </div>
  );
};

/** One shared empty list, so an untouched view keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

// ---- the page --------------------------------------------------------------

// What the view bar's keyword search MATCHES: the row's readable text — id,
// client, service, location (name + address), and the two status labels — as
// a case-insensitive substring. The Jobs page's field-set rule, FLAGGED the
// same way: my choice, no node names one.
const searchHaystack = (est: EstimateRow) => {
  const location = locationOf(est);
  return [
    est.id,
    clientOf(est).name,
    est.serviceName,
    location.name ?? "",
    locationAddress(location),
    est.status,
    estimateStatusLabel(displayStatus(est)),
  ]
    .join(" ")
    .toLowerCase();
};

export interface EstimatesListProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The sidebar / bottom bar navigation — the page owner switches. */
  onNavigate: (next: Page) => void;
}

// A TAB IS A VIEW here too: the sort, the View-menu settings and the search
// are all kept per view id and never carried between views, and the active
// view is remembered per branch — the Jobs page's rules, one for one.
const EstimatesList = ({ breakpoint = "auto", onNavigate }: EstimatesListProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  const [branch, setBranch] = useState<EstimatesBranchId>("open");
  const [tabs, setTabs] = useState<Record<EstimatesBranchId, string>>({ open: "all", closed: "closedAll" });
  const tab = tabs[branch];
  const setTab = (next: string) => setTabs((current) => ({ ...current, [branch]: next }));

  const [sorts, setSorts] = useState<Record<string, TableSort>>({});
  const sort = sorts[tab] ?? sortDefault(branch);
  // `useCallback` so the memoised table keeps its identity between renders.
  const changeSort = useCallback(
    (column: SortColumn) =>
      setSorts((current) => {
        const active = current[tab] ?? sortDefault(branch);
        return {
          ...current,
          [tab]:
            active.column === column
              ? { column, order: active.order === "ascending" ? "descending" : "ascending" }
              : { column, order: "ascending" },
        };
      }),
    [tab, branch],
  );

  const [viewSettings, setViewSettings] = useState<Record<string, ViewSettings>>({});
  const settings = viewSettings[tab] ?? DEFAULT_VIEW_SETTINGS;
  const setSettings = (next: ViewSettings) => setViewSettings((current) => ({ ...current, [tab]: next }));

  // A TAB IS A VIEW, so its filters belong to it and are never carried to
  // another — the Jobs page's rule, and the same shape of state.
  const [selections, setSelections] = useState<Record<string, FilterSelection>>({});
  const selection = selections[tab] ?? EMPTY_SELECTION;
  const setSelection = (next: FilterSelection) => setSelections((current) => ({ ...current, [tab]: next }));

  const [searches, setSearches] = useState<Record<string, string>>({});
  const search = searches[tab] ?? "";
  const setSearch = (next: string) => setSearches((current) => ({ ...current, [tab]: next }));

  // The TABLE lags the field — the Jobs page's rule, and for the same reason:
  // re-rendering 62 rows on every character made typing feel slow. See the
  // `useDeferredValue` note in Filters.tsx.
  const deferredSearch = useDeferredValue(search);

  // The pipeline is the Jobs page's, minus the layers that do not exist yet:
  // branch estimates → the view's states → the keyword search → the sort.
  // The pipeline, in layers: the branch's estimates → the view's states → the
  // user's FILTERS → the keyword search → the sort. The Jobs page's order,
  // minus the two layers estimates do not have (a locked Status filter and the
  // schedule horizon).
  const { estimates, searchEmptied, hiddenByFilters } = useMemo(() => {
    const states = tabById(branch, tab).states;
    const viewStates = states.length > 0 ? states : branchStates(branch);
    const viewEstimates = ESTIMATES.filter((est) => viewStates.includes(est.status));
    const filtered = applyFilters(viewEstimates, FILTERS, selection);
    const query = deferredSearch.trim().toLowerCase();
    const searched = query === "" ? filtered : filtered.filter((est) => searchHaystack(est).includes(query));
    return {
      estimates: sortEstimates(searched, sort),
      searchEmptied: query !== "" && searched.length === 0 && filtered.length > 0,
      hiddenByFilters: viewEstimates.length - filtered.length,
    };
  }, [branch, tab, deferredSearch, sort, selection]);

  const shellProps: ShellProps = {
    estimates,
    searchEmptied,
    search,
    onSearchChange: setSearch,
    branch,
    onBranchChange: setBranch,
    tab,
    onTabChange: setTab,
    sort,
    onSortChange: changeSort,
    onSortSet: (next: TableSort) => setSorts((current) => ({ ...current, [tab]: next })),
    viewSettings: settings,
    onViewSettingsChange: setSettings,
    selection,
    onSelectionChange: setSelection,
    hiddenByFilters,
    onNavigate,
  };
  return isDesktop ? <DesktopShell {...shellProps} /> : <MobileShell {...shellProps} />;
};

export default EstimatesList;
