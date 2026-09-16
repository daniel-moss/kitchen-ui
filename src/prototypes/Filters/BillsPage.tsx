import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { BadgeBillStatusStatus } from "../../components/Badge/BadgeBillStatus";
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
import { BILL_FILTERS, BillsPhase } from "./billFilters";
import {
  BillsTable,
  SortColumn,
  TABLE_COLUMNS,
  TableSort,
  VIEW_ATTRIBUTES,
  VIEW_COLUMNS,
  sortDefault,
  sortBills,
} from "./billsTable";
import { FilterDef, FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard } from "./filterUI";
import { BILL_ROWS, BillRow, billStatusLabel, displayStatus, vendorOf } from "./billsData";
import { BILL_NOUN } from "./listData";
import { HiddenCounts, HiddenDataBar, NoObjectsExist, NoObjectsMatch, NoSearchResults } from "./viewStates";

import styles from "./Filters.module.scss";

// The BILLS list page — added 2026-09-15 (Daniel: "Build", after the design
// review against roopairs_api and his Bill page 14817-83509 in the "View -
// Next Update" file). The same shell as the other five pages — the DS
// SidebarNav / TopBarNav / TopBarView / Table over the shared app-shell
// chrome — with the VIEWS and FILTERS read off the Figma page and the TABLE
// adapted from production (BillTableView + defaultTableViewConfig's
// bills_table__* views) per Daniel's rulings:
//
//   BRANCH tabs   Open · Closed — production's phases.
//   VIEW tabs     Open: All / Draft / Outstanding / Overdue; Closed: All /
//                 Paid / Voided — the Figma Views section (14817-83510).
//                 A view lists bills by the BADGE status. The second tab is
//                 DRAFT, not production's "Pending" (Daniel renamed it in
//                 the design 2026-09-15, closing the review flag): with
//                 Unsent gone ("The bill can not have 'Unsent' status") the
//                 view holds one status, and every single-status tab is
//                 named by its status. Overdue = the DERIVED status,
//                 exactly production's `status=unpaid & is_overdue` slice.
//   Table         production's column set minus State and minus the three
//                 transition-date columns (all "Status changed" data —
//                 Daniel), plus the real Received (`date_received`) and
//                 Issued (`date_issued`). Status changed — column AND
//                 filter — is CLOSED-phase only. See billsTable.tsx.
//   View menu     the shared module, fully functional; NO Schedule horizon
//                 row and NO Timeline view (both jobs-only); Cards disabled
//                 the same way. It offers the PHASE's own columns.
//   Filters       the menu node's rows (14817-83613) — seven shared
//                 templates and the list's own Status and Billing vendor,
//                 with Status changed on the CLOSED phase alone. See
//                 billFilters.tsx.
//
//   ONE registry per PHASE: Status's options differ between the branches,
//   and Status changed exists only on the closed one.
//
// Bills are ACCOUNTS PAYABLE — the vendors' side — so the page stands alone
// in the sidebar (its own "Bills" item, no stack) and the title carries no
// sub-pages.

// ---- the view bar's tabs ---------------------------------------------------

// A view lists bills by their STATUS — the one the badge shows — the other
// pages' rule. The PHASE follows from it: a branch holds the union of its
// views' statuses, so the two levels can never disagree.
interface BillViewTab {
  id: string;
  label: string;
  /** The statuses this view lists — and LOCKS (its fixed Status chip). Empty
   *  = the whole branch ("All"), which locks nothing. */
  statuses: BadgeBillStatusStatus[];
}

interface BillBranch {
  id: BillsPhase;
  label: string;
  tabs: BillViewTab[];
}

// The Views section (14817-83510), each view's locked chip read off its
// annotation: All Open "All open bills are listed" (locks nothing) · Draft
// "'Draft' is selected" · Outstanding · Overdue · All Closed (locks
// nothing) · Paid · Voided — every non-All view one status, and named by it.
const BRANCHES: BillBranch[] = [
  {
    id: "open",
    label: "Open",
    tabs: [
      { id: "all", label: "All", statuses: [] },
      // "Draft", not production's "Pending" (Daniel renamed the view
      // 2026-09-15): production's tab holds Draft + Unsent, and with Unsent
      // ruled out the single status names the tab.
      { id: "draft", label: "Draft", statuses: ["draft"] },
      { id: "outstanding", label: "Outstanding", statuses: ["outstanding"] },
      // Past its due date — the DERIVED status, so this tab is exactly
      // production's `status=unpaid & is_overdue=true` slice.
      { id: "overdue", label: "Overdue", statuses: ["overdue"] },
    ],
  },
  {
    id: "closed",
    label: "Closed",
    tabs: [
      { id: "closedAll", label: "All", statuses: [] },
      { id: "paid", label: "Paid", statuses: ["paid"] },
      { id: "voided", label: "Voided", statuses: ["voided"] },
    ],
  },
];

const branchById = (id: BillsPhase) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

const tabById = (branch: BillsPhase, id: string) => {
  const tabs = branchById(branch).tabs;
  return tabs.find((t) => t.id === id) ?? tabs[0]!;
};

/**
 * The PHASE's whole status set — what the branch's "All" view lists. The union
 * of its views' statuses, so the two levels can never disagree about what a
 * phase holds (the Invoices page's derivation).
 */
const branchStatuses = (branch: BillsPhase) => branchById(branch).tabs.flatMap((t) => t.statuses);

const branchViews = (branch: BillsPhase) =>
  branchById(branch).tabs.map((item) => ({ value: item.id, label: item.label }));

// ---- the list top bar ------------------------------------------------------

// The other pages' TopBar, for bills: the DS TopBarNav `list` variant with
// the [Open · Closed] branch tabs in its `tabs` slot. The title is PLAIN —
// Bills is its own sidebar item, not part of a stack, so there are no
// sub-pages to list (unlike Invoices / Credit notes and Jobs / Series).
const BillsTopBar = ({
  mobile = false,
  branch,
  onBranchChange,
}: {
  mobile?: boolean;
  branch: BillsPhase;
  onBranchChange: (next: BillsPhase) => void;
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
        onChange={(next) => onBranchChange(next as BillsPhase)}
        aria-label="Open or closed bills"
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
      <TopBarNavTitle title="Bills" />
    </TopBarNavLeftElements>
  </TopBarNav>
);

// ---- the View menu (the shared module) --------------------------------------

// The shared View Menu module, wired exactly like the other pages' — Columns,
// Sort by and the view switcher all work — with the same two jobs-only pieces
// left out: no `scheduled` prop (no Schedule horizon row) and no `timeline`
// prop (the switcher offers Table / Cards alone). Cards is DISABLED like on
// the other pages — the view is not designed here, so switching to it would
// change nothing.
//
// The column lists it is fed come from billsTable.tsx's own registry.

/** Everything the View menu edits, kept PER VIEW like on the other pages. */
interface ViewSettings {
  view: ViewMenuView;
  columns: ViewMenuColumnsState;
  activeAttributes: string[];
}

const PINNED = ["id", "vendor", "vendorInvoiceId"];

const defaultViewSettings = (phase: BillsPhase): ViewSettings => ({
  view: "table",
  // The production default: ID, Billing vendor and Vendor invoice ID pinned,
  // the rest in the PHASE's registry order (the open phase has no Status
  // changed column). NOTHING starts hidden — every view of a phase shows
  // every column its phase has (Daniel, 2026-09-12).
  columns: {
    pinned: PINNED,
    unpinned: TABLE_COLUMNS[phase].map((def) => def.key).filter((key) => !PINNED.includes(key)),
    hidden: [],
  },
  activeAttributes: ["status", "vendor", "total"],
});

/** Every view of either branch, in one flat list — view ids are unique. */
const ALL_VIEWS = BRANCHES.flatMap((branch) => branch.tabs.map((tab) => ({ branch, tab })));

/**
 * One default per VIEW, built once — so an untouched view keeps a stable
 * reference and the memoised table is not rebuilt on every render. Every view
 * starts from its PHASE's arrangement (Daniel, 2026-09-12 — the View menu is
 * where a user drops a column they do not want).
 */
const DEFAULT_VIEW_SETTINGS: Record<string, ViewSettings> = Object.fromEntries(
  ALL_VIEWS.map(({ branch, tab }) => [tab.id, defaultViewSettings(branch.id)] as const),
);

/**
 * The registry a VIEW offers — its branch's, whole. Built once for the same
 * reason as the settings above: every piece of the filter UI takes it as a
 * `defs` prop, and a fresh array each render would be churn.
 */
const VIEW_FILTERS: Record<string, FilterDef<BillRow>[]> = Object.fromEntries(
  ALL_VIEWS.map(({ branch, tab }) => [tab.id, BILL_FILTERS[branch.id]] as const),
);

interface BillsViewMenuProps {
  open: boolean;
  onClose: () => void;
  breakpoint: "desktop" | "mobile";
  /** The branch the page is on — the menu offers the PHASE's own columns. */
  branch: BillsPhase;
  settings: ViewSettings;
  onSettingsChange: (next: ViewSettings) => void;
  /** The same per-view sort the header cells edit — one state, two editors. */
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
}

const BillsViewMenu = ({ open, onClose, breakpoint, branch, settings, onSettingsChange, sort, onSortChange }: BillsViewMenuProps) => (
  <ViewMenuModule
    open={open}
    onClose={onClose}
    breakpoint={breakpoint}
    columns={VIEW_COLUMNS[branch]}
    columnsState={settings.columns}
    onColumnsStateChange={(columns) => onSettingsChange({ ...settings, columns })}
    sort={{ key: sort.column, ascending: sort.order === "ascending" }}
    onSortChange={(next) =>
      onSortChange({ column: next.key as SortColumn, order: next.ascending ? "ascending" : "descending" })
    }
    view={settings.view}
    onViewChange={(view) => onSettingsChange({ ...settings, view })}
    disabledViews={["cards"]}
    attributes={VIEW_ATTRIBUTES[branch]}
    activeAttributes={settings.activeAttributes}
    onActiveAttributesChange={(activeAttributes) => onSettingsChange({ ...settings, activeAttributes })}
  />
);

// ---- the view bar ----------------------------------------------------------

interface ViewBarProps {
  branch: BillsPhase;
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

/** The Status filter the current view locks — see `BillViewTab.statuses`. */
const lockedStatusesOf = (branch: BillsPhase, tab: string) => tabById(branch, tab).statuses;

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
  // The Filters menu, anchored under the bar's own Filters button — the other
  // pages' card, with this page's registry in it.
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
            <BillsViewMenu
              open={viewCard.open}
              onClose={() => viewCard.setOpen(false)}
              breakpoint="desktop"
              branch={branch}
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
      <BillsViewMenu
        open={viewMenuOpen}
        onClose={() => setViewMenuOpen(false)}
        breakpoint="mobile"
        branch={branch}
        settings={viewSettings}
        onSettingsChange={onViewSettingsChange}
        sort={sort}
        onSortChange={onSortChange}
      />
    </>
  );
}

// ---- layouts ---------------------------------------------------------------

interface ShellProps {
  bills: BillRow[];
  searchEmptied: boolean;
  search: string;
  onSearchChange: (next: string) => void;
  branch: BillsPhase;
  onBranchChange: (next: BillsPhase) => void;
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
  lockedStatuses: BadgeBillStatusStatus[];
  /**
   * The counted layers. Bills has ONE — the user's filters; the schedule
   * horizon is the Jobs page's alone, so the shared type's optional `horizon`
   * is left out and no copy about it is ever built.
   */
  hidden: HiddenCounts;
  /** MATCHING bills the filters hide from an empty search. */
  searchHidden: HiddenCounts;
  onNavigate: (next: Page) => void;
}

const DesktopShell = ({
  bills,
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
  <div className={styles.workArea}>
    <BillsTopBar branch={branch} onBranchChange={onBranchChange} />
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
      {bills.length > 0 ? (
        <BillsTable
          bills={bills}
          phase={branch}
          columnsState={viewSettings.columns}
          sort={sort}
          onSortChange={onSortChange}
        />
      ) : searchEmptied ? (
        <NoSearchResults
          noun={BILL_NOUN}
          hidden={searchHidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          onClearFilters={() => onSelectionChange([])}
          onClearSearch={() => onSearchChange("")}
        />
      ) : hidden.filters > 0 ? (
        <NoObjectsMatch
          noun={BILL_NOUN}
          hidden={hidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          onClearFilters={() => onSelectionChange([])}
        />
      ) : (
        <NoObjectsExist noun={BILL_NOUN} />
      )}
    </div>
    {/* AFTER the scroll container — the shared bar placement: below the last
        row while the list is short, at the screen bottom once it scrolls
        (the hug rule in Filters.module.scss). Only while the table
        SHOWS rows: empty, No Objects Match carries the count instead. */}
    {bills.length > 0 && (
      <HiddenDataBar
        noun={BILL_NOUN}
        hidden={hidden}
        viewHasLockedFilters={lockedStatuses.length > 0}
        onClearFilters={() => onSelectionChange([])}
      />
    )}
  </div>
);

const MobileShell = ({
  bills,
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
      <BillsTopBar mobile branch={branch} onBranchChange={onBranchChange} />
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
        {bills.length > 0 ? (
          <BillsTable
            bills={bills}
            phase={branch}
            columnsState={viewSettings.columns}
            sort={sort}
            onSortChange={onSortChange}
            mobile
          />
        ) : searchEmptied ? (
          <NoSearchResults
            noun={BILL_NOUN}
            hidden={searchHidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
            onClearSearch={() => onSearchChange("")}
          />
        ) : hidden.filters > 0 ? (
          <NoObjectsMatch
            noun={BILL_NOUN}
            hidden={hidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
          />
        ) : (
          <NoObjectsExist noun={BILL_NOUN} />
        )}
      </div>
      {/* Between the list and the bottom bar — the shared bar's mobile
          placement. Only while the table SHOWS rows. */}
      {bills.length > 0 && (
        <HiddenDataBar
          noun={BILL_NOUN}
          hidden={hidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          mobile
          onClearFilters={() => onSelectionChange([])}
        />
      )}
      <AppBottomBar page="bills" onNavigate={onNavigate} />
    </div>
  );
};

/** One shared empty list, so an untouched view keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

// ---- the page --------------------------------------------------------------

// What the view bar's keyword search MATCHES: the row's readable text — id,
// the vendor's name, the vendor's own invoice number and the status label —
// as a case-insensitive substring. The other pages' field-set rule, FLAGGED
// the same way: my choice, no node names one (production's `keywords` also
// covers the external PO reference and the addresses, which this list does
// not carry).
const searchHaystack = (bill: BillRow) =>
  [bill.id, vendorOf(bill).name, bill.vendorInvoiceId, billStatusLabel(displayStatus(bill))]
    .join(" ")
    .toLowerCase();

export interface BillsPageProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The sidebar / bottom bar navigation — the page owner switches. */
  onNavigate: (next: Page) => void;
}

// A TAB IS A VIEW here too: the sort, the View-menu settings, the filters and
// the search are all kept per view id and never carried between views, and
// the active view is remembered per branch — the other pages' rules, one for
// one.
const BillsPage = ({ breakpoint = "auto", onNavigate }: BillsPageProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  const [branch, setBranch] = useState<BillsPhase>("open");
  const [tabs, setTabs] = useState<Record<BillsPhase, string>>({ open: "all", closed: "closedAll" });
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
  // another — the other pages' rule, and the same shape of state.
  const [selections, setSelections] = useState<Record<string, FilterSelection>>({});
  const selection = selections[tab] ?? EMPTY_SELECTION;
  const setSelection = (next: FilterSelection) => setSelections((current) => ({ ...current, [tab]: next }));

  const [searches, setSearches] = useState<Record<string, string>>({});
  const search = searches[tab] ?? "";
  const setSearch = (next: string) => setSearches((current) => ({ ...current, [tab]: next }));

  // The TABLE lags the field — the other pages' rule, and for the same
  // reason: re-rendering the rows on every character makes typing feel slow.
  // See the `useDeferredValue` note in JobsPage.tsx.
  const deferredSearch = useDeferredValue(search);

  // The pipeline runs in LAYERS, the other pages' order — the one layer bills
  // do not have is the jobs-only schedule horizon:
  //
  //   branch bills → the view's LOCKED statuses → the USER's filters → the
  //   keyword search → the sort.
  //
  // Both status layers match on the DERIVED status (`displayStatus`), the
  // Invoices page's rule — the Overdue view and a locked "overdue" chip are
  // date questions the stored status cannot answer. Only the FILTERS layer is
  // counted: what the locked Status filter hides never counts (the Locked
  // "Status" Filter frame 14192-61579), so a locked view shows no Hidden Data
  // Bar until something else hides. The BRANCH is page context, not a filter,
  // so closed bills are never "hidden" on the open page.
  const { bills, searchEmptied, hidden, searchHidden } = useMemo(() => {
    const branchBills = BILL_ROWS.filter((bill) => branchStatuses(branch).includes(displayStatus(bill)));
    const locked = tabById(branch, tab).statuses;
    const afterLocked =
      locked.length > 0 ? branchBills.filter((bill) => locked.includes(displayStatus(bill))) : branchBills;
    const filtered = applyFilters(afterLocked, VIEW_FILTERS[tab]!, selection);
    const query = deferredSearch.trim().toLowerCase();
    const searched = query === "" ? filtered : filtered.filter((bill) => searchHaystack(bill).includes(query));
    // When the search leaves NOTHING, the Search empty state counts the
    // MATCHING bills the filters hide — the other pages' search-aware
    // numbers, so the count is exactly what its button would reveal.
    let searchHidden: HiddenCounts = { filters: 0 };
    if (query !== "" && searched.length === 0) {
      const matchesQuery = (bill: BillRow) => searchHaystack(bill).includes(query);
      // Locked-hidden matches stay invisible, the standing rule.
      searchHidden = {
        filters: afterLocked.filter(matchesQuery).length - filtered.filter(matchesQuery).length,
      };
    }
    return {
      bills: sortBills(searched, sort),
      searchEmptied: query !== "" && searched.length === 0 && filtered.length > 0,
      hidden: { filters: afterLocked.length - filtered.length } satisfies HiddenCounts,
      searchHidden,
    };
  }, [branch, tab, deferredSearch, sort, selection]);

  const shellProps: ShellProps = {
    bills,
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

export default BillsPage;
