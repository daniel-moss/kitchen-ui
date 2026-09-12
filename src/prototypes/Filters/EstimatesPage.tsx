import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { BadgeEstimateStatusStatus } from "../../components/Badge/BadgeEstimateStatus";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import TopBarNav from "../../components/TopBarNav/TopBarNav";
import TopBarNavLeftElements from "../../components/TopBarNav/TopBarNavLeftElements";
import TopBarNavTitle from "../../components/TopBarNav/TopBarNavTitle";
import TopBarView from "../../components/TopBarView/TopBarView";
import ViewMenuModule from "../../modules/ViewMenu/ViewMenu";
import { ViewMenuColumnsState, ViewMenuView } from "../../modules/ViewMenu/ViewMenu.types";
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import { noop } from "../../stories/helpers";

import { AppBottomBar, Page, useAnchoredCard, useSingleAxisScroll } from "./appShell";
import { ESTIMATE_FILTERS, EstimatesPhase } from "./estimateFilters";
import {
  EstimatesTable,
  SortColumn,
  TABLE_COLUMNS,
  TableSort,
  VIEW_ATTRIBUTES,
  VIEW_COLUMNS,
  sortDefault,
  sortEstimates,
} from "./estimatesTable";
import { FilterDef, FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard } from "./filterUI";
import {
  ESTIMATES,
  EstimateRow,
  clientOf,
  displayStatus,
  estimateStatusLabel,
  locationOf,
} from "./estimatesData";
import { ESTIMATE_NOUN, locationAddress } from "./listData";
import { HiddenCounts, HiddenDataBar, NoObjectsExist, NoObjectsMatch, NoSearchResults } from "./viewStates";

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
//                 shared TEMPLATES (filterTemplates.tsx) — owned by neither
//                 object since the 2026-09-11 re-organisation — and the menu,
//                 the option lists, the chips and the filter bar are the same
//                 components the Jobs page renders, from filterUI.tsx.
//
//   ONE registry for the whole page: unlike jobs, estimates have no
//   open/closed split in their filters, because the only filter that differed
//   between the jobs branches was Status, which is not one of these.
//
// Still missing next to the Jobs page, and flagged: the view tabs are not
// LOCKED Status filters yet (they filter by state directly), and the
// estimates' OWN filters are not built (Status, Down payment, Expires,
// Issued, Total — see estimateFilters.tsx).

// ---- the view bar's tabs ---------------------------------------------------

// A view lists estimates by their STATUS — the one the badge shows — exactly
// as the Jobs page's views do (its tabs are BadgeJobStatus keys). It used to
// filter by the DB state instead, which is what put Jobbed and Invoiced
// estimates under "Approved" and Unconverted ones under "Won": the tab asked
// one question and the badge answered another. Daniel settled it on
// 2026-09-11 — "this concept of state is redundant and we won't use it any
// more" — so the badge status is now the only status, and the PHASE follows
// from it (the union of a branch's views, like `branchStatuses` on Jobs).
interface EstimateViewTab {
  id: string;
  label: string;
  /** The statuses this view lists. Empty = the whole branch ("All"). */
  statuses: BadgeEstimateStatusStatus[];
}

interface EstimateBranch {
  id: EstimatesPhase;
  label: string;
  tabs: EstimateViewTab[];
}

const BRANCHES: EstimateBranch[] = [
  {
    id: "open",
    label: "Open",
    tabs: [
      { id: "all", label: "All", statuses: [] },
      // Still being written, or written and not sent yet. Both columns this
      // view used to hide — Down payment and Status changed — are shown now
      // (Daniel, 2026-09-12): every view starts from the same arrangement, and
      // the View menu is where a user drops what they do not want. Status
      // changed is empty on every row here (a draft and an unsent estimate are
      // both sitting in their first status), and that is a true answer.
      { id: "pending", label: "Pending", statuses: ["draft", "unsent"] },
      // Out with the client — whether or not it has run past its due date.
      { id: "sent", label: "Sent", statuses: ["awaitingApproval", "expired"] },
      // Approved but NOT converted yet. Once it becomes a job or an invoice it
      // is Won, and moves to the Closed phase.
      { id: "approved", label: "Approved", statuses: ["unconverted"] },
    ],
  },
  {
    id: "closed",
    label: "Closed",
    tabs: [
      { id: "closedAll", label: "All", statuses: [] },
      // Converted — the estimate became a job or an invoice. That IS winning it.
      { id: "won", label: "Won", statuses: ["jobbed", "invoiced"] },
      { id: "lost", label: "Lost", statuses: ["lost"] },
      { id: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
    ],
  },
];

const branchById = (id: EstimatesPhase) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

const tabById = (branch: EstimatesPhase, id: string) => {
  const tabs = branchById(branch).tabs;
  return tabs.find((t) => t.id === id) ?? tabs[0]!;
};

/**
 * The PHASE's whole status set — what the branch's "All" view lists. The union
 * of its views' statuses, so the two levels can never disagree about what a
 * phase holds (the Jobs page's rule).
 */
const branchStatuses = (branch: EstimatesPhase) => branchById(branch).tabs.flatMap((t) => t.statuses);

const branchViews = (branch: EstimatesPhase) =>
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
  branch: EstimatesPhase;
  onBranchChange: (next: EstimatesPhase) => void;
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
        onChange={(next) => onBranchChange(next as EstimatesPhase)}
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

// ---- the View menu (the shared module) --------------------------------------

// The shared View Menu module, wired exactly like the Jobs page's — Columns,
// Sort by and the view switcher all work — MINUS the two jobs-only pieces
// (Daniel, 2026-09-11): no `scheduled` prop, so there is no Schedule horizon
// row, and no `timeline` prop, so the switcher offers Table / Cards alone.
// Cards is DISABLED like on the Jobs page — the view is not designed here, so
// switching to it would change nothing.
//
// The column lists it is fed come from estimatesTable.tsx's own registry.

/** Everything the View menu edits, kept PER VIEW like on the Jobs page. */
interface ViewSettings {
  view: ViewMenuView;
  columns: ViewMenuColumnsState;
  activeAttributes: string[];
}

const defaultViewSettings = (): ViewSettings => ({
  view: "table",
  // The production default: ID and Client pinned, the rest in the registry's
  // order. NOTHING starts hidden — every view shows every column (Daniel,
  // 2026-09-12).
  columns: {
    pinned: ["id", "client"],
    unpinned: TABLE_COLUMNS.map((def) => def.key).filter((key) => key !== "id" && key !== "client"),
    hidden: [],
  },
  activeAttributes: ["status", "client", "total"],
});

/** Every view of either branch, in one flat list — view ids are unique. */
const ALL_VIEWS = BRANCHES.flatMap((branch) => branch.tabs.map((tab) => ({ branch, tab })));

/**
 * One default per VIEW, built once — so an untouched view keeps a stable
 * reference and the memoised table is not rebuilt on every render.
 *
 * Every view starts from the SAME arrangement since 2026-09-12. Down payment
 * used to start hidden on the three open views before approval (there is
 * nothing to report yet) and Status changed on Pending, but Daniel dropped both
 * exclusions: "showing it everywhere is not a big deal — the user can still go
 * to the View menu and hide it". Preset views guessing what a user wants stops
 * making sense once CUSTOM views exist, where they choose for themselves.
 */
const DEFAULT_VIEW_SETTINGS: Record<string, ViewSettings> = Object.fromEntries(
  ALL_VIEWS.map(({ tab }) => [tab.id, defaultViewSettings()] as const),
);

/**
 * The registry a VIEW offers — its branch's, whole. Built once for the same
 * reason as the settings above: every piece of the filter UI takes it as a
 * `defs` prop, and a fresh array each render would be churn.
 */
const VIEW_FILTERS: Record<string, FilterDef<EstimateRow>[]> = Object.fromEntries(
  ALL_VIEWS.map(({ branch, tab }) => [tab.id, ESTIMATE_FILTERS[branch.id]] as const),
);

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


// ---- the view bar ----------------------------------------------------------

interface ViewBarProps {
  branch: EstimatesPhase;
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

/** The Status filter the current view locks — see `EstimateViewTab.statuses`. */
const lockedStatusesOf = (branch: EstimatesPhase, tab: string) => tabById(branch, tab).statuses;

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
        defs={VIEW_FILTERS[tab]!}
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
  const lockedStatuses = lockedStatusesOf(branch, tab);
  // The MOBILE Filters count counts the view's LOCKED Status filter as well —
  // the Jobs page's rule: on every view but "All" a filter IS applied, and
  // mobile has no filter bar to show it. So "Pending" with nothing else on
  // reads 1.
  const activeCount = activeFilterCount(selection) + (lockedStatuses.length > 0 ? 1 : 0);
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
        filtersCount={activeCount}
        onFiltersClick={() => setFiltersOpen(true)}
        filtersPressed={filtersOpen}
        onViewMenuClick={() => setViewMenuOpen(true)}
        viewMenuPressed={viewMenuOpen}
      />
      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        defs={VIEW_FILTERS[tab]!}
        selection={selection}
        onSelectionChange={onSelectionChange}
        lockedStatuses={lockedStatuses}
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

// (The table's EMPTY STATES live in viewStates.tsx since 2026-09-11 — Daniel's
// Figma page "View ↳ Shared Behavior" (14031-20299). This page used to carry
// its own `NoEstimatesYet` / `NoMatchingEstimates` / `NoSearchResults`, which
// were the Jobs page's states with the noun swapped and had already drifted.)

// ---- layouts ---------------------------------------------------------------

interface ShellProps {
  estimates: EstimateRow[];
  searchEmptied: boolean;
  search: string;
  onSearchChange: (next: string) => void;
  branch: EstimatesPhase;
  onBranchChange: (next: EstimatesPhase) => void;
  tab: string;
  onTabChange: (next: string) => void;
  sort: TableSort;
  /** A header click. The registry has more column keys than `SortColumn`, so
   *  the shared table hands back a plain string and this narrows it. */
  onSortChange: (column: string) => void;
  onSortSet: (next: TableSort) => void;
  viewSettings: ViewSettings;
  onViewSettingsChange: (next: ViewSettings) => void;
  /** The filters applied to the current view, and how many rows they hide. */
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /** The current view's locked Status filter — the filter bar's first chip. */
  lockedStatuses: BadgeEstimateStatusStatus[];
  /**
   * The counted layers. Estimates has ONE — the user's filters; the schedule
   * horizon is the Jobs page's alone, so the shared type's optional `horizon`
   * is left out and no copy about it is ever built.
   */
  hidden: HiddenCounts;
  /** MATCHING estimates the filters hide from an empty search. */
  searchHidden: HiddenCounts;
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
  lockedStatuses,
  hidden,
  searchHidden,
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
      <FilterBar
        defs={VIEW_FILTERS[tab]!}
        lockedStatuses={lockedStatuses}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      <div className={styles.mainArea}>
        {estimates.length > 0 ? (
          <EstimatesTable
            estimates={estimates}
            columnsState={viewSettings.columns}
            sort={sort}
            onSortChange={onSortChange}
          />
        ) : searchEmptied ? (
          <NoSearchResults
            noun={ESTIMATE_NOUN}
            hidden={searchHidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
            onClearSearch={() => onSearchChange("")}
          />
        ) : hidden.filters > 0 ? (
          <NoObjectsMatch
            noun={ESTIMATE_NOUN}
            hidden={hidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
          />
        ) : (
          <NoObjectsExist noun={ESTIMATE_NOUN} />
        )}
      </div>
      {/* AFTER the scroll container, so it stays put at the bottom while the
          table scrolls — the shared bar's placement rule. Estimates GAINED it
          in the 2026-09-11 re-organisation; the page had none before. Only
          while the table SHOWS rows: empty, No Objects Match carries the count
          instead. */}
      {estimates.length > 0 && (
        <HiddenDataBar
          noun={ESTIMATE_NOUN}
          hidden={hidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          onClearFilters={() => onSelectionChange([])}
        />
      )}
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
  lockedStatuses,
  hidden,
  searchHidden,
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
          <NoSearchResults
            noun={ESTIMATE_NOUN}
            hidden={searchHidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
            onClearSearch={() => onSearchChange("")}
          />
        ) : hidden.filters > 0 ? (
          <NoObjectsMatch
            noun={ESTIMATE_NOUN}
            hidden={hidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
          />
        ) : (
          <NoObjectsExist noun={ESTIMATE_NOUN} />
        )}
      </div>
      {/* Between the list and the bottom bar — the shared bar's mobile
          placement. Only while the table SHOWS rows. */}
      {estimates.length > 0 && (
        <HiddenDataBar
          noun={ESTIMATE_NOUN}
          hidden={hidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          mobile
          onClearFilters={() => onSelectionChange([])}
        />
      )}
      <AppBottomBar page="estimates" onNavigate={onNavigate} />
    </div>
  );
};

/** One shared empty list, so an untouched view keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

// ---- the page --------------------------------------------------------------

// What the view bar's keyword search MATCHES: the row's readable text — id,
// client, service, location (name + address) and the status label — as a
// case-insensitive substring. The Jobs page's field-set rule, FLAGGED the same
// way: my choice, no node names one. (The DB state string went out of the
// haystack with the State column, 2026-09-11: it is not on screen any more.)
const searchHaystack = (est: EstimateRow) => {
  const location = locationOf(est);
  return [
    est.id,
    clientOf(est).name,
    est.serviceName,
    location.name ?? "",
    locationAddress(location),
    estimateStatusLabel(displayStatus(est)),
  ]
    .join(" ")
    .toLowerCase();
};

export interface EstimatesPageProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The sidebar / bottom bar navigation — the page owner switches. */
  onNavigate: (next: Page) => void;
}

// A TAB IS A VIEW here too: the sort, the View-menu settings and the search
// are all kept per view id and never carried between views, and the active
// view is remembered per branch — the Jobs page's rules, one for one.
const EstimatesPage = ({ breakpoint = "auto", onNavigate }: EstimatesPageProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  const [branch, setBranch] = useState<EstimatesPhase>("open");
  const [tabs, setTabs] = useState<Record<EstimatesPhase, string>>({ open: "all", closed: "closedAll" });
  const tab = tabs[branch];
  const setTab = (next: string) => setTabs((current) => ({ ...current, [branch]: next }));

  const [sorts, setSorts] = useState<Record<string, TableSort>>({});
  const sort = sorts[tab] ?? sortDefault(branch);
  // `useCallback` so the memoised table keeps its identity between renders.
  const changeSort = useCallback(
    (key: string) =>
      setSorts((current) => {
        // Only a SORTABLE column reaches here, and every one of those is a
        // `SortColumn` — the shared table just does not know that.
        const column = key as SortColumn;
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
  const settings = viewSettings[tab] ?? DEFAULT_VIEW_SETTINGS[tab]!;
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
  // `useDeferredValue` note in JobsPage.tsx.
  const deferredSearch = useDeferredValue(search);

  // The pipeline runs in LAYERS, the Jobs page's order minus the one layer
  // estimates do not have (the schedule horizon):
  //
  //   branch estimates → the view's LOCKED statuses → the USER's filters →
  //   the keyword search → the sort.
  //
  // Only the FILTERS layer is counted (2026-09-11): what the locked Status
  // filter hides never counts — the Jobs page's rule, from the Locked
  // "Status" Filter frame 14192-61579 ("the objects hidden by the locked
  // 'Status' filter does not count"). So a locked view shows no Hidden Data
  // Bar until something ELSE hides, and a view whose locked filter alone
  // leaves nothing shows No Objects Exist rather than No Objects Match.
  //
  // The BRANCH is page context, not a filter, so closed estimates are never
  // "hidden" on the open page.
  const { estimates, searchEmptied, hidden, searchHidden } = useMemo(() => {
    const branchEstimates = ESTIMATES.filter((est) => branchStatuses(branch).includes(displayStatus(est)));
    const locked = tabById(branch, tab).statuses;
    const afterLocked =
      locked.length > 0
        ? branchEstimates.filter((est) => locked.includes(displayStatus(est)))
        : branchEstimates;
    const filtered = applyFilters(afterLocked, VIEW_FILTERS[tab]!, selection);
    const query = deferredSearch.trim().toLowerCase();
    const searched = query === "" ? filtered : filtered.filter((est) => searchHaystack(est).includes(query));
    // When the search leaves NOTHING, the Search empty state counts the
    // MATCHING estimates the filters hide — the Jobs page's search-aware
    // numbers, so the count is exactly what its button would reveal.
    let searchHidden: HiddenCounts = { filters: 0 };
    if (query !== "" && searched.length === 0) {
      const matchesQuery = (est: EstimateRow) => searchHaystack(est).includes(query);
      // Locked-hidden matches stay invisible, the standing rule.
      searchHidden = {
        filters: afterLocked.filter(matchesQuery).length - filtered.filter(matchesQuery).length,
      };
    }
    return {
      estimates: sortEstimates(searched, sort),
      searchEmptied: query !== "" && searched.length === 0 && filtered.length > 0,
      hidden: { filters: afterLocked.length - filtered.length } satisfies HiddenCounts,
      searchHidden,
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
    lockedStatuses: tabById(branch, tab).statuses,
    hidden,
    searchHidden,
    onNavigate,
  };
  return isDesktop ? <DesktopShell {...shellProps} /> : <MobileShell {...shellProps} />;
};

export default EstimatesPage;
