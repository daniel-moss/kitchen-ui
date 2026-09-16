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
import { CLIENT_FILTERS } from "./clientFilters";
import {
  ClientsTable,
  SORT_DEFAULT,
  SortColumn,
  TABLE_COLUMNS,
  TableSort,
  VIEW_ATTRIBUTES,
  VIEW_COLUMNS,
  sortClients,
} from "./clientsTable";
import { FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard } from "./filterUI";
import {
  CLIENT_ROWS,
  ClientRow,
  billingAddressOf,
  billsToDisplayOf,
  labelsOf,
  locationsOf,
} from "./clientsData";
import { CLIENT_NOUN, locationAddress } from "./listData";
import { HiddenCounts, HiddenDataBar, NoObjectsExist, NoObjectsMatch, NoSearchResults } from "./viewStates";

import styles from "./Filters.module.scss";

// The CLIENTS list page — added 2026-09-16 (Daniel: "Build", after the
// investigation against roopairs_api's clients app and his "↳ Clients" Figma
// page 14947-35514). The same shell as the other eight pages, with the VIEWS
// and FILTERS read off the Figma page and the TABLE off production
// (ClientTableView + defaultTableViewConfig's clients_table__*) plus the
// properties production leaves unlisted, per Daniel's rulings:
//
//   BRANCH tabs   Active · Inactive — production's phases, which are the one
//                 `isActive` flag. The second directory list after Vendors:
//                 no status, no locked filter, nothing clock-derived.
//   VIEW tabs     One "All" per phase — the Figma Views section (14947-35515:
//                 "All active clients are listed" / "All inactive...") and
//                 production's two tabs alike.
//   Table         production's eight columns extended with the client-level
//                 properties the production table does not show — Industry,
//                 Billing address, the three defaults, Outstanding balance,
//                 Available invoice credit, Created at. See clientsTable.tsx.
//   View menu     the shared module, fully functional; Cards disabled like
//                 the other pages.
//   Filters       the menu node's fourteen rows — eleven object-specific +
//                 the Created at, Labels and Last modified templates. See
//                 clientFilters.tsx.
//
// The Figma page's own content area is a PLACEHOLDER — Daniel drew the views
// and the filters, and the table comes from production plus the rulings, the
// Vendors arrangement.

// ---- the view bar's tabs ---------------------------------------------------

interface ClientsBranch {
  id: "active" | "inactive";
  label: string;
  tabs: { id: string; label: string }[];
}

// The Views section (14947-35515): All Active "All active clients are
// listed" · All Inactive "All inactive clients are listed". Nothing locks
// anything.
const BRANCHES: ClientsBranch[] = [
  { id: "active", label: "Active", tabs: [{ id: "all", label: "All" }] },
  { id: "inactive", label: "Inactive", tabs: [{ id: "inactiveAll", label: "All" }] },
];

type ClientsPhase = ClientsBranch["id"];

const branchById = (id: ClientsPhase) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

const branchViews = (branch: ClientsPhase) =>
  branchById(branch).tabs.map((item) => ({ value: item.id, label: item.label }));

// ---- the list top bar ------------------------------------------------------

// The other pages' TopBar, for clients: the DS TopBarNav `list` variant with
// the [Active · Inactive] branch tabs in its `tabs` slot. The title is
// PLAIN — Clients is its own sidebar item, not part of a stack, so there are
// no sub-pages to list (the Vendors arrangement).
const ClientsTopBar = ({
  mobile = false,
  branch,
  onBranchChange,
}: {
  mobile?: boolean;
  branch: ClientsPhase;
  onBranchChange: (next: ClientsPhase) => void;
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
        onChange={(next) => onBranchChange(next as ClientsPhase)}
        aria-label="Active or inactive clients"
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
      <TopBarNavTitle title="Clients" />
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

// The production default: the Client name AND its Type pinned (production's
// own columnPinning), the rest in the registry's order, nothing hidden.
const PINNED = ["name", "clientType"];

const defaultViewSettings = (): ViewSettings => ({
  view: "table",
  columns: {
    pinned: PINNED,
    unpinned: TABLE_COLUMNS.map((def) => def.key).filter((key) => !PINNED.includes(key)),
    hidden: [],
  },
  activeAttributes: ["clientType", "creditLimit", "outstandingBalance"],
});

const ALL_VIEWS = BRANCHES.flatMap((branch) => branch.tabs);

const DEFAULT_VIEW_SETTINGS: Record<string, ViewSettings> = Object.fromEntries(
  ALL_VIEWS.map((tab) => [tab.id, defaultViewSettings()] as const),
);

interface ClientsViewMenuProps {
  open: boolean;
  onClose: () => void;
  breakpoint: "desktop" | "mobile";
  settings: ViewSettings;
  onSettingsChange: (next: ViewSettings) => void;
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
}

const ClientsViewMenu = ({ open, onClose, breakpoint, settings, onSettingsChange, sort, onSortChange }: ClientsViewMenuProps) => (
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
  branch: ClientsPhase;
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
        defs={CLIENT_FILTERS}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      {viewCard.pos != null &&
        createPortal(
          <div ref={viewCard.cardRef} className={styles.filtersSub} style={viewCard.pos}>
            <ClientsViewMenu
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
        defs={CLIENT_FILTERS}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      <ClientsViewMenu
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
  clients: ClientRow[];
  searchEmptied: boolean;
  search: string;
  onSearchChange: (next: string) => void;
  branch: ClientsPhase;
  onBranchChange: (next: ClientsPhase) => void;
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
  clients,
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
}: ShellProps) => (
  <div className={styles.workArea}>
    <ClientsTopBar branch={branch} onBranchChange={onBranchChange} />
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
    <FilterBar defs={CLIENT_FILTERS} selection={selection} onSelectionChange={onSelectionChange} />
    <div className={styles.mainArea}>
      {clients.length > 0 ? (
        <ClientsTable
          clients={clients}
          columnsState={viewSettings.columns}
          sort={sort}
          onSortChange={onSortChange}
        />
      ) : searchEmptied ? (
        <NoSearchResults
          noun={CLIENT_NOUN}
          hidden={searchHidden}
          onClearFilters={() => onSelectionChange([])}
          onClearSearch={() => onSearchChange("")}
        />
      ) : hidden.filters > 0 ? (
        <NoObjectsMatch noun={CLIENT_NOUN} hidden={hidden} onClearFilters={() => onSelectionChange([])} />
      ) : (
        <NoObjectsExist noun={CLIENT_NOUN} />
      )}
    </div>
    {clients.length > 0 && (
      <HiddenDataBar noun={CLIENT_NOUN} hidden={hidden} onClearFilters={() => onSelectionChange([])} />
    )}
  </div>
);

const MobileShell = ({
  clients,
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
      <ClientsTopBar mobile branch={branch} onBranchChange={onBranchChange} />
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
        {clients.length > 0 ? (
          <ClientsTable
            clients={clients}
            columnsState={viewSettings.columns}
            sort={sort}
            onSortChange={onSortChange}
            mobile
          />
        ) : searchEmptied ? (
          <NoSearchResults
            noun={CLIENT_NOUN}
            hidden={searchHidden}
            onClearFilters={() => onSelectionChange([])}
            onClearSearch={() => onSearchChange("")}
          />
        ) : hidden.filters > 0 ? (
          <NoObjectsMatch noun={CLIENT_NOUN} hidden={hidden} onClearFilters={() => onSelectionChange([])} />
        ) : (
          <NoObjectsExist noun={CLIENT_NOUN} />
        )}
      </div>
      {clients.length > 0 && (
        <HiddenDataBar noun={CLIENT_NOUN} hidden={hidden} mobile onClearFilters={() => onSelectionChange([])} />
      )}
      <AppBottomBar page="clients" onNavigate={onNavigate} />
    </div>
  );
};

/** One shared empty list, so an untouched view keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

// ---- the page --------------------------------------------------------------

// What the view bar's keyword search MATCHES — production's own field set
// (ClientFilter.filter_keywords: the name, the locations' names, the
// locations' formatted addresses and the label names) plus, my choice like
// the other lists' extras, the billing address and the Bills to text —
// every readable column, FLAGGED the same way (no node names a set).
const searchHaystack = (client: ClientRow) =>
  [
    client.name,
    ...locationsOf(client).flatMap((location) => [location.name ?? "", locationAddress(location)]),
    billingAddressOf(client),
    billsToDisplayOf(client),
    labelsOf(client)
      .map((label) => label.name)
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();

export interface ClientsPageProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The sidebar / bottom bar navigation — the page owner switches. */
  onNavigate: (next: Page) => void;
}

// A TAB IS A VIEW here too — one per branch, but the state shapes stay the
// other pages', so a second view slots in without rework.
const ClientsPage = ({ breakpoint = "auto", onNavigate }: ClientsPageProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  const [branch, setBranch] = useState<ClientsPhase>("active");
  const [tabs, setTabs] = useState<Record<ClientsPhase, string>>({ active: "all", inactive: "inactiveAll" });
  const tab = tabs[branch];
  const setTab = (next: string) => setTabs((current) => ({ ...current, [branch]: next }));

  const [sorts, setSorts] = useState<Record<string, TableSort>>({});
  const sort = sorts[tab] ?? SORT_DEFAULT;
  const changeSort = useCallback(
    (key: string) =>
      setSorts((current) => {
        const column = key as SortColumn;
        const active = current[tab] ?? SORT_DEFAULT;
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
  //   branch clients (the `isActive` flag) → the USER's filters → the
  //   keyword search → the sort.
  const { clients, searchEmptied, hidden, searchHidden } = useMemo(() => {
    const branchClients = CLIENT_ROWS.filter((client) => client.isActive === (branch === "active"));
    const filtered = applyFilters(branchClients, CLIENT_FILTERS, selection);
    const query = deferredSearch.trim().toLowerCase();
    const searched = query === "" ? filtered : filtered.filter((client) => searchHaystack(client).includes(query));
    let searchHidden: HiddenCounts = { filters: 0 };
    if (query !== "" && searched.length === 0) {
      const matchesQuery = (client: ClientRow) => searchHaystack(client).includes(query);
      searchHidden = {
        filters: branchClients.filter(matchesQuery).length - filtered.filter(matchesQuery).length,
      };
    }
    return {
      clients: sortClients(searched, sort),
      searchEmptied: query !== "" && searched.length === 0 && filtered.length > 0,
      hidden: { filters: branchClients.length - filtered.length } satisfies HiddenCounts,
      searchHidden,
    };
  }, [branch, tab, deferredSearch, sort, selection]);

  const shellProps: ShellProps = {
    clients,
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

export default ClientsPage;
