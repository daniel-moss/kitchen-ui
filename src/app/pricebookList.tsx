import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import TabGroup from "../components/Tabs/TabGroup";
import TabItem from "../components/Tabs/TabItem";
import TopBarNav from "../components/TopBarNav/TopBarNav";
import TopBarNavLeftElements from "../components/TopBarNav/TopBarNavLeftElements";
import TopBarNavRightElements from "../components/TopBarNav/TopBarNavRightElements";
import TopBarNavTitle from "../components/TopBarNav/TopBarNavTitle";
import TopBarView from "../components/TopBarView/TopBarView";
import ViewMenuModule from "../modules/ViewMenu/ViewMenu";
import { ViewMenuColumnsState, ViewMenuView } from "../modules/ViewMenu/ViewMenu.types";
import { PricebookStatus } from "../data/db";
import useIsDesktop, { Breakpoint } from "../hooks/useIsDesktop";
import { noop } from "../stories/helpers";

import { AppBottomBar, Page, useAnchoredCard, useSingleAxisScroll } from "./shell/appShell";
import { FilterDef, FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard } from "./filterUI";
import { ListTable, TableColumnDef, TableSort, viewMenuAttributes, viewMenuColumns } from "./listTable";
import { ObjectNoun } from "./listData";
import { HiddenCounts, HiddenDataBar, NoObjectsExist, NoObjectsMatch, NoSearchResults } from "./viewStates";

import styles from "./App.module.scss";

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
//   TITLE         names the list only. The five pricebook types are reached
//                 from the sidebar (TopBarNav rebuild, 2026-10-01).
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
      { id: "all", label: "All active", statuses: [] },
      { id: "review", label: "Review", statuses: ["review"] },
      { id: "confirmed", label: "Confirmed", statuses: ["active"] },
    ],
  },
  {
    id: "inactive",
    label: "Inactive",
    tabs: [{ id: "inactiveAll", label: "All inactive", statuses: [] }],
  },
];

const branchById = (id: PricebookPhase) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

const tabById = (branch: PricebookPhase, id: string) => {
  const tabs = branchById(branch).tabs;
  return tabs.find((t) => t.id === id) ?? tabs[0]!;
};

// A view's ROWS — the branch's items, narrowed by the view's locked statuses.
// The list's pipeline starts here.
const viewRows = <TRow,>(config: PricebookListConfig<TRow>, rows: TRow[], branch: PricebookPhase, tab: string) => {
  const branchItems = rows.filter((row) => config.isActive(row) === (branch === "active"));
  const locked = tabById(branch, tab).statuses;
  return locked.length > 0 ? branchItems.filter((row) => locked.includes(config.statusOf(row))) : branchItems;
};

/**
 * The branch's views as TopBarView views, each with its counter. The counter
 * is what the view SHOWS (Daniel, 2026-10-26 — it was the view's total
 * before): its rows after its own filters and its own search. A view owns
 * those, so changing them moves that view's counter only. The list counts
 * (`viewCounts`); see JobsPage.tsx.
 */
const branchViews = (branch: PricebookPhase, counts: Record<string, number>) =>
  branchById(branch).tabs.map((item) => ({
    value: item.id,
    label: item.label,
    count: counts[item.id] ?? 0,
  }));

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
  /** The top bar's title ("Labor rates", "Products", "Tax rates"). */
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
  { id: "labor", label: "Labor rates", page: "labor" },
  { id: "products", label: "Products", page: "products" },
  { id: "other", label: "Other charges", page: "other" },
  { id: "discounts", label: "Discounts", page: "discounts" },
  { id: "taxRates", label: "Tax rates", page: "taxRates" },
];

// ---- the list top bar ------------------------------------------------------

const PricebookTopBar = <TRow,>({
  config,
  mobile = false,
  branch,
  onBranchChange,
  onCreate = noop,
}: {
  config: PricebookListConfig<TRow>;
  mobile?: boolean;
  branch: PricebookPhase;
  onBranchChange: (next: PricebookPhase) => void;
  onCreate?: () => void;
}) => (
  <TopBarNav
    className={styles.topBar}
    breakpoint={mobile ? "mobile" : "desktop"}
    actions={
      <TopBarNavRightElements
        onSearch={mobile ? undefined : noop}
        onCreate={onCreate}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    }
    tabs={
      <TabGroup
        variant="pill"
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
      <TopBarNavTitle title={config.title} />
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
  /**
   * The rows to show. Defaults to the config's frozen seed; a list whose
   * records can be edited or created passes the app store's array instead
   * (Tax rates is the first).
   */
  rows?: TRow[];
  /** The top bar's "New" button. Without one the button does nothing. */
  onCreate?: () => void;
  /**
   * A row click — opens the object. Keep the reference STABLE (`useCallback`):
   * the table is memoised, and a new lambda each render defeats it.
   */
  onRowClick?: (row: TRow) => void;
  /**
   * DESKTOP — the key of the row whose side panel is open (Daniel,
   * 2026-11-23: "easier to scan and navigate"). With it:
   *   - that row stays PRESSED;
   *   - clicking it again calls `onDeselect` (closes the panel); clicking
   *     another row calls `onRowClick` (the panel switches);
   *   - ↑ / ↓ move to the previous / next row in the table's CURRENT order
   *     (tab, filters, search, sort) — `onRowClick` with that row — and stop
   *     at the ends. Not while typing in a field, and not while a modal
   *     (an edit form, a Prompt, a menu) has the focus.
   * Leaving the page calls `onDeselect` too. The panel itself must be
   * NON-MODAL (SidePanel `isModal={false}`), or the page is unreachable.
   */
  selectedKey?: string | null;
  /** Closes what `selectedKey` opened — see `selectedKey`. */
  onDeselect?: () => void;
}

/** Is a key press meant for a field, not for the list? */
const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * Is the focus somewhere the list's ↑ / ↓ may act — the page itself (a row,
 * nothing focused) or the non-modal side panel? Anything else that holds the
 * focus is a modal on top (it traps the focus), so the keys are its own.
 */
const focusAllowsListKeys = () => {
  const active = document.activeElement;
  return (
    active == null ||
    active === document.body ||
    active.closest('[role="row"]') != null ||
    active.closest('[data-side-panel="non-modal"]') != null
  );
};

/** One shared empty list, so an untouched view keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

export function PricebookPage<TRow>({
  config,
  breakpoint = "auto",
  onNavigate,
  rows = config.rows,
  onCreate,
  onRowClick,
  selectedKey = null,
  onDeselect,
}: PricebookPageProps<TRow>) {
  const isDesktop = useIsDesktop(breakpoint);
  // Desktop only: the mobile panel fills the screen, so there is nothing to
  // keep pressed and no arrow keys.
  const activeKey = isDesktop ? selectedKey : null;
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
    const afterLocked = viewRows(config, rows, branch, tab);
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
  }, [config, rows, viewFilters, branch, tab, deferredSearch, sort, selection]);

  // The TAB COUNTERS (Daniel, 2026-10-26): every view of the branch, run
  // through the table's layers with THAT view's own filters and search. The
  // current view reads the DEFERRED search, so its counter settles with the
  // table. See JobsPage.tsx.
  const viewCounts = useMemo(
    () =>
      Object.fromEntries(
        branchById(branch).tabs.map(({ id }) => {
          const filtered = applyFilters(
            viewRows(config, rows, branch, id),
            viewFilters[id]!,
            selections[id] ?? EMPTY_SELECTION,
          );
          const query = (id === tab ? deferredSearch : (searches[id] ?? "")).trim().toLowerCase();
          return [id, query === "" ? filtered.length : filtered.filter((row) => config.search(row).includes(query)).length];
        }),
      ),
    [config, rows, viewFilters, branch, tab, selections, searches, deferredSearch],
  );

  const lockedStatuses = tabById(branch, tab).statuses;
  const defs = viewFilters[tab]!;

  // ---- the open row: pressed, toggled by a second click, moved with ↑ / ↓ ----

  // Stable, like `onRowClick` itself — the table is memoised.
  const { rowKey } = config;
  const clickRow = useCallback(
    (row: TRow) => {
      if (activeKey != null && rowKey(row) === activeKey) onDeselect?.();
      else onRowClick?.(row);
    },
    [activeKey, rowKey, onDeselect, onRowClick],
  );

  // The handlers read the latest rows / callbacks through a ref, so the key
  // listener is attached once per open panel, not on every render.
  const latest = useRef({ items, activeKey, onRowClick, onDeselect });
  latest.current = { items, activeKey, onRowClick, onDeselect };

  useEffect(() => {
    if (activeKey == null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (isTypingTarget(event.target) || !focusAllowsListKeys()) return;
      const { items: list, activeKey: key, onRowClick: open } = latest.current;
      const index = list.findIndex((row) => rowKey(row) === key);
      if (index === -1) return;
      const next = list[index + (event.key === "ArrowDown" ? 1 : -1)];
      event.preventDefault();
      // Keyboard navigation hides the mouse hover until the pointer really
      // moves (TableRow's `html[data-keyboard-nav]` rule).
      document.documentElement.dataset.keyboardNav = "";
      // At the first / last row the keys stop.
      if (next != null) open?.(next);
    };
    // Only a REAL move ends it: scrolling the pressed row into view can make
    // the browser report the pointer over another row without it moving.
    const onPointerMove = (event: PointerEvent) => {
      if (event.movementX !== 0 || event.movementY !== 0) delete document.documentElement.dataset.keyboardNav;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [activeKey, rowKey]);

  // The hover comes back once the panel is closed (or the page left), even
  // without a mouse move.
  useEffect(() => {
    if (activeKey == null) delete document.documentElement.dataset.keyboardNav;
  }, [activeKey]);
  useEffect(() => () => void delete document.documentElement.dataset.keyboardNav, []);

  // The pressed row follows the keys: it scrolls into view and takes the
  // focus, so the next ↑ / ↓ starts from it. Only when the focus is already
  // on the list — a click inside the panel must not pull it back.
  useEffect(() => {
    if (activeKey == null) return;
    const frame = requestAnimationFrame(() => {
      const row = document.querySelector<HTMLElement>('[role="row"][aria-selected="true"]');
      if (row == null) return;
      row.scrollIntoView({ block: "nearest" });
      if (document.activeElement?.closest('[role="row"]') != null) row.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeKey]);

  // Leaving the page closes the panel ("Leaving the page closes the panel").
  useEffect(() => () => latest.current.onDeselect?.(), []);

  const table = (mobile: boolean) => (
    <ListTable
      rows={items}
      rowKey={config.rowKey}
      columns={config.columns[branch]}
      columnsState={settings.columns}
      sort={sort}
      onSortChange={changeSort}
      onRowClick={clickRow}
      pressedKey={mobile ? null : activeKey}
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
      viewCounts={viewCounts}
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
      onCreate={onCreate}
    />
  ) : (
    <MobileShell
      config={config}
      branch={branch}
      onBranchChange={setBranch}
      tab={tab}
      onTabChange={setTab}
      viewCounts={viewCounts}
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
      onCreate={onCreate}
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
  /** Each view's tab counter, keyed by view id — see `branchViews`. */
  viewCounts: Record<string, number>;
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
  /** The top bar's "New" button. */
  onCreate?: () => void;
}

function DesktopShell<TRow>({
  config,
  branch,
  onBranchChange,
  tab,
  onTabChange,
  viewCounts,
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
  onCreate,
}: ShellProps<TRow>) {
  const viewCard = useAnchoredCard("right", "[data-floating-list]");
  const filtersCard = useAnchoredCard("right", "[data-concept-filters-sub]");
  return (
    <div className={styles.workArea}>
      <PricebookTopBar config={config} branch={branch} onBranchChange={onBranchChange} onCreate={onCreate} />
      <TopBarView
        className={styles.viewBar}
        breakpoint="desktop"
        views={branchViews(branch, viewCounts)}
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
  viewCounts,
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
  onCreate,
}: ShellProps<TRow>) {
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const tableRef = useSingleAxisScroll(true);
  // The MOBILE Filters count counts the view's LOCKED Status filter as well —
  // the other pages' rule.
  const activeCount = activeFilterCount(selection) + (lockedStatuses.length > 0 ? 1 : 0);
  return (
    <div className={styles.mobile}>
      <PricebookTopBar config={config} mobile branch={branch} onBranchChange={onBranchChange} onCreate={onCreate} />
      <TopBarView
        className={styles.viewBar}
        breakpoint="mobile"
        views={branchViews(branch, viewCounts)}
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
