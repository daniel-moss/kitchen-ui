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
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import { noop } from "../../stories/helpers";

import { AppBottomBar, Page, useAnchoredCard, useSingleAxisScroll } from "./appShell";
import { SERIES_FILTERS } from "./seriesFilters";
import {
  SeriesTable,
  SortColumn,
  TABLE_COLUMNS,
  TableSort,
  VIEW_ATTRIBUTES,
  VIEW_COLUMNS,
  sortDefault,
  sortSeries,
} from "./seriesTable";
import { FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard } from "./filterUI";
import { SERIES_ROWS, SeriesRow, clientOf, isClosed, locationOf, seriesTypeLabel } from "./seriesData";
import { SERIES_NOUN, locationAddress } from "./listData";
import { HiddenCounts, HiddenDataBar, NoObjectsExist, NoObjectsMatch, NoSearchResults } from "./viewStates";

import styles from "./Filters.module.scss";

// The SERIES list page — added 2026-09-14 (Daniel: "Investigate 'Job series'
// list on the 'roopairs-api'... Check out my designs for 'Series' filters"),
// against his Series Figma page (14759-72314). The same shell as the other
// four pages, with the VIEWS and FILTERS read off the Figma page and the
// TABLE off production (JobSeriesTableView + defaultTableViewConfig's
// job_series_table__*):
//
//   BRANCH tabs   Open · Closed — production's phases, and here the phase is
//                 DERIVED: a series is closed when its END has passed
//                 (production `is_closed`), open when it has no end or the
//                 end is still ahead. There is no status, no locked filter
//                 and no Status filter anywhere on this list.
//   VIEW tabs     One "All" per phase — the Figma Views section (14759-74109)
//                 and production's TableViewTabs alike.
//   Table         production's column set — no ID column, NOTHING pinned,
//                 Recurrence as a sentence (formatRecurrence). "Series
//                 start" / "Series end" / "Created at" head the columns
//                 production calls "Recurrence Start" / "Recurrence End" /
//                 "Created At" — the filter names. See seriesTable.tsx.
//   View menu     the shared module, fully functional; Cards disabled like
//                 the other pages.
//   Filters       NINE of the menu node's ten rows — Recurrence is NOT
//                 built (Daniel is undecided; a proposal is with him). See
//                 seriesFilters.tsx.

// ---- the view bar's tabs ---------------------------------------------------

interface SeriesBranch {
  id: "open" | "closed";
  label: string;
  tabs: { id: string; label: string }[];
}

// The Views section (14759-74109): All Open "All open series are listed" ·
// All Closed "All closed series are listed". Nothing locks anything.
const BRANCHES: SeriesBranch[] = [
  { id: "open", label: "Open", tabs: [{ id: "all", label: "All" }] },
  { id: "closed", label: "Closed", tabs: [{ id: "closedAll", label: "All" }] },
];

type SeriesPhase = SeriesBranch["id"];

const branchById = (id: SeriesPhase) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

const branchViews = (branch: SeriesPhase) =>
  branchById(branch).tabs.map((item) => ({ value: item.id, label: item.label }));

// ---- the list top bar ------------------------------------------------------

// The Jobs page's TopBar family: the title carries the Jobs sidebar stack's
// sub-pages — Requests / Jobs / Series — and picking Jobs NAVIGATES there
// (the Invoices ↔ Credit notes pattern). Requests has no page and stays a
// label.
const SeriesTopBar = ({
  mobile = false,
  branch,
  onBranchChange,
  onNavigate,
}: {
  mobile?: boolean;
  branch: SeriesPhase;
  onBranchChange: (next: SeriesPhase) => void;
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
        onChange={(next) => onBranchChange(next as SeriesPhase)}
        aria-label="Open or closed series"
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
        title="Series"
        subPages={[
          { id: "requests", label: "Requests" },
          { id: "jobs", label: "Jobs" },
          { id: "series", label: "Series" },
        ]}
        subPage="series"
        onSubPageChange={(id) => {
          if (id === "jobs") onNavigate("jobs");
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

const defaultViewSettings = (): ViewSettings => ({
  view: "table",
  // The production default: NOTHING pinned — the one list whose table
  // freezes no column — and nothing hidden.
  columns: {
    pinned: [],
    unpinned: TABLE_COLUMNS.map((def) => def.key),
    hidden: [],
  },
  activeAttributes: ["service", "client", "openJobs"],
});

const ALL_VIEWS = BRANCHES.flatMap((branch) => branch.tabs);

const DEFAULT_VIEW_SETTINGS: Record<string, ViewSettings> = Object.fromEntries(
  ALL_VIEWS.map((tab) => [tab.id, defaultViewSettings()] as const),
);

interface SeriesViewMenuProps {
  open: boolean;
  onClose: () => void;
  breakpoint: "desktop" | "mobile";
  settings: ViewSettings;
  onSettingsChange: (next: ViewSettings) => void;
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
}

const SeriesViewMenu = ({ open, onClose, breakpoint, settings, onSettingsChange, sort, onSortChange }: SeriesViewMenuProps) => (
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
  branch: SeriesPhase;
  tab: string;
  onTabChange: (next: string) => void;
  viewSettings: ViewSettings;
  onViewSettingsChange: (next: ViewSettings) => void;
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
  search: string;
  onSearchChange: (next: string) => void;
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
}

// DESKTOP: the View button opens the shared module in an anchored card, and
// Filters opens the shared menu — the other pages' wiring.
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
        defs={SERIES_FILTERS}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      {viewCard.pos != null &&
        createPortal(
          <div ref={viewCard.cardRef} className={styles.filtersSub} style={viewCard.pos}>
            <SeriesViewMenu
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

// MOBILE: the View menu and the Filters both arrive as drawers. No view here
// ever locks a filter, so the Filters count is the user's own applications
// alone.
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
        filtersCount={activeFilterCount(selection)}
        onFiltersClick={() => setFiltersOpen(true)}
        filtersPressed={filtersOpen}
        onViewMenuClick={() => setViewMenuOpen(true)}
        viewMenuPressed={viewMenuOpen}
      />
      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        defs={SERIES_FILTERS}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      <SeriesViewMenu
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

// ---- layouts ---------------------------------------------------------------

interface ShellProps {
  seriesRows: SeriesRow[];
  searchEmptied: boolean;
  search: string;
  onSearchChange: (next: string) => void;
  branch: SeriesPhase;
  onBranchChange: (next: SeriesPhase) => void;
  tab: string;
  onTabChange: (next: string) => void;
  sort: TableSort;
  onSortChange: (column: string) => void;
  onSortSet: (next: TableSort) => void;
  viewSettings: ViewSettings;
  onViewSettingsChange: (next: ViewSettings) => void;
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  hidden: HiddenCounts;
  searchHidden: HiddenCounts;
  onNavigate: (next: Page) => void;
}

const DesktopShell = ({
  seriesRows,
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
  hidden,
  searchHidden,
  onNavigate,
}: ShellProps) => (
  <div className={styles.workArea}>
    <SeriesTopBar branch={branch} onBranchChange={onBranchChange} onNavigate={onNavigate} />
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
    {/* Nothing here is ever locked — the bar renders only while the user has
        applied something. */}
    <FilterBar defs={SERIES_FILTERS} selection={selection} onSelectionChange={onSelectionChange} />
    <div className={styles.mainArea}>
      {seriesRows.length > 0 ? (
        <SeriesTable
          seriesRows={seriesRows}
          columnsState={viewSettings.columns}
          sort={sort}
          onSortChange={onSortChange}
        />
      ) : searchEmptied ? (
        <NoSearchResults
          noun={SERIES_NOUN}
          hidden={searchHidden}
          onClearFilters={() => onSelectionChange([])}
          onClearSearch={() => onSearchChange("")}
        />
      ) : hidden.filters > 0 ? (
        <NoObjectsMatch noun={SERIES_NOUN} hidden={hidden} onClearFilters={() => onSelectionChange([])} />
      ) : (
        <NoObjectsExist noun={SERIES_NOUN} />
      )}
    </div>
    {seriesRows.length > 0 && (
      <HiddenDataBar noun={SERIES_NOUN} hidden={hidden} onClearFilters={() => onSelectionChange([])} />
    )}
  </div>
);

const MobileShell = ({
  seriesRows,
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
  hidden,
  searchHidden,
  onNavigate,
}: ShellProps) => {
  const tableRef = useSingleAxisScroll(true);
  return (
    <div className={styles.mobile}>
      <SeriesTopBar mobile branch={branch} onBranchChange={onBranchChange} onNavigate={onNavigate} />
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
        {seriesRows.length > 0 ? (
          <SeriesTable
            seriesRows={seriesRows}
            columnsState={viewSettings.columns}
            sort={sort}
            onSortChange={onSortChange}
            mobile
          />
        ) : searchEmptied ? (
          <NoSearchResults
            noun={SERIES_NOUN}
            hidden={searchHidden}
            onClearFilters={() => onSelectionChange([])}
            onClearSearch={() => onSearchChange("")}
          />
        ) : hidden.filters > 0 ? (
          <NoObjectsMatch noun={SERIES_NOUN} hidden={hidden} onClearFilters={() => onSelectionChange([])} />
        ) : (
          <NoObjectsExist noun={SERIES_NOUN} />
        )}
      </div>
      {seriesRows.length > 0 && (
        <HiddenDataBar noun={SERIES_NOUN} hidden={hidden} mobile onClearFilters={() => onSelectionChange([])} />
      )}
      <AppBottomBar page="series" onNavigate={onNavigate} />
    </div>
  );
};

/** One shared empty list, so an untouched view keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

// ---- the page --------------------------------------------------------------

// What the view bar's keyword search MATCHES — production's own field set
// (JobSeriesFilter.filter_keywords minus the job links, which the demo does
// not model): id, service name, client, location name + address, plus the
// type label. As a case-insensitive substring.
const searchHaystack = (series: SeriesRow) => {
  const location = locationOf(series);
  return [
    series.id,
    series.serviceName,
    clientOf(series).name,
    location.name ?? "",
    locationAddress(location),
    seriesTypeLabel(series),
  ]
    .join(" ")
    .toLowerCase();
};

export interface SeriesPageProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The sidebar / bottom bar navigation — the page owner switches. */
  onNavigate: (next: Page) => void;
}

// A TAB IS A VIEW here too — one per branch, but the state shapes stay the
// other pages', so a second view slots in without rework.
const SeriesPage = ({ breakpoint = "auto", onNavigate }: SeriesPageProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  const [branch, setBranch] = useState<SeriesPhase>("open");
  const [tabs, setTabs] = useState<Record<SeriesPhase, string>>({ open: "all", closed: "closedAll" });
  const tab = tabs[branch];
  const setTab = (next: string) => setTabs((current) => ({ ...current, [branch]: next }));

  const [sorts, setSorts] = useState<Record<string, TableSort>>({});
  const sort = sorts[tab] ?? sortDefault(branch);
  const changeSort = useCallback(
    (key: string) =>
      setSorts((current) => {
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

  const [selections, setSelections] = useState<Record<string, FilterSelection>>({});
  const selection = selections[tab] ?? EMPTY_SELECTION;
  const setSelection = (next: FilterSelection) => setSelections((current) => ({ ...current, [tab]: next }));

  const [searches, setSearches] = useState<Record<string, string>>({});
  const search = searches[tab] ?? "";
  const setSearch = (next: string) => setSearches((current) => ({ ...current, [tab]: next }));

  const deferredSearch = useDeferredValue(search);

  // The pipeline in LAYERS — the other pages' order, minus the locked-status
  // layer nothing here has:
  //
  //   branch series (the DERIVED phase) → the USER's filters → the keyword
  //   search → the sort.
  const { seriesRows, searchEmptied, hidden, searchHidden } = useMemo(() => {
    const branchSeries = SERIES_ROWS.filter((series) => isClosed(series) === (branch === "closed"));
    const filtered = applyFilters(branchSeries, SERIES_FILTERS, selection);
    const query = deferredSearch.trim().toLowerCase();
    const searched = query === "" ? filtered : filtered.filter((series) => searchHaystack(series).includes(query));
    let searchHidden: HiddenCounts = { filters: 0 };
    if (query !== "" && searched.length === 0) {
      const matchesQuery = (series: SeriesRow) => searchHaystack(series).includes(query);
      searchHidden = {
        filters: branchSeries.filter(matchesQuery).length - filtered.filter(matchesQuery).length,
      };
    }
    return {
      seriesRows: sortSeries(searched, sort),
      searchEmptied: query !== "" && searched.length === 0 && filtered.length > 0,
      hidden: { filters: branchSeries.length - filtered.length } satisfies HiddenCounts,
      searchHidden,
    };
  }, [branch, tab, deferredSearch, sort, selection]);

  const shellProps: ShellProps = {
    seriesRows,
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
    hidden,
    searchHidden,
    onNavigate,
  };
  return isDesktop ? <DesktopShell {...shellProps} /> : <MobileShell {...shellProps} />;
};

export default SeriesPage;
