import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import TopBarNav from "../../components/TopBarNav/TopBarNav";
import TopBarNavLeftElements from "../../components/TopBarNav/TopBarNavLeftElements";
import TopBarNavTitle from "../../components/TopBarNav/TopBarNavTitle";
import TopBarView from "../../components/TopBarView/TopBarView";
import ViewMenuModule from "../../modules/ViewMenu/ViewMenu";
import { ViewMenuColumnsState, ViewMenuView } from "../../modules/ViewMenu/ViewMenu.types";
import { PricebookStatus } from "../../data/db";
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import { noop } from "../../stories/helpers";

import { AppBottomBar, Page, useAnchoredCard, useSingleAxisScroll } from "./appShell";
import { FilterDef, FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard } from "./filterUI";
import { ListTable, TableColumnDef, TableSort, viewMenuAttributes, viewMenuColumns } from "./listTable";
import { ObjectNoun } from "./listData";
import { HiddenCounts, HiddenDataBar, NoObjectsExist, NoObjectsMatch, NoSearchResults } from "./viewStates";

import styles from "./Filters.module.scss";

// THE PRICEBOOK LIST — everything the five pricebook pages do the same way,
// which is everything except their columns, their filters and their rows.
//
// Shared on 2026-09-16, when Other, Discounts and Tax rates arrived and would
// otherwise have been the third, fourth and fifth copy of one 450-line page.
// Labor and Products were folded in with them (their measure sections prove
// the fold changed nothing). It is the `listTable` decision one level up: the
// SHELL is the same, the REGISTRY is what genuinely differs per object.
//
// What every pricebook list shares, and therefore lives here:
//
//   PHASES        Active · Inactive — production's `is_active`, the branch
//                 tabs in the top bar.
//   VIEWS         Active holds All / Review / Confirmed over the two-state
//                 status (production's boolean `confirmed`); Inactive holds
//                 one All. Review and Confirmed LOCK their status, and the
//                 status is named "Active" where the tab stays "Confirmed"
//                 (Daniel, 2026-09-16) — so the Confirmed view's fixed chip
//                 reads "Status is Active" on all five lists.
//   TITLE         the five pricebook types as sub-pages; picking one
//                 navigates (the Invoices ↔ Credit notes rule).
//   PINNING       production pins the description column alone, everywhere.
//   SORT          the Active "All" tab leads with the Review items
//                 (production's `confirmed,description`), every other tab
//                 reads name A-Z.
//   The rest      the view bar, the Filters menu / drawer / bar, the View
//                 menu, the empty states, the Hidden Data Bar, the keyword
//                 search pipeline — identical to every other list's.
//
// A new pricebook list is therefore a data door, a column registry, a filter
// registry and one `PricebookListConfig`.

/** The two branches (phases) every pricebook page switches between. */
export type PricebookPhase = "active" | "inactive";

// ---- the views -------------------------------------------------------------

interface PricebookViewTab {
  id: string;
  label: string;
  /** The statuses this view lists — and LOCKS (its fixed Status chip). Empty
   *  = the whole branch ("All"), which locks nothing. */
  statuses: PricebookStatus[];
}

interface PricebookBranch {
  id: PricebookPhase;
  label: string;
  tabs: PricebookViewTab[];
}

// Every pricebook canvas draws the same Views section, and each non-All view's
// fixed chip is read off its own annotation: All "All active … are listed"
// (locks nothing) · Review "'Review' is selected" · Confirmed "'Active' is
// selected" · Inactive All "All inactive … are listed" (locks nothing; an
// inactive item has no status).
const BRANCHES: PricebookBranch[] = [
  {
    id: "active",
    label: "Active",
    tabs: [
      { id: "all", label: "All", statuses: [] },
      { id: "review", label: "Review", statuses: ["review"] },
      { id: "confirmed", label: "Confirmed", statuses: ["active"] },
    ],
  },
  {
    id: "inactive",
    label: "Inactive",
    tabs: [{ id: "inactiveAll", label: "All", statuses: [] }],
  },
];

const branchById = (id: PricebookPhase) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

const tabById = (branch: PricebookPhase, id: string) => {
  const tabs = branchById(branch).tabs;
  return tabs.find((t) => t.id === id) ?? tabs[0]!;
};

const branchViews = (branch: PricebookPhase) =>
  branchById(branch).tabs.map((item) => ({ value: item.id, label: item.label }));

/** Every view of either branch, in one flat list — view ids are unique. */
const ALL_VIEWS = BRANCHES.flatMap((branch) => branch.tabs.map((tab) => ({ branch, tab })));

// ---- sorting ---------------------------------------------------------------

/**
 * The production defaults, per view: the Active "All" tab orders by
 * `confirmed,description` — the Review items FIRST, then name A-Z — and every
 * single-status tab by plain `description` (Daniel, 2026-09-16: "You keep the
 * sort").
 *
 * The INACTIVE "All" defaults to NAME, deliberately diverging from
 * production's `confirmed,description` there: its Status column is hidden (the
 * phase rule below), and a default sort on a column the phase does not offer
 * would make the View menu's Sort-by row display the wrong column. Nothing
 * visible changes — every inactive row is confirmed, so the two-key order IS
 * name A-Z.
 */
export const pricebookSortDefault = (tab: string): TableSort =>
  tab === "all" ? { column: "status", order: "ascending" } : { column: "name", order: "ascending" };

// Review sorts BEFORE Active — production's `confirmed` ascending (false
// first), which is what floats the review inbox to the top of "All".
export const PRICEBOOK_STATUS_RANK: Record<PricebookStatus, number> = { review: 0, active: 1 };

/**
 * The comparator every pricebook list sorts with: empty values last whichever
 * way the column points, numbers numerically, text naturally, and the row's
 * NAME as the tie-break — production's second key (`confirmed,description`).
 * Only the per-column readers differ, so they are the parameter.
 */
export function pricebookSorter<TRow>(
  keys: Record<string, (row: TRow) => string | number | null>,
  nameOf: (row: TRow) => string,
) {
  return (rows: TRow[], sort: TableSort): TRow[] => {
    const key = keys[sort.column] ?? nameOf;
    const direction = sort.order === "ascending" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const tie = () => nameOf(a).localeCompare(nameOf(b));
      const keyA = key(a);
      const keyB = key(b);
      const emptyA = keyA == null || keyA === "";
      const emptyB = keyB == null || keyB === "";
      if (emptyA || emptyB) return emptyA && emptyB ? tie() : emptyA ? 1 : -1;
      const compared =
        typeof keyA === "number" && typeof keyB === "number"
          ? keyA - keyB
          : String(keyA).localeCompare(String(keyB), "en", { numeric: true });
      return compared !== 0 ? compared * direction : tie();
    });
  };
}

// ---- what a list brings ----------------------------------------------------

/** One pricebook list, in the parts that genuinely differ between the five. */
export interface PricebookListConfig<TRow> {
  /** The sidebar / bottom-bar page id — also which sub-page reads as current. */
  page: Page;
  /** The top bar's title ("Labor", "Products", "Tax rates"). */
  title: string;
  noun: ObjectNoun;
  /** Every row of this type, in the neutral base order (name A-Z). */
  rows: TRow[];
  isActive: (row: TRow) => boolean;
  statusOf: (row: TRow) => PricebookStatus;
  /** React's key — a STABLE module-level function, never an inline lambda. */
  rowKey: (row: TRow) => string;
  /** ONE registry per phase: the Status filter is ACTIVE-phase only. */
  filters: Record<PricebookPhase, FilterDef<TRow>[]>;
  /** ONE registry per phase: the Status COLUMN is ACTIVE-phase only. */
  columns: Record<PricebookPhase, TableColumnDef<TRow>[]>;
  /** Built with `pricebookSorter` over the list's own column readers. */
  sortRows: (rows: TRow[], sort: TableSort) => TRow[];
  /** The Cards view's featured attributes, per phase (Cards stays disabled). */
  attributes: Record<PricebookPhase, string[]>;
  /** The row's readable text, lower-cased — what the keyword search matches. */
  search: (row: TRow) => string;
}

// The Pricebook stack's five types, in the sidebar's order. All five have a
// page since 2026-09-16, so picking any of them navigates.
const SUB_PAGES: { id: string; label: string; page: Page }[] = [
  { id: "labor", label: "Labor", page: "labor" },
  { id: "products", label: "Products", page: "products" },
  { id: "other", label: "Other", page: "other" },
  { id: "discounts", label: "Discounts", page: "discounts" },
  { id: "taxRates", label: "Tax rates", page: "taxRates" },
];

// ---- the list top bar ------------------------------------------------------

const PricebookTopBar = <TRow,>({
  config,
  mobile = false,
  branch,
  onBranchChange,
  onNavigate,
}: {
  config: PricebookListConfig<TRow>;
  mobile?: boolean;
  branch: PricebookPhase;
  onBranchChange: (next: PricebookPhase) => void;
  onNavigate: (next: Page) => void;
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
        onChange={(next) => onBranchChange(next as PricebookPhase)}
        aria-label={`Active or inactive ${config.noun.many}`}
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
      <TopBarNavTitle
        title={config.title}
        subPages={SUB_PAGES.map(({ id, label }) => ({ id, label }))}
        subPage={SUB_PAGES.find((entry) => entry.page === config.page)?.id ?? SUB_PAGES[0]!.id}
        onSubPageChange={(next) => {
          const target = SUB_PAGES.find((entry) => entry.id === next);
          if (target != null && target.page !== config.page) onNavigate(target.page);
        }}
      />
    </TopBarNavLeftElements>
  </TopBarNav>
);

// ---- the View menu (the shared module) --------------------------------------

/** Everything the View menu edits, kept PER VIEW like on the other pages. */
interface ViewSettings {
  view: ViewMenuView;
  columns: ViewMenuColumnsState;
  activeAttributes: string[];
}

// Production pins the description column alone, on every pricebook type.
const PINNED = ["name"];

const defaultViewSettings = <TRow,>(config: PricebookListConfig<TRow>, phase: PricebookPhase): ViewSettings => ({
  view: "table",
  // NOTHING starts hidden — every view of a phase shows every column its
  // phase has (Daniel, 2026-09-12).
  columns: {
    pinned: PINNED,
    unpinned: config.columns[phase].map((def) => def.key).filter((key) => !PINNED.includes(key)),
    hidden: [],
  },
  activeAttributes: config.attributes[phase],
});

// ---- the page --------------------------------------------------------------

export interface PricebookPageProps<TRow> {
  config: PricebookListConfig<TRow>;
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The sidebar / bottom bar navigation — the page owner switches. */
  onNavigate: (next: Page) => void;
}

/** One shared empty list, so an untouched view keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

export function PricebookPage<TRow>({ config, breakpoint = "auto", onNavigate }: PricebookPageProps<TRow>) {
  const isDesktop = useIsDesktop(breakpoint);
  const [branch, setBranch] = useState<PricebookPhase>("active");
  const [tabs, setTabs] = useState<Record<PricebookPhase, string>>({ active: "all", inactive: "inactiveAll" });
  const tab = tabs[branch];
  const setTab = (next: string) => setTabs((current) => ({ ...current, [branch]: next }));

  // Both maps are built ONCE per config — an untouched view must keep a
  // stable reference, or the memoised table re-renders on every keystroke
  // elsewhere. `config` is a module constant on every list, so the memo holds
  // for the life of the page.
  const { defaultSettings, viewFilters } = useMemo(
    () => ({
      defaultSettings: Object.fromEntries(
        ALL_VIEWS.map(({ branch: b, tab: t }) => [t.id, defaultViewSettings(config, b.id)] as const),
      ) as Record<string, ViewSettings>,
      viewFilters: Object.fromEntries(
        ALL_VIEWS.map(({ branch: b, tab: t }) => [t.id, config.filters[b.id]] as const),
      ) as Record<string, FilterDef<TRow>[]>,
    }),
    [config],
  );

  const [sorts, setSorts] = useState<Record<string, TableSort>>({});
  const sort = sorts[tab] ?? pricebookSortDefault(tab);
  const changeSort = useCallback(
    (key: string) =>
      setSorts((current) => {
        const active = current[tab] ?? pricebookSortDefault(tab);
        return {
          ...current,
          [tab]:
            active.column === key
              ? { column: key, order: active.order === "ascending" ? "descending" : "ascending" }
              : { column: key, order: "ascending" },
        };
      }),
    [tab],
  );

  const [viewSettings, setViewSettings] = useState<Record<string, ViewSettings>>({});
  const settings = viewSettings[tab] ?? defaultSettings[tab]!;
  const setSettings = (next: ViewSettings) => setViewSettings((current) => ({ ...current, [tab]: next }));

  const [selections, setSelections] = useState<Record<string, FilterSelection>>({});
  const selection = selections[tab] ?? EMPTY_SELECTION;
  const setSelection = (next: FilterSelection) => setSelections((current) => ({ ...current, [tab]: next }));

  const [searches, setSearches] = useState<Record<string, string>>({});
  const search = searches[tab] ?? "";
  const setSearch = (next: string) => setSearches((current) => ({ ...current, [tab]: next }));

  const deferredSearch = useDeferredValue(search);

  // The pipeline runs in LAYERS, every list's order:
  //
  //   the PHASE's items (`isActive`, not a status) → the view's LOCKED status
  //   → the USER's filters → the keyword search → the sort.
  //
  // Nothing is clock-derived on a pricebook list — the status is stored, so
  // the locked layer reads it directly. Only the FILTERS layer is counted (a
  // locked chip hides nothing that counts, the standing rule).
  const { items, searchEmptied, hidden, searchHidden } = useMemo(() => {
    const branchItems = config.rows.filter((row) => config.isActive(row) === (branch === "active"));
    const locked = tabById(branch, tab).statuses;
    const afterLocked =
      locked.length > 0 ? branchItems.filter((row) => locked.includes(config.statusOf(row))) : branchItems;
    const filtered = applyFilters(afterLocked, viewFilters[tab]!, selection);
    const query = deferredSearch.trim().toLowerCase();
    const searched = query === "" ? filtered : filtered.filter((row) => config.search(row).includes(query));
    let searchHidden: HiddenCounts = { filters: 0 };
    if (query !== "" && searched.length === 0) {
      const matchesQuery = (row: TRow) => config.search(row).includes(query);
      searchHidden = {
        filters: afterLocked.filter(matchesQuery).length - filtered.filter(matchesQuery).length,
      };
    }
    return {
      items: config.sortRows(searched, sort),
      searchEmptied: query !== "" && searched.length === 0 && filtered.length > 0,
      hidden: { filters: afterLocked.length - filtered.length } satisfies HiddenCounts,
      searchHidden,
    };
  }, [config, viewFilters, branch, tab, deferredSearch, sort, selection]);

  const lockedStatuses = tabById(branch, tab).statuses;
  const defs = viewFilters[tab]!;

  const table = (mobile: boolean) => (
    <ListTable
      rows={items}
      rowKey={config.rowKey}
      columns={config.columns[branch]}
      columnsState={settings.columns}
      sort={sort}
      onSortChange={changeSort}
      mobile={mobile}
    />
  );

  const viewMenu = (open: boolean, onClose: () => void, menuBreakpoint: "desktop" | "mobile") => (
    <ViewMenuModule
      open={open}
      onClose={onClose}
      breakpoint={menuBreakpoint}
      columns={viewMenuColumns(config.columns[branch])}
      columnsState={settings.columns}
      onColumnsStateChange={(columns) => setSettings({ ...settings, columns })}
      sort={{ key: sort.column, ascending: sort.order === "ascending" }}
      onSortChange={(next) =>
        setSorts((current) => ({
          ...current,
          [tab]: { column: next.key, order: next.ascending ? "ascending" : "descending" },
        }))
      }
      view={settings.view}
      onViewChange={(view) => setSettings({ ...settings, view })}
      disabledViews={["cards"]}
      attributes={viewMenuAttributes(config.columns[branch])}
      activeAttributes={settings.activeAttributes}
      onActiveAttributesChange={(activeAttributes) => setSettings({ ...settings, activeAttributes })}
    />
  );

  // The list's body: the table, or whichever empty state the pipeline landed
  // on. Written once and rendered by both shells.
  const body =
    items.length > 0 ? null : searchEmptied ? (
      <NoSearchResults
        noun={config.noun}
        hidden={searchHidden}
        viewHasLockedFilters={lockedStatuses.length > 0}
        onClearFilters={() => setSelection([])}
        onClearSearch={() => setSearch("")}
      />
    ) : hidden.filters > 0 ? (
      <NoObjectsMatch
        noun={config.noun}
        hidden={hidden}
        viewHasLockedFilters={lockedStatuses.length > 0}
        onClearFilters={() => setSelection([])}
      />
    ) : (
      <NoObjectsExist noun={config.noun} />
    );

  const hiddenBar = (mobile: boolean) =>
    items.length > 0 ? (
      <HiddenDataBar
        noun={config.noun}
        hidden={hidden}
        viewHasLockedFilters={lockedStatuses.length > 0}
        mobile={mobile || undefined}
        onClearFilters={() => setSelection([])}
      />
    ) : null;

  return isDesktop ? (
    <DesktopShell
      config={config}
      branch={branch}
      onBranchChange={setBranch}
      tab={tab}
      onTabChange={setTab}
      search={search}
      onSearchChange={setSearch}
      selection={selection}
      onSelectionChange={setSelection}
      defs={defs}
      lockedStatuses={lockedStatuses}
      viewMenu={viewMenu}
      table={table}
      body={body}
      hiddenBar={hiddenBar}
      onNavigate={onNavigate}
    />
  ) : (
    <MobileShell
      config={config}
      branch={branch}
      onBranchChange={setBranch}
      tab={tab}
      onTabChange={setTab}
      search={search}
      onSearchChange={setSearch}
      selection={selection}
      onSelectionChange={setSelection}
      defs={defs}
      lockedStatuses={lockedStatuses}
      viewMenu={viewMenu}
      table={table}
      body={body}
      hiddenBar={hiddenBar}
      onNavigate={onNavigate}
    />
  );
}

// ---- the two shells ---------------------------------------------------------

interface ShellProps<TRow> {
  config: PricebookListConfig<TRow>;
  branch: PricebookPhase;
  onBranchChange: (next: PricebookPhase) => void;
  tab: string;
  onTabChange: (next: string) => void;
  search: string;
  onSearchChange: (next: string) => void;
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  defs: FilterDef<TRow>[];
  lockedStatuses: PricebookStatus[];
  viewMenu: (open: boolean, onClose: () => void, breakpoint: "desktop" | "mobile") => JSX.Element;
  table: (mobile: boolean) => JSX.Element;
  body: JSX.Element | null;
  hiddenBar: (mobile: boolean) => JSX.Element | null;
  onNavigate: (next: Page) => void;
}

function DesktopShell<TRow>({
  config,
  branch,
  onBranchChange,
  tab,
  onTabChange,
  search,
  onSearchChange,
  selection,
  onSelectionChange,
  defs,
  lockedStatuses,
  viewMenu,
  table,
  body,
  hiddenBar,
  onNavigate,
}: ShellProps<TRow>) {
  const viewCard = useAnchoredCard("right", "[data-floating-list]");
  const filtersCard = useAnchoredCard("right", "[data-concept-filters-sub]");
  return (
    <div className={styles.workArea}>
      <PricebookTopBar config={config} branch={branch} onBranchChange={onBranchChange} onNavigate={onNavigate} />
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
        defs={defs}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      {viewCard.pos != null &&
        createPortal(
          <div ref={viewCard.cardRef} className={styles.filtersSub} style={viewCard.pos}>
            {viewMenu(viewCard.open, () => viewCard.setOpen(false), "desktop")}
          </div>,
          document.body,
        )}
      {/* Only rendered while something is applied. The Review and Confirmed
          views always carry their fixed Status chip. */}
      <FilterBar
        defs={defs}
        lockedStatuses={lockedStatuses}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      <div className={styles.mainArea}>{body ?? table(false)}</div>
      {hiddenBar(false)}
    </div>
  );
}

function MobileShell<TRow>({
  config,
  branch,
  onBranchChange,
  tab,
  onTabChange,
  search,
  onSearchChange,
  selection,
  onSelectionChange,
  defs,
  lockedStatuses,
  viewMenu,
  table,
  body,
  hiddenBar,
  onNavigate,
}: ShellProps<TRow>) {
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const tableRef = useSingleAxisScroll(true);
  // The MOBILE Filters count counts the view's LOCKED Status filter as well —
  // the other pages' rule.
  const activeCount = activeFilterCount(selection) + (lockedStatuses.length > 0 ? 1 : 0);
  return (
    <div className={styles.mobile}>
      <PricebookTopBar config={config} mobile branch={branch} onBranchChange={onBranchChange} onNavigate={onNavigate} />
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
        defs={defs}
        selection={selection}
        onSelectionChange={onSelectionChange}
        lockedStatuses={lockedStatuses}
      />
      {viewMenu(viewMenuOpen, () => setViewMenuOpen(false), "mobile")}
      <div className={styles.mainArea} ref={tableRef}>
        {body ?? table(true)}
      </div>
      {hiddenBar(true)}
      <AppBottomBar page={config.page} onNavigate={onNavigate} />
    </div>
  );
}
