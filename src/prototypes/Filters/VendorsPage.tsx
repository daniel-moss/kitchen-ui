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
import { VENDOR_FILTERS } from "./vendorFilters";
import {
  SORT_DEFAULT,
  SortColumn,
  TABLE_COLUMNS,
  TableSort,
  VIEW_ATTRIBUTES,
  VIEW_COLUMNS,
  VendorsTable,
  sortVendors,
} from "./vendorsTable";
import { FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard } from "./filterUI";
import { VENDOR_ROWS, VendorRow, billingAddressOf, billsViaOf, labelsOf } from "./vendorsData";
import { VENDOR_NOUN } from "./listData";
import { HiddenCounts, HiddenDataBar, NoObjectsExist, NoObjectsMatch, NoSearchResults } from "./viewStates";

import styles from "./Filters.module.scss";

// The VENDORS list page — added 2026-09-15 (Daniel: "Build", after the
// investigation against roopairs_api's pricebook app and his "↳ Vendors"
// Figma page 14831-30339). The same shell as the other seven pages, with the
// VIEWS and FILTERS read off the Figma page and the TABLE off production
// (VendorTableView + defaultTableViewConfig's vendors_table__*):
//
//   BRANCH tabs   Active · Inactive — production's phases, which are the one
//                 `isActive` flag. The first list whose rows are not
//                 documents: no status, no locked filter, no Status filter
//                 anywhere, nothing clock-derived.
//   VIEW tabs     One "All" per phase — the Figma Views section (14831-30343:
//                 "All active vendors are listed" / "All inactive...") and
//                 production's two tabs alike.
//   Table         production's column set, order and widths, with the
//                 standing rulings ("Payment terms" heads production's
//                 "Terms"; Website is plain text; the three derived number
//                 columns). See vendorsTable.tsx.
//   View menu     the shared module, fully functional; Cards disabled like
//                 the other pages.
//   Filters       the menu node's eight rows — six object-specific + the
//                 Labels and Last modified templates. See vendorFilters.tsx.
//
// The Figma page's own content area is a PLACEHOLDER — Daniel drew the views
// and the filters, and the table comes from production plus the rulings, the
// Invoices arrangement.

// ---- the view bar's tabs ---------------------------------------------------

interface VendorsBranch {
  id: "active" | "inactive";
  label: string;
  tabs: { id: string; label: string }[];
}

// The Views section (14831-30343): All Active "All active vendors are
// listed" · All Inactive "All inactive vendors are listed". Nothing locks
// anything.
const BRANCHES: VendorsBranch[] = [
  { id: "active", label: "Active", tabs: [{ id: "all", label: "All" }] },
  { id: "inactive", label: "Inactive", tabs: [{ id: "inactiveAll", label: "All" }] },
];

type VendorsPhase = VendorsBranch["id"];

const branchById = (id: VendorsPhase) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

const branchViews = (branch: VendorsPhase) =>
  branchById(branch).tabs.map((item) => ({ value: item.id, label: item.label }));

// ---- the list top bar ------------------------------------------------------

// The other pages' TopBar, for vendors: the DS TopBarNav `list` variant with
// the [Active · Inactive] branch tabs in its `tabs` slot. The title is
// PLAIN — Vendors is its own sidebar item, not part of a stack, so there are
// no sub-pages to list (the Bills arrangement).
const VendorsTopBar = ({
  mobile = false,
  branch,
  onBranchChange,
}: {
  mobile?: boolean;
  branch: VendorsPhase;
  onBranchChange: (next: VendorsPhase) => void;
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
        onChange={(next) => onBranchChange(next as VendorsPhase)}
        aria-label="Active or inactive vendors"
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
      <TopBarNavTitle title="Vendors" />
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

const PINNED = ["name"];

const defaultViewSettings = (): ViewSettings => ({
  view: "table",
  // The production default: the Vendor name pinned alone, the rest in the
  // registry's order, nothing hidden.
  columns: {
    pinned: PINNED,
    unpinned: TABLE_COLUMNS.map((def) => def.key).filter((key) => !PINNED.includes(key)),
    hidden: [],
  },
  activeAttributes: ["paymentTerms", "commitments", "payables"],
});

const ALL_VIEWS = BRANCHES.flatMap((branch) => branch.tabs);

const DEFAULT_VIEW_SETTINGS: Record<string, ViewSettings> = Object.fromEntries(
  ALL_VIEWS.map((tab) => [tab.id, defaultViewSettings()] as const),
);

interface VendorsViewMenuProps {
  open: boolean;
  onClose: () => void;
  breakpoint: "desktop" | "mobile";
  settings: ViewSettings;
  onSettingsChange: (next: ViewSettings) => void;
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
}

const VendorsViewMenu = ({ open, onClose, breakpoint, settings, onSettingsChange, sort, onSortChange }: VendorsViewMenuProps) => (
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
  branch: VendorsPhase;
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
        defs={VENDOR_FILTERS}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      {viewCard.pos != null &&
        createPortal(
          <div ref={viewCard.cardRef} className={styles.filtersSub} style={viewCard.pos}>
            <VendorsViewMenu
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
        defs={VENDOR_FILTERS}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      <VendorsViewMenu
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
  vendors: VendorRow[];
  searchEmptied: boolean;
  search: string;
  onSearchChange: (next: string) => void;
  branch: VendorsPhase;
  onBranchChange: (next: VendorsPhase) => void;
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
  vendors,
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
    <VendorsTopBar branch={branch} onBranchChange={onBranchChange} />
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
    <FilterBar defs={VENDOR_FILTERS} selection={selection} onSelectionChange={onSelectionChange} />
    <div className={styles.mainArea}>
      {vendors.length > 0 ? (
        <VendorsTable
          vendors={vendors}
          columnsState={viewSettings.columns}
          sort={sort}
          onSortChange={onSortChange}
        />
      ) : searchEmptied ? (
        <NoSearchResults
          noun={VENDOR_NOUN}
          hidden={searchHidden}
          onClearFilters={() => onSelectionChange([])}
          onClearSearch={() => onSearchChange("")}
        />
      ) : hidden.filters > 0 ? (
        <NoObjectsMatch noun={VENDOR_NOUN} hidden={hidden} onClearFilters={() => onSelectionChange([])} />
      ) : (
        <NoObjectsExist noun={VENDOR_NOUN} />
      )}
    </div>
    {vendors.length > 0 && (
      <HiddenDataBar noun={VENDOR_NOUN} hidden={hidden} onClearFilters={() => onSelectionChange([])} />
    )}
  </div>
);

const MobileShell = ({
  vendors,
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
      <VendorsTopBar mobile branch={branch} onBranchChange={onBranchChange} />
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
        {vendors.length > 0 ? (
          <VendorsTable
            vendors={vendors}
            columnsState={viewSettings.columns}
            sort={sort}
            onSortChange={onSortChange}
            mobile
          />
        ) : searchEmptied ? (
          <NoSearchResults
            noun={VENDOR_NOUN}
            hidden={searchHidden}
            onClearFilters={() => onSelectionChange([])}
            onClearSearch={() => onSearchChange("")}
          />
        ) : hidden.filters > 0 ? (
          <NoObjectsMatch noun={VENDOR_NOUN} hidden={hidden} onClearFilters={() => onSelectionChange([])} />
        ) : (
          <NoObjectsExist noun={VENDOR_NOUN} />
        )}
      </div>
      {vendors.length > 0 && (
        <HiddenDataBar noun={VENDOR_NOUN} hidden={hidden} mobile onClearFilters={() => onSelectionChange([])} />
      )}
      <AppBottomBar page="vendors" onNavigate={onNavigate} />
    </div>
  );
};

/** One shared empty list, so an untouched view keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

// ---- the page --------------------------------------------------------------

// What the view bar's keyword search MATCHES — production's own field set
// (VendorFilter.filter_keywords: the name, the formatted billing address and
// the label names) plus, my choice like the other lists' extras, the account
// id, the bills-via vendor and the website — every readable column, FLAGGED
// the same way (no node names a set).
const searchHaystack = (vendor: VendorRow) =>
  [
    vendor.name,
    vendor.accountId ?? "",
    billingAddressOf(vendor),
    billsViaOf(vendor)?.name ?? "",
    vendor.website ?? "",
    labelsOf(vendor)
      .map((label) => label.name)
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();

export interface VendorsPageProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The sidebar / bottom bar navigation — the page owner switches. */
  onNavigate: (next: Page) => void;
}

// A TAB IS A VIEW here too — one per branch, but the state shapes stay the
// other pages', so a second view slots in without rework.
const VendorsPage = ({ breakpoint = "auto", onNavigate }: VendorsPageProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  const [branch, setBranch] = useState<VendorsPhase>("active");
  const [tabs, setTabs] = useState<Record<VendorsPhase, string>>({ active: "all", inactive: "inactiveAll" });
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
  //   branch vendors (the `isActive` flag) → the USER's filters → the
  //   keyword search → the sort.
  const { vendors, searchEmptied, hidden, searchHidden } = useMemo(() => {
    const branchVendors = VENDOR_ROWS.filter((vendor) => vendor.isActive === (branch === "active"));
    const filtered = applyFilters(branchVendors, VENDOR_FILTERS, selection);
    const query = deferredSearch.trim().toLowerCase();
    const searched = query === "" ? filtered : filtered.filter((vendor) => searchHaystack(vendor).includes(query));
    let searchHidden: HiddenCounts = { filters: 0 };
    if (query !== "" && searched.length === 0) {
      const matchesQuery = (vendor: VendorRow) => searchHaystack(vendor).includes(query);
      searchHidden = {
        filters: branchVendors.filter(matchesQuery).length - filtered.filter(matchesQuery).length,
      };
    }
    return {
      vendors: sortVendors(searched, sort),
      searchEmptied: query !== "" && searched.length === 0 && filtered.length > 0,
      hidden: { filters: branchVendors.length - filtered.length } satisfies HiddenCounts,
      searchHidden,
    };
  }, [branch, tab, deferredSearch, sort, selection]);

  const shellProps: ShellProps = {
    vendors,
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

export default VendorsPage;
