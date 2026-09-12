import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { BadgeJobStatusStatus } from "../../components/Badge/BadgeJobStatus";
import TopBarNav from "../../components/TopBarNav/TopBarNav";
import TopBarNavLeftElements from "../../components/TopBarNav/TopBarNavLeftElements";
import TopBarNavTitle from "../../components/TopBarNav/TopBarNavTitle";
import TopBarView from "../../components/TopBarView/TopBarView";
import ViewMenuModule from "../../modules/ViewMenu/ViewMenu";
import { ViewMenuColumnsState, ViewMenuTimelineState, ViewMenuView } from "../../modules/ViewMenu/ViewMenu.types";
import { SCHEDULED_OPTIONS, SCHEDULED_WINDOW_DAYS, defaultTimelineState } from "../../modules/ViewMenu/viewMenuData";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import { noop } from "../../stories/helpers";

import { AppBottomBar, Page, useAnchoredCard, useSingleAxisScroll } from "./appShell";
import { FilterDef, FilterSelection, activeFilterCount, applyFilters } from "./filterDefs";
import { FilterBar, FiltersDrawer, FiltersMenuCard, ScheduleHorizon } from "./filterUI";
import { JOBS_FILTERS, JobsPhase } from "./jobsFilters";
import {
  JobsTable,
  SORT_DEFAULT,
  SortColumn,
  TABLE_COLUMNS,
  TableSort,
  VIEW_ATTRIBUTES,
  VIEW_COLUMNS,
  sortJobs,
} from "./jobsTable";
import { HiddenCounts, HiddenDataBar, NoObjectsExist, NoObjectsMatch, NoSearchResults } from "./viewStates";
import { JOBS, Job, assigneesOf, clientOf, locationOf, sourceOf } from "./jobsData";
import { JOB_NOUN, dayOffset, locationAddress } from "./listData";

import styles from "./Filters.module.scss";

// Filters — formerly Concept 5 (Daniel, 2026-08-18). Concept 2 with every JOB
// COUNT taken
// out: the tabs, the mobile status picker and its list are labels only. Figma
// nodes 13889-19457 (desktop), 13889-19548 and 13897-21009 (mobile).
//
// The tabs are still Concept 2's: the DS TabGroup's `default` variant — 36px
// pills on a --gray-a3 fill when selected, 2px apart, centred in the bar — with
// no icons. The one count that stays is the mobile Filters button's `Counter`,
// which the node still draws: it says how many filters are applied, not how many
// jobs there are.
//
// The JOBS LIST page — the app shell is the REAL DS components since
// 2026-09-03 (Daniel: "use the actual SidebarNav, TopBarNav and TopBarView"):
//   - sidebar: the DS `SidebarNav` (it took over everything the hand-built
//     copy used to do — the 60px header, Create on top, the built-in Search
//     item, the 1px row rhythm, the medium edge divider);
//   - top bar: the DS `TopBarNav` `list` variant, with the branch tabs in its
//     own `tabs` slot;
//   - view bar: the DS `TopBarView` — the status tabs/selector on the left,
//     Search · Filters · View on the right;
//   - filter bar: the chips, with the tab's locked Status chip first;
//   - table: Concept 1's.
//
// Mobile: the top bar keeps the desktop format (breakpoint="desktop" — see
// TopBar), and the status control is TopBarView's own view selector — the
// tab's name + angles-up-down, opening ONE flat inline list.
//
// Every line in the concept is --gray-a4: under the top bar, down the sidebar's
// right edge, above the mobile bottom bar, along the bottom of the view bar,
// under the filter bar, and under the table's header row. The table's BODY rows
// keep the DS's lighter --gray-a3.

export interface JobsPageProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The sidebar / bottom bar navigation — `FiltersPrototype` owns the page. */
  onNavigate: (next: Page) => void;
}

// The SIDEBAR, the mobile BOTTOM BAR and the two positioning hooks
// (useAnchoredCard, useSingleAxisScroll) moved to appShell.tsx on 2026-09-11,
// when the Estimates page arrived — the two pages share
// one shell. This file is the JOBS page plus the page switch at the bottom.

// ---- the list top bar ------------------------------------------------------

// The DS `TopBarNav` in its `list` variant. Since the bar's 2026-08-27
// redesign it IS this concept's bar — 60px row, lg buttons, heading-h3 16/24
// title — so the old local size/type overrides are gone; the one adjustment
// left in the scss is the --gray-a4 bottom Divider (the concept's line rule).
// The title has NO left icon here (Filters has the wrench). Live users do not
// exist on list bars.
//
// The BRANCH tabs (Daniel, 2026-08-18): the [Open · Closed] TabGroup, in the
// bar's own `tabs` slot — the bar owns the scroller, the edge fades and the
// lg default size (Figma nodes 13888-18181 desktop / 13893-20645 mobile).
//
// Each shell passes its own breakpoint, so the bar renders the component's own
// format on both: the "New" Button on desktop, the solid plus IconButton on
// mobile. (The old force to "desktop" on mobile — Daniel, 2026-08-18, for the
// same "New" Button everywhere — was dropped on 2026-09-03: "I don't need this
// force".) `onSearch` is desktop-only either way; passing it only there keeps
// the intent visible at the call site.
const TopBar = ({
  mobile = false,
  branch,
  onBranchChange,
}: {
  mobile?: boolean;
  branch: BranchId;
  onBranchChange: (next: BranchId) => void;
}) => (
  <TopBarNav
    className={styles.topBar}
    variant="list"
    breakpoint={mobile ? "mobile" : "desktop"}
    onSearch={mobile ? undefined : noop}
    onCreate={noop}
    tabs={
      // Both branches WORK since the documented Views section (14032-23326) —
      // switching phases swaps the views, the filter registry and the table's
      // jobs. See BRANCHES.
      <TabGroup
        variant="default"
        value={branch}
        onChange={(next) => onBranchChange(next as BranchId)}
        aria-label="Open or closed jobs"
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
      {/* The sub-pages read "Requests" / "Series", not "Job requests" / "Job
          series" (Daniel, 2026-08-17) — the same labels the sidebar's Jobs
          stack already uses. */}
      <TopBarNavTitle
        title="Jobs"
        subPages={[
          { id: "requests", label: "Requests" },
          { id: "jobs", label: "Jobs" },
          { id: "series", label: "Series" },
        ]}
        defaultSubPage="jobs"
      />
    </TopBarNavLeftElements>
  </TopBarNav>
);

// ---- the filters this page offers -------------------------------------------

// The rows of the Filters menu — their order, labels, icons and everything each
// one filters — live in `jobsFilters.tsx`: the object-specific eight written
// out there, the shared seven taken from `filterTemplates.tsx`, all reading the
// demo database through `jobsData.ts`. That is what makes the counts in an
// option's tag and the rows the table shows come from the same predicate.
//
// ONE registry per BRANCH — see `JOBS_FILTERS`. Every piece of the filter UI
// takes it as a `defs` prop, so it follows the branch the page is on.
//
// The UI itself is shared and lives elsewhere, which is the whole point of the
// 2026-09-11 re-organisation (Daniel's Figma taxonomy):
//   - the Filters menu, its option lists, the chips, the bar and the mobile
//     drawer → filterUI.tsx ("Filters ↳ The Shell", 14199-63395);
//   - the date / duration / address Custom dialogs → filterKinds.tsx
//     ("Filter Functionality", 14267-23297);
//   - the table's empty states and the Hidden Data Bar → viewStates.tsx
//     ("View ↳ Shared Behavior", 14031-20299).
/** This page's branch (phase) — the registry's own two. */
type BranchId = JobsPhase;

// ---- the view bar's tabs ---------------------------------------------------

// The VIEWS — the documented Views section (14032-23326, 2026-09-03). Two
// levels:
//
//   BRANCH — "Open" and "Closed", the TopBarNav's phase TabGroup. A branch is
//     a PHASE: even its "All" view lists only that phase's jobs ("All Open —
//     No pre-defined filters. All open jobs are listed", and the closed twin).
//   VIEW — the branch's TopBarView tabs: "All" plus one view per status
//     group. Every view EXCEPT "All" applies a LOCKED Status filter.
//
// Both branches are BUILT since the documented section (the old "doesn't
// build Closed for now", 2026-08-18, is superseded): Open holds All / Pending
// / Scheduled / In progress / On hold / Completed, Closed holds All /
// Finalized / Cancelled — the section's TopBarView tabs, verbatim.
//
// The locked filter is NOT part of the user's FilterSelection: the user cannot
// change or remove it, so it never becomes an editable chip. It lives in the
// view state and is applied on top of the user's filters (AND), and the filter
// bar shows it as the first, inert chip.
//
// The status mapping is the section's own (each view's chip and its read-only
// value list):
//   Pending     = Draft + Unscheduled     (the chip reads "is any of 2 statuses")
//   Scheduled   = Upcoming + Past due
//   In progress = Active + Quick-paused   (the annotation: "Active first,
//                 then Quick-paused" — sub-statuses shown because this
//                 workspace HAS them; a company without them would show the
//                 generic status instead)
//   On hold     = On hold (external) + On hold (internal) ("External first")
//   Completed   = Completed
//   Finalized   = Finalized · Cancelled = Cancelled
interface ViewTab {
  id: string;
  label: string;
  /** The Status filter this view locks on. Empty = no filter ("All"). */
  statuses: BadgeJobStatusStatus[];
}

interface TabBranch {
  id: BranchId;
  label: string;
  tabs: ViewTab[];
}

const BRANCHES: TabBranch[] = [
  {
    id: "open",
    label: "Open",
    tabs: [
      { id: "all", label: "All", statuses: [] },
      // Pending = the two statuses a job has before it starts. STATUS CHANGED
      // used to be hidden here; it is not any more (Daniel, 2026-09-12) — under
      // the new rule the column says something real on this view: a draft is
      // empty, and an unscheduled job carries a date only when it came BACK
      // from a schedule, which is exactly "when was this unscheduled?".
      { id: "pending", label: "Pending", statuses: ["draft", "unscheduled"] },
      { id: "scheduled", label: "Scheduled", statuses: ["upcoming", "pastDue"] },
      { id: "inProgress", label: "In progress", statuses: ["active", "quickPaused"] },
      { id: "onHold", label: "On hold", statuses: ["onHoldExternal", "onHoldInternal"] },
      { id: "completed", label: "Completed", statuses: ["completed"] },
    ],
  },
  {
    id: "closed",
    label: "Closed",
    tabs: [
      { id: "closedAll", label: "All", statuses: [] },
      { id: "finalized", label: "Finalized", statuses: ["finalized"] },
      { id: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
    ],
  },
];

const branchById = (id: BranchId) => BRANCHES.find((b) => b.id === id) ?? BRANCHES[0]!;

/** The view behind an id, within its branch. */
const tabById = (branch: BranchId, id: string) => {
  const tabs = branchById(branch).tabs;
  return tabs.find((t) => t.id === id) ?? tabs[0]!;
};

/**
 * The PHASE's whole status set — what the branch's "All" view lists ("All open
 * jobs" / "All closed jobs"). The union of its views' statuses, so the two
 * levels can never disagree about what a phase holds.
 */
const branchStatuses = (branch: BranchId) => branchById(branch).tabs.flatMap((t) => t.statuses);

// No job counts anywhere in this concept (Daniel, 2026-08-18): not on the tabs,
// not on the mobile view selector, not in its list. The other concepts keep a
// `tabCount` helper here for them.

// ---- the view bar ----------------------------------------------------------

// The DS `TopBarView` (Daniel, 2026-09-03 — the hand-built 60px bar, its tab
// scroller, the local StatusPicker and the local Filters count control are
// gone). The bar is the component's own on both breakpoints:
//
//   DESKTOP: the status tabs on the left (labels only in this concept —
//   Daniel, 2026-08-18), "Search", "Filters" and "View" ghost lg Buttons on
//   the right. The keyword search opens the component's own inline field —
//   display only here, it filters nothing yet.
//   MOBILE: the view selector on the left — the tab's name + angles-up-down,
//   opening the flat inline list of the open branch's tabs — and the three
//   IconButtons on the right. An applied count turns Filters into the ghost
//   Button whose label is the number.
//
// Wired: the tabs / the selector, and Filters on both breakpoints. Display
// only: Search (it opens but filters nothing) and View.
//
// Differences against the old local bar, all the component's own rules —
// FLAGGED to Daniel:
//   - the mobile Filters count is the Button's plain text label (the DS doc's
//     rule), not the `Counter` pill the node draws (13889-19259);
//   - RESOLVED 2026-09-04 (per Daniel's ask): both triggers hold the pressed
//     fill while their menu is open — TopBarView grew `viewMenuPressed` and
//     `filtersPressed` for it;
//   - the mobile view-selector list hugs its own content instead of the
//     node's measured 137px floor.

/** The status tabs as TopBarView views — one per tab of the given branch. */
const branchViews = (branch: BranchId) => branchById(branch).tabs.map((item) => ({ value: item.id, label: item.label }));

/**
 * The view's schedule horizon, or null on "All dates" (nothing can conflict).
 *
 * The horizon is the JOBS page's layer alone, so this mapping — View-menu
 * settings → the shared chip's `ScheduleHorizon` — lives here rather than in
 * filterUI.tsx, which only ever receives the result.
 */
const horizonOf = (settings: ViewSettings): ScheduleHorizon | null => {
  const days = SCHEDULED_WINDOW_DAYS[settings.scheduledKey] ?? null;
  if (days == null) return null;
  return { days, label: SCHEDULED_OPTIONS.find((o) => o.key === settings.scheduledKey)?.label ?? "" };
};

interface ViewBarProps {
  /** The active branch — it picks the views and the filter registry. */
  branch: BranchId;
  tab: string;
  onTabChange: (next: string) => void;
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /** The view's View-menu settings, and the shared per-view sort it edits. */
  viewSettings: ViewSettings;
  onViewSettingsChange: (next: ViewSettings) => void;
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
  /**
   * The Hidden Data Bar's "Show" (its annotation: "Opens the 'View' menu") —
   * an incrementing signal from the shell; each step opens this bar's View
   * menu, exactly as a click on its View button would.
   */
  openViewMenuSignal?: number;
  /** The bar's keyword search — the shell owns the state (it filters the table). */
  search: string;
  onSearchChange: (next: string) => void;
}

// DESKTOP: the Filters button opens the anchored menu card. TopBarView owns
// the button and only reports the click, so the card's anchor is taken off
// the event instead of a wrapper div — the card still opens 4px below it,
// right-aligned (Daniel, 2026-08-17; the node 13857-25352 draws it
// left-aligned, but that node's button stood alone mid-canvas — the real one
// sits near the right screen edge, where a left-aligned card runs off it),
// and clicks on the button itself still count as "inside" for the
// outside-click close. NO counter on the desktop button (Daniel, 2026-08-17)
// — the filter bar below shows the applied filters.
function DesktopViewBar({
  branch,
  tab,
  onTabChange,
  selection,
  onSelectionChange,
  viewSettings,
  onViewSettingsChange,
  sort,
  onSortChange,
  openViewMenuSignal = 0,
  search,
  onSearchChange,
}: ViewBarProps) {
  const card = useAnchoredCard("right", "[data-concept-filters-sub]");
  // The View menu — the shared module, anchored under the bar's View button
  // exactly as the Filters menu is under its own. The module's dropdown lists
  // live in [data-floating-list] body portals; the ignore selector keeps a
  // click inside them from closing the card underneath.
  const viewCard = useAnchoredCard("right", "[data-floating-list]");
  // The Hidden Data Bar's "Show" — the same card, anchored to the same View
  // button. TopBarView owns that button and only hands it out inside a click
  // event, so with no click to read it from, the effect finds it in this
  // bar's own DOM (scoped by the bar's class; the icon glyph is CSS content,
  // so the button's text is exactly "View"). A prototype-local reach —
  // FLAGGED: the honest fix is a ref the DS TopBarView exposes.
  const setViewCardOpen = viewCard.setOpen;
  useEffect(() => {
    if (openViewMenuSignal === 0) return;
    const bar = document.querySelector(`.${styles.viewBar}`);
    const button =
      bar == null
        ? null
        : [...bar.querySelectorAll("button")].find((candidate) => candidate.textContent?.trim() === "View");
    if (button != null) viewCard.anchorRef.current = button as unknown as HTMLDivElement;
    setViewCardOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the signal alone re-opens
  }, [openViewMenuSignal, setViewCardOpen]);
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
          // The anchor ref is typed for the div wrappers the other triggers
          // use; the bar's own Button is just as valid a rectangle.
          card.anchorRef.current = e.currentTarget as unknown as HTMLDivElement;
          card.setOpen(!card.open);
        }}
        filtersPressed={card.open}
        onViewMenuClick={(e) => {
          viewCard.anchorRef.current = e.currentTarget as unknown as HTMLDivElement;
          viewCard.setOpen(!viewCard.open);
        }}
        viewMenuPressed={viewCard.open}
      />
      <FiltersMenuCard
        card={card}
        defs={VIEW_FILTERS[tab]!}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      {viewCard.pos != null &&
        createPortal(
          <div ref={viewCard.cardRef} className={styles.filtersSub} style={viewCard.pos}>
            <FiltersViewMenu
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

// MOBILE: the Filters button opens the Menu drawer; a filter row then opens
// its options as a SECOND drawer on top of it.
function MobileViewBar({
  branch,
  tab,
  onTabChange,
  selection,
  onSelectionChange,
  viewSettings,
  onViewSettingsChange,
  sort,
  onSortChange,
  openViewMenuSignal = 0,
  search,
  onSearchChange,
}: ViewBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  // The View menu arrives as the module's own drawer.
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  // The Hidden Data Bar's "Show" — the drawer needs no anchor, so the signal
  // simply opens it.
  useEffect(() => {
    if (openViewMenuSignal > 0) setViewMenuOpen(true);
  }, [openViewMenuSignal]);
  // The sheet, its search, its per-visit drafts and the applied-filters
  // section are all `FiltersDrawer`'s (filterUI.tsx) — this bar only opens it.
  const lockedStatuses = tabById(branch, tab).statuses;

  // The MOBILE Filters count counts the view's locked Status filter as well
  // (Daniel, 2026-08-18): on every view but "All" a filter IS applied, and
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
      <FiltersViewMenu
        open={viewMenuOpen}
        onClose={() => setViewMenuOpen(false)}
        breakpoint="mobile"
        settings={viewSettings}
        onSettingsChange={onViewSettingsChange}
        sort={sort}
        onSortChange={onSortChange}
      />
      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        defs={VIEW_FILTERS[tab]!}
        selection={selection}
        onSelectionChange={onSelectionChange}
        lockedStatuses={lockedStatuses}
        scheduleHorizon={horizonOf(viewSettings)}
        // "Show settings" from the conflict hint: the Filters drawer makes way
        // for the View one.
        onShowViewMenu={() => {
          setFiltersOpen(false);
          setViewMenuOpen(true);
        }}
      />
    </>
  );
}

// (useAnchoredCard and the AnchoredCard type — the shared anchored body
// portal — live in appShell.tsx since 2026-09-11; both pages' view bars and
// the chips use the same hook.)

// ---- the View menu (the shared module) --------------------------------------

// The shared View Menu module (src/modules/ViewMenu — the ViewMenu prototype's
// design, extracted on 2026-09-03 so one build serves every prototype). It is
// FULLY FUNCTIONAL here (Daniel): the Columns section shows, hides, pins and
// reorders the table's columns, Sort by edits the SAME per-view sort the header
// cells set, and the Schedule horizon narrows the jobs. Both jobs-only sections
// are on — this page is jobs.
//
// The Cards and Timeline VIEWS are not designed in this prototype, so their
// switcher tabs are DISABLED (`disabledViews` — Daniel, 2026-09-04: "It doesn't
// make sense to switch to them if the content doesn't change"); the view is
// always the table. FLAGGED: the Cards ATTRIBUTES passed below are the table's
// own columns (the module's demo list is product-shaped, wrong for jobs) — my
// mapping, not a node's; they stay unreachable while Cards is disabled.
//
// The column lists it is fed (`VIEW_COLUMNS` / `VIEW_ATTRIBUTES`) are derived
// from the table's own registry in jobsTable.tsx, so the menu and the table
// cannot disagree about what a column is.

/** Everything the View menu edits, kept PER VIEW like the filters and the sort. */
interface ViewSettings {
  view: ViewMenuView;
  columns: ViewMenuColumnsState;
  activeAttributes: string[];
  /** A SCHEDULED_OPTIONS key — "all" is off. */
  scheduledKey: string;
  timeline: ViewMenuTimelineState;
}

const defaultViewSettings = (): ViewSettings => ({
  view: "table",
  // The table's own default: ID and Service pinned (the production pinned
  // pair), the rest in the registry's order. NOTHING starts hidden — every view
  // shows every column (Daniel, 2026-09-12).
  columns: {
    pinned: ["id", "service"],
    unpinned: TABLE_COLUMNS.map((def) => def.key).filter((key) => key !== "id" && key !== "service"),
    hidden: [],
  },
  activeAttributes: ["status", "client", "scheduledFor"],
  scheduledKey: "all",
  timeline: defaultTimelineState(),
});

/** Every view of either branch, in one flat list — view ids are unique. */
const ALL_VIEWS = BRANCHES.flatMap((branch) => branch.tabs.map((tab) => ({ branch, tab })));

/**
 * One default per VIEW, built once — so an untouched view keeps a stable
 * reference and the memoised table is not rebuilt on every render.
 *
 * Every view starts from the SAME arrangement since 2026-09-12 (Daniel: "I want
 * the Status changed column to be shown by default on all views where it
 * exists" + "do not hide Down payment"). The per-view `hiddenColumns` /
 * `hiddenFilters` mechanism is gone with it: a preset view hiding a column was
 * a guess about what the user wants, and CUSTOM views — where the user picks
 * their own columns and filters — answer that properly. Only "All" will stay a
 * preset.
 */
const DEFAULT_VIEW_SETTINGS: Record<string, ViewSettings> = Object.fromEntries(
  ALL_VIEWS.map(({ tab }) => [tab.id, defaultViewSettings()] as const),
);

/**
 * The registry a VIEW offers — its branch's, whole. Built once for the same
 * reason as the settings above: every piece of the filter UI takes it as a
 * `defs` prop, and a fresh array each render would be churn.
 */
const VIEW_FILTERS: Record<string, FilterDef<Job>[]> = Object.fromEntries(
  ALL_VIEWS.map(({ branch, tab }) => [tab.id, JOBS_FILTERS[branch.id]] as const),
);

interface FiltersViewMenuProps {
  open: boolean;
  onClose: () => void;
  breakpoint: "desktop" | "mobile";
  settings: ViewSettings;
  onSettingsChange: (next: ViewSettings) => void;
  /** The same per-view sort the header cells edit — one state, two editors. */
  sort: TableSort;
  onSortChange: (next: TableSort) => void;
}

const FiltersViewMenu = ({ open, onClose, breakpoint, settings, onSettingsChange, sort, onSortChange }: FiltersViewMenuProps) => (
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
    disabledViews={["cards", "timeline"]}
    attributes={VIEW_ATTRIBUTES}
    activeAttributes={settings.activeAttributes}
    onActiveAttributesChange={(activeAttributes) => onSettingsChange({ ...settings, activeAttributes })}
    scheduled={{ value: settings.scheduledKey, onChange: (scheduledKey) => onSettingsChange({ ...settings, scheduledKey }) }}
    timeline={{ value: settings.timeline, onChange: (timeline) => onSettingsChange({ ...settings, timeline }) }}
  />
);


// ---- layouts ---------------------------------------------------------------

// (The table's EMPTY STATES and the HIDDEN DATA BAR moved to viewStates.tsx on
// 2026-09-11 — Daniel's Figma page "View ↳ Shared Behavior" (14031-20299). Both
// list pages render the same set now, taking the object's noun; this page had
// its own copy and the Estimates page a second, already drifting one.)

/**
 * The Jobs list has BOTH counted layers — the user's filters AND the View
 * menu's schedule horizon — so its counts always carry the horizon, where the
 * shared type leaves it optional for a list that has none.
 */
type JobsHiddenCounts = HiddenCounts & { horizon: number };

interface ShellProps {
  jobs: Job[];
  /** The Hidden Data Bar's counted layers — see `HiddenCounts`. */
  hidden: JobsHiddenCounts;
  /** The SEARCH emptied an otherwise non-empty table — its own empty state. */
  searchEmptied: boolean;
  /** MATCHING jobs the filters / schedule horizon hide from the empty search. */
  searchHidden: JobsHiddenCounts;
  /** The view bar's keyword search — per view, applied after everything else. */
  search: string;
  onSearchChange: (next: string) => void;
  /** The active branch (phase) — Open or Closed. */
  branch: BranchId;
  onBranchChange: (next: BranchId) => void;
  tab: string;
  onTabChange: (next: string) => void;
  /** The current view's locked Status filter — the filter bar's first chip. */
  lockedStatuses: BadgeJobStatusStatus[];
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /** The table's sort — the header cells set it, the jobs arrive sorted by it. */
  sort: TableSort;
  /** A header click. The registry has more column keys than `SortColumn`, so
   *  the shared table hands back a plain string and this narrows it. */
  onSortChange: (column: string) => void;
  /** The View menu's absolute write into the same per-view sort. */
  onSortSet: (next: TableSort) => void;
  /** The view's View-menu settings (columns, view, scheduled window, …). */
  viewSettings: ViewSettings;
  onViewSettingsChange: (next: ViewSettings) => void;
  /** The sidebar / bottom bar navigation — the page switch lives in Filters. */
  onNavigate: (next: Page) => void;
}

const DesktopShell = ({
  jobs,
  hidden,
  searchEmptied,
  searchHidden,
  search,
  onSearchChange,
  branch,
  onBranchChange,
  tab,
  onTabChange,
  lockedStatuses,
  selection,
  onSelectionChange,
  sort,
  onSortChange,
  onSortSet,
  viewSettings,
  onViewSettingsChange,
}: ShellProps) => {
  // The Hidden Data Bar's "Show" opens the View menu, which the view bar owns
  // — an incrementing SIGNAL, not a boolean, so pressing Show again after the
  // menu was dismissed re-opens it.
  const [viewMenuSignal, setViewMenuSignal] = useState(0);

  // The WORK AREA only — the sidebar is rendered once by `Filters`, outside the
  // page switch, so it survives a move between pages (see the note there).
  return (
    <>
      <div className={styles.workArea}>
        <TopBar branch={branch} onBranchChange={onBranchChange} />
        <DesktopViewBar
          branch={branch}
          tab={tab}
          onTabChange={onTabChange}
          selection={selection}
          onSelectionChange={onSelectionChange}
          viewSettings={viewSettings}
          onViewSettingsChange={onViewSettingsChange}
          sort={sort}
          onSortChange={onSortSet}
          openViewMenuSignal={viewMenuSignal}
          search={search}
          onSearchChange={onSearchChange}
        />
        {/* Only rendered while the view locks a status or something is applied. */}
        <FilterBar
          defs={VIEW_FILTERS[tab]!}
          lockedStatuses={lockedStatuses}
          selection={selection}
          onSelectionChange={onSelectionChange}
          scheduleHorizon={horizonOf(viewSettings)}
          onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
        />
        {/* The Table is its own scroll container (that is what lets its header
            stick), so it replaces the page ScrollArea rather than nesting in one.
            EMPTY, it holds the No Match block when the counted layers hid
            everything, and the NoJobsYet EmptyState when the view had nothing
            to begin with (no jobs, or a locked filter matching none). */}
        <div className={styles.mainArea}>
          {jobs.length > 0 ? (
            <JobsTable jobs={jobs} columnsState={viewSettings.columns} sort={sort} onSortChange={onSortChange} />
          ) : searchEmptied ? (
            <NoSearchResults
              noun={JOB_NOUN}
              hidden={searchHidden}
              viewHasLockedFilters={lockedStatuses.length > 0}
              onClearFilters={() => onSelectionChange([])}
              onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
              onClearSearch={() => onSearchChange("")}
            />
          ) : hidden.filters > 0 || hidden.horizon > 0 ? (
            <NoObjectsMatch
              noun={JOB_NOUN}
              hidden={hidden}
              viewHasLockedFilters={lockedStatuses.length > 0}
              onClearFilters={() => onSelectionChange([])}
              onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
            />
          ) : (
            <NoObjectsExist noun={JOB_NOUN} />
          )}
        </div>
        {/* AFTER the scroll container, so it stays put at the bottom while the
            table scrolls — the annotation's "Fixed at the bottom of the list".
            Only while the table SHOWS rows: empty, the No Match block above
            carries the counts instead. */}
        {jobs.length > 0 && (
          <HiddenDataBar
            noun={JOB_NOUN}
            hidden={hidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
            onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
          />
        )}
      </div>
    </>
  );
};

// No filter bar on mobile (the node has none): the tab Button shows the tab and
// the Filters button shows how many of the user's filters are on.
const MobileShell = ({
  jobs,
  hidden,
  searchEmptied,
  searchHidden,
  search,
  onSearchChange,
  branch,
  onBranchChange,
  tab,
  onTabChange,
  lockedStatuses,
  selection,
  onSelectionChange,
  sort,
  onSortChange,
  onSortSet,
  viewSettings,
  onViewSettingsChange,
  onNavigate,
}: ShellProps) => {
  // A drag scrolls the table one way at a time — see useSingleAxisScroll.
  const tableRef = useSingleAxisScroll(true);
  // The Hidden Data Bar's "Show" → the view bar's View drawer (see DesktopShell).
  const [viewMenuSignal, setViewMenuSignal] = useState(0);

  return (
    <div className={styles.mobile}>
      <TopBar mobile branch={branch} onBranchChange={onBranchChange} />
      <MobileViewBar
        branch={branch}
        tab={tab}
        onTabChange={onTabChange}
        selection={selection}
        onSelectionChange={onSelectionChange}
        viewSettings={viewSettings}
        onViewSettingsChange={onViewSettingsChange}
        sort={sort}
        onSortChange={onSortSet}
        openViewMenuSignal={viewMenuSignal}
        search={search}
        onSearchChange={onSearchChange}
      />
      <div className={styles.mainArea} ref={tableRef}>
        {jobs.length > 0 ? (
          <JobsTable jobs={jobs} columnsState={viewSettings.columns} sort={sort} onSortChange={onSortChange} mobile />
        ) : searchEmptied ? (
          <NoSearchResults
            noun={JOB_NOUN}
            hidden={searchHidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
            onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
            onClearSearch={() => onSearchChange("")}
          />
        ) : hidden.filters > 0 || hidden.horizon > 0 ? (
          <NoObjectsMatch
            noun={JOB_NOUN}
            hidden={hidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
            onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
          />
        ) : (
          <NoObjectsExist noun={JOB_NOUN} />
        )}
      </div>
      {/* Between the list and the bottom bar, exactly where the mobile frame
          draws it (14113-54705) — after the scroll container, so it stays put.
          Only while the table SHOWS rows — empty, No Match carries the counts. */}
      {jobs.length > 0 && (
        <HiddenDataBar
          noun={JOB_NOUN}
          hidden={hidden}
          viewHasLockedFilters={lockedStatuses.length > 0}
          mobile
          onClearFilters={() => onSelectionChange([])}
          onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
        />
      )}
      {/* The bar owns its own home-indicator inset, so the shell reserves none. */}
      <AppBottomBar page="jobs" onNavigate={onNavigate} />
    </div>
  );
};

/** One shared empty list, so an untouched tab keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

// What the view bar's keyword search MATCHES (wired 2026-09-09 — it was
// display-only): the row's readable text — id, service, client, location
// (name + address), source (name + reference) and the assignees' names — as a
// case-insensitive substring. FLAGGED: the field set is my choice, no node
// names one.
const searchHaystack = (job: Job) => {
  const location = locationOf(job);
  return [
    job.id,
    job.serviceName,
    clientOf(job).name,
    location.name ?? "",
    locationAddress(location),
    sourceOf(job).name,
    job.sourceRef ?? "",
    ...assigneesOf(job).map((tech) => tech.name),
  ]
    .join(" ")
    .toLowerCase();
};

// Two pieces of state live HERE, above both shells, because the view bar writes
// them and the table reads them:
//
//   - `tab`, which locks a Status filter the user cannot touch;
//   - `selection`, the filters the user applied themselves.
//
// They stay separate on purpose. The tab's statuses are NOT written into
// `selection`: if they were, the Filters menu and the chip's remove button could
// edit them, and Daniel's rule is that the tab's filter cannot be changed or
// removed. So the two are applied one after the other — the user's filters
// first, then the tab's statuses on top (AND).
//
// A user CAN still add their own Status filter from the Filters menu while a tab
// is active. It then narrows the tab ("Pending" + Status is Draft = the drafts),
// and two chips both named Status show in the bar. FLAGGED: say the word and the
// Status row disappears from the menu whenever a tab owns it.
const JobsPage = ({ breakpoint = "auto", onNavigate }: JobsPageProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  const [branch, setBranch] = useState<BranchId>("open");
  // The active view, remembered PER BRANCH, so toggling Open ↔ Closed brings
  // the user back to the view they were on. The nodes do not draw the switch
  // itself — the memory is mine, flagged.
  const [tabs, setTabs] = useState<Record<BranchId, string>>({ open: "all", closed: "closedAll" });
  const tab = tabs[branch];
  const setTab = (next: string) => setTabs((current) => ({ ...current, [branch]: next }));
  // A TAB IS A VIEW (Daniel, 2026-08-18), and a view owns its filters: they are
  // kept per tab and never carried from one to another. Custom views come later
  // and will slot in the same way — a view id with its own set. The view ids
  // are unique ACROSS branches, so one map holds both phases.
  const [selections, setSelections] = useState<Record<string, FilterSelection>>({});
  const selection = selections[tab] ?? EMPTY_SELECTION;
  const setSelection = (next: FilterSelection) =>
    setSelections((current) => ({ ...current, [tab]: next }));

  const filters = VIEW_FILTERS[tab]!;
  const lockedStatuses = tabById(branch, tab).statuses;

  // The table's sort, PER VIEW like the filters (Daniel, 2026-09-03: "Each
  // view should have its own sorting parameters") — the view id keys both
  // maps, so a view carries its filters AND its sort, and an untouched view
  // opens on the default. Clicking a new column sorts by it ascending;
  // clicking the active one flips the direction.
  const [sorts, setSorts] = useState<Record<string, TableSort>>({});
  const sort = sorts[tab] ?? SORT_DEFAULT;
  // `useCallback` so the memoised table keeps its identity between renders —
  // see the note on `JobsTable`.
  const changeSort = useCallback(
    (key: string) =>
      setSorts((current) => {
        // Only a SORTABLE column reaches here, and every one of those is a
        // `SortColumn` — the shared table just does not know that.
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

  // The View menu's settings, PER VIEW like the filters and the sort — one
  // more map the view id keys. An untouched view opens on the default.
  const [viewSettings, setViewSettings] = useState<Record<string, ViewSettings>>({});
  const settings = viewSettings[tab] ?? DEFAULT_VIEW_SETTINGS[tab]!;
  const setSettings = (next: ViewSettings) => setViewSettings((current) => ({ ...current, [tab]: next }));

  // The view bar's keyword SEARCH, per view like everything else a view owns
  // (wired 2026-09-09 — it was display-only). FLAGGED: keeping it per tab is
  // my reading of "a tab is a view"; say the word if a search should clear on
  // every view switch instead.
  const [searches, setSearches] = useState<Record<string, string>>({});
  const search = searches[tab] ?? "";
  const setSearch = (next: string) => setSearches((current) => ({ ...current, [tab]: next }));

  // THE TABLE lags the field, on purpose (Daniel, 2026-09-11: "typing within
  // the search feels very slow"). Measured with the Event Timing API: a
  // keystroke in this field cost 64ms to paint at full speed and 248ms at 4×
  // CPU throttling, with 160ms tasks blocking the main thread — because every
  // character re-runs the whole pipeline and re-renders 78 rows × 17 columns.
  // (The Filters MENU's own search was never the problem: 16-24ms.)
  //
  // `useDeferredValue` is React's answer to exactly this: the field keeps the
  // value the user typed and stays responsive, while the expensive list render
  // runs at a lower priority and is ABANDONED as soon as the next keystroke
  // arrives. No debounce timer to tune, and no keystroke is ever dropped —
  // the table just settles a frame or two after the caret.
  const deferredSearch = useDeferredValue(search);

  // The pipeline runs in LAYERS, each measured against the one before, so the
  // Hidden Data Bar and the No Match state can attribute what hides a job:
  //
  //   branch jobs → the view's LOCKED statuses → the USER's filters → the
  //   View menu's window ("schedule horizon" in the copy).
  //
  // Only the LAST TWO are counted (Daniel, 2026-09-09: "We don't show the
  // objects hidden by locked filter" — the Locked "Status" Filter frames,
  // 14192-61579: "the objects hidden by the locked 'Status' filter does not
  // count", so a locked view shows no bar until something ELSE hides). The
  // BRANCH is page context, not a filter (Daniel confirmed 2026-09-09) — so
  // closed jobs are never "hidden" on the open page. A job hidden by two
  // counted layers is counted once, at the first.
  const { jobs, hidden, searchEmptied, searchHidden } = useMemo(() => {
    const branchJobs = JOBS.filter((job) => branchStatuses(branch).includes(job.status));
    const afterLocked =
      lockedStatuses.length > 0 ? branchJobs.filter((job) => lockedStatuses.includes(job.status)) : branchJobs;
    const afterFilters = applyFilters(afterLocked, filters, selection);
    // The View menu's "Schedule horizon" window (jobs only). The Figma
    // annotation's rule: N days = through the end of that day, and only
    // FUTURE-scheduled jobs are hidden — unscheduled and past ones stay.
    const windowDays = SCHEDULED_WINDOW_DAYS[settings.scheduledKey] ?? null;
    const afterWindow =
      windowDays == null
        ? afterFilters
        : afterFilters.filter((job) => job.scheduledFor == null || dayOffset(job.scheduledFor) <= windowDays);
    // The keyword SEARCH is the LAST layer. It narrows the table but not the
    // Hidden Data Bar — the bar attributes hiding to filters and view
    // settings, and a search is neither. When the search leaves NOTHING, the
    // designed Search section takes over (14205-65621, 2026-09-09): the
    // empty state then counts the MATCHING jobs the filters / schedule horizon
    // hide — the honest, search-aware numbers, so every count is exactly
    // what its button would reveal. Locked-hidden matches stay invisible,
    // the standing rule.
    // `deferredSearch`, not `search` — see the note where it is declared.
    const query = deferredSearch.trim().toLowerCase();
    const searched = query === "" ? afterWindow : afterWindow.filter((job) => searchHaystack(job).includes(query));
    let searchHidden: JobsHiddenCounts = { filters: 0, horizon: 0 };
    if (query !== "" && searched.length === 0) {
      const matchesQuery = (job: Job) => searchHaystack(job).includes(query);
      const inLocked = afterLocked.filter(matchesQuery).length;
      const inFilters = afterFilters.filter(matchesQuery).length;
      const inWindow = afterWindow.filter(matchesQuery).length;
      searchHidden = { filters: inLocked - inFilters, horizon: inFilters - inWindow };
    }
    return {
      jobs: sortJobs(searched, sort),
      hidden: {
        filters: afterLocked.length - afterFilters.length,
        horizon: afterFilters.length - afterWindow.length,
      },
      searchEmptied: query !== "" && searched.length === 0 && afterWindow.length > 0,
      searchHidden,
    };
  }, [selection, filters, lockedStatuses, branch, sort, settings.scheduledKey, deferredSearch]);

  const shellProps = {
    jobs,
    hidden,
    searchEmptied,
    searchHidden,
    search,
    onSearchChange: setSearch,
    branch,
    onBranchChange: setBranch,
    tab,
    onTabChange: setTab,
    lockedStatuses,
    selection,
    onSelectionChange: setSelection,
    sort,
    onSortChange: changeSort,
    onSortSet: (next: TableSort) => setSorts((current) => ({ ...current, [tab]: next })),
    viewSettings: settings,
    onViewSettingsChange: setSettings,
    onNavigate,
  };

  return isDesktop ? <DesktopShell {...shellProps} /> : <MobileShell {...shellProps} />;
};

export default JobsPage;
