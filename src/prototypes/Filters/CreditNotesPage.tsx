import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { BadgeCreditNoteStatusStatus } from "../../components/Badge/BadgeCreditNoteStatus";
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
import { CREDIT_NOTE_FILTERS, CreditNotesPhase } from "./creditNoteFilters";
import {
  CreditNotesTable,
  SortColumn,
  TABLE_COLUMNS,
  TableSort,
  VIEW_ATTRIBUTES,
  VIEW_COLUMNS,
  sortDefault,
  sortCreditNotes,
} from "./creditNotesTable";
import { FilterDef, FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard } from "./filterUI";
import {
  CREDIT_NOTE_ROWS,
  CreditNoteRow,
  clientOf,
  creditNoteStatusLabel,
  typeLabelOf,
} from "./creditNotesData";
import { CREDIT_NOTE_NOUN } from "./listData";
import { HiddenCounts, HiddenDataBar, NoObjectsExist, NoObjectsMatch, NoSearchResults } from "./viewStates";

import styles from "./Filters.module.scss";

// The CREDIT NOTES list page — added 2026-09-14 (Daniel: "Add 'Credit notes'
// table, filters and view settings to the 'Filters' prototype"), against his
// Credit Notes Figma page (14759-68515, the "View - Next Update" file). The
// same shell as the other three pages — the DS SidebarNav / TopBarNav /
// TopBarView / Table over the shared app-shell chrome — with the VIEWS and
// FILTERS read off the Figma page and the TABLE off production
// (CreditNoteTableView + defaultTableViewConfig's credit_notes_table__*
// views, which share one column set):
//
//   BRANCH tabs   Open · Closed — production's phases.
//   VIEW tabs     Open: All; Closed: All / Issued / Voided — the Figma Views
//                 section (14759-68516). The Pending view was REMOVED later
//                 on 2026-09-14 (Daniel: "Since they have the same objects,
//                 the 'Pending' view is redundant" — the open branch IS
//                 draft + unsent, so Pending listed exactly what All did).
//                 Issued and Voided lock their one status each; the Alls
//                 lock nothing.
//   Table         the production column set (widths and order); "Date Issued"
//                 heads as "Issued", the Invoices list's name for the same
//                 field. The TYPE column is CLOSED-phase only (Daniel,
//                 2026-09-14) — see TABLE_COLUMNS.
//   View menu     the shared module, fully functional: columns show / hide /
//                 pin / reorder, Sort by, Table / Cards switcher. NO Schedule
//                 horizon row and NO Timeline view (both jobs-only); Cards
//                 disabled the same way. It offers the PHASE's own columns.
//   Filters       the menu node's rows (14759-68604) — five shared templates
//                 and the list's own Status everywhere, plus its own Type on
//                 the CLOSED phase alone. See creditNoteFilters.tsx.
//
//   ONE registry per PHASE: Status's options differ between the branches,
//   and Type exists only on the closed one.

// ---- the view bar's tabs ---------------------------------------------------

// A view lists credit notes by their STATUS — the one the badge shows — the
// other pages' rule. The PHASE follows from it: a branch holds the union of
// its views' statuses, so the two levels can never disagree.
interface CreditNoteViewTab {
  id: string;
  label: string;
  /** The statuses this view lists — and LOCKS (its fixed Status chip). Empty
   *  = the whole branch ("All"), which locks nothing. */
  statuses: BadgeCreditNoteStatusStatus[];
}

interface CreditNoteBranch {
  id: CreditNotesPhase;
  label: string;
  /**
   * The statuses the PHASE holds — what its "All" view lists. Declared on the
   * branch (the other pages derive it as the union of the views' statuses —
   * impossible here since the open phase's only view is "All", which locks
   * nothing). The filter registry's `CREDIT_NOTE_PHASE_STATUSES` names the
   * same sets; if one changes, change the other.
   */
  statuses: BadgeCreditNoteStatusStatus[];
  tabs: CreditNoteViewTab[];
}

// The Views section (14759-68516), each view's locked chip read off its
// annotation: All Open "All open credit notes are listed" (locks nothing —
// and it is the open phase's ONLY view since later on 2026-09-14: Daniel
// removed the Pending frame, "Since they have the same objects, the
// 'Pending' view is redundant") · All Closed (locks nothing) · Issued ·
// Voided, one status each. The open phase still needs its statuses listed
// here — they are what the branch shows.
const BRANCHES: CreditNoteBranch[] = [
  {
    id: "open",
    label: "Open",
    // Draft + unsent — production's `status=pending`, the whole branch.
    statuses: ["draft", "unsent"],
    tabs: [{ id: "all", label: "All", statuses: [] }],
  },
  {
    id: "closed",
    label: "Closed",
    statuses: ["issued", "voided"],
    tabs: [
      { id: "closedAll", label: "All", statuses: [] },
      { id: "issued", label: "Issued", statuses: ["issued"] },
      { id: "voided", label: "Voided", statuses: ["voided"] },
    ],
  },
];

const branchById = (id: CreditNotesPhase) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

const tabById = (branch: CreditNotesPhase, id: string) => {
  const tabs = branchById(branch).tabs;
  return tabs.find((t) => t.id === id) ?? tabs[0]!;
};

/** The PHASE's whole status set — declared on the branch, see `CreditNoteBranch`. */
const branchStatuses = (branch: CreditNotesPhase) => branchById(branch).statuses;

const branchViews = (branch: CreditNotesPhase) =>
  branchById(branch).tabs.map((item) => ({ value: item.id, label: item.label }));

// ---- the list top bar ------------------------------------------------------

// The other pages' TopBar, for credit notes: the DS TopBarNav `list` variant
// with the [Open · Closed] branch tabs in its `tabs` slot. The title carries
// the sidebar stack's sub-pages — "Invoices" / "Credit notes" — and since
// this page exists, PICKING the other one NAVIGATES there (the title's own
// SelectList; the Invoices page does the same back).
const CreditNotesTopBar = ({
  mobile = false,
  branch,
  onBranchChange,
  onNavigate,
}: {
  mobile?: boolean;
  branch: CreditNotesPhase;
  onBranchChange: (next: CreditNotesPhase) => void;
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
        onChange={(next) => onBranchChange(next as CreditNotesPhase)}
        aria-label="Open or closed credit notes"
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
        title="Credit notes"
        subPages={[
          { id: "invoices", label: "Invoices" },
          { id: "credit-notes", label: "Credit notes" },
        ]}
        subPage="credit-notes"
        onSubPageChange={(id) => {
          if (id === "invoices") onNavigate("invoices");
        }}
      />
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
// The column lists it is fed come from creditNotesTable.tsx's own registry.

/** Everything the View menu edits, kept PER VIEW like on the other pages. */
interface ViewSettings {
  view: ViewMenuView;
  columns: ViewMenuColumnsState;
  activeAttributes: string[];
}

const defaultViewSettings = (phase: CreditNotesPhase): ViewSettings => ({
  view: "table",
  // The production default: ID and Client pinned, the rest in the PHASE's
  // registry order (the open phase has no Type column). NOTHING starts
  // hidden — every view of a phase shows every column its phase has
  // (Daniel, 2026-09-12).
  columns: {
    pinned: ["id", "client"],
    unpinned: TABLE_COLUMNS[phase].map((def) => def.key).filter((key) => key !== "id" && key !== "client"),
    hidden: [],
  },
  activeAttributes: ["status", "client", "total"],
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
const VIEW_FILTERS: Record<string, FilterDef<CreditNoteRow>[]> = Object.fromEntries(
  ALL_VIEWS.map(({ branch, tab }) => [tab.id, CREDIT_NOTE_FILTERS[branch.id]] as const),
);

interface CreditNotesViewMenuProps {
  open: boolean;
  onClose: () => void;
  breakpoint: "desktop" | "mobile";
  /** The branch the page is on — the menu offers the PHASE's own columns. */
  branch: CreditNotesPhase;
  settings: ViewSettings;
  onSettingsChange: (next: ViewSettings) => void;
  /** The same per-view sort the header cells edit — one state, two editors. */
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
}

const CreditNotesViewMenu = ({ open, onClose, breakpoint, branch, settings, onSettingsChange, sort, onSortChange }: CreditNotesViewMenuProps) => (
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
  branch: CreditNotesPhase;
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

/** The Status filter the current view locks — see `CreditNoteViewTab.statuses`. */
const lockedStatusesOf = (branch: CreditNotesPhase, tab: string) => tabById(branch, tab).statuses;

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
            <CreditNotesViewMenu
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
      <CreditNotesViewMenu
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
  creditNotes: CreditNoteRow[];
  searchEmptied: boolean;
  search: string;
  onSearchChange: (next: string) => void;
  branch: CreditNotesPhase;
  onBranchChange: (next: CreditNotesPhase) => void;
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
  lockedStatuses: BadgeCreditNoteStatusStatus[];
  /**
   * The counted layers. Credit notes has ONE — the user's filters; the
   * schedule horizon is the Jobs page's alone, so the shared type's optional
   * `horizon` is left out and no copy about it is ever built.
   */
  hidden: HiddenCounts;
  /** MATCHING credit notes the filters hide from an empty search. */
  searchHidden: HiddenCounts;
  onNavigate: (next: Page) => void;
}

const DesktopShell = ({
  creditNotes,
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
}: ShellProps) => (
  // The WORK AREA only — `Filters` renders the sidebar once, outside the page
  // switch, so it survives a move between pages and its stack can animate shut.
  <div className={styles.workArea}>
    <CreditNotesTopBar branch={branch} onBranchChange={onBranchChange} onNavigate={onNavigate} />
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
      {creditNotes.length > 0 ? (
        <CreditNotesTable
          creditNotes={creditNotes}
          phase={branch}
          columnsState={viewSettings.columns}
          sort={sort}
          onSortChange={onSortChange}
        />
      ) : searchEmptied ? (
        <NoSearchResults
          noun={CREDIT_NOTE_NOUN}
          hidden={searchHidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          onClearFilters={() => onSelectionChange([])}
          onClearSearch={() => onSearchChange("")}
        />
      ) : hidden.filters > 0 ? (
        <NoObjectsMatch
          noun={CREDIT_NOTE_NOUN}
          hidden={hidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          onClearFilters={() => onSelectionChange([])}
        />
      ) : (
        <NoObjectsExist noun={CREDIT_NOTE_NOUN} />
      )}
    </div>
    {/* AFTER the scroll container — the shared bar placement: below the last
        row while the list is short, at the screen bottom once it scrolls
        (the hug rule in Filters.module.scss). Only while the table
        SHOWS rows: empty, No Objects Match carries the count instead. */}
    {creditNotes.length > 0 && (
      <HiddenDataBar
        noun={CREDIT_NOTE_NOUN}
        hidden={hidden}
        viewHasLockedFilters={lockedStatuses.length > 0}
        onClearFilters={() => onSelectionChange([])}
      />
    )}
  </div>
);

const MobileShell = ({
  creditNotes,
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
      <CreditNotesTopBar mobile branch={branch} onBranchChange={onBranchChange} onNavigate={onNavigate} />
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
        {creditNotes.length > 0 ? (
          <CreditNotesTable
            creditNotes={creditNotes}
            phase={branch}
            columnsState={viewSettings.columns}
            sort={sort}
            onSortChange={onSortChange}
            mobile
          />
        ) : searchEmptied ? (
          <NoSearchResults
            noun={CREDIT_NOTE_NOUN}
            hidden={searchHidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
            onClearSearch={() => onSearchChange("")}
          />
        ) : hidden.filters > 0 ? (
          <NoObjectsMatch
            noun={CREDIT_NOTE_NOUN}
            hidden={hidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
          />
        ) : (
          <NoObjectsExist noun={CREDIT_NOTE_NOUN} />
        )}
      </div>
      {/* Between the list and the bottom bar — the shared bar's mobile
          placement. Only while the table SHOWS rows. */}
      {creditNotes.length > 0 && (
        <HiddenDataBar
          noun={CREDIT_NOTE_NOUN}
          hidden={hidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          mobile
          onClearFilters={() => onSelectionChange([])}
        />
      )}
      <AppBottomBar page="creditNotes" onNavigate={onNavigate} />
    </div>
  );
};

/** One shared empty list, so an untouched view keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

// ---- the page --------------------------------------------------------------

// What the view bar's keyword search MATCHES: the row's readable text — id,
// the linked invoice's id, client, the status label and the type label — as a
// case-insensitive substring. The other pages' field-set rule, FLAGGED the
// same way: my choice, no node names one.
const searchHaystack = (creditNote: CreditNoteRow) =>
  [
    creditNote.id,
    creditNote.invoiceId ?? "",
    clientOf(creditNote).name,
    creditNoteStatusLabel(creditNote.status),
    typeLabelOf(creditNote),
  ]
    .join(" ")
    .toLowerCase();

export interface CreditNotesPageProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The sidebar / bottom bar navigation — the page owner switches. */
  onNavigate: (next: Page) => void;
}

// A TAB IS A VIEW here too: the sort, the View-menu settings, the filters and
// the search are all kept per view id and never carried between views, and
// the active view is remembered per branch — the other pages' rules, one for
// one.
const CreditNotesPage = ({ breakpoint = "auto", onNavigate }: CreditNotesPageProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  const [branch, setBranch] = useState<CreditNotesPhase>("open");
  const [tabs, setTabs] = useState<Record<CreditNotesPhase, string>>({ open: "all", closed: "closedAll" });
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

  // The pipeline runs in LAYERS, the other pages' order — the one layer
  // credit notes do not have is the jobs-only schedule horizon:
  //
  //   branch credit notes → the view's LOCKED statuses → the USER's filters →
  //   the keyword search → the sort.
  //
  // Only the FILTERS layer is counted: what the locked Status filter hides
  // never counts (the Locked "Status" Filter frame 14192-61579), so a locked
  // view shows no Hidden Data Bar until something else hides, and a view
  // whose locked filter alone leaves nothing shows No Objects Exist rather
  // than No Objects Match. The BRANCH is page context, not a filter, so
  // closed credit notes are never "hidden" on the open page.
  const { creditNotes, searchEmptied, hidden, searchHidden } = useMemo(() => {
    const branchCreditNotes = CREDIT_NOTE_ROWS.filter((creditNote) =>
      branchStatuses(branch).includes(creditNote.status),
    );
    const locked = tabById(branch, tab).statuses;
    const afterLocked =
      locked.length > 0
        ? branchCreditNotes.filter((creditNote) => locked.includes(creditNote.status))
        : branchCreditNotes;
    const filtered = applyFilters(afterLocked, VIEW_FILTERS[tab]!, selection);
    const query = deferredSearch.trim().toLowerCase();
    const searched =
      query === "" ? filtered : filtered.filter((creditNote) => searchHaystack(creditNote).includes(query));
    // When the search leaves NOTHING, the Search empty state counts the
    // MATCHING credit notes the filters hide — the other pages' search-aware
    // numbers, so the count is exactly what its button would reveal.
    let searchHidden: HiddenCounts = { filters: 0 };
    if (query !== "" && searched.length === 0) {
      const matchesQuery = (creditNote: CreditNoteRow) => searchHaystack(creditNote).includes(query);
      // Locked-hidden matches stay invisible, the standing rule.
      searchHidden = {
        filters: afterLocked.filter(matchesQuery).length - filtered.filter(matchesQuery).length,
      };
    }
    return {
      creditNotes: sortCreditNotes(searched, sort),
      searchEmptied: query !== "" && searched.length === 0 && filtered.length > 0,
      hidden: { filters: afterLocked.length - filtered.length } satisfies HiddenCounts,
      searchHidden,
    };
  }, [branch, tab, deferredSearch, sort, selection]);

  const shellProps: ShellProps = {
    creditNotes,
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

export default CreditNotesPage;
