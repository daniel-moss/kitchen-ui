import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { POStatus } from "../../data/db";
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
import { PO_FILTERS, POsPhase } from "./poFilters";
import {
  POsTable,
  SortColumn,
  TABLE_COLUMNS,
  TableSort,
  VIEW_ATTRIBUTES,
  VIEW_COLUMNS,
  sortDefault,
  sortPOs,
} from "./posTable";
import { FilterDef, FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard } from "./filterUI";
import { PO_ROWS, PORow, poStatusLabel, vendorOf } from "./posData";
import { PO_NOUN } from "./listData";
import { HiddenCounts, HiddenDataBar, NoObjectsExist, NoObjectsMatch, NoSearchResults } from "./viewStates";

import styles from "./Filters.module.scss";

// The POs list page — added 2026-09-15 (Daniel: "I want to add 'POs' list and
// filters to the prototype", after the design review against roopairs_api and
// his POs section 14817-88566 in the "View - Next Update" file). The same
// shell as the other six pages, with the VIEWS and FILTERS read off the Figma
// section and the TABLE adapted from production (PurchaseOrderTableView +
// defaultTableViewConfig's purchase_orders_table__* views) per Daniel's
// rulings:
//
//   BRANCH tabs   Open · Closed — production's phases.
//   VIEW tabs     Open: All / Pending / Open / In transit / Delivered /
//                 Stocked; Closed: All / Paid / Cancelled — the Figma Views
//                 section (14817-88570), production's nine tabs one for one.
//                 A view lists POs by the BADGE status: Pending = Draft +
//                 Unsent (production status=pending, is_draft the flag),
//                 Open = Sent + Acknowledged, Delivered = Unstocked and
//                 Stocked = Unpaid — the tabs name the STEP, the badges name
//                 the work left, and production relabels the same way.
//   Table         production's column set minus State (retired), the two
//                 shipping columns merged under one "Shipping", the seven
//                 per-status date columns replaced by the one Status
//                 changed. See posTable.tsx.
//   View menu     the shared module, fully functional; NO Schedule horizon
//                 row and NO Timeline view (both jobs-only); Cards disabled
//                 the same way.
//   Filters       the menu node's rows (14824-29890) — five shared templates
//                 and the list's own nine, Status changed on BOTH phases.
//                 See poFilters.tsx.
//
//   ONE registry per PHASE: only the Status filter's options differ.
//
// POs hang off VENDORS — the buying side — so the page stands alone in the
// sidebar (its own "Purchase orders" item, no stack) and the title carries no
// sub-pages. The top bar's title is "POs", the design's own word (node
// 14817-88572); the sidebar keeps the spelled-out name, also the design's.

// ---- the view bar's tabs ---------------------------------------------------

// A view lists POs by their STATUS — the one the badge shows — the other
// pages' rule. The PHASE follows from it: a branch holds the union of its
// views' statuses, so the two levels can never disagree.
interface POViewTab {
  id: string;
  label: string;
  /** The statuses this view lists — and LOCKS (its fixed Status chip). Empty
   *  = the whole branch ("All"), which locks nothing. */
  statuses: POStatus[];
}

interface POBranch {
  id: POsPhase;
  label: string;
  tabs: POViewTab[];
}

// The Views section (14817-88570), each view's locked chip read off its
// annotation: All Open "All open POs are listed" (locks nothing) · Pending
// "'Draft' and 'Unsent' are selected" · Open "'Sent' and 'Acknowledged'" ·
// In transit "'In transit'" · Delivered "'Unstocked'" · Stocked "'Unpaid'" ·
// All Closed (locks nothing) · Paid · Cancelled.
const BRANCHES: POBranch[] = [
  {
    id: "open",
    label: "Open",
    tabs: [
      { id: "all", label: "All", statuses: [] },
      { id: "pending", label: "Pending", statuses: ["draft", "unsent"] },
      { id: "open", label: "Open", statuses: ["sent", "acknowledged"] },
      { id: "inTransit", label: "In transit", statuses: ["inTransit"] },
      // The tab names the STEP; the badge names the work left — production's
      // own relabeling (delivered → "Unstocked", stocked → "Unpaid").
      { id: "delivered", label: "Delivered", statuses: ["unstocked"] },
      { id: "stocked", label: "Stocked", statuses: ["unpaid"] },
    ],
  },
  {
    id: "closed",
    label: "Closed",
    tabs: [
      { id: "closedAll", label: "All", statuses: [] },
      { id: "paid", label: "Paid", statuses: ["paid"] },
      { id: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
    ],
  },
];

const branchById = (id: POsPhase) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

const tabById = (branch: POsPhase, id: string) => {
  const tabs = branchById(branch).tabs;
  return tabs.find((t) => t.id === id) ?? tabs[0]!;
};

/**
 * The PHASE's whole status set — what the branch's "All" view lists. The union
 * of its views' statuses, so the two levels can never disagree about what a
 * phase holds (the other pages' derivation).
 */
const branchStatuses = (branch: POsPhase) => branchById(branch).tabs.flatMap((t) => t.statuses);

const branchViews = (branch: POsPhase) =>
  branchById(branch).tabs.map((item) => ({ value: item.id, label: item.label }));

// ---- the list top bar ------------------------------------------------------

// The other pages' TopBar, for POs: the DS TopBarNav `list` variant with the
// [Open · Closed] branch tabs in its `tabs` slot. The title is PLAIN — POs is
// its own sidebar item, not part of a stack, so there are no sub-pages to
// list (the Bills arrangement).
const POsTopBar = ({
  mobile = false,
  branch,
  onBranchChange,
}: {
  mobile?: boolean;
  branch: POsPhase;
  onBranchChange: (next: POsPhase) => void;
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
        onChange={(next) => onBranchChange(next as POsPhase)}
        aria-label="Open or closed POs"
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
      <TopBarNavTitle title="POs" />
    </TopBarNavLeftElements>
  </TopBarNav>
);

// ---- the View menu (the shared module) --------------------------------------

// The shared View Menu module, wired exactly like the other pages' — Columns,
// Sort by and the view switcher all work — with the same two jobs-only pieces
// left out: no `scheduled` prop and no `timeline` prop. Cards is DISABLED
// like on the other pages.

/** Everything the View menu edits, kept PER VIEW like on the other pages. */
interface ViewSettings {
  view: ViewMenuView;
  columns: ViewMenuColumnsState;
  activeAttributes: string[];
}

const PINNED = ["id", "vendor"];

const defaultViewSettings = (): ViewSettings => ({
  view: "table",
  // The production default: ID and Purchasing vendor pinned, the rest in the
  // registry order. NOTHING starts hidden — every view shows every column
  // (Daniel, 2026-09-12).
  columns: {
    pinned: PINNED,
    unpinned: TABLE_COLUMNS.map((def) => def.key).filter((key) => !PINNED.includes(key)),
    hidden: [],
  },
  activeAttributes: ["status", "vendor", "amount"],
});

/** Every view of either branch, in one flat list — view ids are unique. */
const ALL_VIEWS = BRANCHES.flatMap((branch) => branch.tabs.map((tab) => ({ branch, tab })));

/**
 * One default per VIEW, built once — so an untouched view keeps a stable
 * reference and the memoised table is not rebuilt on every render.
 */
const DEFAULT_VIEW_SETTINGS: Record<string, ViewSettings> = Object.fromEntries(
  ALL_VIEWS.map(({ tab }) => [tab.id, defaultViewSettings()] as const),
);

/**
 * The registry a VIEW offers — its branch's, whole. Built once for the same
 * reason as the settings above.
 */
const VIEW_FILTERS: Record<string, FilterDef<PORow>[]> = Object.fromEntries(
  ALL_VIEWS.map(({ branch, tab }) => [tab.id, PO_FILTERS[branch.id]] as const),
);

interface POsViewMenuProps {
  open: boolean;
  onClose: () => void;
  breakpoint: "desktop" | "mobile";
  settings: ViewSettings;
  onSettingsChange: (next: ViewSettings) => void;
  /** The same per-view sort the header cells edit — one state, two editors. */
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
}

const POsViewMenu = ({ open, onClose, breakpoint, settings, onSettingsChange, sort, onSortChange }: POsViewMenuProps) => (
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
  branch: POsPhase;
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
// Filters opens the shared menu — the other pages' wiring, the same
// components.
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
            <POsViewMenu
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

// MOBILE: the View menu and the Filters both arrive as drawers.
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
  // the other pages' rule: on every view but "All" a filter IS applied, and
  // mobile has no filter bar to show it.
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
      <POsViewMenu
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

/** The Status filter the current view locks — see `POViewTab.statuses`. */
const lockedStatusesOf = (branch: POsPhase, tab: string) => tabById(branch, tab).statuses;

// ---- layouts ---------------------------------------------------------------

interface ShellProps {
  pos: PORow[];
  searchEmptied: boolean;
  search: string;
  onSearchChange: (next: string) => void;
  branch: POsPhase;
  onBranchChange: (next: POsPhase) => void;
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
  lockedStatuses: POStatus[];
  /** The counted layers. POs has ONE — the user's filters. */
  hidden: HiddenCounts;
  /** MATCHING POs the filters hide from an empty search. */
  searchHidden: HiddenCounts;
  onNavigate: (next: Page) => void;
}

const DesktopShell = ({
  pos,
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
  // switch, so it survives a move between pages.
  <div className={styles.workArea}>
    <POsTopBar branch={branch} onBranchChange={onBranchChange} />
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
        Every view but the two Alls locks a Status filter, so those views
        always carry at least the fixed first chip. */}
    <FilterBar
      defs={VIEW_FILTERS[tab]!}
      lockedStatuses={lockedStatuses}
      selection={selection}
      onSelectionChange={onSelectionChange}
    />
    <div className={styles.mainArea}>
      {pos.length > 0 ? (
        <POsTable
          pos={pos}
          columnsState={viewSettings.columns}
          sort={sort}
          onSortChange={onSortChange}
        />
      ) : searchEmptied ? (
        <NoSearchResults
          noun={PO_NOUN}
          hidden={searchHidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          onClearFilters={() => onSelectionChange([])}
          onClearSearch={() => onSearchChange("")}
        />
      ) : hidden.filters > 0 ? (
        <NoObjectsMatch
          noun={PO_NOUN}
          hidden={hidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          onClearFilters={() => onSelectionChange([])}
        />
      ) : (
        <NoObjectsExist noun={PO_NOUN} />
      )}
    </div>
    {/* AFTER the scroll container — below the last row while the list is
        short, at the screen bottom once it scrolls (the hug rule in
        Filters.module.scss). Only while the table SHOWS rows. */}
    {pos.length > 0 && (
      <HiddenDataBar
        noun={PO_NOUN}
        hidden={hidden}
        viewHasLockedFilters={lockedStatuses.length > 0}
        onClearFilters={() => onSelectionChange([])}
      />
    )}
  </div>
);

const MobileShell = ({
  pos,
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
      <POsTopBar mobile branch={branch} onBranchChange={onBranchChange} />
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
        {pos.length > 0 ? (
          <POsTable
            pos={pos}
            columnsState={viewSettings.columns}
            sort={sort}
            onSortChange={onSortChange}
            mobile
          />
        ) : searchEmptied ? (
          <NoSearchResults
            noun={PO_NOUN}
            hidden={searchHidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
            onClearSearch={() => onSearchChange("")}
          />
        ) : hidden.filters > 0 ? (
          <NoObjectsMatch
            noun={PO_NOUN}
            hidden={hidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
          />
        ) : (
          <NoObjectsExist noun={PO_NOUN} />
        )}
      </div>
      {/* Between the list and the bottom bar — the shared bar's mobile
          placement. Only while the table SHOWS rows. */}
      {pos.length > 0 && (
        <HiddenDataBar
          noun={PO_NOUN}
          hidden={hidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          mobile
          onClearFilters={() => onSelectionChange([])}
        />
      )}
      <AppBottomBar page="pos" onNavigate={onNavigate} />
    </div>
  );
};

/** One shared empty list, so an untouched view keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

// ---- the page --------------------------------------------------------------

// What the view bar's keyword search MATCHES: the row's readable text — id,
// the vendor's name, the tracking number, the status label AND the associated
// estimate / job / invoice ids — as a case-insensitive substring. The other
// pages' field-set rule, FLAGGED the same way: my choice, no node names one.
// The associated ids are a DELIBERATE deviation from production (its
// `keywords` does not search them): typing "JOB-1201" here finds the job's
// orders, which is the Associated question's identity half — the filter
// stays presence-only on purpose.
const searchHaystack = (po: PORow) =>
  [
    po.id,
    vendorOf(po).name,
    po.trackingNumber ?? "",
    poStatusLabel(po.status),
    ...po.associatedEstimateIds,
    ...po.associatedJobIds,
    ...po.associatedInvoiceIds,
  ]
    .join(" ")
    .toLowerCase();

export interface POsPageProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The sidebar / bottom bar navigation — the page owner switches. */
  onNavigate: (next: Page) => void;
}

// A TAB IS A VIEW here too: the sort, the View-menu settings, the filters and
// the search are all kept per view id and never carried between views, and
// the active view is remembered per branch — the other pages' rules.
const POsPage = ({ breakpoint = "auto", onNavigate }: POsPageProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  const [branch, setBranch] = useState<POsPhase>("open");
  const [tabs, setTabs] = useState<Record<POsPhase, string>>({ open: "all", closed: "closedAll" });
  const tab = tabs[branch];
  const setTab = (next: string) => setTabs((current) => ({ ...current, [branch]: next }));

  const [sorts, setSorts] = useState<Record<string, TableSort>>({});
  const sort = sorts[tab] ?? sortDefault();
  // `useCallback` so the memoised table keeps its identity between renders.
  const changeSort = useCallback(
    (key: string) =>
      setSorts((current) => {
        // Only a SORTABLE column reaches here, and every one of those is a
        // `SortColumn` — the shared table just does not know that.
        const column = key as SortColumn;
        const active = current[tab] ?? sortDefault();
        return {
          ...current,
          [tab]:
            active.column === column
              ? { column, order: active.order === "ascending" ? "descending" : "ascending" }
              : { column, order: "ascending" },
        };
      }),
    [tab],
  );

  const [viewSettings, setViewSettings] = useState<Record<string, ViewSettings>>({});
  const settings = viewSettings[tab] ?? DEFAULT_VIEW_SETTINGS[tab]!;
  const setSettings = (next: ViewSettings) => setViewSettings((current) => ({ ...current, [tab]: next }));

  // A TAB IS A VIEW, so its filters belong to it and are never carried to
  // another — the other pages' rule, and the same shape of state.
  const [selections, setSelections] = useState<Record<string, FilterSelection>>({});
  const selection = selections[tab] ?? EMPTY_SELECTION;
  const setSelection = (next: FilterSelection) => setSelections((current) => ({ ...current, [tab]: next }));

  const [searches, setSearches] = useState<Record<string, string>>({});
  const search = searches[tab] ?? "";
  const setSearch = (next: string) => setSearches((current) => ({ ...current, [tab]: next }));

  // The TABLE lags the field — the other pages' rule. See the
  // `useDeferredValue` note in JobsPage.tsx.
  const deferredSearch = useDeferredValue(search);

  // The pipeline runs in LAYERS, the other pages' order:
  //
  //   branch POs → the view's LOCKED statuses → the USER's filters → the
  //   keyword search → the sort.
  //
  // Both status layers match on the STORED status — nothing on this list is
  // derived. Only the FILTERS layer is counted: what the locked Status filter
  // hides never counts, so a locked view shows no Hidden Data Bar until
  // something else hides. The BRANCH is page context, not a filter, so closed
  // POs are never "hidden" on the open page.
  const { pos, searchEmptied, hidden, searchHidden } = useMemo(() => {
    const branchPOs = PO_ROWS.filter((po) => branchStatuses(branch).includes(po.status));
    const locked = tabById(branch, tab).statuses;
    const afterLocked = locked.length > 0 ? branchPOs.filter((po) => locked.includes(po.status)) : branchPOs;
    const filtered = applyFilters(afterLocked, VIEW_FILTERS[tab]!, selection);
    const query = deferredSearch.trim().toLowerCase();
    const searched = query === "" ? filtered : filtered.filter((po) => searchHaystack(po).includes(query));
    // When the search leaves NOTHING, the Search empty state counts the
    // MATCHING POs the filters hide — the other pages' search-aware numbers.
    let searchHidden: HiddenCounts = { filters: 0 };
    if (query !== "" && searched.length === 0) {
      const matchesQuery = (po: PORow) => searchHaystack(po).includes(query);
      // Locked-hidden matches stay invisible, the standing rule.
      searchHidden = {
        filters: afterLocked.filter(matchesQuery).length - filtered.filter(matchesQuery).length,
      };
    }
    return {
      pos: sortPOs(searched, sort),
      searchEmptied: query !== "" && searched.length === 0 && filtered.length > 0,
      hidden: { filters: afterLocked.length - filtered.length } satisfies HiddenCounts,
      searchHidden,
    };
  }, [branch, tab, deferredSearch, sort, selection]);

  const shellProps: ShellProps = {
    pos,
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

export default POsPage;
