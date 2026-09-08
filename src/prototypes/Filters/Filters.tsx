import {
  CSSProperties,
  Fragment,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
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
import BottomBarNav from "../../components/BottomBarNav/BottomBarNav";
import BottomBarNavItem from "../../components/BottomBarNav/BottomBarNavItem";
import SidebarNav from "../../components/SidebarNav/SidebarNav";
import SidebarNavItem from "../../components/SidebarNav/SidebarNavItem";
import SidebarNavItemGroup from "../../components/SidebarNav/SidebarNavItemGroup";
import TopBarNav from "../../components/TopBarNav/TopBarNav";
import TopBarNavLeftElements from "../../components/TopBarNav/TopBarNavLeftElements";
import TopBarNavTitle from "../../components/TopBarNav/TopBarNavTitle";
import FilterChip from "../../components/TopBarFilter/FilterChip";
import TopBarFilter from "../../components/TopBarFilter/TopBarFilter";
import TopBarView from "../../components/TopBarView/TopBarView";
import Popover from "../../components/Popover/Popover";
import PopoverFooter from "../../components/Popover/PopoverFooter";
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
import { SCHEDULED_WINDOW_DAYS, defaultTimelineState } from "../../modules/ViewMenu/viewMenuData";
import { Table } from "../../components/Table/Table/Table";
import { TableRow } from "../../components/Table/TableRow/TableRow";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import { objectPlaceholder } from "../../data/users";
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import { isSameMonth } from "../../utils/calendar";
import { semanticIcons } from "../../styles/semanticIcons";
import { noop } from "../../stories/helpers";

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
  optionCounts,
  removeFilter,
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
  serviceOf,
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

export interface FiltersProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
}

// MenuItem left icon (square 16px box) — same helper the other prototypes use.
const slot = (icon: string) => <Icon icon={icon} container="square" />;

// ---- SidebarNav config (display only) --------------------------------------

const profileMenu = (
  <>
    <MenuItemGroup>
      <MenuItem label="Settings" slotLeft={slot("gear")} />
    </MenuItemGroup>
    <MenuItemGroup>
      <MenuItem label="Help center" slotLeft={slot("circle-question")} />
      <MenuItem label="Contact support" slotLeft={slot("headset")} />
      <MenuItem label="Request feature" slotLeft={slot("circle-info")} />
      <MenuItem label="What's new" slotLeft={slot("bullhorn")} />
    </MenuItemGroup>
    <MenuItemGroup>
      <MenuItem label="Log out" slotLeft={slot("arrow-right-from-bracket")} danger />
    </MenuItemGroup>
  </>
);

const createMenu = (
  <MenuItemGroup>
    <MenuItem label="Estimate" slotLeft={slot(semanticIcons.estimate)} />
    <MenuItem
      label="Job"
      slotLeft={slot(semanticIcons.job)}
      subMenu={
        <MenuItemGroup>
          <MenuItem label="Job" slotLeft={slot(semanticIcons.job)} />
          <MenuItem label="Job series" slotLeft={slot(semanticIcons.jobSeries)} />
        </MenuItemGroup>
      }
      subMenuTitle="Create job"
    />
    <MenuItem
      label="Invoice"
      slotLeft={slot(semanticIcons.invoice)}
      subMenu={
        <MenuItemGroup>
          <MenuItem label="Invoice" slotLeft={slot(semanticIcons.invoice)} />
          <MenuItem label="Credit note" slotLeft={slot(semanticIcons.creditNote)} />
        </MenuItemGroup>
      }
      subMenuTitle="Create invoice"
    />
    <MenuItem label="Purchase order" slotLeft={slot(semanticIcons.purchaseOrder)} />
    <MenuItem label="Bill" slotLeft={slot(semanticIcons.bill)} />
    <MenuItem label="Vendor" slotLeft={slot(semanticIcons.vendor)} />
    <MenuItem label="Client" slotLeft={slot(semanticIcons.client)} />
    <MenuItem
      label="Pricebook item"
      slotLeft={slot(semanticIcons.pricebook)}
      subMenu={
        <MenuItemGroup>
          <MenuItem label="Labor" slotLeft={slot(semanticIcons.labor)} />
          <MenuItem label="Product" slotLeft={slot(semanticIcons.product)} />
          <MenuItem label="Other" slotLeft={slot(semanticIcons.other)} />
          <MenuItem label="Discount" slotLeft={slot(semanticIcons.discount)} />
          <MenuItem label="Tax rate" slotLeft={slot(semanticIcons.taxRate)} />
        </MenuItemGroup>
      }
      subMenuTitle="Create pricebook item"
    />
  </MenuItemGroup>
);

// The nav items BELOW the built-in Search row (SidebarNav renders Search
// itself when `onSearchClick` is set). The page is the Jobs list and the
// current page is the "Jobs" sub-item, so that group starts open with the
// sub-item active.
const navContent = (
  <>
    <SidebarNavItem icon="house">Home</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.estimate}>Estimates</SidebarNavItem>
    <SidebarNavItemGroup icon={semanticIcons.job} label="Jobs" defaultOpen>
      <SidebarNavItem type="stackItem">Requests</SidebarNavItem>
      <SidebarNavItem type="stackItem" active>
        Jobs
      </SidebarNavItem>
      <SidebarNavItem type="stackItem">Series</SidebarNavItem>
    </SidebarNavItemGroup>
    <SidebarNavItemGroup icon={semanticIcons.invoice} label="Invoices">
      <SidebarNavItem type="stackItem">Invoices</SidebarNavItem>
      <SidebarNavItem type="stackItem">Credit notes</SidebarNavItem>
    </SidebarNavItemGroup>
    <SidebarNavItem icon={semanticIcons.purchaseOrder}>Purchase orders</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.bill}>Bills</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.vendor}>Vendors</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.client}>Clients</SidebarNavItem>
    <SidebarNavItemGroup icon={semanticIcons.pricebook} label="Pricebook">
      <SidebarNavItem type="stackItem">Labor</SidebarNavItem>
      <SidebarNavItem type="stackItem">Products</SidebarNavItem>
      <SidebarNavItem type="stackItem">Other</SidebarNavItem>
      <SidebarNavItem type="stackItem">Discounts</SidebarNavItem>
      <SidebarNavItem type="stackItem">Tax rates</SidebarNavItem>
    </SidebarNavItemGroup>
    <SidebarNavItemGroup icon={semanticIcons.reports} label="Reports">
      <SidebarNavItem type="stackItem">Clients &amp; locations</SidebarNavItem>
      <SidebarNavItem type="stackItem">Jobs</SidebarNavItem>
      <SidebarNavItem type="stackItem">Inventory</SidebarNavItem>
    </SidebarNavItemGroup>
  </>
);

const bottomItems = (
  <>
    <SidebarNavItem icon="circle-question">Help center</SidebarNavItem>
    <SidebarNavItem icon="bullhorn">What&apos;s new</SidebarNavItem>
  </>
);

// ---- the sidebar -----------------------------------------------------------

// The DS `SidebarNav` (Daniel, 2026-09-03 — the hand-assembled copy is gone).
// Everything the old local build did by hand is the component's own behavior
// now: the 60px header, Create on top of the item list with its right-opening
// top-aligned menu card, the built-in Search item (rendered when
// `onSearchClick` is set; its hot key follows the OS), the 1px row rhythm,
// the pinned bottom items and the medium (--gray-a4) edge divider.
//
// `breakpoint="desktop"` keeps the sidebar rendered (and its menus on their
// card presentation) whatever the canvas width is — the component returns
// null on mobile otherwise, and the context it provides carries the value to
// the workspace / profile buttons.
//
// `imageSrc` gives the 28px object avatar a picture instead of the name's
// first letter (Daniel, 2026-08-17). `objectPlaceholder` is the kit's shared
// demo object image (src/data/users.ts) — its path is relative on purpose,
// because the built Storybook is served under a sub-path on GitHub Pages.
const Sidebar = () => (
  <SidebarNav
    breakpoint="desktop"
    workspaces={[{ id: "1", name: "Workspace", imageSrc: objectPlaceholder }]}
    profileName="Lorne Riddle"
    profileEmail="email@address.com"
    profileMenu={profileMenu}
    onSearchClick={noop}
    createMenu={createMenu}
    bottomItems={bottomItems}
  >
    {navContent}
  </SidebarNav>
);

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
// prototype's own database in `jobsData.ts`. That is what makes the counts in
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
  rows: FilterDef[],
  // Per-row extras — the handlers that open the row's SelectList. MenuItem
  // spreads any unknown props onto its root element, so pointer handlers reach
  // the row with NO change to the component. Narrowed to the three handlers on
  // purpose: MenuItemProps is a UNION, and a whole HTMLAttributes spread
  // collides with the `never`s in its branches.
  extra?: (row: FilterDef) => RowHandlers,
) => (
  <MenuItemGroup>
    {rows.length > 0 ? (
      rows.map((row) => (
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
      ))
    ) : (
      // No match. `Menu` has no empty / noResults state of its own — SelectList
      // does (an EmptyState with "No results found"), Menu does not — so this
      // stands in with a DISABLED MenuItem: a real component in a real state
      // (dimmed, non-interactive), needing no invented styling.
      // FLAGGED to Daniel: if Menu should gain a proper noResults state like
      // SelectList's, that is a DS decision, not a prototype one.
      <MenuItem label="No results found" disabled />
    )}
  </MenuItemGroup>
);

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
  defs: FilterDef[];
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /** Set by Menu's withGroupDividers — see above. */
  divider?: boolean;
}

const AppliedFilters = ({ defs, selection, onSelectionChange, divider = false }: AppliedFiltersProps) => (
  <div>
    {sectionLabel("Applied filters")}
    <div className={styles.appliedChips}>
      {activeFilters(defs, selection).map(({ def, instance }) => (
        <AppliedChip
          key={instance.key}
          mobile
          def={def}
          instance={instance}
          selection={selection}
          onSelectionChange={onSelectionChange}
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
  rows: FilterDef[];
  extra?: (row: FilterDef) => RowHandlers;
  labelled: boolean;
  divider?: boolean;
}) => (
  <div>
    {labelled && sectionLabel("Add filter")}
    {filterRows(rows, extra)}
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
// MenuHeader takes focus on mount by itself, so the desktop card opens ready to
// type. The MOBILE drawer must not (Daniel, 2026-08-17) — and it does not, from
// the component's own drawer rule, so there is nothing to pass here.
function useFilterSearch(open: boolean, defs: FilterDef[]) {
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
// ---- how wide a filter's option list has to be ------------------------------
//
// The node's Priority list is 209px, and that number is tuned to ITS labels:
// "No priority" next to "1 job" only just fits. Duration's "Under 1 hour" next
// to "20 jobs" does not, and a location name needs far more. The card cannot
// work this out itself — it is `width: fit-content`, but SelectListItem's title
// has `min-width: 0` and so contributes nothing to the intrinsic width (the same
// KNOWN LIMIT as the Menu card). So each list is measured here.

let measureCtx: CanvasRenderingContext2D | null | undefined;

/** The rendered width of a string in the option row's type (Inter regular 14). */
function textWidth(text: string): number {
  if (measureCtx === undefined) measureCtx = document.createElement("canvas").getContext("2d");
  // No canvas (never in a browser, but the fallback keeps this honest): about
  // 7.3px per character at Inter 14.
  if (measureCtx == null) return text.length * 7.3;
  measureCtx.font = "400 14px InterVariable, Inter, sans-serif";
  return measureCtx.measureText(text).width;
}

// Everything in an option row except the label and the tag: 12px padding,
// 16px checkbox, 12px gap, 16px icon, 8px gap, 16px label↔tag gap, 12px padding,
// plus the group's own 4px each side.
const OPTION_CHROME = 92 + 8;
/** The node's Priority width is the floor; the DS card's own max is the ceiling. */
const SUB_MIN_WIDTH = 209;
const SUB_MAX_WIDTH = 384;

// A DATE list is narrower than any option list — bare labels, no checkbox, no
// tag — so it takes the node's own width (13912-11964, the Date received list)
// instead of being measured. FIXED, not measured: all seven labels are known and
// short, and a fixed number keeps the "Custom" popover's anchor stable.
const DATE_LIST_WIDTH = 156;

// The DURATION list is narrower still — four bare labels, about 111px of
// content. Like the date list it is FIXED, not measured — and the rendered
// card actually opens at `listWidth`'s 240px floor, which is exactly what the
// documented node draws (13874-11407 is 240 wide, and carries Daniel's
// "Min Width" annotation saying that IS the minimum).
const DURATION_LIST_WIDTH = 111;

/**
 * Does this filter hold ONE value rather than a set? Date and duration both do,
 * and everything that follows from it is the same for the two: a single-select
 * list (so it closes on the pick), no counts, no Apply bar on mobile, and a
 * "Custom..." row in the footer that opens a dialog.
 */
const isSingleValue = (def: FilterDef) => def.kind === "date" || def.kind === "duration";

/**
 * Does this filter have NO option list at all, so that everything about it is
 * edited in a dialog? Only Address (Figma section 13988-53503). Its row in the
 * Filters menu opens the dialog on CLICK instead of hovering a list open, and
 * its chip's value segment does the same.
 */
const isDialogOnly = (def: FilterDef) => def.kind === "address";

// A plain (non-module) class on the Custom dialog's scrim. The dialog portals to
// <body>, so every anchored card here would read a click inside it as "outside";
// `useAnchoredCard` looks for this marker and stays open instead.
const DIALOG_MARKER = "concept-filters-dialog";
/** The Custom popover's card, from Figma nodes 13913-14399 / 13912-13158. */

// The widest count any option can show — every job in the database. Measured
// once, so a list's width never depends on which options happen to be ticked.
let cachedMaxCountWidth: number | undefined;
const maxCountWidth = () => (cachedMaxCountWidth ??= textWidth(countLabel(JOBS.length)));

// ---- how wide the HEADER's condition chips want to be ----------------------
//
// The card hugs its content and 240px is only the FLOOR (Daniel, 2026-08-24) —
// but until now only the option ROWS were measured, so a header whose chips are
// wider than the rows was left to wrap inside a 240px card. Labels showed it:
// its four conditions stacked into four lines under a 240px card while its
// longest option, "Cooking equipment", asked for barely 200.
//
// The chips' natural width is ALL OF THEM ON ONE ROW; the DS card's own 384px
// max is the ceiling, and the ChipGroup wraps anything past it. Labels' four
// conditions ask for about 575, so the card opens at the 384 max and they sit
// on two rows — two per row, exactly as the documented sub-menu draws them
// (node 14101-43498).
const CHIP_SIDES = 20; // md Chip: --size-2_5 (10px) each side
const CHIP_GAP = 8; // ChipGroup's gap
const HEADER_SIDES = 32; // SelectListHeader's chip container: 16px each side

const chipRowWidth = (choices: ConditionChoice[]) =>
  choices.reduce((sum, choice, index) => sum + textWidth(choice.label) + CHIP_SIDES + (index > 0 ? CHIP_GAP : 0), 0) +
  HEADER_SIDES;

/**
 * The width the condition chips need, at the WIDEST SET this filter can ever
 * show — not the set on screen right now (Daniel, 2026-08-24: "show the select
 * list the size which fits all 4 chips by default").
 *
 * So Labels opens at the 384 maximum, wide enough for the four conditions its
 * second ticked label brings, and never resizes while the user is working inside
 * it. This is the rule the option COUNTS already follow, for the same reason:
 * "measured at its WIDEST POSSIBLE value, not its current one".
 *
 * Labels is the only filter where the widest and narrowest sets differ at all —
 * every other one keeps the same two or three chips whatever is ticked, so every
 * other card still hugs its own option rows.
 */
function conditionsWidth(instance: FilterInstance): number {
  // One value and several — the only two shapes `conditionChoices` has. A date
  // or duration ignores `ids` entirely, so both calls return its own list.
  const sets = [
    conditionChoices({ ...instance, ids: instance.ids.slice(0, 1) }),
    conditionChoices({ ...instance, ids: ["a", "b"] }),
  ];
  // CEIL, not round: the sum is fractional and rounding DOWN leaves the row a
  // third of a pixel short, which is enough to wrap the last chip onto a
  // second line.
  return Math.ceil(Math.max(...sets.map(chipRowWidth)));
}

/**
 * The width a filter's list opens at, WHEREVER it opens from: the widest of the
 * option rows, the condition chips and the filter's own pinned minimum
 * (`FilterDef.listMinWidth` — Location's 384, from its "Min Width" annotation),
 * capped at the DS card's 384px maximum (and floored at 240 by `listWidth`).
 *
 * The chips count even when the list shows NONE of them — a value list opened
 * from a chip. That is the documented Labels section's rule (2026-09-03): its
 * chip-opened value lists carry the SAME "Min Width" pin as the menu's list
 * (nodes 13999-17141, 14101-43138 and 14101-43512, all 384) — one filter, one
 * width, so the list never changes size depending on where it was opened.
 */
const openListWidth = (def: FilterDef, instance: FilterInstance, measured: number) =>
  Math.min(SUB_MAX_WIDTH, Math.max(measured, conditionsWidth(instance), def.listMinWidth ?? 0));

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
  // These rows have no left icon and no tag, so they need a narrower chrome than
  // the option lists: 12px padding + label + 16px gap + the 16px check + 12px
  // padding, plus the group's 4px each side. Lands on the node's 97px for
  // "is" / "is not".
  const width = Math.round(Math.max(...choices.map((choice) => textWidth(choice.label))) + 64);
  return { items, width };
}

// A FUNCTION, not a component: SelectList has to SEE the SelectListItemGroup
// among its children. Its built-in `searchable` filters the items by their
// `label`, and `withGroupDividers` clones the groups — neither can look inside a
// custom component, so wrapping this in one made every list render its
// "No results found" state with zero options. (The same trap as
// SidePanelNavigation's fragment note in the DS.)
function filterList(
  def: FilterDef,
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
    return { items, width: DATE_LIST_WIDTH, isEmpty: false };
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
    return { items, width: DURATION_LIST_WIDTH, isEmpty: false };
  }

  const counts = optionCounts(JOBS, def);
  const picked = instance.ids;
  const toggle = (optionId: string) => {
    // An EXCLUSIVE option (Labels' "No labels") stands alone — its annotation:
    // "Selecting this option unselects all others. This option can only be
    // used alone." So ticking it clears the rest, and ticking anything else
    // clears it.
    const exclusive = def.exclusiveOptionId;
    const ids = picked.includes(optionId)
      ? picked.filter((id) => id !== optionId)
      : optionId === exclusive
        ? [optionId]
        : [...picked.filter((id) => id !== exclusive), optionId];
    // Un-ticking the last option leaves an EMPTY application; `upsertFilter`
    // drops it from the selection, so its chip goes with it.
    onInstanceChange({ ...instance, ids });
  };

  // The tag is measured at its WIDEST POSSIBLE value, not its current one.
  // Measuring the live count made the card shrink as options were ticked ("0
  // jobs" is narrower than "14 jobs"), and the labels then truncated — the width
  // must not depend on what is selected. A list with no counts (Assignee) drops
  // that term, which is what lands it on the node's 208px.
  // A list with no counts (Assignee) loses both the tag and the 16px gap in
  // front of it, which is what lands it on the node's 208px.
  const noTag = def.hideCounts === true;
  const widest =
    def.options.reduce((max, option) => Math.max(max, textWidth(option.label)), 0) +
    (noTag ? 0 : maxCountWidth());
  const chrome = noTag ? OPTION_CHROME - 16 : OPTION_CHROME;
  const width = Math.round(Math.min(SUB_MAX_WIDTH, Math.max(SUB_MIN_WIDTH, widest + chrome)));

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

  const row = (option: FilterOption) => (
    <SelectListItem
      key={option.id}
      label={option.label}
      searchText={option.searchText}
      select="multi"
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
      <SelectListItemGroup key={group.id} label={<GroupLabel variant="secondary" label={group.label} />}>
        {options.map(row)}
      </SelectListItemGroup>
    ));
    return { items, width, isEmpty: groups.length === 0 };
  }

  const items = <SelectListItemGroup>{shown.map(row)}</SelectListItemGroup>;

  return { items, width, isEmpty: shown.length === 0 };
}

// A desktop list's width, PINNED — the card must not resize as the search filters
// the rows, so the same value goes on all three properties. `filterList` measures
// the longest option; every filter's list then has a FLOOR of --size-60 (240px),
// so the submenus of the Filters menu all open at the same width instead of each
// hugging its own longest label (Daniel, 2026-08-19). CSS `max()` keeps that
// floor a token instead of a number resolved here.
const LIST_MIN_WIDTH = "var(--size-60)"; // 240px

const listWidth = (measured: number): CSSProperties => {
  const width = `max(${LIST_MIN_WIDTH}, ${measured}px)`;
  return { width, minWidth: width, maxWidth: width };
};

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
  def: FilterDef;
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

      {/* The chosen timeframe's own content. MONTH and YEAR (nodes 14097-21480
          / 14098-28104): a SECOND full-bleed Divider — Day has none — then the
          period list, which carries its own 16px padding and scrolls behind
          the line. DAY keeps the Selection block (field + calendar). */}
      {timeframe !== "day" ? (
        <>
          <Divider contrast="medium" />
          <PeriodList
            timeframe={timeframe}
            from={draft.from}
            to={draft.to}
            range={range}
            onPick={pickIso}
            today={todayDate}
          />
        </>
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
  def: FilterDef;
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
  def: FilterDef;
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
  def: FilterDef;
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
  def: FilterDef;
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

  // The card hugs the WIDER of its two contents — the option rows and the
  // header's condition chips — with the DS card's own 384px as the ceiling and
  // `listWidth`'s 240px as the floor. The chips count even when this list
  // hides them (`openListWidth`'s one-filter-one-width rule).
  const width = openListWidth(def, instance, list.width);

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

  return (
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
      // A date or duration filter holds ONE value, so its rows are
      // single-select — which is also what makes SelectList close itself the
      // moment one is picked.
      multiSelect={!isSingleValue(def)}
      className={isSingleValue(def) && variant === "drawer" ? styles.dateDrawer : undefined}
      state={list.isEmpty ? "noResults" : "default"}
      style={variant === "inline" ? listWidth(width) : undefined}
    >
      {list.items}
    </SelectList>
  );
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
// button instead.
interface MobileFilterOptionsProps {
  def: FilterDef;
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
  const isSingle = isSingleValue(def);

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
        onCustom={isSingle ? () => setCustom(true) : undefined}
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
}: ViewBarProps) {
  const card = useAnchoredCard("right", "[data-concept-filters-sub]");
  // The View menu — the shared module, anchored under the bar's View button
  // exactly as the Filters menu is under its own. The module's dropdown lists
  // live in [data-floating-list] body portals; the ignore selector keeps a
  // click inside them from closing the card underneath.
  const viewCard = useAnchoredCard("right", "[data-floating-list]");
  return (
    <>
      <TopBarView
        className={styles.viewBar}
        breakpoint="desktop"
        views={branchViews(branch)}
        view={tab}
        onViewChange={onTabChange}
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
}: ViewBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  // The View menu arrives as the module's own drawer.
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const filters = useFilterSearch(filtersOpen, FILTERS_BY_BRANCH[branch]);
  // Tapping a filter row opens its options as a SECOND drawer on top of the
  // Filters one (Figma node 13855-23306 — the list draws its own scrim). NO
  // back button (Daniel, 2026-08-17): the Filters drawer is still open
  // underneath, so dismissing this sheet already returns there.
  const [openFilter, setOpenFilter] = useState<FilterDef | null>(null);
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

  const mobileRowHandlers = (row: FilterDef): RowHandlers => ({
    onClick: () => {
      setDrafts((current) => (current[row.id] != null ? current : { ...current, [row.id]: newFilterInstance(row) }));
      setOpenFilter(row);
    },
  });

  // The applied-filters section, and with it the two section labels. Hidden
  // while the search is running: it filters the LIST, and the chips are not part
  // of that list, so leaving them up would look like the search had missed them.
  const showApplied = activeFilterCount(selection) > 0 && filters.query === "";

  // The MOBILE Filters count counts the view's locked Status filter as well
  // (Daniel, 2026-08-18): on every view but "All" a filter IS applied, and
  // mobile has no filter bar to show it. So "Pending" with nothing else on
  // reads 1.
  const activeCount = activeFilterCount(selection) + (tabById(branch, tab).statuses.length > 0 ? 1 : 0);

  return (
    <>
      <TopBarView
        className={styles.viewBar}
        breakpoint="mobile"
        views={branchViews(branch)}
        view={tab}
        onViewChange={onTabChange}
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
      {/* The drawer portals out to the device frame's drawer root, so where it
          is written makes no difference. */}
      {/* The drawer header keeps the DS's own line under it (Daniel,
          2026-08-23 — "reset the style to match the DS"). It used to be
          turned off through Menu's `drawerHeader` escape hatch; Menu
          builds the header from `title` again. */}
      <Menu
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        header={filters.header}
        breakpoint="mobile"
      >
        {/* The phone has no filter bar, so what is applied shows here
            (Figma node 13867-5235). Only while something IS applied — and
            the search hides it too, since it filters the list below and
            the chips are not part of that list. */}
        {showApplied && (
          <AppliedFilters defs={FILTERS_BY_BRANCH[branch]} selection={selection} onSelectionChange={onSelectionChange} />
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

// ---- anchored cards --------------------------------------------------------

type CardAlign = "left" | "right";

// One anchored body portal, shared by everything in this concept that opens next
// to something: the Filters menu (from the view bar's button and from the filter
// bar's plus), and a chip's condition menu and value list. It is a body portal
// because a card anchored inside the bars would be clipped by their overflow;
// `position: fixed` from the trigger's rect, re-measured on scroll and resize.
function useAnchoredCard(align: CardAlign = "left", ignoreSelector?: string) {
  const [open, setOpen] = useState(false);
  // `| null` in the type parameter makes the ref MUTABLE: most triggers attach
  // it as a wrapper div's `ref`, but the view bar assigns TopBarView's own
  // Filters button into it by hand (see DesktopViewBar).
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left?: number; right?: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect == null) return;
      // Pinned by the RIGHT edge near the right of the screen, so the card grows
      // leftwards and its own width never has to be measured.
      setPos(
        align === "right"
          ? { right: window.innerWidth - rect.right, top: rect.bottom + 4 }
          : { left: rect.left, top: rect.bottom + 4 },
      );
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, align]);

  // A click outside the trigger and the card closes it. `ignoreSelector` spares
  // a card's OWN satellite portals — the Filters menu's hovered option list is a
  // second portal, so it is not inside `cardRef`, and without this ticking an
  // option in it closed the whole menu underneath.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (anchorRef.current?.contains(target) === true) return;
      if (cardRef.current?.contains(target) === true) return;
      // The Custom DIALOG portals to <body>, so it is "outside" EVERY card here
      // — a click on its date field or its Range box closed the dialog, the
      // option list and the Filters menu all at once (Daniel, 2026-08-20). It
      // is a modal these cards opened, so no card ever closes on it; its own
      // scrim and Cancel are what dismiss it.
      if (target.closest?.(`.${DIALOG_MARKER}`) != null) return;
      if (ignoreSelector != null && target.closest?.(ignoreSelector) != null) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, ignoreSelector]);

  return { open, setOpen, anchorRef, cardRef, pos };
}

type AnchoredCard = ReturnType<typeof useAnchoredCard>;

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
  defs: FilterDef[];
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
}

function FiltersMenuCard({ card, defs, selection, onSelectionChange }: FiltersMenuCardProps) {
  const { open, setOpen, cardRef, pos } = card;
  const filters = useFilterSearch(open, defs);

  // The row being hovered, and the applications this VISIT to the menu is
  // building — one per filter, kept for as long as the menu stays open (Daniel,
  // 2026-08-18). Moving the pointer off a row only closes its list; coming back
  // continues the same application. Closing the whole Filters menu is what
  // resets them, so the next visit adds another application.
  const [subFilter, setSubFilter] = useState<FilterDef | null>(null);
  // Mirrors `subFilter` for the close timer, which fires long after its closure
  // was created and must act on whichever row is CURRENTLY open.
  const subFilterRef = useRef<FilterDef | null>(null);
  subFilterRef.current = subFilter;
  const [drafts, setDrafts] = useState<Partial<Record<FilterId, FilterInstance>>>({});
  const [subRow, setSubRow] = useState<DOMRect | null>(null);
  const [subPos, setSubPos] = useState<{ left: number; top: number } | null>(null);
  const subCardRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  // The Custom DIALOG. Picking "Custom" closes the menu (Daniel, 2026-08-20),
  // and the reset below wipes the visit's `subFilter` / `drafts` — so the dialog
  // holds its OWN copy of what it is editing and survives that.
  const [customEdit, setCustomEdit] = useState<{ def: FilterDef; instance: FilterInstance } | null>(null);

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
  const openSub = (row: HTMLElement, def: FilterDef) => {
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
  useLayoutEffect(() => {
    if (subFilter == null || subRow == null) return;
    const el = subCardRef.current;
    if (el == null) return;
    const cw = el.offsetWidth;
    const ch = el.offsetHeight;
    let left = subRow.right + SUB_GAP;
    if (left + cw > window.innerWidth - SUB_MARGIN) {
      const flipped = subRow.left - SUB_GAP - cw;
      left = flipped >= SUB_MARGIN ? flipped : Math.max(SUB_MARGIN, window.innerWidth - SUB_MARGIN - cw);
    }
    let top = subRow.top;
    if (top + ch > window.innerHeight - SUB_MARGIN) top = window.innerHeight - SUB_MARGIN - ch;
    if (top < SUB_MARGIN) top = SUB_MARGIN;
    setSubPos((prev) => (prev != null && prev.left === left && prev.top === top ? prev : { left, top }));
  }, [subFilter, subRow]);

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
  const rowHandlers = (row: FilterDef): RowHandlers =>
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
          <Menu
            open={open}
            onClose={() => setOpen(false)}
            header={filters.header}
            breakpoint="desktop"
            className={styles.filtersCard}
          >
            {filterRows(filters.rows, rowHandlers)}
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
  defs: FilterDef[];
  /** The statuses the current view locks — the first, fixed chip. */
  lockedStatuses: BadgeJobStatusStatus[];
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
}

const FilterBar = ({ defs, lockedStatuses, selection, onSelectionChange }: FilterBarProps) => {
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
function lockedStatusList(def: FilterDef, statuses: BadgeJobStatusStatus[]) {
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
  // The same width the status filter's own list opens at (the nodes pin the
  // 240 minimum), measured against an empty application so it never depends
  // on what the view happens to lock.
  return { items, width: openListWidth(def, newFilterInstance(def), filterList(def, newFilterInstance(def), noop).width) };
}

// The DS FilterChip's `isFixed` IS this chip (migrated 2026-09-08): no remove
// box, a non-interactive condition box. Per the component's documented rule,
// the VALUE box is wired only when it holds SEVERAL values — a single-value
// locked chip ("is | Completed") already says everything, so its value box is
// plain. (The old local chip opened the read-only list for one value too —
// behavior change, FLAGGED.)
const LockedStatusChip = ({ def, statuses }: { def: FilterDef; statuses: BadgeJobStatusStatus[] }) => {
  const valueCard = useAnchoredCard("left");
  const shown = valueDisplay(def, { ids: statuses, negated: false });
  const list = lockedStatusList(def, statuses);

  return (
    <>
      <FilterChip
        isFixed
        slotLeft={<Icon icon={def.icon} pack={def.pack} rotate={def.rotate} size={14} container="square" />}
        property={def.label}
        condition={statuses.length > 1 ? "is any of" : "is"}
        value={shown.label}
        valueSlotLeft={shown.slotLeft}
        onValueClick={
          statuses.length > 1
            ? (e) => {
                valueCard.anchorRef.current = e.currentTarget as unknown as HTMLDivElement;
                valueCard.setOpen(!valueCard.open);
              }
            : undefined
        }
        valuePressed={valueCard.open}
      />
      {valueCard.pos != null &&
        createPortal(
          <div ref={valueCard.cardRef} className={styles.filtersSub} style={valueCard.pos}>
            <SelectList
              variant="inline"
              open={valueCard.open}
              onClose={() => valueCard.setOpen(false)}
              multiSelect
              style={listWidth(list.width)}
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
interface AppliedChipProps {
  def: FilterDef;
  /** The application this chip stands for. */
  instance: FilterInstance;
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /**
   * The chip inside the mobile Filters sheet (Figma node 13932-9592) — the DS
   * chip's `mobile` presentation: 36px boxes, 12px paddings, fills the row,
   * the value box takes the slack and truncates. Its condition and value open
   * DRAWERS instead of cards anchored to the chip.
   */
  mobile?: boolean;
}

const AppliedChip = ({ def, instance, selection, onSelectionChange, mobile = false }: AppliedChipProps) => {
  const conditionCard = useAnchoredCard("left");
  const valueCard = useAnchoredCard("left");
  const shown = valueDisplay(def, instance);
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
        slotLeft={<Icon icon={def.icon} pack={def.pack} rotate={def.rotate} size={14} container="square" />}
        property={def.label}
        condition={conditionLabel(instance)}
        onConditionClick={
          fixedCondition
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
                  style={{ width: condition.width, minWidth: condition.width, maxWidth: condition.width }}
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
              multiSelect={!isSingleValue(def)}
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
              // The SAME width the menu-opened list uses — see `openListWidth`:
              // the documented Labels value lists pin the menu list's 384.
              style={listWidth(openListWidth(def, instance, list.width))}
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
  service: (job) => serviceOf(job).name,
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
  {
    key: "service", label: "Service", width: COLUMNS.service, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.service} {...pin}>
        {serviceOf(job).name}
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
}

const JobsTable = ({ jobs, columnsState, sort, onSortChange }: JobsTableProps) => {
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

  const pinPropsByKey = new Map<string, CellPinProps>();
  let pinnedOffset = 0;
  for (const [index, def] of pinnedDefs.entries()) {
    pinPropsByKey.set(def.key, {
      isPinned: true,
      pinnedOffset,
      isLastPinned: index === pinnedDefs.length - 1,
    });
    pinnedOffset += def.width;
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
};

// ---- one-axis table scrolling (mobile) -------------------------------------

// The table is ONE scroll container that pans both ways, so a diagonal drag
// moves it sideways and down at the same time. On a phone that feels wrong —
// Daniel asked for one direction per gesture (2026-08-16).
//
// There is no CSS for this: `touch-action` is static, and it is intersected
// down the ancestor chain, so nesting a `pan-x` scroller inside a `pan-y` one
// just forbids both. So the axis is locked in JS: the first few pixels of each
// touch decide the direction, and the other axis is pinned to the value it had
// when the gesture started.
//
// The lock lives ONLY while the finger is down. An earlier version held it
// through the momentum phase as well, which killed the flick entirely —
// assigning scrollLeft/scrollTop while iOS is running its inertia aborts the
// inertia. Releasing at `touchend` keeps the momentum fully native, and it
// still travels in one direction, because the drag held the other axis still
// and that is the velocity iOS carries into the flick.
//
// Returns a ref for the element WRAPPING the table — the Table's own root is
// the scroller, and it is that wrapper's only child.
function useSingleAxisScroll(enabled: boolean) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const el = hostRef.current?.firstElementChild as HTMLElement | null;
    if (el == null) return undefined;

    let axis: "x" | "y" | null = null;
    let startX = 0;
    let startY = 0;
    let lockLeft = 0;
    let lockTop = 0;
    let touching = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t == null) return;
      touching = true;
      axis = null;
      startX = t.clientX;
      startY = t.clientY;
      lockLeft = el.scrollLeft;
      lockTop = el.scrollTop;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (axis != null) return;
      const t = e.touches[0];
      if (t == null) return;
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);
      if (dx < 6 && dy < 6) return; // too small to tell the direction yet
      axis = dx > dy ? "x" : "y";
      // The browser may already have scrolled a little before we decided.
      lockLeft = el.scrollLeft;
      lockTop = el.scrollTop;
    };

    // The lock ends the moment the finger lifts, so the flick-and-release
    // momentum is left completely alone.
    const onTouchEnd = () => {
      touching = false;
      axis = null;
    };

    // Pin the locked-out axis — ONLY while the finger is down. Assigning
    // scrollLeft/scrollTop during iOS's momentum phase aborts the inertia
    // (that is what made the table stop dead on release), so this must never
    // run after touchend. The drag already held the other axis at a standstill,
    // so the momentum iOS starts from carries almost no velocity on it.
    const onScroll = () => {
      if (!touching || axis == null) return;
      if (axis === "x") {
        if (el.scrollTop !== lockTop) el.scrollTop = lockTop;
      } else if (el.scrollLeft !== lockLeft) {
        el.scrollLeft = lockLeft;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);

  return hostRef;
}

// ---- layouts ---------------------------------------------------------------

// When the filters match nothing the table is replaced by the DS `EmptyState`,
// with a "Clear filters" way out — otherwise the only thing on screen is a
// header row and no explanation. FLAGGED to Daniel: not designed. It also takes
// the table's place rather than sitting under its header, because the Table's
// children are TableRows and an EmptyState among them would break the grid roles.
const NoResults = ({ onClear }: { onClear: () => void }) => (
  <div className={styles.noResults}>
    <EmptyState
      icon="bars-filter"
      title="No jobs match these filters"
      caption="Change or clear the filters to see jobs here."
      primaryAction={{ label: "Clear filters", leftIcon: "xmark", onClick: onClear }}
    />
  </div>
);

interface ShellProps {
  jobs: Job[];
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
}

const DesktopShell = ({
  jobs,
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
}: ShellProps) => (
  <div className={styles.desktop}>
    <Sidebar />
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
      />
      {/* Only rendered while the view locks a status or something is applied. */}
      <FilterBar
        defs={FILTERS_BY_BRANCH[branch]}
        lockedStatuses={lockedStatuses}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      {/* The Table is its own scroll container (that is what lets its header
          stick), so it replaces the page ScrollArea rather than nesting in one. */}
      <div className={styles.mainArea}>
        {jobs.length > 0 ? <JobsTable jobs={jobs} columnsState={viewSettings.columns} sort={sort} onSortChange={onSortChange} /> : <NoResults onClear={() => onSelectionChange([])} />}
      </div>
    </div>
  </div>
);

// No filter bar on mobile (the node has none): the tab Button shows the tab and
// the Filters button shows how many of the user's filters are on.
const MobileShell = ({
  jobs,
  branch,
  onBranchChange,
  tab,
  onTabChange,
  selection,
  onSelectionChange,
  sort,
  onSortChange,
  onSortSet,
  viewSettings,
  onViewSettingsChange,
}: ShellProps) => {
  // A drag scrolls the table one way at a time — see useSingleAxisScroll.
  const tableRef = useSingleAxisScroll(true);

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
      />
      <div className={styles.mainArea} ref={tableRef}>
        {jobs.length > 0 ? <JobsTable jobs={jobs} columnsState={viewSettings.columns} sort={sort} onSortChange={onSortChange} /> : <NoResults onClear={() => onSelectionChange([])} />}
      </div>
      {/* The bar owns its own home-indicator inset, so the shell reserves none. */}
      <BottomBarNav breakpoint="mobile" className={styles.bottomBar}>
        <BottomBarNavItem icon="house" label="Home" />
        <BottomBarNavItem icon={semanticIcons.job} label="Jobs" active />
        {/* A PLAIN item since 2026-09-03 (Daniel + node 1502-14983): bare
            `plus`, regular weight — the Create adjustment (`strong`,
            circle-plus) is gone from the design and the component. */}
        <BottomBarNavItem icon="plus" label="Create" />
        <BottomBarNavItem icon="magnifying-glass" label="Search" />
        <BottomBarNavItem icon="bars" label="Menu" />
      </BottomBarNav>
    </div>
  );
};

/** One shared empty list, so an untouched tab keeps the same reference. */
const EMPTY_SELECTION: FilterSelection = [];

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
const Filters = ({ breakpoint = "auto" }: FiltersProps) => {
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
  const changeSort = (column: SortColumn) =>
    setSorts((current) => {
      const active = current[tab] ?? SORT_DEFAULT;
      return {
        ...current,
        [tab]:
          active.column === column
            ? { column, order: active.order === "ascending" ? "descending" : "ascending" }
            : { column, order: "ascending" },
      };
    });

  // The View menu's settings, PER VIEW like the filters and the sort — one
  // more map the view id keys. An untouched view opens on the default.
  const [viewSettings, setViewSettings] = useState<Record<string, ViewSettings>>({});
  const settings = viewSettings[tab] ?? DEFAULT_VIEW_SETTINGS;
  const setSettings = (next: ViewSettings) => setViewSettings((current) => ({ ...current, [tab]: next }));

  const jobs = useMemo(() => {
    let list = applyFilters(JOBS, filters, selection);
    // The PHASE always filters — the branch's "All" view lists that phase's
    // jobs, not everything ("All Open — ... All open jobs are listed", section
    // 14032-23326). A view with its own locked statuses narrows further.
    const phase = lockedStatuses.length > 0 ? lockedStatuses : branchStatuses(branch);
    list = list.filter((job) => phase.includes(job.status));
    // The View menu's "Schedule horizon" window (jobs only). The Figma
    // annotation's rule: N days = through the end of that day, and only
    // FUTURE-scheduled jobs are hidden — unscheduled and past ones stay.
    const windowDays = SCHEDULED_WINDOW_DAYS[settings.scheduledKey] ?? null;
    if (windowDays != null) {
      list = list.filter((job) => job.scheduledFor == null || dayOffset(job.scheduledFor) <= windowDays);
    }
    return sortJobs(list, sort);
  }, [selection, filters, lockedStatuses, branch, sort, settings.scheduledKey]);

  const shellProps = {
    jobs,
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
  };
  return isDesktop ? <DesktopShell {...shellProps} /> : <MobileShell {...shellProps} />;
};

export default Filters;
