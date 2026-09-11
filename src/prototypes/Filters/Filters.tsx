import {
  CSSProperties,
  Fragment,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import AvatarGroup from "../../components/Avatar/AvatarGroup";
import Badge from "../../components/Badge/Badge";
import BadgeJobStatus, { BadgeJobStatusStatus, STATUS } from "../../components/Badge/BadgeJobStatus";
import Button from "../../components/Button/Button";
import Chip from "../../components/Chip/Chip";
import ChipGroup from "../../components/Chip/ChipGroup";
import Dialog from "../../components/Dialog/Dialog";
import { Divider } from "../../components/Divider/Divider";
import EmptyState from "../../components/EmptyState/EmptyState";
import DateChip from "../../components/DatePicker/DateChip";
import Month from "../../components/DatePicker/Month";
import DateField from "../../components/Fields/DateField/DateField";
import Input from "../../components/Input/Input";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import Menu from "../../components/Menu/Menu";
import MenuHeader from "../../components/Menu/MenuHeader";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import TopBarNav from "../../components/TopBarNav/TopBarNav";
import TopBarNavLeftElements from "../../components/TopBarNav/TopBarNavLeftElements";
import TopBarNavTitle from "../../components/TopBarNav/TopBarNavTitle";
import FilterChip from "../../components/TopBarFilter/FilterChip";
import TopBarFilter from "../../components/TopBarFilter/TopBarFilter";
import TopBarView from "../../components/TopBarView/TopBarView";
import Popover from "../../components/Popover/Popover";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import SelectList from "../../components/SelectList/SelectList";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListHeader from "../../components/SelectList/SelectListHeader";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextField from "../../components/Fields/TextField/TextField";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import { CellBody } from "../../components/Table/CellBody/CellBody";
import { CellHeader } from "../../components/Table/CellHeader/CellHeader";
import { CellDataType, CellSortOrder } from "../../components/Table/CellHeader/CellHeader.types";
import ViewMenuModule from "../../modules/ViewMenu/ViewMenu";
import {
  ViewMenuAttribute,
  ViewMenuColumn,
  ViewMenuColumnType,
  ViewMenuColumnsState,
  ViewMenuTimelineState,
  ViewMenuView,
} from "../../modules/ViewMenu/ViewMenu.types";
import { SCHEDULED_OPTIONS, SCHEDULED_WINDOW_DAYS, defaultTimelineState } from "../../modules/ViewMenu/viewMenuData";
import AvatarWarning from "../../components/Avatar/AvatarWarning";
import { Table } from "../../components/Table/Table/Table";
import { TableRow } from "../../components/Table/TableRow/TableRow";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import { isSameMonth } from "../../utils/calendar";
import { semanticIcons } from "../../styles/semanticIcons";
import { noop } from "../../stories/helpers";

import {
  AnchoredCard,
  AppBottomBar,
  DIALOG_MARKER,
  Page,
  Sidebar,
  useAnchoredCard,
  useSingleAxisScroll,
} from "./appShell";
import {
  ConditionChoice,
  DATE_CONDITIONS,
  dateCompareLabel,
  DateCompare,
  DateTimeframe,
  DURATION_DIALOG_CONDITIONS,
  DURATION_PRESETS,
  DurationCompare,
  ADDRESS_FIELDS,
  AddressValue,
  DurationValue,
  FIRST_YEAR,
  YEARS_AFTER_TODAY,
  DateValue,
  emptyAddress,
  AnyFilterDef,
  FilterDef,
  FilterId,
  FilterInstance,
  FilterOption,
  FilterSelection,
  FilterValue,
  activeFilterCount,
  activeFilters,
  applyFilters,
  buildFilters,
  conditionChoices,
  conditionLabel,
  countLabel,
  formatFooterDate,
  formatLongDate,
  isConditionActive,
  isDateRange,
  isEmptyValue,
  newFilterInstance,
  removeFilter,
  scheduledValueEnd,
  upsertFilter,
  valueDisplay,
  withCondition,
} from "./filterDefs";
import {
  JOBS,
  Job,
  JobType,
  PriorityLevel,
  assigneesOf,
  clientOf,
  formatDateTime,
  dayOffset,
  formatDay,
  formatDuration,
  labelsOf,
  locationAddress,
  locationOf,
  sourceOf,
} from "./jobsData";

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
// when the Estimates page (EstimatesList.tsx) arrived — the two pages share
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

// ---- the "Filters" menu ----------------------------------------------------

// The menu behind the view bar's Filters control. Figma nodes 13857-25343
// (mobile drawer) and 13857-25352 (desktop card) hold the SAME 14 rows in the
// same order, each a MenuItem with a 16px left icon and an angle-right chevron
// on the right, above them a MenuHeader search reading "Filter...".
//
// The rows themselves — their order, labels and icons — and everything each one
// filters now live in ONE place, `filterDefs.tsx`'s registry, which reads the
// shared demo database through `jobsData.ts`. That is what makes the counts in
// each option's tag and the rows the table shows come from the same predicate.
//
// ONE registry per BRANCH (the Views section 14032-23326, 2026-09-03). The two
// differ only in the Status filter: the open nine over a search, or the closed
// two without one. Whoever needs the registry takes it as a `defs` prop, so
// every piece follows the branch the page is on.
const FILTERS_BY_BRANCH = {
  open: buildFilters(styles.priorityUrgent, "open"),
  closed: buildFilters(styles.priorityUrgent, "closed"),
};
type BranchId = keyof typeof FILTERS_BY_BRANCH;

/** The handlers a filter row may need — see `filterRows`' `extra`. */
type RowHandlers = Pick<HTMLAttributes<HTMLDivElement>, "onClick" | "onPointerEnter" | "onPointerLeave">;

// The desktop sub-list's gap to its row and the minimum it keeps from the
// screen edges — MenuItem's own SUB_MENU_GAP / SUB_MENU_MARGIN values.
const SUB_GAP = 4;
const SUB_MARGIN = 8;

// The rows carry the chevron as an explicit `slotRight` Icon rather than
// through MenuItem's `subMenu` prop, which would add the same chevron itself.
// The reason: each row opens a real `SelectList`, and `subMenu` wraps whatever
// it is given in a Menu CARD — a SelectList inside would be a card in a card.
// So the row looks exactly like the node and the consumer opens the list.
//
// EXCEPT a dialog-only row (`isDialogOnly` — Address). It opens a modal, not a
// list beside the row, so the chevron would promise a sub-menu that never comes
// (Daniel, 2026-08-25). The updated menu node (14032-20321, 2026-09-03) now
// draws Address without the chevron too, so the node and the build agree.
//
// The rows carry NO counter any more (Daniel, 2026-08-18). A filter can be
// applied several times, so "how many options are ticked" has no single answer
// here — and every visit to this menu adds a NEW application, it never edits an
// existing one. The applications live in the filter bar's chips instead.
const filterRows = (
  rows: AnyFilterDef[],
  // Per-row extras — the handlers that open the row's SelectList. MenuItem
  // spreads any unknown props onto its root element, so pointer handlers reach
  // the row with NO change to the component. Narrowed to the three handlers on
  // purpose: MenuItemProps is a UNION, and a whole HTMLAttributes spread
  // collides with the `never`s in its branches.
  extra?: (row: AnyFilterDef) => RowHandlers,
) => (
  <MenuItemGroup>
    {rows.map((row) => (
      <MenuItem
        key={row.id}
        label={row.label}
        slotLeft={<Icon icon={row.icon} pack={row.pack} rotate={row.rotate} container="square" />}
        slotRight={
          isDialogOnly(row) ? undefined : <Icon icon="angle-right" pack="regular" size={14} container="square" />
        }
        onClick={noop}
        {...extra?.(row)}
      />
    ))}
  </MenuItemGroup>
);

// NOTHING MATCHED THE SEARCH — one block for all three surfaces that can hit
// it (Daniel, 2026-09-11). The nodes draw the SAME thing on each: the Filters
// menu with no matching row (14310-59924 desktop / 14310-59921 mobile) and a
// multi-select filter's option list with no matching option (14310-60254 /
// 14310-60389). It is the DS `EmptyState` with its CAPTION ONLY — no icon, no
// title, no actions, since every one of those nodes carries `title: false` /
// `caption: true` — reading "No matching options". The 32px padding around it
// is the component's own.
//
// In the menu it replaces the disabled "No results found" MenuItem that stood
// in for it; in the lists it replaces the DS SelectList's built-in no-results
// block (an icon over a title and a caption), through the component's
// `noResultsState` slot. FLAGGED: if the DS's OWN no-results design has moved
// to caption-only too, the default should change and the slot can go — the
// other consumers (JobDetails' service picker, the address autocomplete) still
// want the title, which is why this is opt-in rather than a new default.
const noMatches = <EmptyState caption="No matching options" />;

// ---- the mobile sheet's "Applied filters" section --------------------------

// MOBILE ONLY (Figma node 13867-5235). The phone has no filter bar, so the
// applied filters live at the top of the Filters sheet: a secondary GroupLabel,
// then one full-width chip per application, then a full-bleed Divider — and the
// list below gains its own "Add filter" label.
//
// Both take `divider` because Menu runs `withGroupDividers` over its children:
// every child but the last gets `divider: true`, which is exactly the node's
// rule (a line under the chips, none under the list).
//
// The section is only rendered when something IS applied. The node draws no
// empty state, and a lone "Add filter" label over the untouched list would be
// noise — FLAGGED, say the word if the labels should always show.
const sectionLabel = (label: string) => (
  <div className={styles.menuSectionLabel}>
    <GroupLabel variant="secondary" label={label} />
  </div>
);

interface AppliedFiltersProps {
  /** The branch's filter registry. */
  defs: AnyFilterDef[];
  /**
   * The view's locked Status filter. It leads the section as the LOCKED chip
   * — the same first-chip rule the desktop bar follows (2026-09-09, Daniel:
   * the mobile sheet was not showing it at all, while the Filters button
   * already counted it).
   */
  lockedStatuses?: string[];
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /** The view's Schedule horizon + the hint's View-menu opener — the conflict warning. */
  scheduleHorizon?: ScheduleHorizon | null;
  onShowViewMenu?: () => void;
  /** Set by Menu's withGroupDividers — see above. */
  divider?: boolean;
}

const AppliedFilters = ({
  defs,
  lockedStatuses = [],
  selection,
  onSelectionChange,
  scheduleHorizon = null,
  onShowViewMenu,
  divider = false,
}: AppliedFiltersProps) => (
  <div>
    {sectionLabel("Applied filters")}
    <div className={styles.appliedChips}>
      {lockedStatuses.length > 0 && (
        <LockedStatusChip mobile def={defs.find((def) => def.id === "status")!} statuses={lockedStatuses} />
      )}
      {activeFilters(defs, selection).map(({ def, instance }) => (
        <AppliedChip
          key={instance.key}
          mobile
          def={def}
          instance={instance}
          selection={selection}
          onSelectionChange={onSelectionChange}
          scheduleHorizon={scheduleHorizon}
          onShowViewMenu={onShowViewMenu}
        />
      ))}
    </div>
    {/* Inset 16px each side (Daniel, 2026-08-19), the same as MenuItemGroup's
        own group divider — Divider's `padding` prop insets the line inside its
        box, so nothing here draws a line by hand. */}
    {divider && <Divider padding={`0 var(--size-4)`} />}
  </div>
);

// The filter list, with the node's "Add filter" label above it — but ONLY when
// the applied section is there to be told apart from (Daniel, 2026-08-19). With
// nothing applied the sheet holds one list, and naming it says nothing.
const AddFilterSection = ({
  rows,
  extra,
  labelled,
  divider = false,
}: {
  rows: AnyFilterDef[];
  extra?: (row: AnyFilterDef) => RowHandlers;
  labelled: boolean;
  divider?: boolean;
}) => (
  <div>
    {labelled && sectionLabel("Add filter")}
    {rows.length > 0 ? filterRows(rows, extra) : noMatches}
    {divider && <Divider />}
  </div>
);

// The Filters menu's search: the query plus the two pieces it drives. Both
// breakpoints call this, so the matching rule lives in ONE place — a
// case-insensitive substring match on the row label.
//
// The header is the DS `MenuHeader`, handed to Menu's `header` prop (Figma's
// Menu `header=true`) so it stays pinned while the rows scroll. On mobile that
// also makes the drawer fill the screen height — which is what stops the sheet
// resizing as the list filters down.
//
// MenuHeader takes focus on mount by itself, so the desktop card opens ready
// to type. The MOBILE drawer joined it on 2026-09-09 (Daniel: "the search
// should be auto-focus" — reversing his 2026-08-17 rule for this one menu):
// `autoFocusSearch` here is MenuHeader's explicit opt-in that bypasses the
// component's drawer + touch exclusions, so only the mobile caller sets it.
function useFilterSearch(open: boolean, defs: AnyFilterDef[], autoFocusSearch = false) {
  const [query, setQuery] = useState("");

  // Every fresh open starts from the full list. Cleared in a LAYOUT effect, not
  // a plain one: the state lives out here (the button stays mounted while the
  // menu comes and goes), so a stale query would otherwise be painted for one
  // frame before the reset landed.
  useLayoutEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const rows = q === "" ? defs : defs.filter((row) => row.label.toLowerCase().includes(q));

  // Bare `MenuHeader`, nothing around it. It used to be wrapped in a local
  // --gray-a2 block that re-created the design by hand, because the DS
  // SearchField `bar` was still 36px with its own fill and divider. Since the
  // bar moved to 40px + a 1px Divider (2026-08-19) the component IS that
  // design, so the wrapper is gone.
  //
  // Its FILL is taken off (Daniel, 2026-08-19), the same trial Client's list is
  // on: the menu card's own surface runs up to the Divider. A LOCAL override of
  // the DS SearchField `bar`, FLAGGED — if the no-fill search stays, the bar
  // needs a real variant in the DS.
  const header = (
    <MenuHeader
      className={styles.searchNoFill}
      // `undefined`, never `false`, when not opted in — false means NEVER
      // focus in MenuHeader's semantics, and the desktop card must keep its
      // default focus-on-open.
      autoFocusSearch={autoFocusSearch || undefined}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onClear={() => setQuery("")}
      placeholder="Filter..."
      aria-label="Filter"
    />
  );

  return { header, rows, query };
}

// ---- one filter's option list ----------------------------------------------

// The SelectList behind a filter row, on either breakpoint. The ONE designed
// example is Priority (Figma nodes 13855-22268 desktop / 13855-23306 mobile) and
// every filter follows it: a searchable multi-select list whose rows carry the
// option's icon, its label, and the number of jobs behind it in `tag`.
//
// The count comes from `optionCounts`, which measures against the list filtered
// by every OTHER active filter — so it answers "how many would I get if I ticked
// this", and ticking one option does not drop its siblings to 0.
// ---- how wide a filter's list is -------------------------------------------
//
// It is not measured any more (Daniel, 2026-09-11: the Labels list "should
// follow the default component behavior. No overrides"). The DS SelectList
// card already sizes itself — `width: fit-content` capped by its own
// `max-width: 384px` — and the only thing a filter list adds is the 208px
// floor its documented nodes pin. Everything else the old build computed
// (canvas text measurement per option, the condition-chip row width, a
// per-filter minimum) is gone with it.
//
// This lands on the nodes exactly, because the component's own hugging is what
// the nodes draw: Labels empty is 223 (13999-17141) and 384 once a second
// label brings the four conditions and the chips wrap (14101-42750); Location
// is 384 (14101-44923); the short lists sit on the 208 floor.
// 208px — the floor EVERY surface in this menu sits on: the Filters card
// itself (node 14310-59652) and each of its lists, whose nodes all carry the
// same "Min Width" pin. One constant, so they cannot drift apart.
const MIN_WIDTH = "var(--size-52)"; // 208px

const LIST_STYLE: CSSProperties = { minWidth: MIN_WIDTH };

/**
 * Holds a card at the width it HUGGED TO when it opened, for as long as it
 * stays open — the rule the Filters menu already follows (Daniel, 2026-09-11:
 * "the width of the menu should not change" while typing), now applied to the
 * option lists as well: "Service and Source SelectLists change their width
 * while typing within the search."
 *
 * Only those two showed it, and that is the whole story: every other list
 * either sits on the 208 floor (its rows are narrower) or against the 384
 * ceiling, so filtering rows out cannot move it. Service (291) and Source
 * (231) are the ones that float in between, where the widest VISIBLE row
 * decides the width and so changes with every keystroke.
 *
 * A FLOOR, never a fixed width: filtering only removes rows, so the content can
 * only get narrower and the floor is what it settles on — but if a row ever
 * needs more, the card can still take it, so this can never clip a label.
 *
 * `offsetWidth`, not `getBoundingClientRect()`: the card opens under a
 * `scale(0.98)` transition and the rect would report the scaled width.
 */
function useFrozenWidth(open: boolean, enabled: boolean, key: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [frozen, setFrozen] = useState<number | null>(null);

  // RELEASE first. `key` is the filter the card is showing, and on desktop the
  // card stays mounted while the pointer moves from row to row — only the
  // contents change — so a floor measured for Service would otherwise still be
  // holding Source's list open at 291px.
  useLayoutEffect(() => {
    setFrozen(null);
  }, [open, enabled, key]);

  // MEASURE on the pass after that, when the card is hugging its own rows with
  // nothing but the 208 floor under it.
  useLayoutEffect(() => {
    if (!open || !enabled || frozen != null) return;
    const el = ref.current;
    if (el != null) setFrozen(el.offsetWidth);
  }, [open, enabled, frozen, key]);

  return {
    ref,
    style: {
      minWidth: frozen != null ? `max(${MIN_WIDTH}, ${frozen}px)` : MIN_WIDTH,
    } as CSSProperties,
  };
}

/**
 * Does this filter hold ONE value rather than a set? Date and duration both do,
 * and everything that follows from it is the same for the two: a single-select
 * list (so it closes on the pick), no counts, no Apply bar on mobile, and a
 * "Custom..." row in the footer that opens a dialog. Type is single-SELECT
 * without being single-value (`isSingleSelect` below carries the list
 * behavior); this test alone gates the Custom-dialog machinery, which only a
 * date or duration has.
 */
const isSingleValue = (def: AnyFilterDef) => def.kind === "date" || def.kind === "duration";

/**
 * Is this filter's LIST single-select — one pick at a time, applying and
 * closing on the pick, no Apply bar on mobile? Every single-value filter is,
 * and so is an options filter marked `singleSelect` (Type — its section's
 * annotation, node 14101-53834). What this does NOT imply is a "Custom..."
 * row: that stays `isSingleValue`'s.
 */
const isSingleSelect = (def: AnyFilterDef) => isSingleValue(def) || def.singleSelect === true;

/**
 * Does this filter have NO option list at all, so that everything about it is
 * edited in a dialog? Only Address (Figma section 13988-53503). Its row in the
 * Filters menu opens the dialog on CLICK instead of hovering a list open, and
 * its chip's value segment does the same.
 */
const isDialogOnly = (def: AnyFilterDef) => def.kind === "address";

// (DIALOG_MARKER — the Custom dialog's scrim class the anchored cards spare —
// lives in appShell.tsx with useAnchoredCard now.)
/** The Custom popover's card, from Figma nodes 13913-14399 / 13912-13158. */

// The condition list — a SelectList of two SelectListItems, not a Menu (Figma
// nodes 13877-16387 desktop / 13877-16411 mobile; it WAS a Menu until Daniel
// changed it, 2026-08-17). SINGLE-select: the two conditions replace each other,
// and a single-select SelectList closes itself as soon as one is picked.
function conditionList(value: FilterValue, onPick: (choice: ConditionChoice) => void) {
  const choices = conditionChoices(value);
  const items = (
    <SelectListItemGroup>
      {choices.map((choice) => (
        <SelectListItem
          key={choice.label}
          label={choice.label}
          select="single"
          selected={isConditionActive(value, choice)}
          onClick={() => onPick(choice)}
        />
      ))}
    </SelectListItemGroup>
  );
  return { items };
}

// A FUNCTION, not a component: SelectList has to SEE the SelectListItemGroup
// among its children. Its built-in `searchable` filters the items by their
// `label`, and `withGroupDividers` clones the groups — neither can look inside a
// custom component, so wrapping this in one made every list render its
// "No results found" state with zero options. (The same trap as
// SidePanelNavigation's fragment note in the DS.)
function filterList(
  def: AnyFilterDef,
  /** The ONE application this list edits — a fresh one from the Filters menu, or
   *  the existing one behind a chip. */
  instance: FilterInstance,
  onInstanceChange: (next: FilterInstance) => void,
  /** The list's own search text, when it has a search (see FilterOptions). */
  query = "",
) {
  // A DATE filter is its own list (Figma node 13912-11964): seven relative dates,
  // SINGLE-select, so no checkbox, no icon, no count and no search — and one
  // "Custom" row in the footer, which the caller wires (see FilterOptions).
  if (def.kind === "date") {
    const picked = instance.date?.preset ?? null;
    const items = (
      <SelectListItemGroup>
        {def.options.map((option) => (
          <SelectListItem
            key={option.id}
            label={option.label}
            select="single"
            selected={picked === option.id}
            // Picking a preset CLEARS the custom date — the two are alternatives
            // (Daniel, 2026-08-19), so the chip shows one or the other. It also
            // clears `compare`: a preset's condition is the after / before pair
            // the list header's own chips show, not the dialog's four.
            onClick={() =>
              onInstanceChange({
                ...instance,
                date: { preset: option.id, from: null, to: null },
              })
            }
          />
        ))}
      </SelectListItemGroup>
    );
    return { items, isEmpty: false };
  }

  // A DURATION filter is the date list's twin (Figma node 13874-11407): four
  // preset lengths, SINGLE-select, no icon, no count and no search, over a
  // "Custom..." row the caller wires. Picking a preset CLEARS any custom value —
  // the two are alternatives, like a date's preset and its custom date — and
  // KEEPS the condition, which the header's chips have already set.
  if (def.kind === "duration") {
    const picked = instance.duration?.preset ?? null;
    const compare = instance.duration?.compare ?? "over";
    const items = (
      <SelectListItemGroup>
        {def.options.map((option) => (
          <SelectListItem
            key={option.id}
            label={option.label}
            select="single"
            selected={picked === option.id}
            onClick={() =>
              onInstanceChange({
                ...instance,
                // A preset is one value, so a `within` condition cannot survive
                // it — it falls back to the list header's own three.
                duration: {
                  compare: compare === "within" ? "over" : compare,
                  preset: option.id,
                  from: null,
                  to: null,
                },
              })
            }
          />
        ))}
      </SelectListItemGroup>
    );
    return { items, isEmpty: false };
  }

  const counts = def.counts?.() ?? {};
  const picked = instance.ids;
  const toggle = (optionId: string) => {
    // A SINGLE-select options filter (Type) holds one option at a time — its
    // section's annotation. Picking REPLACES the pick, exactly like a date
    // preset; there is no un-pick, because clearing the filter is the chip's
    // remove button.
    if (def.singleSelect === true) {
      onInstanceChange({ ...instance, ids: [optionId] });
      return;
    }
    // Every option toggles on its own. The absence options ("No assignees",
    // "No labels") used to clear the rest and be cleared BY the rest — the
    // rows' old annotation, "this option can only be used alone" — which
    // Daniel removed on 2026-09-11: they combine like any other option now, so
    // "No assignees or Dana" is a filter the user can build.
    const ids = picked.includes(optionId) ? picked.filter((id) => id !== optionId) : [...picked, optionId];
    // Un-ticking the last option leaves an EMPTY application; `upsertFilter`
    // drops it from the selection, so its chip goes with it.
    onInstanceChange({ ...instance, ids });
  };

  // The search is the list's own (see FilterOptions), not SelectList's built-in
  // one: this list's header holds the condition chips as well, and SelectList
  // only filters the groups when IT owns the search field.
  const q = query.trim().toLowerCase();
  // `searchText` INSTEAD of the label, the DS `SelectListItem` rule — so this
  // search (a list opened from the Filters menu) and SelectList's built-in one (a
  // list opened from a chip) match on exactly the same words. Location's rows put
  // their client's name in there, because the grouping took it out of the label.
  const haystack = (option: FilterOption) => (option.searchText ?? option.label).toLowerCase();
  const shown = q === "" ? def.options : def.options.filter((option) => haystack(option).includes(q));

  // The OBJECT row (Location since 2026-09-11 — node 14101-44923): the DS's
  // 60px variant, an xl AvatarLocation with the address as its Medium title and
  // the site's name as the caption under it. It carries no tag — the object
  // variant's copy rules forbid combining a caption with one, and Location
  // shows no counts anyway.
  const row = (option: FilterOption) =>
    def.objectRows === true ? (
      <SelectListItem
        key={option.id}
        variant="object"
        label={option.label}
        caption={option.caption}
        avatar={option.avatar}
        searchText={option.searchText}
        select="multi"
        selected={picked.includes(option.id)}
        onClick={() => toggle(option.id)}
      />
    ) : (
      <SelectListItem
        key={option.id}
        label={option.label}
        searchText={option.searchText}
        // Type's rows are single-select — icon + label, no checkbox, the picked
        // row showing the DS right check (node 14101-53835's rows).
        select={def.singleSelect === true ? "single" : "multi"}
        selected={picked.includes(option.id)}
        onClick={() => toggle(option.id)}
        slotLeft={option.slotLeft}
        tag={def.hideCounts === true ? undefined : countLabel(counts[option.id] ?? 0)}
      />
    );

  // GROUPED (Location, Figma node 13986-51038): one SelectListItemGroup per
  // group, each headed by a `secondary` GroupLabel — the DS pairing rule for
  // "default" items. A group the search has emptied is dropped entirely, header
  // and all; SelectList puts the dividers between whatever is left.
  //
  // Groups also change how the list ORDERS itself: the DS pins the
  // selected-on-open rows to the top only when there is ONE group, and leaves
  // several exactly as written. That is what we want here — a location without
  // its client above it means nothing.
  if (def.groups != null) {
    const groups = def.groups
      .map((group) => ({ group, options: shown.filter((option) => option.groupId === group.id) }))
      .filter((entry) => entry.options.length > 0);
    // An ARRAY, never a fragment. `withGroupDividers` does look through
    // fragments, but SelectList's own `groupCount` (and the `pinned` scan next
    // to it) call `Children.toArray` WITHOUT unwrapping — a fragment would
    // count as ONE group, which flips on the single-group "selected on top"
    // reorder and hands it the groups where it expects items. An array is
    // flattened by `Children.toArray`, so every group is seen.
    const items = groups.map(({ group, options }) => (
      <SelectListItemGroup
        key={group.id}
        // The DS pairing rule, which the component's own docs state: a PRIMARY
        // GroupLabel goes with "object" items, a SECONDARY one with "default"
        // items. Location's rows became object rows on 2026-09-11 and its node
        // (14101-44923) moved its GroupLabel to `primary` with them, so the
        // variant is taken from the rows rather than written by hand.
        label={
          def.objectRows === true ? (
            // `primary` also carries the group's own avatar — Location's header
            // shows the client's (node 14101-44923's GroupLabel slotLeft).
            <GroupLabel variant="primary" slotLeft={group.slotLeft} label={group.label} />
          ) : (
            <GroupLabel variant="secondary" label={group.label} />
          )
        }
      >
        {options.map(row)}
      </SelectListItemGroup>
    ));
    return { items, isEmpty: groups.length === 0 };
  }

  const items = <SelectListItemGroup>{shown.map(row)}</SelectListItemGroup>;

  return { items, isEmpty: shown.length === 0 };
}

// ---- the condition section -------------------------------------------------

// The conditions as DS `Chip`s at the top of a filter's option list. The
// choices are the same set the chip's condition menu offers, so they follow
// the value count: "is" / "is not" with one option ticked, "is any of" / "is
// not" with several.
//
// The bare Chips, with no row around them — what the DS `SelectListHeader`
// takes for its `chips` slot (it wraps them in a real ChipGroup itself).
//
// `md` (32px) everywhere: this builds LIST-HEADER chips only. The Custom dialogs
// draw their own `lg` (36px) chips from DATE_CONDITIONS / DURATION_DIALOG_-
// CONDITIONS, because the sets they offer are wider than the chip's.
const conditionChipList = (value: FilterValue, onChange: (choice: ConditionChoice) => void) =>
  conditionChoices(value).map((choice) => (
    <Chip key={choice.label} size="md" isSelected={isConditionActive(value, choice)} onClick={() => onChange(choice)}>
      {choice.label}
    </Chip>
  ));

// ---- the date filter's "Custom..." dialog -----------------------------------

// The modal behind the list's "Custom..." row, from Figma nodes 13962-8889
// (desktop) / 13962-8893 (mobile). The DS `Dialog`, titled with the filter's own
// name, holding four blocks:
//
//   TIMEFRAME (a 16px row) — a `ChipGroup` of `lg` Chips, Day / Month / Year,
//     that picks WHICH timeframe the date is expressed in.
//   a `Divider`, FULL-BLEED — edge to edge, no side inset.
//   CONDITION (its own 16px container) — a second `ChipGroup` of `lg` Chips:
//     HOW the timeframe is measured — on / before / after / within.
//   SELECTION (16px sides and bottom, none on top — the Condition block above
//     closes with its own 16 — and 16px between items). Unique to the chosen
//     timeframe:
//     - a `DateField` labelled "Date". It does NOT open the DatePicker
//       (`withPicker={false}`, Daniel 2026-08-23) — the calendar is already in
//       the dialog, so the field is a text field that parses what is typed;
//     - the calendar itself (`DialogCalendar` below).
//   the FOOTER: the picked date on the left, "Apply" on the right.
//
// REBUILT 2026-08-24 (Daniel): the "Range (within)" ToggleItem that used to
// share the Timeframe row is GONE, and its job is now the fourth condition chip,
// `within` — "it does the same thing as the Range toggle, just structured
// differently". Three things follow from that:
//   - `DateValue` has no `range` flag any more; `compare === "within"` IS the
//     range (`isDateRange`);
//   - the Condition block is shown in range mode too (nodes 13962-12748 /
//     13962-12750 now draw it), where the old build hid it;
//   - the four chips are the same on every timeframe, so switching timeframe no
//     longer rewrites the condition — only the dates are dropped.
//
// Everything inside is a DRAFT until Apply, so an unfinished edit never wipes
// the chip.
const isoOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dateOf = (iso: string | null) => (iso == null ? null : new Date(`${iso}T12:00:00`));

/** The top ChipGroup, in the node's order. All three are built. */
const TIMEFRAMES: { id: DateTimeframe; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

// ---- the dialog's MONTH grid and YEAR list ---------------------------------

// The Month and Year timeframes' content — the documented Timeframe filter
// section (14038-21304, 2026-09-03; Month dialog 14097-21480, Year dialog
// 14098-28104). Neither has date fields or a calendar — the period IS the
// value.
//
// The cells are the DS `DateChip` since 2026-09-03 — the same component the
// day calendar uses, which is exactly what the nodes draw ("#️⃣ DateChip"):
// 36px tall, 6px radius, stretching to fill its column; the picked period =
// the chip's own `selected` (a2 fill + gray-12 stroke, Medium); the CURRENT
// period — the one holding today — reads `--text-error`, like the calendar's
// today (the nodes' annotation: "A year with the current day is highlighted");
// a range runs as the chip's own band. The old local Chip restyle (the dark
// pill, the full radius) is gone with it.
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface PeriodListProps {
  /** "month" draws twelve chips per year; "year" draws one chip per year. */
  timeframe: "month" | "year";
  /** SINGLE mode: the picked period as an ISO first-of-period, or null. */
  from: string | null;
  /** RANGE mode's second end; `range` says which mode this is. */
  to: string | null;
  range: boolean;
  onPick: (iso: string) => void;
  today: Date;
}

// Both the MONTH grid and the YEAR list — the same list of years, drawn two
// ways. Month gives each year a 36px `heading-h3` header over its twelve
// months in three touching columns, rows 4px apart (node 14097-21480); Year is
// one full-width cell per year, 4px apart, no titles (node 14098-28104). The
// list SCROLLS and opens on the period holding today (the nodes' annotation),
// or on the picked one.
function PeriodList({ timeframe, from, to, range, onPick, today }: PeriodListProps) {
  // Same preview as the calendar's: with only one end picked, the band follows
  // the pointer. NOT IN THE NODE — a static frame cannot draw a hover.
  const [hovered, setHovered] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const openYearRef = useRef<HTMLDivElement>(null);

  // Open on the year that matters — the picked one, else today's (Daniel,
  // 2026-08-23; the documented nodes' "Shows the year with the current day by
  // default"). The scroll is set on the LIST, not through `scrollIntoView`:
  // that walks up every scrollable ancestor, and it would take the Timeframe
  // and Condition rows off the top of the dialog with it.
  useEffect(() => {
    const list = listRef.current;
    const year = openYearRef.current;
    if (list != null && year != null) list.scrollTop = year.offsetTop;
  }, []);

  const bandFrom = range ? from : null;
  const bandTo = range ? (to ?? (bandFrom != null && hovered != null && hovered > bandFrom ? hovered : null)) : null;

  const openYear = from != null ? Number(from.slice(0, 4)) : today.getFullYear();
  // 1990 up to ten years past today — the annotation on node 14098-28104.
  const years: number[] = [];
  for (let year = FIRST_YEAR; year <= today.getFullYear() + YEARS_AFTER_TODAY; year++) years.push(year);

  /** The period (first-of-month / first-of-year ISO) that holds today. */
  const currentIso =
    timeframe === "year"
      ? `${today.getFullYear()}-01-01`
      : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

  // One cell — a month or a whole year: the DS DateChip. `rowStart`/`rowEnd`
  // cap the range band at the row's edges, the chip's own band rule ("a range
  // end, a row break … they all look the same").
  const cell = (iso: string, label: string, rowStart: boolean, rowEnd: boolean) => {
    const picked = range ? iso === bandFrom || iso === bandTo : iso === from;
    const inBand = bandFrom != null && bandTo != null && iso >= bandFrom && iso <= bandTo;
    const capLeft = iso === bandFrom || rowStart;
    const capRight = iso === bandTo || rowEnd;
    return (
      <DateChip
        key={iso}
        day={label}
        isSelected={picked}
        isToday={iso === currentIso}
        band={!inBand ? "none" : capLeft && capRight ? "capBoth" : capLeft ? "capLeft" : capRight ? "capRight" : "middle"}
        aria-label={label}
        onPointerEnter={() => setHovered(iso)}
        onClick={() => onPick(iso)}
      />
    );
  };

  return (
    <div
      ref={listRef}
      className={clsx(styles.monthYears, timeframe === "year" && styles.monthYearsRows)}
      onPointerLeave={() => setHovered(null)}
    >
      {years.map((year) =>
        timeframe === "year" ? (
          // A year is a row of its own, so an in-band year is capped both ways.
          <div key={year} ref={year === openYear ? openYearRef : undefined} className={styles.yearRow}>
            {cell(`${year}-01-01`, String(year), true, true)}
          </div>
        ) : (
          <div key={year} ref={year === openYear ? openYearRef : undefined} className={styles.monthYear}>
            <div className={styles.monthYearTitle}>{year}</div>
            <div className={styles.monthGrid}>
              {MONTH_LABELS.map((label, index) =>
                cell(`${year}-${String(index + 1).padStart(2, "0")}-01`, label, index % 3 === 0, index % 3 === 2),
              )}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

// ---- the dialog's calendar -------------------------------------------------

// The month calendar drawn INSIDE the Custom dialog — the documented Day
// dialog (node 14095-7347, 2026-09-03; it replaced 13962-8889 / 13962-8893).
// Since 2026-09-03 each visible month IS the DS `Month` component (Daniel:
// "Use Month component from the DS") — the same piece DatePicker renders,
// which is exactly what the node embeds ("#️⃣ Month"): the 36px header with
// the title left and the lg jump-to-today / prev / next buttons right, the
// weekday captions, the fixed 6×7 DateChip grid with empty placeholders
// outside the month, and the band capped at range ends and row breaks alike.
//
// What stays local is only the ARRANGEMENT the DS root cannot provide inline
// (`DatePicker` renders as a floating card or its own drawer): one or two
// months side by side (the nav on the LAST one, moving both — node
// 14096-10085), the swipe-to-change-month gesture, and the half-picked
// range's hover preview, which `Month`'s own `onHover` contract exists for.

/** Range mode's two ends, as ISO `yyyy-mm-dd`. Its presence IS the mode. */
interface CalendarRange {
  from: string | null;
  to: string | null;
}

interface DialogCalendarProps {
  /** SINGLE mode: the picked day, or null — the dialog opens with none. */
  value?: Date | null;
  /** RANGE mode: the two ends. Passing this switches the calendar's behavior. */
  range?: CalendarRange;
  onChange: (date: Date) => void;
  /** The FIRST month on show; the arrows and swipes move on from there. */
  month: Date;
  onMonthChange: (month: Date) => void;
  /**
   * How many months side by side. 2 on desktop in range mode (node
   * 13962-12748); 1 everywhere else — mobile shows one month at a time.
   */
  monthCount?: number;
  /** "Today" — a prop so a story can pin it. Defaults to the real today. */
  today?: Date;
}

const firstOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
/** Months since year 0 — lets two months be compared with one number. */
const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

function DialogCalendar({ value, range, onChange, month, onMonthChange, monthCount = 1, today }: DialogCalendarProps) {
  // `useState` initialiser, not a bare `new Date()`: the reference must not
  // change on every render, or the "today" cell could flip mid-session.
  const [todayDate] = useState(() => today ?? new Date());
  // The day under the pointer while a range is half-picked — it previews where
  // the band would end (`Month`'s own `onHover` contract). NOT IN THE NODE (a
  // static frame cannot draw a hover), but picking a range blind is guesswork.
  // FLAGGED.
  const [hovered, setHovered] = useState<Date | null>(null);
  const goToMonth = (delta: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  // JUMP TO TODAY (Figma nodes 13973-32477 / 13973-32495) — `Month`'s own
  // return button. It appears only once today is in NONE of the shown months,
  // and its icon points the way back. Jumping puts today in the FIRST month.
  const monthsAfterLast = monthIndex(todayDate) - (monthIndex(month) + monthCount - 1);
  const monthsBeforeFirst = monthIndex(todayDate) - monthIndex(month);
  const returnDirection = monthsAfterLast > 0 ? "right" : monthsBeforeFirst < 0 ? "left" : null;

  // Swipe sideways to change month — the same gesture (and the same 48px /
  // mostly-horizontal test) the DS DatePicker's drawer uses. A vertical drag is
  // left alone so the mobile dialog can still be swiped away.
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    const touch = e.changedTouches[0];
    if (start == null || touch == null) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
    goToMonth(dx < 0 ? 1 : -1);
  };

  // The band's two ends, as DATES (`Month`'s contract). With only `from`
  // picked the hovered day stands in for `to`, so the band follows the pointer.
  const from = dateOf(range?.from ?? null);
  const to = dateOf(range?.to ?? null);
  const bandEnd = to ?? (from != null && hovered != null && hovered > from ? hovered : null);
  const band = from != null && bandEnd != null ? { start: from, end: bandEnd } : null;
  // The selected chips: the range's two ends, or the single mode's one pick.
  const selectedDates = range != null ? [from, to] : [value ?? null];

  const months = Array.from({ length: monthCount }, (_, i) => new Date(month.getFullYear(), month.getMonth() + i, 1));

  return (
    <div className={styles.dialogCalendar} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className={styles.dialogCalendarMonths}>
        {months.map((shown, index) => {
          // The controls live on the LAST month only, so with two of them the
          // arrows sit at the far right and move the pair together (node
          // 14096-10085).
          const withNav = index === monthCount - 1;
          // The keyboard entry point: the selected end shown in this month,
          // else the month's first day.
          const selectedHere = selectedDates.find((s) => s != null && isSameMonth(s, shown)) ?? null;
          return (
            <Month
              key={monthIndex(shown)}
              month={shown}
              today={todayDate}
              selectedDates={selectedDates}
              band={band}
              showNav={withNav}
              prevDisabled={false}
              nextDisabled={false}
              onPrev={() => goToMonth(-1)}
              onNext={() => goToMonth(1)}
              returnDirection={withNav ? returnDirection : null}
              onReturn={() => onMonthChange(firstOfMonth(todayDate))}
              onPick={onChange}
              // The hover preview only matters while a range is half-picked.
              onHover={range != null ? setHovered : undefined}
              tabbable={selectedHere ?? shown}
              slideDir={null}
            />
          );
        })}
      </div>
    </div>
  );
}

interface DateCustomProps {
  /** The filter this dialog belongs to — it names the dialog. */
  def: AnyFilterDef;
  /** The value being edited — a fresh one from the list, or the chip's. */
  value: FilterValue;
  /** The finished date. `negated` is always false — `compare` IS the condition. */
  onApply: (date: DateValue) => void;
  onClose: () => void;
  open: boolean;
  /** Presentation — the PROTOTYPE's breakpoint, not the window's (DeviceFrame). */
  breakpoint: "desktop" | "mobile";
}

function DateCustom({ def, value, onApply, onClose, open, breakpoint }: DateCustomProps) {
  // Opening on a PRESET starts empty — a preset and a custom date are
  // alternatives, so there is nothing to carry over.
  const editing = value.date != null && value.date.preset == null ? value.date : null;
  const [draft, setDraft] = useState<DateValue>({
    preset: null,
    from: editing?.from ?? null,
    to: editing?.to ?? null,
    // The dialog ALWAYS carries a measure — it is the second ChipGroup, and
    // there is no unset state for it. "after" is the first chip and the default
    // (Daniel, 2026-08-24: "'After' should be the first one and the default
    // one"). The rebuilt nodes settle it: Day 13979-32841, Month 13979-34143 and
    // Year 13979-35147 all draw `after` active.
    compare: editing?.compare ?? "after",
    timeframe: editing?.timeframe ?? "day",
  });
  // No separate flag any more — `within` IS the range (Daniel, 2026-08-24).
  const range = isDateRange(draft);
  const timeframe = draft.timeframe ?? "day";
  // Pinned once per mount, like the calendar's — the month grid opens on it.
  const [todayDate] = useState(() => new Date());
  const from = dateOf(draft.from);
  const to = dateOf(draft.to);
  // Two months side by side on DESKTOP in range mode (node 13962-12748); one
  // everywhere else — "on mobile we only show 1 month at a time" (Daniel).
  const monthCount = range && breakpoint === "desktop" ? 2 : 1;

  // The FIRST month on show. It follows a date typed into a field, and the
  // arrows / swipes move it on their own.
  const [month, setMonth] = useState(() => firstOfMonth(from ?? new Date()));

  /** Move the view only if `date` is not already on screen. */
  const revealMonth = (date: Date) =>
    setMonth((current) => {
      const offset = monthIndex(date) - monthIndex(current);
      return offset >= 0 && offset < monthCount ? current : firstOfMonth(date);
    });

  const setEnd = (key: "from" | "to", date: Date | null) => {
    setDraft((current) => ({ ...current, [key]: date == null ? null : isoOf(date) }));
    if (date != null) revealMonth(date);
  };

  // Clicking a day, or a month chip — both hand over an ISO date, so the rule
  // is one. SINGLE mode replaces the one pick. RANGE mode fills `from` first,
  // then `to`; a click before `from`, or one made when the range is already
  // whole, starts a new range there.
  const pickIso = (iso: string) =>
    setDraft((current) => {
      if (!isDateRange(current)) return { ...current, from: iso };
      if (current.from == null || current.to != null || iso < current.from) {
        return { ...current, from: iso, to: null };
      }
      return { ...current, to: iso };
    });

  // Switching timeframe DROPS the picked dates: a day is not a month, so
  // carrying "Aug 5" over to the Month grid would leave a value nobody chose.
  // The CONDITION survives — since 2026-08-24 the four chips are the same on
  // every timeframe, so there is nothing to reset.
  const setTimeframe = (next: DateTimeframe) =>
    setDraft((current) => ({ ...current, timeframe: next, from: null, to: null }));

  // The condition chips. Picking one keeps `from` — the date already chosen
  // becomes the range's first end, or the single value again — and always drops
  // `to`, so a half-finished range can never survive the switch.
  const setCompare = (next: DateCompare) => setDraft((current) => ({ ...current, compare: next, to: null }));

  // Apply stays disabled until there is something to apply: one day, or BOTH
  // ends of a range (Daniel, 2026-08-23).
  const ready = range ? draft.from != null && draft.to != null : draft.from != null;

  // What the DateFields SHOW (Daniel, 2026-08-23): the month spelled out on
  // desktop, shortened on the phone — where "Date from" and "Date to" share one
  // row, so a long month name would truncate. Typed input is still parsed the
  // same way; this only changes the committed text.
  const formatField = breakpoint === "desktop" ? formatLongDate : formatFooterDate;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // The filter's own name titles the dialog, not the word "Custom".
      title={def.label}
      breakpoint={breakpoint}
      // DIALOG_MARKER is a plain class the outside-click handlers look for. No
      // z-index override: the menu and the option list close when the dialog
      // opens, so it sits on the normal --z-modal layer.
      // The DS Dialog card is already 608px wide, the node's own width.
      className={DIALOG_MARKER}
      // Every block below brings its own 16px — the DS default would add 24
      // between them.
      bodyPadded={false}
      footer={
        // Cancel / Apply since the documented Timeframe section (2026-09-03,
        // nodes 14095-7347 / 14097-21480 / 14098-28104 — every variant draws
        // the ghost Cancel in the left slot). The old picked-date preview
        // (Daniel, 2026-08-23, node 13979-35697) is GONE from the design; the
        // duration dialog still carries its own. Apply stays disabled until a
        // value is picked, the nodes' annotation.
        <PopoverFooter
          leadingButton={
            <Button variant="ghost" size="lg" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button
            variant="solid"
            size="lg"
            isDisabled={!ready}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Apply
          </Button>
        </PopoverFooter>
      }
    >
      {/* TIMEFRAME — the chips that pick Day / Month / Year. The Range toggle
          that used to share this row is gone (Daniel, 2026-08-24); the row is
          the ChipGroup and nothing else. */}
      <div className={styles.dateCustomTimeframe}>
        <ChipGroup>
          {TIMEFRAMES.map((option) => (
            <Chip key={option.id} size="lg" isSelected={timeframe === option.id} onClick={() => setTimeframe(option.id)}>
              {option.label}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* FULL-BLEED — edge to edge, no side inset (Daniel, 2026-08-23). */}
      <Divider contrast="medium" />

      {/* CONDITION — its own 16px container, between the Divider and the
          Selection block (Figma frame 13973-32462). ALWAYS shown, `within`
          included: the nodes draw it in range mode too now (13962-12748 /
          13962-12750), because `within` is the chip that PUTS the dialog in
          range mode. */}
      <div className={styles.dateCustomCondition}>
        <ChipGroup>
          {DATE_CONDITIONS.map((choice) => (
            <Chip key={choice} size="lg" isSelected={draft.compare === choice} onClick={() => setCompare(choice)}>
              {/* "on" a day, "in" a month or a year — the only measure whose
                  wording follows the timeframe (nodes 13979-34143 / 13979-35147). */}
              {dateCompareLabel(choice, timeframe)}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* A SECOND full-bleed Divider closes the Condition block on EVERY
          timeframe now — DAY joined Month and Year on 2026-09-09 (the Day
          section's new dividers, nodes 14205-65591…65613; Month/Year drew it
          all along, 14097-21480 / 14098-28104). */}
      <Divider contrast="medium" />

      {/* The chosen timeframe's own content. MONTH and YEAR: the period list,
          which carries its own 16px padding and scrolls behind the line. DAY
          keeps the Selection block (field + calendar). */}
      {timeframe !== "day" ? (
        <PeriodList
          timeframe={timeframe}
          from={draft.from}
          to={draft.to}
          range={range}
          onPick={pickIso}
          today={todayDate}
        />
      ) : (
        <div className={styles.dateCustomSelection}>
          <>
            {range ? (
              // Two fields sharing the row, 16px apart (nodes 13962-12748 /
              // 13962-12750). Neither opens a DatePicker, like the single field.
              <div className={styles.dateCustomFields}>
                <Input label="Date from">
                  <DateField
                    value={from}
                    onDateChange={(date) => setEnd("from", date)}
                    withPicker={false}
                    formatValue={formatField}
                  />
                </Input>
                <Input label="Date to">
                  <DateField
                    value={to}
                    onDateChange={(date) => setEnd("to", date)}
                    withPicker={false}
                    formatValue={formatField}
                  />
                </Input>
              </div>
            ) : (
              <Input label="Date">
                <DateField
                  value={from}
                  // NO DatePicker (Daniel, 2026-08-23): the calendar is right
                  // below, so a second one on top of it would be in the way. The
                  // field still parses whatever is typed and hands back a Date.
                  withPicker={false}
                  formatValue={formatField}
                  onDateChange={(date) => setEnd("from", date)}
                />
              </Input>
            )}

            <DialogCalendar
              value={range ? undefined : from}
              range={range ? { from: draft.from, to: draft.to } : undefined}
              onChange={(date) => pickIso(isoOf(date))}
              month={month}
              onMonthChange={setMonth}
              monthCount={monthCount}
            />
          </>
        </div>
      )}
    </Dialog>
  );
}

// ---- the duration filter's "Custom..." dialog ------------------------------

// The modal behind the duration list's "Custom..." row — the documented Form
// section (14100-38325, 2026-09-03: No Range nodes 13923-24049 desktop /
// 13923-24742 mobile, Range 13923-24617 / 13923-24921, plus their Filled
// twins). The DS `Dialog`, titled with the filter's own name, holding:
//
//   CONDITION (a 16px row) — a `ChipGroup` of `lg` Chips: over / under / is /
//     within. This is the ONE place `within` can be chosen, because it is the
//     only place that can collect a second value.
//   a `Divider`, FULL-BLEED — edge to edge, like the date and address
//     dialogs'. NEW with the documented section; the old node drew none here.
//   CONTENT (16px all round, 16px between items):
//     - one `Input` labelled "Duration", or, in `within`, two stacked Inputs
//       labelled "From" and "To" (the documented nodes' labels — they read
//       "Duration from" / "Duration until" before);
//     - each is the DS `InputGroup` in its TextField + SelectField shape: hours
//       typed with an "hr" suffix, minutes picked from a list with a "min" one.
//   the FOOTER: a ghost Cancel and a solid Apply, like the date and address
//     dialogs. The old value-being-built preview (node 13983-38225) is GONE
//     from the design — the Filled nodes (14100-39378 / 14100-40342) draw a
//     plain Cancel / Apply pair too.
//
// Apply stays disabled until the value is complete — the nodes' annotations:
// "until the 'date' Input is filled out", and on a range "until both the
// 'From' and the 'To' inputs are filled out".
//
// Everything inside is a DRAFT until Apply, so an unfinished edit never wipes
// the chip.

/** The minutes the picker offers — quarter hours, as everywhere else in the app. */
const MINUTE_OPTIONS = ["00", "15", "30", "45"];

/** A duration split into what the two fields hold. */
interface DurationParts {
  hours: string;
  minutes: string;
}

const splitDuration = (total: number | null): DurationParts =>
  total == null
    ? // A ZERO in the hours field, not a blank — the empty nodes draw "0 hr" /
      // "00 min" in the filled style (13923-24049 / 13923-24617). Zero still
      // counts as "not filled in", which is what keeps Apply disabled.
      { hours: "0", minutes: "00" }
    : { hours: String(Math.floor(total / 60)), minutes: String(total % 60).padStart(2, "0") };

/**
 * What the two fields add up to, or null when they add up to nothing. An empty
 * hours field with "00" minutes is NOT a duration of zero — it is a field the
 * user has not filled in, which is what keeps Apply disabled.
 */
const joinDuration = (parts: DurationParts): number | null => {
  const total = (parseInt(parts.hours, 10) || 0) * 60 + (parseInt(parts.minutes, 10) || 0);
  return total > 0 ? total : null;
};

/**
 * One SelectField inside the Custom dialog. The list is a body portal — the
 * dialog's own body would clip it — marked with DIALOG_MARKER so the chip's
 * `useAnchoredCard` counts it as part of the dialog and does not close the whole
 * stack underneath it. Outside clicks are caught in the CAPTURE phase: the
 * Dialog card stops `pointerdown` from bubbling to the document, so a
 * bubble-phase listener would never see a click on another field in the dialog.
 */
function useDialogSelect(mobile: boolean) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const measure = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, top: rect.bottom + 4, width: rect.width };
  };

  const toggle = (el: HTMLElement) => {
    if (open) {
      setOpen(false);
      return;
    }
    triggerRef.current = el;
    if (!mobile) setPos(measure(el));
    setOpen(true);
  };
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open || mobile) return undefined;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (cardRef.current?.contains(target) === true) return;
      if (triggerRef.current?.contains(target) === true) return;
      setOpen(false);
    };
    const onResize = () => {
      if (triggerRef.current != null) setPos(measure(triggerRef.current));
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, mobile]);

  return { open, pos, cardRef, toggle, close };
}

type DialogSelect = ReturnType<typeof useDialogSelect>;

/** One "N hr / NN min" row — the DS InputGroup's TextField + SelectField shape. */
function DurationInput({
  label,
  value,
  onChange,
  pop,
  mobile,
}: {
  label: string;
  value: DurationParts;
  onChange: (next: DurationParts) => void;
  pop: DialogSelect;
  mobile: boolean;
}) {
  // The list's rows are the same on either breakpoint — only the shell differs.
  const items = (
    <SelectListItemGroup>
      {MINUTE_OPTIONS.map((minutes) => (
        <SelectListItem
          key={minutes}
          label={minutes}
          select="single"
          selected={minutes === value.minutes}
          onClick={() => {
            onChange({ ...value, minutes });
            pop.close();
          }}
        />
      ))}
    </SelectListItemGroup>
  );

  return (
    <>
      {/* Input takes exactly ONE field, so the minutes list is its sibling, not
          a second child. */}
      <Input label={label}>
        <InputGroup>
          <TextField
            value={value.hours}
            // Digits only — the field is a number of hours, and the mobile
            // keyboard follows. Leading zeros are dropped because the field
            // STARTS at "0" (the node's empty state): typing after it would
            // otherwise read "02" where the user meant "2".
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
              onChange({ ...value, hours: digits.replace(/^0+(?=\d)/, "") });
            }}
            keyboard="numeric"
            suffix="hr"
            aria-label={`${label} hours`}
          />
          <SelectField
            value={value.minutes}
            suffix="min"
            open={pop.open}
            aria-label={`${label} minutes`}
            onClick={(e: MouseEvent<HTMLDivElement>) => pop.toggle(e.currentTarget)}
          />
        </InputGroup>
      </Input>
      {pop.open &&
        (mobile ? (
          <SelectList variant="drawer" breakpoint="mobile" open onClose={pop.close} title="Minutes">
            {items}
          </SelectList>
        ) : (
          pop.pos != null &&
          createPortal(
            <div
              ref={pop.cardRef}
              className={clsx(styles.filtersSub, DIALOG_MARKER)}
              style={{ left: pop.pos.left, top: pop.pos.top }}
            >
              <SelectList
                variant="inline"
                open
                onClose={pop.close}
                // The SelectField → SelectList rule: the card matches the
                // trigger's width.
                style={{ width: pop.pos.width, minWidth: pop.pos.width, maxWidth: pop.pos.width }}
              >
                {items}
              </SelectList>
            </div>,
            document.body,
          )
        ))}
    </>
  );
}

interface DurationCustomProps {
  def: AnyFilterDef;
  value: FilterValue;
  /** The finished duration. `negated` is always false — `compare` IS the condition. */
  onApply: (duration: DurationValue) => void;
  onClose: () => void;
  open: boolean;
  /** Presentation — the PROTOTYPE's breakpoint, not the window's (DeviceFrame). */
  breakpoint: "desktop" | "mobile";
}

function DurationCustom({ def, value, onApply, onClose, open, breakpoint }: DurationCustomProps) {
  const mobile = breakpoint === "mobile";
  // Opening on a PRESET starts empty — a preset and a custom duration are
  // alternatives, so there is nothing to carry over (the same rule the date
  // dialog follows). The CONDITION does carry over: the list header's chips have
  // already set it, and arriving on "over" after choosing "under" would undo a
  // decision the user just made.
  const editing = value.duration != null && value.duration.preset == null ? value.duration : null;
  const [compare, setCompare] = useState<DurationCompare>(value.duration?.compare ?? "over");
  const [from, setFrom] = useState<DurationParts>(() => splitDuration(editing?.from ?? null));
  const [to, setTo] = useState<DurationParts>(() => splitDuration(editing?.to ?? null));

  const fromPop = useDialogSelect(mobile);
  const toPop = useDialogSelect(mobile);

  const within = compare === "within";
  const fromMinutes = joinDuration(from);
  const toMinutes = joinDuration(to);

  // Apply stays disabled until there is something to apply (the nodes'
  // annotation: "until the 'date' Input is filled out" / "until both the 'From'
  // and the 'To' inputs are filled out"): one length, or BOTH ends of a range —
  // and the second end has to be the LONGER one, or the range is empty and the
  // filter would silently match nothing. That last check is INVENTED, flagged:
  // the nodes draw no error state for a backwards range.
  const ready = within ? fromMinutes != null && toMinutes != null && toMinutes > fromMinutes : fromMinutes != null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // The filter's own name titles the dialog, not the word "Custom".
      title={def.label}
      breakpoint={breakpoint}
      className={DIALOG_MARKER}
      // Both blocks below bring their own 16px — the DS default would add 24
      // between them.
      bodyPadded={false}
      footer={
        // Cancel / Apply since the documented Form section (2026-09-03, nodes
        // 13923-24049 / 13923-24617 — every variant draws the ghost Cancel in
        // the left slot). The old value-being-built preview (an hourglass +
        // the text, node 13983-38223) is GONE from the design.
        <PopoverFooter
          leadingButton={
            <Button variant="ghost" size="lg" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button
            variant="solid"
            size="lg"
            isDisabled={!ready}
            onClick={() => {
              onApply({
                compare,
                preset: null,
                from: fromMinutes,
                to: within ? toMinutes : null,
              });
              onClose();
            }}
          >
            Apply
          </Button>
        </PopoverFooter>
      }
    >
      {/* CONDITION — the four measures, `within` among them. */}
      <div className={styles.durationCustomCondition}>
        <ChipGroup>
          {DURATION_DIALOG_CONDITIONS.map((choice) => (
            <Chip key={choice} size="lg" isSelected={compare === choice} onClick={() => setCompare(choice)}>
              {choice}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* FULL-BLEED — edge to edge, like the date and address dialogs'. NEW
          with the documented section; the old build drew none here. */}
      <Divider contrast="medium" />

      {/* CONTENT — one field row, or two when the condition needs both ends.
          The single "Duration" row and the range's "From" SHARE one state,
          which is the node's own annotation made real (13923-24617): "selecting
          'within' automatically populates 'From' duration with that value".
          Leaving `within` keeps whatever was typed into the second row, so a
          slip on the chips costs nothing; only Apply reads it. */}
      <div className={styles.durationCustomContent}>
        {within ? (
          <>
            <DurationInput label="From" value={from} onChange={setFrom} pop={fromPop} mobile={mobile} />
            <DurationInput label="To" value={to} onChange={setTo} pop={toPop} mobile={mobile} />
          </>
        ) : (
          <DurationInput label="Duration" value={from} onChange={setFrom} pop={fromPop} mobile={mobile} />
        )}
      </div>
    </Dialog>
  );
}

// ---- the Address dialog ----------------------------------------------------

// The ADDRESS filter's whole interface — the documented section 14100-36446
// (nodes 14100-36447 desktop / 14100-36463 mobile, 2026-09-03; it replaced
// 13988-53606 / 13988-53696). Unlike every other filter this one never opens a
// list — there is nothing to list — so the row in the Filters menu opens this
// straight away, and so does the chip's value segment.
//
// The DS `Dialog`, titled with the filter's name, holding:
//
//   CONDITION (a 16px row, NEW with the documented section) — a `ChipGroup` of
//     two `lg` Chips, "contains" / "does not contain". The same pair the chip's
//     condition segment offers, from the same `conditionChoices` source — so
//     the dialog and the chip cannot drift apart.
//   a `Divider`, FULL-BLEED — edge to edge, like the date dialog's.
//   the FIVE `Input`s at 24px apart inside 16px padding, each labelled
//     "(optional)" because any one of them on its own is a real question. The
//     only difference between the breakpoints is the last row: DESKTOP puts
//     State / Province and Postal code side by side (280px each inside the
//     608px card), MOBILE stacks all five.
//
// The footer is a plain Cancel / Apply pair — not the value-preview footer the
// date and duration dialogs use, because the value is already legible in the
// fields above it.
//
// Everything is a DRAFT until Apply — the condition chips included — the same
// contract the other two dialogs have, so an unfinished edit never touches the
// chip.
interface AddressCustomProps {
  def: AnyFilterDef;
  value: FilterValue;
  onApply: (address: AddressValue, negated: boolean) => void;
  onClose: () => void;
  open: boolean;
  breakpoint: "desktop" | "mobile";
}

function AddressCustom({ def, value, onApply, onClose, open, breakpoint }: AddressCustomProps) {
  const [draft, setDraft] = useState<AddressValue>(() => value.address ?? emptyAddress());
  // The condition is part of the draft too: re-opening the dialog seeds it from
  // the application ("contains" on a fresh one — `negated: false`), and only
  // Apply writes it back.
  const [negated, setNegated] = useState(value.negated);

  const field = (key: keyof AddressValue) => {
    const spec = ADDRESS_FIELDS.find((entry) => entry.key === key);
    return (
      <Input label={spec?.label} labelCondition="optional">
        <TextField
          value={draft[key]}
          onChange={(e) => setDraft((current) => ({ ...current, [key]: e.target.value }))}
        />
      </Input>
    );
  };

  // Apply stays disabled while every field is blank — an empty address would
  // match every job, which is the same as no filter at all. INVENTED, flagged:
  // the node draws no disabled state, but Duration's dialog already works this
  // way and `upsertFilter` would drop the empty application anyway.
  const ready = ADDRESS_FIELDS.some((entry) => draft[entry.key].trim() !== "");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={def.label}
      breakpoint={breakpoint}
      className={DIALOG_MARKER}
      // The block below brings its own 16px; the DS default would add 24 more.
      bodyPadded={false}
      footer={
        <PopoverFooter
          leadingButton={
            <Button variant="ghost" size="lg" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button
            variant="solid"
            size="lg"
            isDisabled={!ready}
            onClick={() => {
              onApply(draft, negated);
              onClose();
            }}
          >
            Apply
          </Button>
        </PopoverFooter>
      }
    >
      {/* CONDITION — "contains" / "does not contain" as lg Chips in a 16px row
          (node 14100-36449), the pair `conditionChoices` already defines for an
          address. Picking one only marks it; Apply commits it. */}
      <div className={styles.addressCustomCondition}>
        <ChipGroup>
          {conditionChoices(value).map((choice) => (
            <Chip
              key={choice.label}
              size="lg"
              isSelected={negated === choice.negated}
              onClick={() => setNegated(choice.negated)}
            >
              {choice.label}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* FULL-BLEED — edge to edge, no side inset, like the date dialog's. */}
      <Divider contrast="medium" />

      <div className={styles.addressCustomContent}>
        {field("street")}
        {field("suite")}
        {field("city")}
        {breakpoint === "desktop" ? (
          <div className={styles.addressCustomRow}>
            {field("state")}
            {field("postalCode")}
          </div>
        ) : (
          <>
            {field("state")}
            {field("postalCode")}
          </>
        )}
      </div>
    </Dialog>
  );
}

// ---- the Custom dialog, for whichever kind asked for it ---------------------

// Date and duration each have their own Custom dialog; every place that opens
// one holds a FilterInstance and wants one back, so the choice is made here
// instead of at each of the three call sites.
interface CustomDialogProps {
  def: AnyFilterDef;
  instance: FilterInstance;
  breakpoint: "desktop" | "mobile";
  /** The application with its new custom value — ready for `upsertFilter`. */
  onApply: (next: FilterInstance) => void;
  onClose: () => void;
}

function CustomDialog({ def, instance, breakpoint, onApply, onClose }: CustomDialogProps) {
  if (def.kind === "address") {
    return (
      <AddressCustom
        def={def}
        value={instance}
        breakpoint={breakpoint}
        open
        // The dialog owns the condition since the documented section
        // (14100-36446): its own chips edit the contains / does not contain
        // pair, so Apply writes `negated` back along with the fields. The
        // chip's condition segment still edits the same pair between visits.
        onApply={(address, negated) => onApply({ ...instance, address, negated })}
        onClose={onClose}
      />
    );
  }
  if (def.kind === "duration") {
    return (
      <DurationCustom
        def={def}
        value={instance}
        breakpoint={breakpoint}
        open
        // `negated` stays false: the dialog's own measure chips ARE the
        // condition (see `withCondition`).
        onApply={(duration) => onApply({ ...instance, negated: false, duration })}
        onClose={onClose}
      />
    );
  }
  return (
    <DateCustom
      def={def}
      value={instance}
      breakpoint={breakpoint}
      open
      onApply={(date) => onApply({ ...instance, negated: false, date })}
      onClose={onClose}
    />
  );
}

// ---- a filter's option list, on either breakpoint --------------------------

// One component for both presentations: the desktop card that opens beside the
// Filters menu, and the mobile drawer. It owns the list's SEARCH TEXT and builds
// the pinned header — condition chips, then (on the drawer) a Divider, then the
// search field. That is why the search is not SelectList's built-in one: the
// component's `header` and `searchable` props are mutually exclusive, and this
// list needs both parts.
//
// FLAGGED to Daniel: if the condition section stays, its home is a `slotTop`
// prop on the DS SelectList, not a prototype-local header. It is built here
// because this is a trial.
interface FilterOptionsProps {
  def: AnyFilterDef;
  /** The ONE application this list edits — a new one, or a chip's existing one. */
  instance: FilterInstance;
  onInstanceChange: (next: FilterInstance) => void;
  variant: "inline" | "drawer";
  open?: boolean;
  onClose?: () => void;
  footer?: ReactNode;
  /**
   * DATE filters only: the list ends in a "Custom" row (Figma node 13912-11967).
   * It opens the Custom DIALOG — a centred modal, so no anchor is passed.
   */
  onCustom?: () => void;
  /** Hide the condition chips — the chip's own value list has none. */
  hideConditions?: boolean;
  /**
   * Passed to the DS SelectList. The menu's HOVER-opened sub-lists turn it
   * off: a hover-close must not pull focus back into the menu's search — the
   * field's icon visibly re-lit every time the pointer reached the Address
   * row (Daniel, 2026-09-04).
   */
  restoreFocus?: boolean;
}

function FilterOptions({
  def,
  instance,
  onInstanceChange,
  variant,
  open = true,
  onClose,
  footer,
  onCustom,
  hideConditions = false,
  restoreFocus = true,
}: FilterOptionsProps) {
  // Desktop only — a drawer fills the screen width, so there is nothing to hold.
  const frozenWidth = useFrozenWidth(open, variant === "inline", def.id);
  const [query, setQuery] = useState("");
  // Each filter's search is ITS OWN (Daniel, 2026-08-18). On desktop this one
  // component stays mounted while the pointer moves from row to row — only `def`
  // changes — so without this the text typed into Assignee would still be
  // filtering Client a moment later. Reset DURING the render that brings the new
  // filter in, not in an effect: an effect would paint one frame of the new
  // list already filtered by the old query.
  // (React re-runs this component with the cleared state before it touches the
  // DOM, so nothing from the first pass is ever shown.)
  const [lastDefId, setLastDefId] = useState(def.id);
  if (lastDefId !== def.id) {
    setLastDefId(def.id);
    setQuery("");
  }

  // Opened from a CHIP, the list is the options and nothing else — the condition
  // lives in the chip's own segment. So it builds no header block and hands the
  // search back to SelectList's built-in `searchable`, which then owns the query
  // AND the filtering. `filterList` gets no query in that case, or the two would
  // filter the same list twice.
  const fromChip = hideConditions;
  const ownSearch = fromChip && def.searchPlaceholder != null;
  const list = filterList(def, instance, onInstanceChange, fromChip ? "" : query);

  // The condition keeps the ticked options as they are — only the condition moves.
  const setCondition = (choice: ConditionChoice) => onInstanceChange(withCondition(instance, choice));

  // EVERY filter's header is the DS `SelectListHeader` (the documented
  // sections, 2026-09-03 — the prototype-local chips block is gone), in one of
  // its two variants:
  //   - a filter WITH a search: chipGroup + search — 16px around the chips
  //     closing at 8, the real 40px SearchField bar under them, 97px in all;
  //   - a filter WITHOUT one: chipGroup ONLY, `search={false}` — a 16px-padded
  //     row of chips, 65px in all.
  // Either way the closing Divider is the component's own, and the chips go in
  // bare: the header wraps them in a ChipGroup itself.
  //
  // It is not SelectList's built-in `searchable` — that prop and `header` are
  // mutually exclusive, and this header holds the chips as well — so the query
  // lives here and `filterList` does the filtering.
  const header =
    def.dsHeader === true && !fromChip ? (
      <SelectListHeader
        chips={conditionChipList(instance, setCondition)}
        search={def.searchPlaceholder != null}
        placeholder={def.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
      />
    ) : undefined;

  // A date or duration list's footer is the "Custom" row; every other list takes
  // whatever the caller passes (mobile's Apply bar).
  const listFooter =
    isSingleValue(def) && onCustom != null ? (
      <SelectListFooter>
        {/* "Custom..." since 2026-08-23 (Daniel) — it was "Custom date or
            timeframe...". The ellipsis says a dialog follows. Duration's node
            (13874-11407) draws the same row and carries the dev annotation
            "Custom — Opens the dialog". */}
        <MenuItem label="Custom..." onClick={() => onCustom()} />
      </SelectListFooter>
    ) : (
      footer
    );

  const selectList = (
    <SelectList
      variant={variant}
      open={open}
      onClose={onClose}
      title={variant === "drawer" ? def.label : undefined}
      // The drawer's title ALWAYS keeps the DS's own line under it (Daniel,
      // 2026-08-23 — "reset the style to match the DS"), so no
      // `drawerHeaderDivider` here: SelectList's default is true. It used to be
      // off for every filter with a header block, which is why Assignee, Client
      // and the Filters sheet were all missing the line. (The old flag is
      // resolved: the Multi-Select Filter section's mobile nodes — 14038-14033,
      // and Assignee's own 13923-21079 — now draw the medium Divider under the
      // DrawerHeader, so the nodes and the build agree.)
      header={header}
      searchable={ownSearch}
      searchPlaceholder={def.searchPlaceholder}
      // Assignee's and Client's search take focus even on a phone — both mobile
      // nodes open with the caret in the field and the keyboard already up
      // (Figma 13934-14232 for Client). `autoFocusSearch` is what opts out of
      // the DS's two exclusions (drawer + touch device); it works for the
      // list's OWN header too, since SelectList focuses the first `input` it
      // finds inside whichever header it was given.
      autoFocusSearch={def.autoFocusSearch === true}
      restoreFocus={restoreFocus}
      footer={listFooter}
      // A date, duration or Type filter holds ONE pick, so its rows are
      // single-select — which is also what makes SelectList close itself the
      // moment one is picked.
      multiSelect={!isSingleSelect(def)}
      // Every drawer WITHOUT a search HUGS its content (Daniel, 2026-09-09,
      // with the Priority node 13855-23306 — drawer 358 of 812; the
      // full-height rule exists only so a SEARCH does not resize the sheet
      // per keystroke). Was single-select-only, which left Priority and the
      // closed-phase Status stretched over an empty screen.
      className={def.searchPlaceholder == null && variant === "drawer" ? styles.hugDrawer : undefined}
      state={list.isEmpty ? "noResults" : "default"}
      // The filters' own no-match block — see `noMatches`. It covers BOTH ways
      // a list can come up empty: this prototype's own search (the `state`
      // above) and SelectList's built-in `searchable`, which decides the state
      // for itself on a chip-opened list.
      noResultsState={noMatches}
      // The width it hugged to when it opened, held while the search narrows
      // the rows — see `useFrozenWidth`. A drawer has no width of its own.
      style={variant === "inline" ? frozenWidth.style : undefined}
    >
      {list.items}
    </SelectList>
  );

  // The desktop card is wrapped only so its width can be MEASURED: the div
  // shrink-wraps the card inside the `max-content` portal, so its `offsetWidth`
  // IS the card's. The drawer is portaled away by SelectList itself, so there
  // is nothing to measure and nothing to wrap.
  return variant === "inline" ? <div ref={frozenWidth.ref}>{selectList}</div> : selectList;
}

// MOBILE applies on "Apply" (Daniel, 2026-08-18) — every filter, Assignee and
// Client alike (Figma nodes 13873-7470 / 13902-23498, both ending in a
// SelectListFooter). The sheet edits a DRAFT of the application — ticks and the
// condition chips both — and only adds it to the selection when the footer
// button is tapped; dismissing the sheet drops it. Desktop has no footer and
// keeps applying instantly.
//
// A DATE or DURATION filter is the exception (Figma nodes 13912-12054 and
// 13874-11522): its footer is the "Custom" row, not an Apply bar, because the
// list is single-select — picking a value IS the decision, so it applies and
// closes on the spot (Daniel, 2026-08-19). Its Custom dialog carries the Apply
// button instead. TYPE follows the same single-select rule since 2026-09-09
// (its section's annotation) — no Apply bar, the pick applies and closes —
// but with no Custom row at all: two options need no dialog.
interface MobileFilterOptionsProps {
  def: AnyFilterDef;
  /** The application to edit: a fresh one from the menu, or a chip's existing one. */
  instance: FilterInstance;
  /** Put this application into the selection. Does NOT close the sheet. */
  onCommit: (next: FilterInstance) => void;
  onClose: () => void;
  /** Opened from a CHIP: the condition lives in the chip, so drop the chips. */
  hideConditions?: boolean;
}

/**
 * The picked VALUE of an application, as a string — everything except its
 * condition. It is what tells a value pick apart from a condition change in the
 * single-value drawers below, where both arrive through the same callback.
 */
const pickedValue = (value: FilterValue): string => {
  if (value.duration != null) {
    return `${value.duration.preset}|${value.duration.from}|${value.duration.to}`;
  }
  if (value.date != null) return `${value.date.preset}|${value.date.from}|${value.date.to}`;
  return value.ids.join(",");
};

function MobileFilterOptions({ def, instance, onCommit, onClose, hideConditions = false }: MobileFilterOptionsProps) {
  const [draft, setDraft] = useState<FilterInstance>(instance);
  const [custom, setCustom] = useState(false);
  const isSingle = isSingleSelect(def);

  const commit = (next: FilterInstance) => {
    setDraft(next);
    onCommit(next);
  };

  return (
    <>
      <FilterOptions
        def={def}
        instance={draft}
        onInstanceChange={(next) => {
          if (!isSingle) {
            setDraft(next);
            return;
          }
          // A single-value drawer has no Apply bar, so every change applies at
          // once. But the header's CONDITION chips come through here as well,
          // and only a VALUE pick is the decision that closes the sheet —
          // tapping "under" has to leave the list open so a length can still be
          // chosen. (This closed the date drawer on a chip tap until 2026-08-24.)
          const picked = pickedValue(draft) !== pickedValue(next);
          commit(next);
          if (picked) onClose();
        }}
        variant="drawer"
        open
        onClose={onClose}
        hideConditions={hideConditions}
        // The "Custom..." row belongs to date and duration ONLY — Type is
        // single-select without a dialog behind it (`isSingleValue`, not
        // `isSingleSelect`).
        onCustom={isSingleValue(def) ? () => setCustom(true) : undefined}
        footer={
          // No footer at all until something is ticked (Daniel, 2026-08-19):
          // with nothing chosen there is nothing to apply, so the bar would only
          // take room off the list.
          isSingle || isEmptyValue(draft) ? undefined : (
            // `stretch` is what makes the button fill the row, as the node draws
            // it. `solid` since 2026-08-19 (Daniel) — it was `subtle` while the
            // node drew the white surface with the gray-a2 ring.
            <SelectListFooter variant="actionBar" stretch>
              <Button
                variant="solid"
                size="lg"
                onClick={() => {
                  onCommit(draft);
                  onClose();
                }}
              >
                Apply
              </Button>
            </SelectListFooter>
          )
        }
      />
      {custom && (
        <CustomDialog
          def={def}
          instance={draft}
          breakpoint="mobile"
          onApply={(next) => {
            commit(next);
            onClose();
          }}
          onClose={() => setCustom(false)}
        />
      )}
    </>
  );
}

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
        defs={FILTERS_BY_BRANCH[branch]}
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
  // TRUE = the drawer opens with the search focused and the keyboard up
  // (Daniel, 2026-09-09) — MenuHeader's explicit opt-in.
  const filters = useFilterSearch(filtersOpen, FILTERS_BY_BRANCH[branch], true);
  // Tapping a filter row opens its options as a SECOND drawer on top of the
  // Filters one (Figma node 13855-23306 — the list draws its own scrim). NO
  // back button (Daniel, 2026-08-17): the Filters drawer is still open
  // underneath, so dismissing this sheet already returns there.
  const [openFilter, setOpenFilter] = useState<AnyFilterDef | null>(null);
  // The application each filter's sheet is building. It lives only as long as
  // THAT sheet does (Daniel, 2026-08-19 — it used to survive until the whole
  // Filters menu closed): closing a filter's own sheet, with Apply or by
  // dismissing it, drops its draft, so opening the row again starts a fresh
  // application instead of continuing the last one.
  const [drafts, setDrafts] = useState<Partial<Record<FilterId, FilterInstance>>>({});
  const closeFilterSheet = () => {
    if (openFilter != null) setDrafts((current) => ({ ...current, [openFilter.id]: undefined }));
    setOpenFilter(null);
  };
  useEffect(() => {
    if (!filtersOpen) setDrafts({});
  }, [filtersOpen]);

  const mobileRowHandlers = (row: AnyFilterDef): RowHandlers => ({
    onClick: () => {
      setDrafts((current) => (current[row.id] != null ? current : { ...current, [row.id]: newFilterInstance(row) }));
      setOpenFilter(row);
    },
  });

  const lockedStatuses = tabById(branch, tab).statuses;

  // The applied-filters section, and with it the two section labels. Hidden
  // while the search is running: it filters the LIST, and the chips are not part
  // of that list, so leaving them up would look like the search had missed them.
  // The view's LOCKED filter counts as applied here too (2026-09-09, Daniel) —
  // on "Pending" with nothing else on, the section shows the locked chip alone.
  const showApplied = (activeFilterCount(selection) > 0 || lockedStatuses.length > 0) && filters.query === "";

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
        defs={FILTERS_BY_BRANCH[branch]}
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

// ---- the Filters drawer (mobile) -------------------------------------------

// The phone's whole filter surface, split out of the Jobs view bar on
// 2026-09-11 so the Estimates list can open the SAME one: the Filters sheet,
// the applied-filters section at the top of it, and the second sheet a row
// opens on top. It owns the per-visit drafts; the page owns the selection.
interface FiltersDrawerProps {
  open: boolean;
  onClose: () => void;
  /** The page's filter registry. */
  defs: AnyFilterDef[];
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /** The view's locked Status filter, where the page has one (jobs do). */
  lockedStatuses?: string[];
  /** Jobs only — the Schedule horizon behind the applied chips' conflict hint. */
  scheduleHorizon?: ScheduleHorizon | null;
  onShowViewMenu?: () => void;
}

export function FiltersDrawer({
  open,
  onClose,
  defs,
  selection,
  onSelectionChange,
  lockedStatuses = [],
  scheduleHorizon = null,
  onShowViewMenu,
}: FiltersDrawerProps) {
  // TRUE = the drawer opens with the search focused and the keyboard up
  // (Daniel, 2026-09-09) — MenuHeader's explicit opt-in.
  const filters = useFilterSearch(open, defs, true);
  // Tapping a filter row opens its options as a SECOND drawer on top of the
  // Filters one (Figma node 13855-23306 — the list draws its own scrim). NO
  // back button (Daniel, 2026-08-17): the Filters drawer is still open
  // underneath, so dismissing this sheet already returns there.
  const [openFilter, setOpenFilter] = useState<AnyFilterDef | null>(null);
  // The application each filter's sheet is building. It lives only as long as
  // THAT sheet does (Daniel, 2026-08-19): closing a filter's own sheet, with
  // Apply or by dismissing it, drops its draft, so opening the row again starts
  // a fresh application instead of continuing the last one.
  const [drafts, setDrafts] = useState<Partial<Record<FilterId, FilterInstance>>>({});
  const closeFilterSheet = () => {
    if (openFilter != null) setDrafts((current) => ({ ...current, [openFilter.id]: undefined }));
    setOpenFilter(null);
  };
  useEffect(() => {
    if (!open) setDrafts({});
  }, [open]);

  const mobileRowHandlers = (row: AnyFilterDef): RowHandlers => ({
    onClick: () => {
      setDrafts((current) => (current[row.id] != null ? current : { ...current, [row.id]: newFilterInstance(row) }));
      setOpenFilter(row);
    },
  });

  // The applied-filters section, and with it the two section labels. Hidden
  // while the search is running: it filters the LIST, and the chips are not part
  // of that list, so leaving them up would look like the search had missed them.
  const showApplied = (activeFilterCount(selection) > 0 || lockedStatuses.length > 0) && filters.query === "";

  return (
    <>
      {/* The drawer portals out to the device frame's drawer root, so where it
          is written makes no difference. */}
      {/* The drawer header keeps the DS's own line under it (Daniel,
          2026-08-23 — "reset the style to match the DS"). It used to be
          turned off through Menu's `drawerHeader` escape hatch; Menu
          builds the header from `title` again. */}
      <Menu
        open={open}
        onClose={onClose}
        title="Filters"
        // The drawer's TITLE ROW carries the bulk action (Daniel, 2026-09-09
        // — option B of the placement proposals, "use md ghost button"):
        // "Filters" on the left, the ghost/md Button on the right — "Clear
        // all", or "Reset" on a view with a locked filter — the desktop
        // bar's right-slot rule. With nothing applied (or only the locked
        // chip) there is no button: nothing to clear. Clearing keeps the
        // drawer open, so the result is visible in place.
        // FLAGGED: PopoverHeaderContent's `actions` slot documents "up to 2
        // md ghost IconButtons"; the TEXT Button here is Daniel's call — a
        // DS doc update candidate if the pattern stays.
        drawerHeader={
          <DrawerHeader>
            <PopoverHeaderContent
              actions={
                activeFilterCount(selection) > 0 ? (
                  <Button variant="ghost" size="md" onClick={() => onSelectionChange([])}>
                    {lockedStatuses.length > 0 ? "Reset" : "Clear all"}
                  </Button>
                ) : undefined
              }
            >
              <PopoverHeaderText variant="title" title="Filters" />
            </PopoverHeaderContent>
          </DrawerHeader>
        }
        header={filters.header}
        breakpoint="mobile"
      >
        {/* The phone has no filter bar, so what is applied shows here
            (Figma node 13867-5235). Only while something IS applied — and
            the search hides it too, since it filters the list below and
            the chips are not part of that list. */}
        {showApplied && (
          <AppliedFilters
            defs={defs}
            lockedStatuses={lockedStatuses}
            selection={selection}
            onSelectionChange={onSelectionChange}
            scheduleHorizon={scheduleHorizon}
            // "Show settings" from the conflict hint: the Filters drawer
            // makes way for the View one. Closing the drawer unmounts the
            // chip, which takes the hint drawer down with it.
            onShowViewMenu={onShowViewMenu}
          />
        )}
        <AddFilterSection rows={filters.rows} extra={mobileRowHandlers} labelled={showApplied} />
      </Menu>
      {/* Rendered after the Menu, so it stacks above it.
          No search header any more (the nodes dropped it), so the sheet
          HUGS its content and the scrim strip above it is tappable again —
          the node's mobile sheets are 185–302px, not full height.
          `title` is the filter's name, as Daniel asked. */}
      {/* The sheet edits ONE application, started when the row is tapped
          and dropped when the sheet closes (`closeFilterSheet`), so the
          next tap on that row starts another. `key` remounts the sheet per
          application, so its draft is seeded fresh each time. */}
      {openFilter != null &&
        drafts[openFilter.id] != null &&
        // ADDRESS has no option sheet — the row opens its dialog instead
        // (node 13988-53696, a drawer over the Filters one).
        (isDialogOnly(openFilter) ? (
          <CustomDialog
            key={drafts[openFilter.id]!.key}
            def={openFilter}
            instance={drafts[openFilter.id]!}
            breakpoint="mobile"
            onApply={(next) => onSelectionChange(upsertFilter(selection, next))}
            onClose={closeFilterSheet}
          />
        ) : (
          <MobileFilterOptions
            key={drafts[openFilter.id]!.key}
            def={openFilter}
            instance={drafts[openFilter.id]!}
            onCommit={(next) => {
              setDrafts((current) => ({ ...current, [next.id]: next }));
              onSelectionChange(upsertFilter(selection, next));
            }}
            onClose={closeFilterSheet}
          />
        ))}
    </>
  );
}

// ---- the Filters menu card -------------------------------------------------

// The menu itself, split out from its trigger so BOTH openers share one copy:
// the "Filters" Button on the view bar and the "plus" IconButton on the filter
// bar (Daniel, 2026-08-17 — the plus opens the same menu).
//
// A row's option list opens on HOVER, 4px to the right of the row and
// TOP-aligned with it (Figma node 13855-22268), and it is a real `SelectList` —
// so it cannot go through MenuItem's `subMenu` prop, which wraps whatever it is
// given in a Menu card and would give us a card inside a card.
interface FiltersMenuCardProps {
  card: AnchoredCard;
  /** The branch's filter registry. */
  defs: AnyFilterDef[];
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
}

export function FiltersMenuCard({ card, defs, selection, onSelectionChange }: FiltersMenuCardProps) {
  const { open, setOpen, cardRef, pos } = card;
  const filters = useFilterSearch(open, defs);

  // The row being hovered, and the applications this VISIT to the menu is
  // building — one per filter, kept for as long as the menu stays open (Daniel,
  // 2026-08-18). Moving the pointer off a row only closes its list; coming back
  // continues the same application. Closing the whole Filters menu is what
  // resets them, so the next visit adds another application.
  const [subFilter, setSubFilter] = useState<AnyFilterDef | null>(null);
  // Mirrors `subFilter` for the close timer, which fires long after its closure
  // was created and must act on whichever row is CURRENTLY open.
  const subFilterRef = useRef<AnyFilterDef | null>(null);
  subFilterRef.current = subFilter;
  const [drafts, setDrafts] = useState<Partial<Record<FilterId, FilterInstance>>>({});
  const [subRow, setSubRow] = useState<DOMRect | null>(null);
  const [subPos, setSubPos] = useState<{ left: number; top: number } | null>(null);
  const subCardRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  // The Custom DIALOG. Picking "Custom" closes the menu (Daniel, 2026-08-20),
  // and the reset below wipes the visit's `subFilter` / `drafts` — so the dialog
  // holds its OWN copy of what it is editing and survives that.
  const [customEdit, setCustomEdit] = useState<{ def: AnyFilterDef; instance: FilterInstance } | null>(null);

  const cancelSubClose = () => window.clearTimeout(closeTimer.current);
  // A grace period, like MenuItem's own sub-menu: the pointer needs time to
  // travel off the row and into the list without it closing underneath.
  // Closing a row's list DROPS the application it was building (Daniel,
  // 2026-08-19), so coming back to the row starts a new one rather than adding
  // to the last. `subFilter` is read from the ref inside the timeout — the
  // closure would otherwise hold whichever row was hovered when it was armed.
  const scheduleSubClose = () => {
    cancelSubClose();
    closeTimer.current = window.setTimeout(() => {
      const closing = subFilterRef.current;
      if (closing != null) setDrafts((current) => ({ ...current, [closing.id]: undefined }));
      setSubFilter(null);
    }, 150);
  };
  const openSub = (row: HTMLElement, def: AnyFilterDef) => {
    cancelSubClose();
    const rect = row.getBoundingClientRect();
    setSubRow(rect);
    setSubPos({ left: rect.right + SUB_GAP, top: rect.top }); // corrected below, before paint
    // The row's application is started once per menu visit and kept in `drafts`,
    // so re-hovering shows the ticks made a moment ago.
    setDrafts((current) => (current[def.id] != null ? current : { ...current, [def.id]: newFilterInstance(def) }));
    setSubFilter(def);
  };

  // Keep the list on screen, the same rule MenuItem applies to its own
  // sub-menus: it prefers the right of the row, but FLIPS to the left when it
  // would overflow the right edge, and shifts up off the bottom. The flip is
  // needed here: opened from the view bar the menu sits near the right screen
  // edge, so there is no room on the right (the node draws it on the right
  // because the button stands alone mid-canvas there — FLAGGED).
  // Measured after mount but BEFORE paint, so the provisional spot is unseen.
  //
  // It also re-runs whenever the card's own SIZE changes (the ResizeObserver
  // below), because a card that is still settling reports the wrong width to
  // measure against. Labels showed it: its header chips decide that width, and
  // the first pass read 208 where the card came to rest at 222 — so the list
  // was placed 14px too far right and sat on top of the menu. Whatever the
  // reason a list resizes, its position follows it now.
  const placeSub = useCallback((rowRect: DOMRect) => {
    const el = subCardRef.current;
    if (el == null) return;
    const cw = el.offsetWidth;
    const ch = el.offsetHeight;
    let left = rowRect.right + SUB_GAP;
    if (left + cw > window.innerWidth - SUB_MARGIN) {
      const flipped = rowRect.left - SUB_GAP - cw;
      left = flipped >= SUB_MARGIN ? flipped : Math.max(SUB_MARGIN, window.innerWidth - SUB_MARGIN - cw);
    }
    let top = rowRect.top;
    if (top + ch > window.innerHeight - SUB_MARGIN) top = window.innerHeight - SUB_MARGIN - ch;
    if (top < SUB_MARGIN) top = SUB_MARGIN;
    setSubPos((prev) => (prev != null && prev.left === left && prev.top === top ? prev : { left, top }));
  }, []);

  useLayoutEffect(() => {
    if (subFilter == null || subRow == null) return undefined;
    const el = subCardRef.current;
    if (el == null) return undefined;
    placeSub(subRow);
    const ro = new ResizeObserver(() => placeSub(subRow));
    ro.observe(el);
    return () => ro.disconnect();
  }, [subFilter, subRow, placeSub]);

  // The card must not resize while the search narrows the rows (Daniel,
  // 2026-09-11: "when a user starts typing within the search, the width of the
  // menu should not change" — typing "type" took it from 191 to 160, and a card
  // resizing under the caret reads as lag even though the keystroke itself
  // costs about a millisecond).
  //
  // So the card hugs its FULL list once, when it opens, and that width is then
  // held as a FLOOR for as long as the menu stays open: filtering only removes
  // rows, so the content can only get narrower and the floor keeps the card
  // where it was. A floor, not a fixed width — if a row ever needs more the
  // card can still take it, so this can never clip a label.
  //
  // `offsetWidth`, not `getBoundingClientRect()`: the card opens under a
  // `scale(0.98)` transition, and the rect would report the scaled width.
  const [frozenWidth, setFrozenWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      setFrozenWidth(null);
      return;
    }
    const el = cardRef.current?.firstElementChild as HTMLElement | null;
    if (el != null) setFrozenWidth((prev) => prev ?? el.offsetWidth);
    // `pos` is in the deps because the portal only exists once the anchor has
    // been measured — on the render where `open` first flips there is nothing
    // to measure yet.
  }, [open, pos, cardRef]);

  // Closing the menu takes its sub-list with it — AND drops the applications it
  // was building, which is what makes the next visit start fresh ones.
  useEffect(() => {
    if (!open) {
      cancelSubClose();
      setSubFilter(null);
      setDrafts({});
    }
  }, [open]);
  useEffect(() => () => cancelSubClose(), []);

  // Touch pointers are ignored — hover-open on touch opens and instantly closes
  // (MenuItem hit this on iPad), and this card is the desktop presentation.
  const rowHandlers = (row: AnyFilterDef): RowHandlers =>
    // ADDRESS has no list to hover open — the row IS the dialog's trigger, so it
    // takes a CLICK and closes the menu behind it, exactly as the "Custom..."
    // row does for a date. Hovering it still closes whichever list was open, or
    // the previous row's card would hang over the dialog.
    isDialogOnly(row)
      ? {
          onPointerEnter: (e) => {
            if (e.pointerType === "touch") return;
            scheduleSubClose();
          },
          onClick: () => {
            setCustomEdit({ def: row, instance: newFilterInstance(row) });
            setOpen(false);
          },
        }
      : {
          onPointerEnter: (e) => {
            if (e.pointerType === "touch") return;
            openSub(e.currentTarget as HTMLElement, row);
          },
          onPointerLeave: (e) => {
            if (e.pointerType === "touch") return;
            scheduleSubClose();
          },
        };

  const subDraft = subFilter == null ? null : drafts[subFilter.id] ?? null;

  if (pos == null) return null;

  return (
    <>
      {createPortal(
        <div ref={cardRef} className={styles.filtersMenu} style={pos}>
          {/* 208px FLOOR (Daniel, 2026-09-11), the same one every filter list
              sits on. It is the card's own documented minimum: the Shell
              section's "Filters" Menu / Desktop (node 14310-59652) carries a
              "Min Width" pin of 208 over the DS maximum of 384, and is drawn at
              exactly 208. (An older copy of the menu, 14295-47676, still pins
              the DS default of 160 — superseded.)

              Above the floor the card hugs its rows. It stopped needing a
              hand-picked width on 2026-09-11, when the real cause of its
              old 222px (250 on Daniel's machine) was fixed in the DS: the
              header's search `<input>` was contributing its default intrinsic
              width to the fit-content card. See `.bar .input` in SearchField.

              `frozenWidth` is the width it hugged to when it OPENED — that is
              what keeps the card still while the search filters the rows (see
              above). The two are combined rather than swapped, so whichever is
              larger wins and the floor can never be undercut. */}
          <Menu
            open={open}
            onClose={() => setOpen(false)}
            header={filters.header}
            breakpoint="desktop"
            style={{
              minWidth: frozenWidth != null ? `max(${MIN_WIDTH}, ${frozenWidth}px)` : MIN_WIDTH,
            }}
          >
            {filters.rows.length > 0 ? filterRows(filters.rows, rowHandlers) : noMatches}
          </Menu>
        </div>,
        document.body,
      )}
      {/* The hovered row's option list — its own body portal, so the menu card's
          overflow cannot clip it. `subFilter` gates the whole portal rather than
          just SelectList's `open`, because it must be gone (not merely faded)
          once the pointer has left, or it would keep swallowing hovers. */}
      {subFilter != null &&
        subDraft != null &&
        subPos != null &&
        createPortal(
          <div
            ref={subCardRef}
            data-concept-filters-sub
            className={styles.filtersSub}
            style={{ left: subPos.left, top: subPos.top }}
            onPointerEnter={cancelSubClose}
            onPointerLeave={scheduleSubClose}
          >
            <FilterOptions
              def={subFilter}
              instance={subDraft}
              onInstanceChange={(next) => {
                // Desktop applies instantly: the application goes straight into
                // the selection, and this menu visit keeps editing THAT one.
                setDrafts((current) => ({ ...current, [next.id]: next }));
                onSelectionChange(upsertFilter(selection, next));
              }}
              variant="inline"
              // Hover-opened and hover-closed — see the prop's note.
              restoreFocus={false}
              // Picking "Custom" CLOSES the menu (Daniel, 2026-08-20): the
              // dialog is a modal, so leaving the menu and its list open behind
              // it made no sense — and with them gone the dialog needs no
              // z-index lift, which is what let the DateField's own DatePicker
              // (--z-menu) sit above it again.
              onCustom={
                isSingleValue(subFilter)
                  ? () => {
                      setCustomEdit({ def: subFilter, instance: subDraft });
                      setOpen(false);
                    }
                  : undefined
              }
            />
          </div>,
          document.body,
        )}
      {/* The Custom DIALOG — a centred modal since 2026-08-20 (Figma nodes
          13962-8889 / 13962-8893 for a date, 13983-37497 / 13983-37308 for a
          duration), not a card anchored beside the list, so it needs no position
          and no portal of its own: Dialog portals itself. */}
      {customEdit != null && (
        <CustomDialog
          def={customEdit.def}
          instance={customEdit.instance}
          breakpoint="desktop"
          onApply={(next) => onSelectionChange(upsertFilter(selection, next))}
          onClose={() => setCustomEdit(null)}
        />
      )}
    </>
  );
}

// ---- the filter bar --------------------------------------------------------

// The bar IS the DS `TopBarFilter` now (migrated 2026-09-08 — the prototype
// inherits the real DS components): FilterChipGroup with the built-in "Add
// filter" plus button, the right-slot "Clear all" / "Reset" (the DS renders
// the copy + icon), and the medium Divider under the bar — all the component's
// own. What stays the prototype's:
//   - WHEN the bar exists: while the tab locks a Status filter OR the user has
//     applied at least one filter — on "All" with nothing applied there is no
//     bar at all.
//   - WHICH right button: "Clear all" on "All" (locks nothing — everything
//     goes), "Reset" on every other tab (clears the user's filters, keeps the
//     tab's locked chip). With only the locked chip: neither.
//   - The "plus" opens the prototype's own Filters menu card (not a DS Menu),
//     so it uses `onAddClick` + `addPressed`, anchored to the button from the
//     click event (the DS group owns the button element).
//
// FLAGGED to Daniel: DESKTOP only (TopBarFilter's own rule too). The mobile
// Filters button carries a counter instead.
interface FilterBarProps {
  /** The branch's filter registry. */
  defs: AnyFilterDef[];
  /** The statuses the current view locks — the first, fixed chip. Estimates
   *  lock none, so it defaults to empty there. */
  lockedStatuses?: string[];
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /** The view's Schedule horizon + the hint's View-menu opener — the conflict warning. */
  scheduleHorizon?: ScheduleHorizon | null;
  onShowViewMenu?: () => void;
}

export const FilterBar = ({
  defs,
  lockedStatuses = [],
  selection,
  onSelectionChange,
  scheduleHorizon = null,
  onShowViewMenu,
}: FilterBarProps) => {
  const chips = activeFilters(defs, selection);
  const statusDef = defs.find((def) => def.id === "status")!;
  const addCard = useAnchoredCard("left", "[data-concept-filters-sub]");
  if (chips.length === 0 && lockedStatuses.length === 0) return null;

  return (
    <>
      <TopBarFilter
        breakpoint="desktop"
        onAddClick={(e) => {
          addCard.anchorRef.current = e.currentTarget as unknown as HTMLDivElement;
          addCard.setOpen(!addCard.open);
        }}
        addPressed={addCard.open}
        onClearAll={
          chips.length > 0 && lockedStatuses.length === 0 ? () => onSelectionChange([]) : undefined
        }
        onReset={chips.length > 0 && lockedStatuses.length > 0 ? () => onSelectionChange([]) : undefined}
      >
        {lockedStatuses.length > 0 && <LockedStatusChip def={statusDef} statuses={lockedStatuses} />}
        {/* One chip per APPLICATION, in the order they were added — two
            "Assignee" chips can stand side by side. */}
        {chips.map(({ def, instance }) => (
          <AppliedChip
            key={instance.key}
            def={def}
            instance={instance}
            selection={selection}
            onSelectionChange={onSelectionChange}
            scheduleHorizon={scheduleHorizon}
            onShowViewMenu={onShowViewMenu}
          />
        ))}
      </TopBarFilter>
      <FiltersMenuCard card={addCard} defs={defs} selection={selection} onSelectionChange={onSelectionChange} />
    </>
  );
};

// ---- the view's locked chip ------------------------------------------------

// The Status chip a view applies — the documented Views section (14032-23326,
// 2026-09-03; e.g. the Pending chip 14032-24293). The SAME surface as a normal
// chip, but only THREE segments — name, condition, value — and no remove
// button. The annotation on every one: "Unremovable and unchangeable. The user
// is only allowed to see the applied values."
//
// The VALUE segment is the one target: clicking it opens the branch's status
// list READ-ONLY, so the user can SEE which statuses are on and which are not
// — the rows are the DS `readOnly` state (normal colors, nothing ticks; the
// value-list nodes 14032-25709 / 14101-52292 / 14101-53105 draw
// `state=readOnly` on every row), with the applied ones pinned on top by the
// DS's own selected-on-open rule, exactly as the nodes draw them. No counts.
//
// The condition follows the count like a user chip's would — the documented
// chips read "is any of | 2 statuses" (Pending) and "is | Completed"
// (Completed). The old node's flat "is" (13889-19207) is superseded.
function lockedStatusList(def: AnyFilterDef, statuses: string[]) {
  const items = (
    <SelectListItemGroup>
      {def.options.map((option) => (
        <SelectListItem
          key={option.id}
          label={option.label}
          select="multi"
          selected={statuses.includes(option.id as BadgeJobStatusStatus)}
          readOnly
          slotLeft={option.slotLeft}
        />
      ))}
    </SelectListItemGroup>
  );
  return { items };
}

// The DS FilterChip's `isLocked` IS this chip (migrated 2026-09-08; the prop
// was RENAMED from `isFixed` with the Figma component, 2026-09-09): no remove
// box, a non-interactive condition box. The VALUE box is always wired here —
// the documented rule was CORRECTED 2026-09-10 (Daniel: "the doc was wrong",
// DS doc 29552-12681): a value from the filter's OPTION LIST opens the
// read-only list whether it holds one value or several ("is | Finalized"
// opens it too, as the old local chip did); only a CUSTOM, Dialog-edited
// value would render a plain box, and a locked Status value never is one.
//
// `mobile` is the Filters sheet's presentation (2026-09-09): the chip fills
// the row like the user chips there, and the multi-value read-only list
// arrives as a DRAWER — a card anchored inside a drawer would clip. FLAGGED:
// the mobile sheet's node predates the locked chip, so this state is not
// drawn; built to the desktop chip's rules.
const LockedStatusChip = ({
  def,
  statuses,
  mobile = false,
}: {
  def: AnyFilterDef;
  statuses: string[];
  mobile?: boolean;
}) => {
  const valueCard = useAnchoredCard("left");
  const shown = valueDisplay(def, { ids: statuses, negated: false });
  const list = lockedStatusList(def, statuses);

  return (
    <>
      <FilterChip
        isLocked
        breakpoint={mobile ? "mobile" : "desktop"}
        slotLeft={<Icon icon={def.icon} pack={def.pack} rotate={def.rotate} size={14} container="square" />}
        property={def.label}
        condition={statuses.length > 1 ? "is any of" : "is"}
        value={shown.label}
        valueSlotLeft={shown.slotLeft}
        onValueClick={(e) => {
          valueCard.anchorRef.current = e.currentTarget as unknown as HTMLDivElement;
          valueCard.setOpen(!valueCard.open);
        }}
        valuePressed={valueCard.open}
      />
      {mobile
        ? valueCard.open && (
            <SelectList variant="drawer" open onClose={() => valueCard.setOpen(false)} title={def.label}>
              {list.items}
            </SelectList>
          )
        : valueCard.pos != null &&
          createPortal(
            <div ref={valueCard.cardRef} className={styles.filtersSub} style={valueCard.pos}>
              <SelectList
                variant="inline"
                open={valueCard.open}
                onClose={() => valueCard.setOpen(false)}
                multiSelect
                style={LIST_STYLE}
              >
                {list.items}
              </SelectList>
            </div>,
            document.body,
          )}
    </>
  );
};

// ---- one filter chip -------------------------------------------------------

// One applied filter: the DS `FilterChip` plus this prototype's wiring around
// it (migrated 2026-09-08 — the old hand-built four-segment chip is gone).
// The chip itself — boxes, dividers, fills, truncation tooltips, the remove
// box — is entirely the component's; this wrapper owns WHAT the boxes open:
// the condition/value lists, the mobile drawers, and the Custom dialog. The
// cards anchor to the box buttons via the click event (the DS chip owns the
// elements), and `conditionPressed` / `valuePressed` hold a box's fill while
// its list is on screen.
// ---- the schedule-horizon conflict ------------------------------------------

// The "Scheduled for" filter and the View menu's Schedule horizon narrow the
// SAME dimension, so a filter window reaching past the horizon's last day is
// silently capped — the trap the CONFLICT warning marks (Daniel's design,
// section 14101-46526, 2026-09-10). The chip turns `--text-warning` with the
// `warning` icon in the property slot, and the property box carries a Hint —
// hover (desktop) / tap (mobile drawer) — whose body is an EmptyState:
// AvatarWarning square, "Beyond the schedule horizon", the caption naming the
// horizon, and a GHOST "Show settings" (the EmptyState action-variant
// addition rides on this design). The rule lives in `scheduledValueEnd`.
interface ScheduleHorizon {
  /** The horizon's last day, offset from today (`SCHEDULED_WINDOW_DAYS`). */
  days: number;
  /** Its View-menu label — "Next 1 week" — for the hint's caption. */
  label: string;
}

/** The view's horizon, or null on "All dates" (nothing can conflict). */
const horizonOf = (settings: ViewSettings): ScheduleHorizon | null => {
  const days = SCHEDULED_WINDOW_DAYS[settings.scheduledKey] ?? null;
  if (days == null) return null;
  return { days, label: SCHEDULED_OPTIONS.find((o) => o.key === settings.scheduledKey)?.label ?? "" };
};

const conflictHint = (horizon: ScheduleHorizon, onShowViewMenu: () => void) => (
  <EmptyState
    slot={<AvatarWarning size="xl" />}
    title="Beyond the schedule horizon"
    caption={`The filter reaches beyond the view's schedule horizon (${horizon.label})`}
    primaryAction={{ label: "Show settings", variant: "ghost", onClick: onShowViewMenu }}
  />
);

interface AppliedChipProps {
  def: AnyFilterDef;
  /** The application this chip stands for. */
  instance: FilterInstance;
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /** The view's Schedule horizon — the conflict warning's other half. */
  scheduleHorizon?: ScheduleHorizon | null;
  /** The conflict hint's "Show settings" — opens the View menu. */
  onShowViewMenu?: () => void;
  /**
   * The chip inside the mobile Filters sheet (Figma node 13932-9592) — the DS
   * chip's `mobile` presentation: 36px boxes, 12px paddings, fills the row,
   * the value box takes the slack and truncates. Its condition and value open
   * DRAWERS instead of cards anchored to the chip.
   */
  mobile?: boolean;
}

const AppliedChip = ({
  def,
  instance,
  selection,
  onSelectionChange,
  scheduleHorizon = null,
  onShowViewMenu,
  mobile = false,
}: AppliedChipProps) => {
  const conditionCard = useAnchoredCard("left");
  const valueCard = useAnchoredCard("left");
  const shown = valueDisplay(def, instance);
  // The conflict: only the "Scheduled for" chip, only under a finite horizon,
  // and only when the value's last matching day reaches past the horizon's
  // (`null` end = an open "after", beyond every horizon).
  let conflict = false;
  if (def.id === "scheduledFor" && scheduleHorizon != null) {
    const end = scheduledValueEnd(instance.date);
    conflict = end !== false && (end == null || end > scheduleHorizon.days);
  }
  // A date or duration chip's Custom DIALOG, opened from the value list's
  // "Custom" row. It is a centred modal, so this is a flag, not an anchor.
  const [customOpen, setCustomOpen] = useState(false);
  // This chip's value IS a custom one, so the value segment opens the dialog
  // instead of the preset list.
  const isCustomValue =
    (instance.date != null && instance.date.preset == null) ||
    (instance.duration != null && instance.duration.preset == null) ||
    // An ADDRESS is only ever a typed value, so its value segment ALWAYS opens
    // the dialog — there is no preset list behind it to fall back to.
    instance.address != null;
  // The chip edits ITS OWN application, by key — the other chips of the same
  // filter are untouched.
  const change = (next: FilterInstance) => onSelectionChange(upsertFilter(selection, next));
  // No query here: the value list uses SelectList's built-in search, which does
  // its own filtering and clears itself when the card closes.
  const list = filterList(def, instance, change);
  const condition = conditionList(instance, (choice) => setCondition(choice));
  // One choice = no choice, so the condition segment stops being a target: a
  // date RANGE is always "within" (Daniel, 2026-08-23), and so is a DURATION
  // that holds one (Daniel, 2026-08-24 — node 13877-14876 draws the default
  // cursor over that segment to say it is not interactive). Leaving `within` is
  // the Custom dialog's job, reached from the VALUE segment.
  const fixedCondition = conditionChoices(instance).length < 2;
  // A WINDOW preset ("Next 3 days") is a complete answer with NO condition —
  // the chip renders WITHOUT the condition box entirely (the FilterChip
  // `condition=false` variant; the Scheduled for section's chip example,
  // 14101-46531). A CUSTOM value on the same filter keeps its dialog
  // condition ("after · Jan 1").
  const noCondition = def.dateWindows != null && instance.date?.preset != null;

  const setCondition = (choice: ConditionChoice) => {
    change(withCondition(instance, choice));
    conditionCard.setOpen(false);
  };
  const remove = () => onSelectionChange(removeFilter(selection, instance.key));

  return (
    <>
      {/* The condition — "is" / "is not" / "is any of" (nodes 13861-1837 and
          13870-7296), whose two choices depend on how many values are picked.
          A value with only ONE choice — a date range, a `within` duration —
          renders as plain text like the filter's name (the DS box with no
          handler): nothing to open.
          The value — one option with its icon, or "N priorities". Clicking it
          opens the SAME options the Filters menu shows (Daniel, 2026-08-17),
          minus the condition chips (Figma nodes 13912-13977 / 13911-10955).
          A chip whose value is already CUSTOM skips the list and opens the
          Custom dialog straight away (node 13914-15128) — the list would only
          offer presets, which is not what that chip holds. */}
      <FilterChip
        breakpoint={mobile ? "mobile" : "desktop"}
        // Conflicted, the CHIP swaps the property icon to `warning` itself
        // (the master's isWarning behavior since 2026-09-10) — the def icon
        // is simply what it shows the rest of the time.
        slotLeft={<Icon icon={def.icon} pack={def.pack} rotate={def.rotate} size={14} container="square" />}
        isWarning={conflict}
        propertyHint={
          conflict && scheduleHorizon != null && onShowViewMenu != null
            ? conflictHint(scheduleHorizon, onShowViewMenu)
            : undefined
        }
        property={def.label}
        condition={noCondition ? undefined : conditionLabel(instance)}
        onConditionClick={
          noCondition || fixedCondition
            ? undefined
            : (e) => {
                conditionCard.anchorRef.current = e.currentTarget as unknown as HTMLDivElement;
                conditionCard.setOpen(!conditionCard.open);
              }
        }
        conditionPressed={conditionCard.open}
        value={shown.label}
        valueSlotLeft={shown.slotLeft}
        onValueClick={(e) => {
          valueCard.anchorRef.current = e.currentTarget as unknown as HTMLDivElement;
          setCustomOpen(false);
          valueCard.setOpen(!valueCard.open);
        }}
        valuePressed={valueCard.open}
        onRemove={remove}
      />

      {/* The condition list. On MOBILE the rows arrive as a drawer instead
          (nodes 13902-21573 and, for a duration, 13874-10423) — there is no
          room beside a full-width chip. */}
      {!fixedCondition &&
        (mobile
          ? conditionCard.open && (
              <SelectList variant="drawer" open onClose={() => conditionCard.setOpen(false)} title={def.label}>
                {condition.items}
              </SelectList>
            )
          : conditionCard.pos != null &&
            createPortal(
              <div ref={conditionCard.cardRef} className={styles.filtersSub} style={conditionCard.pos}>
                <SelectList
                  variant="inline"
                  open={conditionCard.open}
                  onClose={() => conditionCard.setOpen(false)}
                  style={LIST_STYLE}
                >
                  {condition.items}
                </SelectList>
              </div>,
              document.body,
            ))}

      {/* MOBILE: the value options arrive as the same drawer the Filters sheet
          uses (node 13923-22399) — a draft plus an Apply footer — with no
          condition chips, since the chip's own box holds the condition. */}
      {mobile && valueCard.open && !isCustomValue && (
        <MobileFilterOptions
          def={def}
          instance={instance}
          hideConditions
          onCommit={change}
          onClose={() => valueCard.setOpen(false)}
        />
      )}
      {/* A custom date or duration opens the Custom dialog straight away — the
          preset list would have nothing ticked in it. The drawer twin of the
          desktop branch below (nodes 13933-12975 and 13983-37308). */}
      {mobile && valueCard.open && isCustomValue && (
        <CustomDialog
          def={def}
          instance={instance}
          breakpoint="mobile"
          onApply={(next) => {
            change(next);
            valueCard.setOpen(false);
          }}
          onClose={() => valueCard.setOpen(false)}
        />
      )}
      {!mobile &&
        valueCard.pos != null &&
        !isCustomValue &&
        !customOpen &&
        createPortal(
          <div ref={valueCard.cardRef} className={styles.filtersSub} style={valueCard.pos}>
            <SelectList
              variant="inline"
              open={valueCard.open}
              onClose={() => valueCard.setOpen(false)}
              multiSelect={!isSingleSelect(def)}
              // SelectList's own search — the header here is the search and
              // nothing else, which IS the DS `SelectListHeader`. It was a
              // hand-built block while the SearchField `bar` was 36px; the bar
              // is 40px + a Divider now, so the component covers it and owns
              // the query and the filtering with it.
              searchable={def.searchPlaceholder != null}
              searchPlaceholder={def.searchPlaceholder}
              footer={
                isSingleValue(def) ? (
                  <SelectListFooter>
                    <MenuItem label="Custom..." onClick={() => setCustomOpen(true)} />
                  </SelectListFooter>
                ) : undefined
              }
              state={list.isEmpty ? "noResults" : "default"}
              noResultsState={noMatches}
              style={LIST_STYLE}
            >
              {list.items}
            </SelectList>
          </div>,
          document.body,
        )}
      {/* The Custom DIALOG — a centred modal (nodes 13962-8889 / 13962-8893
          for a date, 13983-37497 for a duration), so it needs no anchor: it
          opens the same way whether the chip's VALUE box held a custom value
          already (`isCustomValue`) or the list's "Custom..." row was picked. */}
      {!mobile && valueCard.open && (isSingleValue(def) || isDialogOnly(def)) && (isCustomValue || customOpen) && (
        <CustomDialog
          def={def}
          instance={instance}
          breakpoint="desktop"
          onApply={(next) => {
            change(next);
            setCustomOpen(false);
            valueCard.setOpen(false);
          }}
          onClose={() => {
            setCustomOpen(false);
            valueCard.setOpen(false);
          }}
        />
      )}
    </>
  );
};

// ---- the Jobs table --------------------------------------------------------

// Concept 1's table: the columns, widths, sort and pinning of the production
// "Jobs → All Open" view, read off `jobs_table__open_all_open` in the app's
// defaultTableViewConfig plus the column definitions in JobTableView. 17
// columns, so the table scrolls sideways; ID and Service are pinned, sorted by
// Scheduled For. Concept 1's taller rows (44 header / 52 body) and heavier row
// divider come with it — see the scss.
//
// Every cell now READS the job record and formats it here (jobsData.ts owns the
// formatters), instead of storing pre-formatted strings. That is what lets the
// same values drive the filters.
//
// One deliberate difference, also Concept 1's: Duration is a LEFT-aligned text
// column. Production right-aligns its header while the cell renders left, which
// is the mismatch we agreed to fix — "2h 30m" is alphanumeric, so it never
// formed a numeric column. It still SORTS numerically, which is why its
// dataType stays "numerical".
const COLUMNS = {
  id: 144,
  service: 224,
  status: 240,
  labels: 288,
  type: 128,
  priority: 144,
  source: 184,
  sourceId: 144,
  // 112px (Daniel, 2026-08-17) — production ships 80, which leaves 48px after
  // the cell's padding and fits only ONE avatar slot, so any job with more than
  // one assignee showed a bare counter. 112 leaves 80px = three slots, i.e. two
  // faces plus the counter.
  techs: 112,
  received: 144,
  client: 224,
  locationName: 288,
  locationAddress: 288,
  scheduledFor: 224,
  duration: 112,
  statusChanged: 160,
  lastModified: 144,
};

// Priority 1–4 → icon + label, read off Figma node 8147-25260 in the "Table
// View — Next Update" file (Daniel, 2026-08-17). These are the REAL glyphs,
// not the approximations Concepts 1 and 2 still use: High / Medium / Low are
// Font Awesome KIT icons, and this playground does carry them (the two
// fa-kit-*.woff2 fonts + src/styles/icons-glyphs-kit.css). Medium and Low are
// DUOTONE — the second layer is what draws the pale bars next to the dark one.
// Urgent is plain FA Pro `fire`, and it is the only one with colour.
const PRIORITY = {
  1: { icon: "fire", pack: "solid", label: "Urgent", isUrgent: true },
  2: { icon: "solid-priority-high", pack: "custom", label: "High", isUrgent: false },
  3: { icon: "duotone-solid-priority-medium", pack: "custom-duotone", label: "Medium", isUrgent: false },
  4: { icon: "duotone-solid-priority-low", pack: "custom-duotone", label: "Low", isUrgent: false },
} as const;

// No priority is a TEXT cell like the rest, not an empty one (Figma node
// 13857-27895, Daniel 2026-08-17): the kit's `solid-priority-none` on the left
// and the copy "No priority" in the normal --text-strong. It reads as a value
// the job has, which is why it does not fall back to the cell's "—" placeholder.
const NO_PRIORITY = { icon: "solid-priority-none", pack: "custom", label: "No priority", isUrgent: false } as const;

const priorityOf = (priority: PriorityLevel | null) => (priority == null ? NO_PRIORITY : PRIORITY[priority]);

const priorityIcon = (priority: PriorityLevel | null) => {
  const { icon, pack, isUrgent } = priorityOf(priority);
  return <Icon icon={icon} pack={pack} size={14} className={isUrgent ? styles.priorityUrgent : undefined} />;
};

// Type — renamed from "Job Type" (Daniel, 2026-08-17) and showing the SAME value
// the Job Details page shows in its Service module's "Type" row: the copy
// New / Recall with a 14px regular icon in front of it, `sparkle` for New and
// `clock-rotate-left` for Recall. Both come straight from the JobDetails
// prototype (ServicePanel.tsx / CompleteJobForm.tsx), so the list and the
// details page cannot drift apart.
const typeIcon = (type: JobType) => (
  <Icon icon={type === "recall" ? "clock-rotate-left" : "sparkle"} pack="regular" size={14} container="square" />
);

// ---- sorting ---------------------------------------------------------------

// The header cells SORT since 2026-09-03 (Daniel: "clicking on a column header
// should apply the sorting. The second click changes the order"). Clicking a
// sortable column sorts by it ASCENDING; clicking the same column again flips
// the direction. The columns that sort are the ones that were already marked
// `isSortable`; the default is the view's own order, Scheduled for ascending.
//
// The sort belongs to its VIEW (Daniel, 2026-09-03: "Each view should have
// its own sorting parameters") — kept per view id, exactly like the view's
// filters, and never carried from one view to another.
type SortColumn =
  | "id"
  | "service"
  | "status"
  | "priority"
  | "source"
  | "sourceId"
  | "received"
  | "client"
  | "locationName"
  | "locationAddress"
  | "scheduledFor"
  | "duration"
  | "lastModified";

interface TableSort {
  column: SortColumn;
  order: CellSortOrder;
}

const SORT_DEFAULT: TableSort = { column: "scheduledFor", order: "ascending" };

// STATUS sorts by the badge map's own order — the job's lifecycle — not the
// alphabet ("other" is its icon pair for the same reason). PRIORITY ascends
// from No priority through Low to Urgent, the filter list's own order.
const STATUS_RANK = new Map((Object.keys(STATUS) as BadgeJobStatusStatus[]).map((key, index) => [key, index]));

/**
 * What each column sorts BY — a string (localeCompare, numeric-aware so
 * "SRC-99" sorts before "SRC-100") or a number. `null` / "" means the cell is
 * empty; empty cells sort LAST in either direction (the rule the view's own
 * Scheduled-for order already followed: "Unscheduled jobs have no date, so
 * they sort last").
 */
const SORT_KEYS: Record<SortColumn, (job: Job) => string | number | null> = {
  id: (job) => job.id,
  service: (job) => job.serviceName,
  status: (job) => STATUS_RANK.get(job.status) ?? 0,
  priority: (job) => (job.priority == null ? 0 : 5 - job.priority),
  source: (job) => sourceOf(job).name,
  sourceId: (job) => job.sourceRef,
  received: (job) => job.receivedAt,
  client: (job) => clientOf(job).name,
  locationName: (job) => locationOf(job).name ?? null,
  locationAddress: (job) => locationAddress(locationOf(job)),
  scheduledFor: (job) => job.scheduledFor,
  duration: (job) => job.durationMinutes,
  lastModified: (job) => job.lastModifiedAt,
};

function sortJobs(jobs: Job[], sort: TableSort): Job[] {
  const key = SORT_KEYS[sort.column];
  const direction = sort.order === "ascending" ? 1 : -1;
  return [...jobs].sort((a, b) => {
    const keyA = key(a);
    const keyB = key(b);
    const emptyA = keyA == null || keyA === "";
    const emptyB = keyB == null || keyB === "";
    // Ties and empties fall back to the ID, so the order is stable and two
    // equal rows can never swap as the sort changes around them.
    if (emptyA || emptyB) return emptyA && emptyB ? a.id.localeCompare(b.id) : emptyA ? 1 : -1;
    const compared =
      typeof keyA === "number" && typeof keyB === "number"
        ? keyA - keyB
        : String(keyA).localeCompare(String(keyB), "en", { numeric: true });
    return compared !== 0 ? compared * direction : a.id.localeCompare(b.id);
  });
}

// ---- the column registry ---------------------------------------------------

// ONE list drives the shared View Menu's rows, the table's header cells and
// its body cells, so the menu and the table can never disagree about what a
// column is. The order here is the DEFAULT view order (the production
// "Jobs → All Open" config); each view's own `columns` state reorders, hides
// and pins from it through the View menu.
interface TableColumnDef {
  key: string;
  label: string;
  width: number;
  /** The sort-icon pair — the header's, and (mapped) the menu's. */
  dataType: CellDataType;
  sortable: boolean;
  /** The body cell. `pin` freezes a pinned column's cells (see CellPinProps). */
  cell: (job: Job, pin: CellPinProps) => ReactNode;
}

/**
 * What a pinned column's cells receive: the sticky flag with its offset (the
 * summed widths of the pinned columns before it), and the pinned-region
 * boundary on the LAST pinned column. Empty for an unpinned column.
 */
interface CellPinProps {
  isPinned?: boolean;
  pinnedOffset?: number;
  isLastPinned?: boolean;
}

// ---- separator comparison (TEMPORARY — Daniel, 2026-09-04) -----------------
// Separator candidates side by side, so Daniel can compare them in place: the
// first 7 rows of the DEFAULT table (Open "All", Scheduled for ascending —
// JOBS' own order) each print "Scheduled for" with a different date–time
// separator, in the order below. Every other row keeps the ordinary bullet.
// Pinned to JOB IDS, so re-sorting or filtering moves a trial row with its
// job. Remove this block — and formatDateTime's `separator` parameter — once
// Daniel picks one.
//
const TABLE_COLUMNS: TableColumnDef[] = [
  {
    key: "id", label: "ID", width: COLUMNS.id, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.id} {...pin}>
        {job.id}
      </CellBody>
    ),
  },
  // The job's OWN service name — the db denormalizes it (production-like),
  // and it may drift from the pricebook name the Service FILTER lists; the
  // filter still matches on `serviceId`.
  {
    key: "service", label: "Service", width: COLUMNS.service, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.service} {...pin}>
        {job.serviceName}
      </CellBody>
    ),
  },
  {
    key: "status", label: "Status", width: COLUMNS.status, dataType: "other", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.status} content="badge" {...pin}>
        <BadgeJobStatus status={job.status} />
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(job).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  {
    key: "type", label: "Type", width: COLUMNS.type, dataType: "other", sortable: false,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.type} slotLeft={typeIcon(job.type)} {...pin}>
        {job.type === "recall" ? "Recall" : "New"}
      </CellBody>
    ),
  },
  {
    key: "priority", label: "Priority", width: COLUMNS.priority, dataType: "other", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.priority} slotLeft={priorityIcon(job.priority)} {...pin}>
        {priorityOf(job.priority).label}
      </CellBody>
    ),
  },
  {
    key: "source", label: "Source", width: COLUMNS.source, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.source} {...pin}>
        {sourceOf(job).name}
      </CellBody>
    ),
  },
  {
    key: "sourceId", label: "Source ID", width: COLUMNS.sourceId, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.sourceId} {...pin}>
        {job.sourceRef ?? ""}
      </CellBody>
    ),
  },
  {
    key: "techs", label: "Assignees", width: COLUMNS.techs, dataType: "other", sortable: false,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.techs} content="assignee" {...pin}>
        {job.assigneeIds.length > 0 ? (
          <AvatarGroup
            size="md"
            items={assigneesOf(job).map((tech) => ({ content: "image", imageSrc: tech.avatar, name: tech.name }))}
          />
        ) : undefined}
      </CellBody>
    ),
  },
  {
    key: "received", label: "Date received", width: COLUMNS.received, dataType: "timing", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.received} {...pin}>
        {formatDay(job.receivedAt)}
      </CellBody>
    ),
  },
  {
    key: "client", label: "Client", width: COLUMNS.client, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.client} {...pin}>
        {clientOf(job).name}
      </CellBody>
    ),
  },
  // Both location halves are OPTIONAL (2026-08-24): a location may have no
  // name of its own, or no address. An empty string is what makes CellBody
  // draw its own "—" placeholder.
  {
    key: "locationName", label: "Location name", width: COLUMNS.locationName, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.locationName} {...pin}>
        {locationOf(job).name ?? ""}
      </CellBody>
    ),
  },
  {
    key: "locationAddress", label: "Location address", width: COLUMNS.locationAddress, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.locationAddress} {...pin}>
        {locationAddress(locationOf(job))}
      </CellBody>
    ),
  },
  {
    key: "scheduledFor", label: "Scheduled for", width: COLUMNS.scheduledFor, dataType: "timing", sortable: true,
    // A past-due job's scheduled time reads as an error.
    cell: (job, pin) => (
      <CellBody
        width={COLUMNS.scheduledFor}
        colorScheme={job.status === "pastDue" ? "error" : "default"}
        {...pin}
      >
        {formatDateTime(job.scheduledFor)}
      </CellBody>
    ),
  },
  {
    key: "duration", label: "Duration", width: COLUMNS.duration, dataType: "numerical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.duration} {...pin}>
        {formatDuration(job.durationMinutes)}
      </CellBody>
    ),
  },
  {
    key: "statusChanged", label: "Status changed", width: COLUMNS.statusChanged, dataType: "timing", sortable: false,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.statusChanged} {...pin}>
        {formatDay(job.statusChangedAt)}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDay(job.lastModifiedAt)}
      </CellBody>
    ),
  },
];

const COLUMN_BY_KEY = new Map(TABLE_COLUMNS.map((def) => [def.key, def]));

// ---- the View menu (the shared module) --------------------------------------

// The shared View Menu module (src/modules/ViewMenu — the ViewMenu prototype's
// design, extracted on 2026-09-03 so one build serves every prototype). It is
// FULLY FUNCTIONAL here (Daniel): the Columns section shows, hides, pins and
// reorders the table's columns, Sort by edits the SAME per-view sort the
// header cells set, and the Schedule horizon narrows the jobs. Both jobs-only
// sections are on — this page is jobs.
//
// The Cards and Timeline VIEWS are not designed in this prototype, so their
// switcher tabs are DISABLED (`disabledViews` — Daniel, 2026-09-04: "It
// doesn't make sense to switch to them if the content doesn't change"); the
// view is always the table. FLAGGED: the Cards ATTRIBUTES passed below are
// the table's own columns (the module's demo list is product-shaped, wrong
// for jobs) — my mapping, not a node's; they stay unreachable while Cards is
// disabled.

/** The header's sort-icon pairs, mapped onto the menu's column types. */
const MENU_TYPE: Record<CellDataType, ViewMenuColumnType> = {
  alphabetical: "text",
  numerical: "number",
  timing: "date",
  other: "generic",
};

const VIEW_COLUMNS: ViewMenuColumn[] = TABLE_COLUMNS.map((def) => ({
  key: def.key,
  label: def.label,
  type: MENU_TYPE[def.dataType],
  sortable: def.sortable,
}));

const VIEW_ATTRIBUTES: ViewMenuAttribute[] = TABLE_COLUMNS.filter((def) => def.key !== "id").map((def) => ({
  key: def.key,
  label: def.label,
}));

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
  // pair), the rest in the registry's order, nothing hidden.
  columns: {
    pinned: ["id", "service"],
    unpinned: TABLE_COLUMNS.map((def) => def.key).filter((key) => key !== "id" && key !== "service"),
    hidden: [],
  },
  activeAttributes: ["status", "client", "scheduledFor"],
  scheduledKey: "all",
  timeline: defaultTimelineState(),
});

/** One shared default, so an untouched view keeps a stable reference. */
const DEFAULT_VIEW_SETTINGS = defaultViewSettings();

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

interface JobsTableProps {
  jobs: Job[];
  /** The view's column arrangement — what the View menu edits. */
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  /** Clicking a sortable header — the toggle rule lives with the state. */
  onSortChange: (column: SortColumn) => void;
  /**
   * MOBILE has no pin functionality (Daniel, 2026-09-09), so the desktop's
   * pinned columns do not freeze there — they render as ordinary leading
   * columns and scroll with the rest. The View menu's arrangement (pinned
   * group first) still decides the ORDER on both breakpoints.
   */
  mobile?: boolean;
}

// MEMOISED (2026-09-11). Re-rendering 78 rows × 17 columns costs 40-160ms, and
// without this the table rebuilt itself on EVERY render of the page — including
// the one that merely echoes a keystroke into the view bar's search field,
// where `jobs` has not changed at all because the filtering is deferred. With
// the table skipped, that keystroke render is nothing but the input.
//
// This only works while every prop keeps its identity between renders: `jobs`
// comes from the pipeline's `useMemo`, `columnsState` and `sort` are per-view
// state, and `onSortChange` is a `useCallback` — see `changeSort`.
const JobsTable = memo(function JobsTable({ jobs, columnsState, sort, onSortChange, mobile = false }: JobsTableProps) {
  // The three sorting props of a sortable header, from one place: the active
  // column shows its direction, every other one the neutral pair.
  const sortable = (column: string) => ({
    isSortable: true,
    sortOrder: sort.column === column ? sort.order : undefined,
    onClick: () => onSortChange(column as SortColumn),
  });

  // The view's arrangement, resolved against the registry: the pinned group
  // first, then the unpinned one, hidden keys dropped from both. Every pinned
  // column's cells FREEZE at the table's left edge (sticky, offset by the
  // pinned widths before them — Daniel, 2026-09-04) and the last one carries
  // the pinned-region boundary — header and cells alike.
  const visibleDefs = (keys: string[]) =>
    keys.filter((key) => !columnsState.hidden.includes(key)).flatMap((key) => COLUMN_BY_KEY.get(key) ?? []);
  const pinnedDefs = visibleDefs(columnsState.pinned);
  const unpinnedDefs = visibleDefs(columnsState.unpinned);
  const ordered = [...pinnedDefs, ...unpinnedDefs];

  // On MOBILE the map stays empty — no pin functionality there (see the
  // `mobile` prop) — so every column gets the plain, scrolling cell.
  const pinPropsByKey = new Map<string, CellPinProps>();
  if (!mobile) {
    let pinnedOffset = 0;
    for (const [index, def] of pinnedDefs.entries()) {
      pinPropsByKey.set(def.key, {
        isPinned: true,
        pinnedOffset,
        isLastPinned: index === pinnedDefs.length - 1,
      });
      pinnedOffset += def.width;
    }
  }
  const pinProps = (key: string): CellPinProps => pinPropsByKey.get(key) ?? {};

  return (
    <Table
      className={styles.jobsTable}
      header={
        <TableRow variant="header">
          {ordered.map((def) => (
            <CellHeader
              key={def.key}
              label={def.label}
              width={def.width}
              dataType={def.dataType}
              {...pinProps(def.key)}
              {...(def.sortable ? sortable(def.key) : {})}
            />
          ))}
        </TableRow>
      }
    >
      {jobs.map((job) => (
        <TableRow key={job.id} isClickable onClick={noop}>
          {ordered.map((def) => (
            <Fragment key={def.key}>{def.cell(job, pinProps(def.key))}</Fragment>
          ))}
        </TableRow>
      ))}
    </Table>
  );
});

// (useSingleAxisScroll — the mobile table's one-direction-per-gesture lock —
// lives in appShell.tsx since 2026-09-11; the Estimates table shares it.)

// ---- layouts ---------------------------------------------------------------

// ---- the table's empty states ----------------------------------------------

// NO MATCH — the "No Objects Match" section, REBUILT 2026-09-09 on the DS
// `EmptyState` (Daniel: "I decided to use the existing EmptyState component
// there" — the section's custom bordered-card block from earlier the same day
// is gone), UPDATED 2026-09-10 to Daniel's copy/state pass: the layer's
// user-facing name is "schedule horizon" now — "view settings" is gone from
// every string (the code keeps `viewSettings` for the View-menu state object,
// which holds more than the horizon). Read off the nodes (14118-59272,
// 14189-54104, 14189-54588, 14189-55064 + mobile twins; "Max Width" pin 384):
//
//   icon    every state icon is REGULAR now (the solid weights are gone —
//           and regular became EmptyState's default, so no iconPack here):
//           `bars-filter` for the filters states, `calendar` (was `sliders`)
//           for the schedule-horizon-only state;
//   title   "No jobs matching the filters" / "No jobs within the schedule
//           horizon" (Daniel 2026-09-10: jobs don't "match" a horizon — they
//           fall inside or outside it);
//   caption the counts — "N jobs" strong, the words subtle: "N jobs hidden by
//           filters", "N jobs hidden by schedule horizon", or the combined
//           "N jobs hidden by filters + N by schedule horizon";
//   actions subtle/lg — "Clear filters", or "Reset filters" when the view has
//           locked filters ("Depends if the view has locked filters"), and
//           "Show settings" (opens the View menu). The combined state shows
//           BOTH, filters button left — which is what turned EmptyState's
//           secondary action subtle.
//
// Jobs the LOCKED filter hides are not counted here either; a view whose
// locked filter alone leaves nothing shows NoJobsYet below instead (the
// Locked "Status" Filter frame 14192-60794: "we treat it as if no objects
// exist — even though the 'Status' filter is only hiding them").
interface NoMatchProps {
  hidden: HiddenCounts;
  /** The filters button: "Reset filters" with locked filters, else "Clear filters". */
  viewHasLockedFilters: boolean;
  onClearFilters: () => void;
  onShowViewMenu: () => void;
}

const NoMatch = ({ hidden, viewHasLockedFilters, onClearFilters, onShowViewMenu }: NoMatchProps) => {
  // The view-settings-ONLY state has its own icon and title; as soon as the
  // filters hide anything the state is the filters one, schedule horizon or not.
  const byViewOnly = hidden.user < 1;
  const filtersAction = {
    label: viewHasLockedFilters ? "Reset filters" : "Clear filters",
    onClick: onClearFilters,
  };
  const showAction = { label: "Show settings", onClick: onShowViewMenu };
  return (
    <div className={styles.noResults}>
      <EmptyState
        className={styles.tableEmptyState}
        icon={byViewOnly ? "calendar" : "bars-filter"}
        title={byViewOnly ? "No jobs within the schedule horizon" : "No jobs matching the filters"}
        caption={
          byViewOnly ? (
            <>
              <strong>{countLabel(hidden.view)}</strong> hidden by schedule horizon
            </>
          ) : hidden.view > 0 ? (
            <>
              <strong>{countLabel(hidden.user)}</strong> hidden by filters + <strong>{hidden.view}</strong> by
              schedule horizon
            </>
          ) : (
            <>
              <strong>{countLabel(hidden.user)}</strong> hidden by filters
            </>
          )
        }
        // Combined: filters button LEFT of Show settings (node 14189-55064) —
        // the secondary slot is the left one.
        secondaryAction={!byViewOnly && hidden.view > 0 ? filtersAction : undefined}
        primaryAction={byViewOnly || hidden.view > 0 ? showAction : filtersAction}
      />
    </div>
  );
};

// NO OBJECTS EXIST — the "No Objects Exist" section (14192-55585) and the
// Locked "Status" Filter frames (14192-60794 / 14192-61579): the DS
// `EmptyState`, centered in the table area. Shown when the view has NOTHING
// to offer before the counted layers — no jobs in the system, or a view whose
// locked Status filter matches none ("Once we build the 'View' functionality,
// this state won't exist. Until then, we treat it as if no objects exist").
// The locked chip stays in the filter bar in that case.
//
// The node's content, with the "[objects]" placeholders filled for jobs: the
// icon is "the object icon from the SidebarNav" (`semanticIcons.job`), title
// "No jobs", caption "There are no jobs here yet" (Daniel fixed the template's
// grammar in Figma, 2026-09-09), the "Create job" primary action with the
// `plus` icon (REGULAR, like every state icon since 2026-09-10 — the Button's
// Icon default). Create job goes nowhere in this prototype — no create flow —
// which Daniel OK'd.
const NoJobsYet = () => (
  <div className={styles.noResults}>
    <EmptyState
      className={styles.tableEmptyState}
      icon={semanticIcons.job}
      title="No jobs"
      caption="There are no jobs here yet"
      primaryAction={{ label: "Create job", leftIcon: "plus", onClick: noop }}
    />
  </div>
);

// NO SEARCH RESULTS — the "Search" section (14205-65621), UPDATED 2026-09-10
// to Daniel's copy/state pass. Both states are the EmptyState with a REGULAR
// `search` icon (was solid) and the title "No jobs matching the search":
//
//   MATCHING SEARCH (frames 14238-36927 / 37395 / 14205-65622 + mobile
//     twins) — the search DOES match jobs, but the filters and/or schedule
//     horizon hide them. The caption is a full sentence now — "N jobs match
//     the search but are hidden by filters + N by schedule horizon" (it
//     replaced "N matching jobs hidden by …"; Daniel's fix for the title
//     saying "no jobs match" while the caption counted matches) — and each
//     part shows ONLY when that layer hides matches. Only the Ns are strong
//     here (the nodes bold the bare number, not "N jobs" — unlike the No
//     Match captions). The actions follow the same per-layer rule: "Clear
//     filters" (locked-view label rule applies — its annotation's "Reset" is
//     the settled "Reset filters", per the bar's 2026-09-09 naming) and
//     "Show settings". NO "Clear search" here — the search field sits open
//     in the bar with its own clear.
//   NO MATCH (frames 14235-22441 / 22449) — nothing matches anywhere in the
//     view's world: caption "No jobs exist that match the search" (was "Try
//     another search"), one subtle "Clear search".
interface NoSearchResultsProps {
  /** MATCHING jobs hidden per layer — the search-aware counts. */
  hidden: HiddenCounts;
  viewHasLockedFilters: boolean;
  onClearFilters: () => void;
  onShowViewMenu: () => void;
  onClearSearch: () => void;
}

const NoSearchResults = ({
  hidden,
  viewHasLockedFilters,
  onClearFilters,
  onShowViewMenu,
  onClearSearch,
}: NoSearchResultsProps) => {
  const byFilters = hidden.user > 0;
  const byView = hidden.view > 0;
  const filtersAction = {
    label: viewHasLockedFilters ? "Reset filters" : "Clear filters",
    onClick: onClearFilters,
  };
  const showAction = { label: "Show settings", onClick: onShowViewMenu };
  return (
    <div className={styles.noResults}>
      <EmptyState
        className={styles.tableEmptyState}
        icon="search"
        title="No jobs matching the search"
        caption={
          // The node's template is plural ("N [object]s match … are hidden");
          // the singular is the same small grammar fix the copy takes
          // everywhere else ("1 job matches … is hidden").
          byFilters && byView ? (
            <>
              <strong>{hidden.user}</strong>{" "}
              {hidden.user === 1 ? "job matches the search but is" : "jobs match the search but are"} hidden by
              filters + <strong>{hidden.view}</strong> by schedule horizon
            </>
          ) : byFilters ? (
            <>
              <strong>{hidden.user}</strong>{" "}
              {hidden.user === 1 ? "job matches the search but is" : "jobs match the search but are"} hidden by
              filters
            </>
          ) : byView ? (
            <>
              <strong>{hidden.view}</strong>{" "}
              {hidden.view === 1 ? "job matches the search but is" : "jobs match the search but are"} hidden by
              schedule horizon
            </>
          ) : (
            "No jobs exist that match the search"
          )
        }
        // Filters button LEFT of Show settings when both show — the No Match
        // family's arrangement, which the section's frames repeat.
        secondaryAction={byFilters && byView ? filtersAction : undefined}
        primaryAction={
          byView ? showAction : byFilters ? filtersAction : { label: "Clear search", onClick: onClearSearch }
        }
      />
    </div>
  );
};

// ---- the Hidden Data Bar ----------------------------------------------------

// The "Hidden Data Bar" — the "Partially Hidden Objects" section (14189-49658,
// updated 2026-09-09; it superseded the states boards 14178-47650 /
// 14178-47306 and the first draft 14113-54698 / 14113-54705). The placement
// rule holds: after the table's scroll container, "fixed at the bottom of the
// list" — and the bar exists only while the table SHOWS something; with every
// row hidden the No Match state takes over (see NoMatch below). Every state
// is the DS Divider (medium) over a 40px centered row of caption text (13/20,
// the numbers strong 500, the words subtle 400) and ghost/sm Buttons; no fill
// of its own.
//
// Jobs the LOCKED status filter hides are NOT counted (the Locked "Status"
// Filter frame's annotation, 14192-61579: "the objects hidden by the locked
// 'Status' filter does not count. The default view with a single locked
// 'Status' filter doesn't have 'hidden object' bar") — so the bar measures
// the APPLIED filters and the schedule horizon only, and the old locked-only
// state is gone. The states, each with its node's annotation:
//
//   applied filters        "N jobs hidden by filters" + a button that
//                          "Depends if the view has locked filters"
//                          (14186-49625): "Clear filters" on a view without
//                          locked filters (14113-55510, "Removes all the
//                          applied filters"), "Reset filters" on a view WITH
//                          them (14186-48271, "Removes all the filters
//                          applied by the user" — the locked one stays);
//   schedule horizon only  "N jobs hidden by schedule horizon" + "Show
//                          settings" (14186-48783; the button "Opens the
//                          'View' menu". "Relevant to 'Jobs' only" — which
//                          this page is);
//   filters + horizon      DESKTOP (14186-49251): both groups side by side,
//                          16px apart — "N jobs hidden by filters" + its
//                          button and "+N by schedule horizon" + "Show
//                          settings". MOBILE (14186-49261): ONE compact line,
//                          no buttons — "N jobs hidden by filters + N by
//                          schedule horizon".
//
// "Reset filters" and "Clear filters" are the same write — the selection
// empties; the locked filter never lives in the selection, so it survives by
// construction. "Show settings" opens the View menu, wired through the
// shells.
//
// NAMING SETTLED (Daniel, 2026-09-09): "Reset filters" is intentional — it
// superseded the plain "Reset" he asked for earlier the same day. ("Show"
// grew to "Show settings" in the same update.) COPY RENAMED 2026-09-10:
// "view settings" became "schedule horizon" in every user-facing string,
// bar and empty states alike (the article rule Daniel settled the same day:
// "by + mechanism" takes no article — "hidden by filters" / "by schedule
// horizon" — while descriptive phrases keep "the" — "matching the filters",
// "within the schedule horizon").

/** The bar's two counted layers, each measured against the layer before it. */
interface HiddenCounts {
  /** Hidden by the USER's applied filters (out of what the locked view shows). */
  user: number;
  /** Hidden by the View menu's Schedule horizon window (out of what the filters show). */
  view: number;
}

interface HiddenDataBarProps {
  hidden: HiddenCounts;
  /** Picks the filters button: "Reset filters" with locked filters, else "Clear filters". */
  viewHasLockedFilters: boolean;
  /** The combined state collapses to the compact buttonless line on mobile. */
  mobile?: boolean;
  onClearFilters: () => void;
  onShowViewMenu: () => void;
}

const HiddenDataBar = ({ hidden, viewHasLockedFilters, mobile = false, onClearFilters, onShowViewMenu }: HiddenDataBarProps) => {
  if (hidden.user < 1 && hidden.view < 1) return null;

  const filtersGroup = hidden.user > 0 && (
    <span className={styles.hiddenBarGroup}>
      <p className={styles.hiddenBarText}>
        {/* countLabel — "1 job" / "13 jobs", the same copy the option rows use. */}
        <strong>{countLabel(hidden.user)}</strong> hidden by filters
      </p>
      <Button variant="ghost" size="sm" onClick={onClearFilters}>
        {viewHasLockedFilters ? "Reset filters" : "Clear filters"}
      </Button>
    </span>
  );

  const showButton = (
    <Button variant="ghost" size="sm" onClick={onShowViewMenu}>
      Show settings
    </Button>
  );

  return (
    <div className={styles.hiddenBar}>
      <Divider contrast="medium" />
      <div className={styles.hiddenBarRow}>
        {hidden.user > 0 && hidden.view > 0 ? (
          mobile ? (
            // The compact combined line — "no buttons" is its annotation.
            <p className={styles.hiddenBarText}>
              <strong>{countLabel(hidden.user)}</strong> hidden by filters +{" "}
              <strong>{hidden.view}</strong> by schedule horizon
            </p>
          ) : (
            <>
              {filtersGroup}
              <span className={styles.hiddenBarGroup}>
                <p className={styles.hiddenBarText}>
                  <strong>+{hidden.view}</strong> by schedule horizon
                </p>
                {showButton}
              </span>
            </>
          )
        ) : hidden.user > 0 ? (
          filtersGroup
        ) : (
          <span className={styles.hiddenBarGroup}>
            <p className={styles.hiddenBarText}>
              <strong>{countLabel(hidden.view)}</strong> hidden by schedule horizon
            </p>
            {showButton}
          </span>
        )}
      </div>
    </div>
  );
};

interface ShellProps {
  jobs: Job[];
  /** The Hidden Data Bar's three layers — see `HiddenCounts`. */
  hidden: HiddenCounts;
  /** The SEARCH emptied an otherwise non-empty table — its own empty state. */
  searchEmptied: boolean;
  /** MATCHING jobs the filters / schedule horizon hide from the empty search. */
  searchHidden: HiddenCounts;
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
  onSortChange: (column: SortColumn) => void;
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
          defs={FILTERS_BY_BRANCH[branch]}
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
              hidden={searchHidden}
              viewHasLockedFilters={lockedStatuses.length > 0}
              onClearFilters={() => onSelectionChange([])}
              onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
              onClearSearch={() => onSearchChange("")}
            />
          ) : hidden.user > 0 || hidden.view > 0 ? (
            <NoMatch
              hidden={hidden}
              viewHasLockedFilters={lockedStatuses.length > 0}
              onClearFilters={() => onSelectionChange([])}
              onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
            />
          ) : (
            <NoJobsYet />
          )}
        </div>
        {/* AFTER the scroll container, so it stays put at the bottom while the
            table scrolls — the annotation's "Fixed at the bottom of the list".
            Only while the table SHOWS rows: empty, the No Match block above
            carries the counts instead. */}
        {jobs.length > 0 && (
          <HiddenDataBar
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
            hidden={searchHidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
            onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
            onClearSearch={() => onSearchChange("")}
          />
        ) : hidden.user > 0 || hidden.view > 0 ? (
          <NoMatch
            hidden={hidden}
            viewHasLockedFilters={lockedStatuses.length > 0}
            onClearFilters={() => onSelectionChange([])}
            onShowViewMenu={() => setViewMenuSignal((n) => n + 1)}
          />
        ) : (
          <NoJobsYet />
        )}
      </div>
      {/* Between the list and the bottom bar, exactly where the mobile frame
          draws it (14113-54705) — after the scroll container, so it stays put.
          Only while the table SHOWS rows — empty, No Match carries the counts. */}
      {jobs.length > 0 && (
        <HiddenDataBar
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

  const filters = FILTERS_BY_BRANCH[branch];
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
    (column: SortColumn) =>
      setSorts((current) => {
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
  const settings = viewSettings[tab] ?? DEFAULT_VIEW_SETTINGS;
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
    let searchHidden: HiddenCounts = { user: 0, view: 0 };
    if (query !== "" && searched.length === 0) {
      const matchesQuery = (job: Job) => searchHaystack(job).includes(query);
      const inLocked = afterLocked.filter(matchesQuery).length;
      const inFilters = afterFilters.filter(matchesQuery).length;
      const inWindow = afterWindow.filter(matchesQuery).length;
      searchHidden = { user: inLocked - inFilters, view: inFilters - inWindow };
    }
    return {
      jobs: sortJobs(searched, sort),
      hidden: {
        user: afterLocked.length - afterFilters.length,
        view: afterFilters.length - afterWindow.length,
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
