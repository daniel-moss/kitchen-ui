import {
  CSSProperties,
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
import BadgeJobStatus, { BadgeJobStatusStatus } from "../../components/Badge/BadgeJobStatus";
import Button from "../../components/Button/Button";
import Chip from "../../components/Chip/Chip";
import ChipGroup from "../../components/Chip/ChipGroup";
import Dialog from "../../components/Dialog/Dialog";
import { Divider } from "../../components/Divider/Divider";
import EmptyState from "../../components/EmptyState/EmptyState";
import DateButton from "../../components/DatePicker/DateButton";
import DateField from "../../components/Fields/DateField/DateField";
import Input from "../../components/Input/Input";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import { Icon } from "../../components/Icon/Icon";
import Counter from "../../components/Counter/Counter";
import IconButton from "../../components/IconButton/IconButton";
import Menu from "../../components/Menu/Menu";
import MenuHeader from "../../components/Menu/MenuHeader";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import BottomBarNav from "../../components/BottomBarNav/BottomBarNav";
import BottomBarNavItem from "../../components/BottomBarNav/BottomBarNavItem";
import { SidebarNavBreakpointContext } from "../../components/SidebarNav/SidebarNavContext";
import SidebarNavItem from "../../components/SidebarNav/SidebarNavItem";
import SidebarNavItemGroup from "../../components/SidebarNav/SidebarNavItemGroup";
import SidebarNavProfileButton from "../../components/SidebarNav/SidebarNavProfileButton";
import SidebarNavWorkspaceButton from "../../components/SidebarNav/SidebarNavWorkspaceButton";
import TopBarNav from "../../components/TopBarNav/TopBarNav";
import TopBarNavLeftElements from "../../components/TopBarNav/TopBarNavLeftElements";
import TopBarNavTitle from "../../components/TopBarNav/TopBarNavTitle";
import Popover from "../../components/Popover/Popover";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import ScrollArea from "../../components/ScrollArea/ScrollArea";
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
import { Table } from "../../components/Table/Table/Table";
import { TableRow } from "../../components/Table/TableRow/TableRow";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { objectPlaceholder } from "../../data/users";
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import {
  WEEKDAYS,
  buildMonthGrid,
  formatFullDate,
  formatMonthTitle,
  isSameDay,
  isSameMonth,
} from "../../utils/calendar";
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
  formatDurationFooter,
  formatFooterDate,
  formatLongDate,
  formatMonthValue,
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
// The JOBS LIST page:
//   - sidebar: Concept 1's hardcoded copy, RESTRUCTURED — Create is lifted out
//     of the item list and sits on top of it, the header is 60px, and the rows
//     are 1px apart instead of flush;
//   - top bar: the DS `TopBarNav` — no title icon, an h3 title at 16px, no live
//     users, a 60px row — with the branch tabs 16px after the title;
//   - view bar: 60px, the status tabs on the left and the three buttons on the
//     right;
//   - filter bar: the chips, with the tab's locked Status chip first;
//   - table: Concept 1's.
//
// Mobile, as in Concept 3: the top bar carries the branch tabs and the DS's own
// mobile create button, and the status control is NOT a Button — here it is a
// plain label + count + chevron row (see StatusPicker), opening ONE flat list.
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

// The list under Create STARTS with Search (Daniel, 2026-08-16) — in Concept 1
// Search sits above Create. The page is the Jobs list and the current page is
// the "Jobs" sub-item, so that group starts open with the sub-item active.
const navContent = (
  <>
    <SidebarNavItem icon="magnifying-glass" hotKey="⌘K" onClick={noop}>
      Search...
    </SidebarNavItem>
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

// ---- the sidebar (hardcoded for this concept) ------------------------------

// Sidebar — Concept 1's hardcoded copy (Figma nodes 13825-10029 +
// 13835-16562), assembled from the real DS parts, with the changes Daniel
// asked for on 2026-08-16:
//   - the header is 56px, not 64;
//   - CREATE is lifted OUT of the item list and sits on top of it, directly
//     under the header with no gap above it;
//   - the item list below it starts with Search, 8px under Create;
//   - the rows are 1px apart (Concept 1 stacks them flush), inside the
//     accordion groups too, and the bottom items are 1px apart as well.
// Unchanged from Concept 1: the 280px column, 10px side padding, 36px rows,
// the Create row's own look. The edge line is now --gray-a4.

// The Create row and its menu. The menu opens to the right of the row and is
// TOP-aligned — the component aligns the bottoms, which would run off the top
// of the screen from a row this high.
function CreateRow() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Measure while open (and on scroll/resize — the sidebar scrolls).
  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect == null) return;
      setPos({ left: rect.right + 4, top: rect.top });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // Clicking outside the row + card closes the menu.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (wrapRef.current?.contains(target) === true) return;
      if (target.closest?.("[data-concept-create-menu]") != null) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef}>
      <SidebarNavItem
        className={styles.createRow}
        icon="circle-plus"
        strong
        hotKey="C"
        isPressed={open}
        onClick={() => setOpen(!open)}
      >
        Create
      </SidebarNavItem>
      {pos != null &&
        createPortal(
          <div data-concept-create-menu className={styles.createMenu} style={{ left: pos.left, top: pos.top }}>
            <Menu open={open} onClose={() => setOpen(false)} title="Create" breakpoint="desktop">
              {createMenu}
            </Menu>
          </div>,
          document.body,
        )}
    </div>
  );
}

const Sidebar = () => (
  // The breakpoint context keeps the workspace / profile menus on their
  // desktop presentation (cards, not drawers) whatever the canvas width is.
  <SidebarNavBreakpointContext.Provider value="desktop">
    <div className={styles.sidebar}>
      <div className={styles.sidebarInner}>
        <div className={styles.sidebarHeader}>
          {/* `imageSrc` gives the 28px object avatar a picture instead of the
              name's first letter (Daniel, 2026-08-17). `objectPlaceholder` is
              the kit's shared demo object image (src/data/users.ts) — its path
              is relative on purpose, because the built Storybook is served
              under a sub-path on GitHub Pages. */}
          <SidebarNavWorkspaceButton
            workspaces={[{ id: "1", name: "Workspace", imageSrc: objectPlaceholder }]}
            className={styles.sidebarWorkspace}
          />
          <SidebarNavProfileButton name="Lorne Riddle" email="email@address.com">
            {profileMenu}
          </SidebarNavProfileButton>
        </div>
        <ScrollArea wrapperClassName={styles.sidebarScrollWrap} className={styles.sidebarScroll}>
          <div className={styles.sidebarTop}>
            <CreateRow />
            <div className={styles.sidebarItems}>{navContent}</div>
          </div>
          <div className={styles.sidebarItems}>{bottomItems}</div>
        </ScrollArea>
      </div>
      {/* --gray-a4 IS Divider's "medium" contrast (Daniel, 2026-08-17 — it was
          --gray-a6), so this is the component's own variant, not an override. */}
      <Divider orientation="vertical" contrast="medium" className={styles.sidebarEdge} />
    </div>
  </SidebarNavBreakpointContext.Provider>
);

// ---- the list top bar ------------------------------------------------------

// The DS `TopBarNav` in its `list` variant (Daniel, 2026-08-16) — NOT a
// hardcoded copy like Concept 1's. The prototype-local adjustments live in the
// scss: the 60px row, the lg buttons, the 16px `heading-h3` title and the
// --gray-a4 bottom Divider.
// The title has NO left icon here (Filters has the wrench). Live users are
// not passed, so the avatar stack never appears (TopBarNavLiveUsers returns
// null on an empty list).
//
// The BRANCH tabs live here now (Daniel, 2026-08-18): the same [Open · Closed]
// TabGroup, 24px after the title and filling the bar's height, on BOTH
// breakpoints (Figma nodes 13888-18181 desktop / 13893-20645 mobile).
//
// The bar is told `breakpoint="desktop"` on MOBILE too (Daniel, 2026-08-18):
// TopBarNavRightElements draws the create button as a plus IconButton on mobile,
// and the create control should be the same "New" Button as on desktop. Forcing
// the desktop format is the only way to get it without changing the component.
// `onSearch` is then left OFF on mobile, so the desktop-only search button still
// does not appear.
const TopBar = ({ mobile = false }: { mobile?: boolean }) => (
  <TopBarNav
    className={styles.topBar}
    variant="list"
    breakpoint="desktop"
    onSearch={mobile ? undefined : noop}
    onCreate={noop}
  >
    <TopBarNavLeftElements className={styles.topBarLeft}>
      {/* The sub-pages read "Requests" / "Series", not "Job requests" / "Job
          series" (Daniel, 2026-08-17) — the same labels the sidebar's Jobs
          stack already uses. */}
      <TopBarNavTitle
        className={styles.topBarTitle}
        title="Jobs"
        subPages={[
          { id: "requests", label: "Requests" },
          { id: "jobs", label: "Jobs" },
          { id: "series", label: "Series" },
        ]}
        defaultSubPage="jobs"
      />
      {/* "Closed" is drawn but not built, so the group never leaves "Open" —
          see BRANCHES. */}
      <TabGroup
        className={styles.branchTabs}
        variant="default"
        size="lg"
        value={OPEN_BRANCH.id}
        onChange={noop}
        aria-label="Open or closed jobs"
      >
        {BRANCHES.map((branch) => (
          <TabItem key={branch.id} value={branch.id}>
            {branch.label}
          </TabItem>
        ))}
      </TabGroup>
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
// filters now live in ONE place, `filters.tsx`'s registry, which reads the
// prototype's own database in `jobsData.ts`. That is what makes the counts in
// each option's tag and the rows the table shows come from the same predicate.
const FILTERS = buildFilters(styles.priorityUrgent);

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
// (Daniel, 2026-08-25). FLAGGED: node 13857-25352 draws the chevron on the
// Address row like every other one, so the node and the build now differ.
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
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /** Set by Menu's withGroupDividers — see above. */
  divider?: boolean;
}

const AppliedFilters = ({ selection, onSelectionChange, divider = false }: AppliedFiltersProps) => (
  <div>
    {sectionLabel("Applied filters")}
    <div className={styles.appliedChips}>
      {activeFilters(FILTERS, selection).map(({ def, instance }) => (
        <FilterChip
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
function useFilterSearch(open: boolean) {
  const [query, setQuery] = useState("");

  // Every fresh open starts from the full list. Cleared in a LAYOUT effect, not
  // a plain one: the state lives out here (the button stays mounted while the
  // menu comes and goes), so a stale query would otherwise be painted for one
  // frame before the reset landed.
  useLayoutEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const rows = q === "" ? FILTERS : FILTERS.filter((row) => row.label.toLowerCase().includes(q));

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

// The DURATION list is narrower still — four bare labels (node 13983-38374 is
// 111px). Like the date list it is FIXED, not measured.
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
// conditions ask for about 582, so the card opens at the 384 max and they sit
// on two rows — two per row, which is the closest the DS card can get to
// showing all four at once.
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
  // CEIL, not round: the sum is fractional (Labels' four come to 333.31) and
  // rounding DOWN leaves the row a third of a pixel short, which is enough to
  // wrap the last chip onto a second line.
  return Math.ceil(Math.max(...sets.map(chipRowWidth)));
}

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
    const ids = picked.includes(optionId) ? picked.filter((id) => id !== optionId) : [...picked, optionId];
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

// The two conditions as DS `Chip`s at the top of a filter's option list (Figma
// nodes 13934-14585 desktop / 13934-14391 mobile): a 16/12 padded row, chips 8px
// apart, `lg` (32px), the current one `active` (the DS's gray-a2 fill + gray-12
// border).
//
// The choices are the same pair the chip's condition menu offers, so they follow
// the value count: "is" / "is not" with one option ticked, "is any of" / "is
// not" with several.
interface ConditionChipsProps {
  value: FilterValue;
  onChange: (choice: ConditionChoice) => void;
  /** Nothing follows the chips in the header, so the container closes itself. */
  last?: boolean;
}

// The bare Chips, with no row around them — what the DS `SelectListHeader`
// takes for its `chips` slot (it wraps them in a real ChipGroup itself).
//
// `md` (32px) everywhere: this builds LIST-HEADER chips only. The Custom dialogs
// draw their own `lg` (36px) chips from DATE_CONDITIONS / DURATION_DIALOG_-
// CONDITIONS, because the sets they offer are wider than the chip's.
const conditionChipList = (value: FilterValue, onChange: (choice: ConditionChoice) => void) =>
  conditionChoices(value).map((choice) => (
    <Chip key={choice.label} size="md" active={isConditionActive(value, choice)} onClick={() => onChange(choice)}>
      {choice.label}
    </Chip>
  ));

// The same Chips in the prototype-LOCAL row — for the filters that have no node
// of their own and so are not on `dsHeader` (Duration, Labels, Location, …).
const ConditionChips = ({ value, onChange, last = false }: ConditionChipsProps) => (
  <div className={clsx(styles.conditionChipGroup, last && styles.conditionChipGroupLast)}>
    {conditionChipList(value, onChange)}
  </div>
);

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

// The Month and Year timeframes' content. Neither has date fields or a
// calendar — the period IS the value.
//
// The cells are the real DS `Chip`, with the nodes' own look applied through a
// class. FLAGGED, the same way the calendar's DateButtons are: the node strips
// the Chip's resting fill and 1px ring, stretches it (to a third of the row for
// a month, the full width for a year), and paints the picked one as a dark
// PILL — none of which the DS Chip can do today. If this look is kept, the Chip
// needs a plain/`ghost` variant and a `picked` one, and the list belongs in the
// DS beside DatePicker.
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
// ways (nodes 13962-14374 / 13965-24022 for Month, 13965-29278 / 13965-31488
// for Year). Month gives each year a `heading-h3` title over its twelve months
// in three columns; Year is one full-width chip per year and no titles.
function PeriodList({ timeframe, from, to, range, onPick, today }: PeriodListProps) {
  // Same preview as the calendar's: with only one end picked, the band follows
  // the pointer. NOT IN THE NODE — a static frame cannot draw a hover.
  const [hovered, setHovered] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const openYearRef = useRef<HTMLDivElement>(null);

  // Open on the year that matters — the picked one, else this one (Daniel,
  // 2026-08-23). The scroll is set on the LIST, not through `scrollIntoView`:
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
  const years: number[] = [];
  for (let year = FIRST_YEAR; year <= today.getFullYear(); year++) years.push(year);

  // One cell — a month or a whole year. Both are the DS Chip with the same
  // local look; only the label and the ISO behind it differ.
  const cell = (iso: string, label: string) => {
    const picked = range ? iso === bandFrom || iso === bandTo : iso === from;
    const inBand = bandFrom != null && bandTo != null && iso >= bandFrom && iso <= bandTo;
    return (
      <Chip
        key={iso}
        size="lg"
        // `active` only on the two ends: it sets aria-pressed, and its gray-12
        // ring is invisible under the dark fill. A band cell would SHOW that
        // ring, which the node does not draw.
        active={picked}
        className={clsx(
          styles.monthCell,
          inBand && styles.monthCellBand,
          inBand && iso === bandFrom && styles.monthCellBandStart,
          inBand && iso === bandTo && styles.monthCellBandEnd,
          picked && styles.monthCellPicked,
        )}
        onPointerEnter={() => setHovered(iso)}
        onClick={() => onPick(iso)}
      >
        {label}
      </Chip>
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
          <div key={year} ref={year === openYear ? openYearRef : undefined} className={styles.yearRow}>
            {cell(`${year}-01-01`, String(year))}
          </div>
        ) : (
          <div key={year} ref={year === openYear ? openYearRef : undefined} className={styles.monthYear}>
            <div className={styles.monthYearTitle}>{year}</div>
            <div className={styles.monthGrid}>
              {MONTH_LABELS.map((label, index) => cell(`${year}-${String(index + 1).padStart(2, "0")}-01`, label))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

// ---- the dialog's calendar -------------------------------------------------

// The month calendar drawn INSIDE the Custom dialog (Figma nodes 13962-8889 /
// 13962-8893). It is the DS `DatePicker`'s twin, not the component itself: the
// DS one renders either a floating desktop card (its own surface, shadow and
// 12px padding) or its own mobile drawer, and neither can sit inline in a dialog
// body. So the LAYOUT is local and the DAY CELLS are the real DS `DateButton`s,
// with the node's own look applied through a class.
//
// FLAGGED to Daniel: if this stays, it belongs in the DS as a DatePicker
// presentation (`variant="inline"`) plus a DateButton `pill` look and a range
// look, not here. The differences from the DS picker, all read off the nodes:
//   1. the title is `heading-h3` (15/24) and LEFT-aligned; the DS picker's is
//      `heading-h4` (14/20) and centred between the two buttons;
//   2. both nav IconButtons sit to the RIGHT of the title and are `lg` (36px);
//      the DS picker puts one on each side at `md` (32px). With two months side
//      by side they sit on the LAST one only, and move BOTH (node 13962-12748);
//   3. the day cell is a PILL that stretches to fill the row (up to 56px); the
//      DS cell is a fixed 36px square with a 6px radius, and its selected label
//      is semibold where the node's is medium;
//   4. days outside the shown month are INVISIBLE (`opacity: 0` in the node);
//      the DS picker dims them to 40%;
//   5. the DS picker has no RANGE at all — the band under the days is entirely
//      the nodes' own (see `dialogCalendarDayBand*` in the scss).
// The grid is still the DS's own `buildMonthGrid` — 6 rows, Monday first — so
// the calendar's height never changes from month to month.

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
  // the band would end. NOT IN THE NODE (a static frame cannot draw a hover),
  // but picking a range blind is guesswork. FLAGGED.
  const [hovered, setHovered] = useState<string | null>(null);
  const goToMonth = (delta: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  // JUMP TO TODAY (Figma nodes 13973-32477 / 13973-32495). It appears only once
  // today is in NONE of the shown months, and its icon points the way back:
  // today AHEAD of them → `arrow-turn-right`, BEHIND them → `arrow-turn-left`.
  // First of the three buttons, so the two month arrows keep their place at the
  // right edge. Jumping puts today in the FIRST month.
  // (The range nodes do not draw it — they were cut before it existed — so this
  // is the single-selection rule carried over. FLAGGED.)
  const monthsAfterLast = monthIndex(todayDate) - (monthIndex(month) + monthCount - 1);
  const monthsBeforeFirst = monthIndex(todayDate) - monthIndex(month);
  const jumpDirection = monthsAfterLast > 0 ? "forward" : monthsBeforeFirst < 0 ? "back" : null;

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

  // The band's two ends. With only `from` picked the hovered day stands in for
  // `to`, so the band follows the pointer. ISO strings compare like dates.
  const bandFrom = range?.from ?? null;
  const bandTo = range?.to ?? (bandFrom != null && hovered != null && hovered > bandFrom ? hovered : null);

  const months = Array.from({ length: monthCount }, (_, i) => new Date(month.getFullYear(), month.getMonth() + i, 1));

  return (
    <div className={styles.dialogCalendar} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className={styles.dialogCalendarMonths}>
        {months.map((shown, index) => {
          // The controls live on the LAST month only, so with two of them the
          // arrows sit at the far right and move the pair together.
          const withNav = index === monthCount - 1;
          const grid = buildMonthGrid(shown);
          const rows: Date[][] = [];
          for (let i = 0; i < 42; i += 7) rows.push(grid.slice(i, i + 7));

          return (
            <div key={monthIndex(shown)} className={styles.dialogCalendarMonth}>
              <div className={styles.dialogCalendarHeader}>
                <div className={styles.dialogCalendarTitle}>{formatMonthTitle(shown)}</div>
                {withNav && jumpDirection != null && (
                  <HoverTooltip text="Jump to today">
                    <IconButton
                      aria-label="Jump to today"
                      icon={jumpDirection === "forward" ? "arrow-turn-right" : "arrow-turn-left"}
                      variant="ghost"
                      size="lg"
                      onClick={() => onMonthChange(firstOfMonth(todayDate))}
                    />
                  </HoverTooltip>
                )}
                {withNav && (
                  <>
                    <IconButton
                      aria-label="Previous month"
                      icon="angle-left"
                      variant="ghost"
                      size="lg"
                      onClick={() => goToMonth(-1)}
                    />
                    <IconButton
                      aria-label="Next month"
                      icon="angle-right"
                      variant="ghost"
                      size="lg"
                      onClick={() => goToMonth(1)}
                    />
                  </>
                )}
              </div>

              <div className={styles.dialogCalendarBlock}>
                <div className={styles.dialogCalendarWeekdays}>
                  {WEEKDAYS.map((weekday) => (
                    <div key={weekday} className={styles.dialogCalendarWeekday}>
                      {weekday}
                    </div>
                  ))}
                </div>

                <div className={styles.dialogCalendarGrid} role="grid" onPointerLeave={() => setHovered(null)}>
                  {rows.map((row, i) => (
                    <div key={i} className={styles.dialogCalendarRow} role="row">
                      {row.map((date) => {
                        // Only this month's days exist here — the rest keep
                        // their cell (the grid must not reflow) but are
                        // invisible and inert.
                        const outside = !isSameMonth(date, shown);
                        const iso = isoOf(date);
                        // An END of the range, or the single mode's one pick:
                        // the DS `selected` pill either way.
                        const isEnd = range != null ? iso === bandFrom || iso === bandTo : isSameDay(date, value);
                        // Inside the band — the two ends included, so the fill
                        // runs unbroken under their pills.
                        const inBand =
                          !outside && bandFrom != null && bandTo != null && iso >= bandFrom && iso <= bandTo;
                        // NOT IN THE NODE — its example month (January 2027)
                        // holds no today, so the node cannot say. Kept the DS
                        // DateButton's own `today` fill (--gray-a3), because a
                        // "Jump to today" button that lands on a month where
                        // today looks like every other day helps nobody.
                        // FLAGGED — say the word and it goes.
                        const isToday = !isEnd && !inBand && isSameDay(date, todayDate);
                        return (
                          <DateButton
                            key={date.getTime()}
                            day={date.getDate()}
                            type={isEnd ? "selected" : isToday ? "today" : "default"}
                            disabled={outside}
                            aria-label={formatFullDate(date)}
                            aria-hidden={outside || undefined}
                            className={clsx(
                              styles.dialogCalendarDay,
                              isEnd && styles.dialogCalendarDaySelected,
                              outside && styles.dialogCalendarDayHidden,
                              inBand && styles.dialogCalendarDayBand,
                              // The band is capped where it really starts and
                              // ends, not at each month's edge: a range that
                              // spans two months runs straight off one grid and
                              // onto the next.
                              inBand && iso === bandFrom && styles.dialogCalendarDayBandStart,
                              inBand && iso === bandTo && styles.dialogCalendarDayBandEnd,
                            )}
                            onPointerEnter={() => setHovered(iso)}
                            onClick={() => onChange(date)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

  // The footer's read-only label: one value, or both ends of the range.
  const formatEnd = (iso: string) =>
    timeframe === "year" ? iso.slice(0, 4) : timeframe === "month" ? formatMonthValue(iso) : formatFooterDate(dateOf(iso)!);
  const footerLabel =
    range && draft.from != null && draft.to != null
      ? `${formatEnd(draft.from)} — ${formatEnd(draft.to)}`
      : !range && draft.from != null
        ? formatEnd(draft.from)
        : null;

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
        <PopoverFooter
          // The left slot SHOWS the picked date. NOT a Button — plain text with
          // a calendar icon 8px in front of it (Daniel, 2026-08-23; node
          // 13979-35697 draws a 20px-tall icon + text with no box around it).
          // With nothing picked it is not there at all.
          leadingButton={
            footerLabel != null ? (
              <span className={styles.customFooterValue}>
                <Icon icon="calendar" size={14} container="square" />
                {footerLabel}
              </span>
            ) : undefined
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
            <Chip key={option.id} size="lg" active={timeframe === option.id} onClick={() => setTimeframe(option.id)}>
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
            <Chip key={choice} size="lg" active={draft.compare === choice} onClick={() => setCompare(choice)}>
              {/* "on" a day, "in" a month or a year — the only measure whose
                  wording follows the timeframe (nodes 13979-34143 / 13979-35147). */}
              {dateCompareLabel(choice, timeframe)}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* SELECTION — the chosen timeframe's own content. NO top padding: the
          Condition block above always closes with its own 16. */}
      <div className={styles.dateCustomSelection}>
        {timeframe !== "day" ? (
          // MONTH and YEAR have no date fields and no calendar — the period
          // list IS the control (nodes 13962-14374 / 13965-29278).
          <PeriodList
            timeframe={timeframe}
            from={draft.from}
            to={draft.to}
            range={range}
            onPick={pickIso}
            today={todayDate}
          />
        ) : (
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
        )}
      </div>
    </Dialog>
  );
}

// ---- the duration filter's "Custom..." dialog ------------------------------

// The modal behind the duration list's "Custom..." row (Figma nodes 13983-37497
// desktop / 13983-37308 mobile, and 13983-38053 / 13983-37755 for `within`). The
// DS `Dialog`, titled with the filter's own name, holding two blocks:
//
//   CONDITION (a 16px row) — a `ChipGroup` of `lg` Chips: over / under / is /
//     within. This is the ONE place `within` can be chosen, because it is the
//     only place that can collect a second value. (The node labels the first two
//     "greater" / "less"; see the copy note on DurationCompare.)
//   CONTENT (16px sides and bottom, none on top — the Condition block closes
//     with its own 16 — and 16px between items):
//     - one `Input` labelled "Duration", or, in `within`, two stacked Inputs
//       labelled "Duration from" and "Duration until";
//     - each is the DS `InputGroup` in its TextField + SelectField shape: hours
//       typed with an "hr" suffix, minutes picked from a list with a "min" one.
//   the FOOTER: the value being built on the left (an hourglass + the text), and
//     "Apply" on the right.
//
// There is NO Divider between the two blocks — the date dialog has one under its
// Timeframe row, this one draws none.
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
    ? { hours: "", minutes: "00" }
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
            // keyboard follows.
            onChange={(e) => onChange({ ...value, hours: e.target.value.replace(/\D/g, "").slice(0, 3) })}
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

  // Apply stays disabled until there is something to apply: one length, or BOTH
  // ends of a range — and the second end has to be the LONGER one, or the range
  // is empty and the filter would silently match nothing. INVENTED, flagged: the
  // nodes draw no error state for a backwards range.
  const ready = within ? fromMinutes != null && toMinutes != null && toMinutes > fromMinutes : fromMinutes != null;

  // The footer's read-only label: one value, or both ends of the range.
  const footerLabel = within
    ? fromMinutes != null && toMinutes != null
      ? `${formatDurationFooter(fromMinutes)} — ${formatDurationFooter(toMinutes)}`
      : null
    : fromMinutes != null
      ? formatDurationFooter(fromMinutes)
      : null;

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
        <PopoverFooter
          // The left slot SHOWS the value being built — plain text with an
          // hourglass 8px in front of it, not a Button (node 13983-38223). With
          // nothing filled in it is not there at all.
          leadingButton={
            footerLabel != null ? (
              <span className={styles.customFooterValue}>
                <Icon icon="hourglass" size={14} container="square" />
                {footerLabel}
              </span>
            ) : undefined
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
            <Chip key={choice} size="lg" active={compare === choice} onClick={() => setCompare(choice)}>
              {choice}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* CONTENT — one field row, or two when the condition needs both ends.
          Leaving `within` keeps whatever was typed into the second row, so a
          slip on the chips costs nothing; only Apply reads it. */}
      <div className={styles.durationCustomContent}>
        {within ? (
          <>
            <DurationInput label="Duration from" value={from} onChange={setFrom} pop={fromPop} mobile={mobile} />
            <DurationInput label="Duration until" value={to} onChange={setTo} pop={toPop} mobile={mobile} />
          </>
        ) : (
          <DurationInput label="Duration" value={from} onChange={setFrom} pop={fromPop} mobile={mobile} />
        )}
      </div>
    </Dialog>
  );
}

// ---- the Address dialog ----------------------------------------------------

// The ADDRESS filter's whole interface (Figma nodes 13988-53606 desktop /
// 13988-53696 mobile). Unlike every other filter this one never opens a list —
// there is nothing to list — so the row in the Filters menu opens this straight
// away, and so does the chip's value segment.
//
// The DS `Dialog`, titled with the filter's name, holding five `Input`s at 24px
// apart inside 16px padding, each labelled "(optional)" because any one of them
// on its own is a real question. The only difference between the breakpoints is
// the last row: DESKTOP puts State / Province and Postal code side by side
// (280px each inside the 608px card), MOBILE stacks all five.
//
// The footer is a plain Cancel / Apply pair — not the value-preview footer the
// date and duration dialogs use, because the value is already legible in the
// fields above it.
//
// Everything is a DRAFT until Apply, the same contract the other two dialogs
// have, so an unfinished edit never touches the chip.
interface AddressCustomProps {
  def: FilterDef;
  value: FilterValue;
  onApply: (address: AddressValue) => void;
  onClose: () => void;
  open: boolean;
  breakpoint: "desktop" | "mobile";
}

function AddressCustom({ def, value, onApply, onClose, open, breakpoint }: AddressCustomProps) {
  const [draft, setDraft] = useState<AddressValue>(() => value.address ?? emptyAddress());

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
              onApply(draft);
              onClose();
            }}
          >
            Apply
          </Button>
        </PopoverFooter>
      }
    >
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
        // `negated` is KEPT: an address's condition is the ordinary
        // contains / does not contain pair, set from the chip, and re-opening
        // the dialog to fix a typo must not quietly flip it back.
        onApply={(address) => onApply({ ...instance, address })}
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

  const chips = !fromChip && def.hideConditionChips !== true;

  // The card hugs the WIDER of its two contents — the option rows and the
  // header's condition chips — with the DS card's own 384px as the ceiling and
  // `listWidth`'s 240px as the floor. Without the chips in the sum, Labels'
  // four conditions stacked into four lines inside a 240px card.
  const width = chips ? Math.min(SUB_MAX_WIDTH, Math.max(list.width, conditionsWidth(instance))) : list.width;

  // The three DESIGNED filters (`dsHeader`) hand the whole header to the DS
  // `SelectListHeader`, in one of its two variants:
  //   - Assignee and Client: chipGroup + search — 16px around the chips closing
  //     at 8, the real 40px SearchField bar under them, 97px in all (Figma nodes
  //     13923-21709 / 13923-21079 and 13933-10525 / 13933-9967);
  //   - Date received: chipGroup ONLY, `search={false}` — a 16px-padded row of
  //     chips, 65px in all (node 13962-8817). It has no search.
  // Either way the closing Divider is the component's own, and the chips go in
  // bare: the header wraps them in a ChipGroup itself.
  //
  // It is not SelectList's built-in `searchable` — that prop and `header` are
  // mutually exclusive, and this header holds the chips as well — so the query
  // lives here and `filterList` does the filtering.
  const dsHeader =
    def.dsHeader === true && !fromChip ? (
      <SelectListHeader
        chips={chips ? conditionChipList(instance, setCondition) : undefined}
        search={def.searchPlaceholder != null}
        placeholder={def.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
      />
    ) : null;

  // Every filter with no node of its own still draws the prototype-local block:
  // the condition chips in a padded row, closed by a Divider (Figma node
  // 13947-15714) — 6px above the chips (the card adds 10 more) and 16px sides.
  //
  // `medium` on the Divider, not its `low` default: the node draws --gray-a4,
  // the same line the DS SelectListHeader brings with it.
  const header =
    dsHeader ??
    (fromChip || !chips ? undefined : (
      <>
        <div className={clsx(styles.optionHeader, variant === "drawer" && styles.optionHeaderDrawer)}>
          <ConditionChips value={instance} onChange={setCondition} last />
        </div>
        <Divider contrast="medium" />
      </>
    ));

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
      // and the Filters sheet were all missing the line.
      // FLAGGED: Assignee's and Client's mobile nodes (13934-13257 /
      // 13933-9967) still draw the DrawerHeader at 70px — no line — so those
      // two nodes now disagree with the build.
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

// The view bar's tabs (Figma nodes 13888-18217 desktop / 13890-19955 mobile).
// There are TWO levels:
//
//   BRANCH — "Open" and "Closed", the first TabGroup. A branch holds sub-tabs;
//     it applies no filter of its own.
//   TAB — the branch's sub-tabs, the second TabGroup: "All" plus one tab per
//     job status group. Every tab EXCEPT "All" applies a LOCKED Status filter.
//
// The Closed branch (All / Finalized / Cancelled) is DRAWN but NOT BUILT
// (Daniel, 2026-08-18: "doesn't build Closed tab for now"). It is in the data
// below because the mobile tab list draws both groups; clicking it does
// nothing. FLAGGED — say when it should work and it is one line (the statuses
// are already here).
//
// The locked filter is NOT part of the user's FilterSelection: the user cannot
// change or remove it, so it never becomes an editable chip. It lives in the
// tab state and is applied on top of the user's filters (AND), and the filter
// bar shows it as the first, inert chip.
//
// The statuses are Daniel's mapping (2026-08-18) onto the DS status list, which
// is finer than the production one (`Job.Statuses`, roopairs/apps/jobs/models.py):
//   Pending     = Draft + Unscheduled     (the node's chip reads "2 statuses")
//   Scheduled   = Upcoming + Past due
//   In progress = Active + Quick-paused
//   On hold     = On hold (external) + On hold (internal)
//   Completed   = Completed
// The icons are the node's, and they are NOT all the status badge's own glyph —
// Scheduled uses `calendar-lines` where BadgeJobStatus draws `circle-half-stroke`.
interface ViewTab {
  id: string;
  label: string;
  /** The tab's icon — regular when unselected, solid when selected. */
  icon?: string;
  /** The Status filter this tab locks on. Empty = no filter ("All"). */
  statuses: BadgeJobStatusStatus[];
}

interface TabBranch {
  id: string;
  label: string;
  tabs: ViewTab[];
}

const BRANCHES: TabBranch[] = [
  {
    id: "open",
    label: "Open",
    tabs: [
      { id: "all", label: "All", statuses: [] },
      { id: "pending", label: "Pending", icon: "circle-dashed", statuses: ["draft", "unscheduled"] },
      { id: "scheduled", label: "Scheduled", icon: "calendar-lines", statuses: ["upcoming", "pastDue"] },
      { id: "inProgress", label: "In progress", icon: "circle-play", statuses: ["active", "quickPaused"] },
      { id: "onHold", label: "On hold", icon: "circle-stop", statuses: ["onHoldExternal", "onHoldInternal"] },
      { id: "completed", label: "Completed", icon: "circle-check", statuses: ["completed"] },
    ],
  },
  {
    // Not built — see the note above.
    id: "closed",
    label: "Closed",
    tabs: [
      { id: "closedAll", label: "All", statuses: [] },
      { id: "finalized", label: "Finalized", icon: "circle-check", statuses: ["finalized"] },
      { id: "cancelled", label: "Cancelled", icon: "circle-xmark", statuses: ["cancelled"] },
    ],
  },
];

const OPEN_BRANCH = BRANCHES[0]!;

/** The tab behind an id — always one of the open branch's, the only built one. */
const tabById = (id: string) => OPEN_BRANCH.tabs.find((t) => t.id === id) ?? OPEN_BRANCH.tabs[0]!;

// No job counts anywhere in this concept (Daniel, 2026-08-18): not on the tabs,
// not on the mobile status picker, not in its list. The other concepts keep a
// `tabCount` helper here for them.

// The tab row scrolls sideways — the two groups do not fit the bar next to the
// buttons. This copies the DS's own scrolling-tabs behaviour from TopBarNav's
// details bar, so nothing here is invented:
//   - the SCROLLER is a WRAPPER, never the TabGroup itself (the sliding
//     underline is positioned inside the tablist, so scrolling the tablist
//     would leave the line behind);
//   - the scrollbar is hidden;
//   - a plain vertical mouse wheel scrolls it horizontally — a native
//     non-passive listener, because React's onWheel is registered passive and
//     cannot preventDefault;
//   - the edge fades show where the row continues.
// Desktop only: the mobile bar has no tab row at all any more.
function TabScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  const measure = () => {
    const el = ref.current;
    if (el == null) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setFade((f) => (f.left === left && f.right === right ? f : { left, right }));
  };

  // No dependency list on purpose (TopBarNav does the same): the row's width
  // changes with the bar's controls, and re-measuring every render is cheap.
  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (el == null) return undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // real horizontal input works natively
      if (el.scrollWidth <= el.clientWidth) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(
        styles.viewTabsScroll,
        fade.left && fade.right && styles.viewTabsFadeBoth,
        fade.left && !fade.right && styles.viewTabsFadeLeft,
        !fade.left && fade.right && styles.viewTabsFadeRight,
      )}
      onScroll={measure}
    >
      {children}
    </div>
  );
}

// ---- the mobile status picker ----------------------------------------------

// MOBILE has no tab row (Figma node 13897-21018). The control that replaces it
// is NOT a Button (Daniel, 2026-08-18): it is a plain row — the tab's name, 8px,
// `angles-up-down` — with no icon, no COUNT, no padding, no fill and no radius,
// all in --gray-12. So it is built here, in the prototype, and flagged as
// prototype-local: no DS component draws this.
//
// It follows the DS's interactive-title behaviour (TopBarNavTitle): 75% opacity
// on hover, 50% while the list is open — which is exactly what the node draws
// (its status row is at 50% with the list showing).
//
// The list below it (node 13897-21030) is ONE flat group of the CURRENT branch's
// tabs — LABELS ONLY: no group labels, no icons, no counts, no second branch
// (the branch is chosen in the top bar). It is a body portal, and the INLINE
// variant on mobile too: the node draws a card, not a drawer, the same call
// TopBarNavTitle's `subPages` makes.

// The row's chrome around its label: 4px group padding each side, 12px left
// padding, then the 12px gap to the 16px check and the row's 12px right padding.
const TAB_ITEM_CHROME = 60;
/** The node's list width — the floor, so short labels still match the design. */
const TAB_LIST_MIN_WIDTH = 137;

function StatusPicker({ tab, onTabChange }: { tab: string; onTabChange: (next: string) => void }) {
  const card = useAnchoredCard("left");
  const current = tabById(tab);

  const tabs = OPEN_BRANCH.tabs;
  const width = Math.round(
    Math.max(
      TAB_LIST_MIN_WIDTH,
      tabs.reduce((max, t) => Math.max(max, textWidth(t.label)), 0) + TAB_ITEM_CHROME,
    ),
  );

  return (
    <div ref={card.anchorRef} className={styles.statusPickerWrap}>
      <button
        type="button"
        className={clsx(styles.statusPicker, card.open && styles.statusPickerOpen)}
        onClick={() => card.setOpen(!card.open)}
      >
        <span>{current.label}</span>
        <Icon
          icon="angles-up-down"
          pack="regular"
          size={14}
          container="square"
          className={styles.statusPickerChevron}
        />
      </button>
      {card.pos != null &&
        createPortal(
          <div ref={card.cardRef} className={styles.filtersSub} style={card.pos}>
            {/* `breakpoint="desktop"` is what keeps this a CARD on a phone:
                SelectList falls back to its drawer for `inline` on mobile, and
                the node draws a card. It is the same call TopBarNavTitle makes
                for its sub-pages list. */}
            <SelectList
              variant="inline"
              breakpoint="desktop"
              open={card.open}
              onClose={() => card.setOpen(false)}
              style={{ width, minWidth: width, maxWidth: width }}
            >
              <SelectListItemGroup>
                {tabs.map((item) => (
                  <SelectListItem
                    key={item.id}
                    label={item.label}
                    select="single"
                    selected={item.id === tab}
                    onClick={() => {
                      onTabChange(item.id);
                      card.setOpen(false);
                    }}
                  />
                ))}
              </SelectListItemGroup>
            </SelectList>
          </div>,
          document.body,
        )}
    </div>
  );
}

// The mobile Filters control. With no filters applied it is the plain 36px
// IconButton; with some, it grows into a pill holding the bars-filter icon and
// a `Counter` with how many are on (Figma node 13889-19259 — Daniel, 2026-08-18).
// That pill is the DS ghost lg Button with the node's 10px side padding, which
// is Button `md`'s padding at `lg`'s height — the one local override here.
function FiltersControl({ count, open, onOpen }: { count: number; open: boolean; onOpen: () => void }) {
  if (count === 0) {
    return (
      <IconButton
        icon="bars-filter"
        variant="ghost"
        size="lg"
        aria-label="Filters"
        isPressed={open}
        onClick={onOpen}
      />
    );
  }
  return (
    <Button
      className={styles.filtersCountButton}
      variant="ghost"
      size="lg"
      leftIcon="bars-filter"
      aria-label="Filters"
      isPressed={open}
      onClick={onOpen}
    >
      <Counter value={count} />
    </Button>
  );
}

// ---- the view bar ----------------------------------------------------------

// ViewBar — two formats, both 60px:
//
//   DESKTOP (Figma node 13888-18217): 16px side padding. On the left the two tab
//   groups — [Open · Closed], a 24px-tall vertical Divider, then the open
//   branch's status tabs, 24px apart — the branch group moved to the TOP BAR.
//   On the right three ghost lg Buttons, 8px apart: "Search", "Filters" and
//   "View".
//   MOBILE (Figma node 13893-20294): the same 16px padding, the StatusPicker on
//   the left and three controls on the right: search, Filters (with its count)
//   and View.
//
// Both formats carry a 1px --gray-a4 line along the bar's BOTTOM EDGE — an inner
// stroke on the bar itself, not a Divider below it. It stays even with the filter
// bar below, which the node draws that way too.
//
// Wired: the tabs, and Filters on both breakpoints. Display only: Search and
// View.
interface ViewBarProps {
  mobile?: boolean;
  tab: string;
  onTabChange: (next: string) => void;
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
}

const ViewBar = ({ mobile = false, tab, onTabChange, selection, onSelectionChange }: ViewBarProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = useFilterSearch(filtersOpen);
  // MOBILE: tapping a filter row opens its options as a SECOND drawer on top of
  // the Filters one (Figma node 13855-23306 — the list draws its own scrim). NO
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

  // The MOBILE Filters counter counts the tab's locked Status filter as well
  // (Daniel, 2026-08-18): on every tab but "All" a filter IS applied, and mobile
  // has no filter bar to show it. So "Pending" with nothing else on reads 1.
  const activeCount = activeFilterCount(selection) + (tabById(tab).statuses.length > 0 ? 1 : 0);

  return (
    <div className={styles.viewBar}>
      {mobile ? (
        <StatusPicker tab={tab} onTabChange={onTabChange} />
      ) : (
        <TabScroller>
          <TabGroup
            className={styles.statusTabs}
            variant="default"
            size="lg"
            value={tab}
            onChange={onTabChange}
            aria-label="Job status"
          >
            {/* Labels only in this concept (Daniel, 2026-08-18): no icons, and
                no counts either — Figma node 13889-19496. */}
            {OPEN_BRANCH.tabs.map((item) => (
              <TabItem key={item.id} value={item.id}>
                {item.label}
              </TabItem>
            ))}
          </TabGroup>
        </TabScroller>
      )}
      <div className={styles.viewControls}>
        {mobile ? (
          <>
            <IconButton icon="search" variant="ghost" size="lg" aria-label="Keyword search" onClick={noop} />
            <FiltersControl count={activeCount} open={filtersOpen} onOpen={() => setFiltersOpen(true)} />
            <IconButton icon="sliders" variant="ghost" size="lg" aria-label="View" onClick={noop} />
            {/* The drawer portals out to the device frame's drawer root, so it
                does not matter that it is written inside this flex row. */}
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
              {showApplied && <AppliedFilters selection={selection} onSelectionChange={onSelectionChange} />}
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
        ) : (
          <>
            <Button variant="ghost" size="lg" leftIcon="search" onClick={noop}>
              Search
            </Button>
            <FiltersButton selection={selection} onSelectionChange={onSelectionChange} />
            <Button variant="ghost" size="lg" leftIcon="sliders" onClick={noop}>
              View
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// ---- anchored cards --------------------------------------------------------

type CardAlign = "left" | "right";

// One anchored body portal, shared by everything in this concept that opens next
// to something: the Filters menu (from the view bar's button and from the filter
// bar's plus), and a chip's condition menu and value list. It is a body portal
// because a card anchored inside the bars would be clipped by their overflow;
// `position: fixed` from the trigger's rect, re-measured on scroll and resize.
function useAnchoredCard(align: CardAlign = "left", ignoreSelector?: string) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
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
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
}

function FiltersMenuCard({ card, selection, onSelectionChange }: FiltersMenuCardProps) {
  const { open, setOpen, cardRef, pos } = card;
  const filters = useFilterSearch(open);

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

// The view bar's "Filters" button. The card opens 4px BELOW it and RIGHT-aligned
// with it (Daniel, 2026-08-17). The node (13857-25352) draws it left-aligned, but
// the real button sits near the right screen edge, where a left-aligned card
// runs off it — FLAGGED: the node was drawn with the button standing alone in
// the middle of the canvas.
//
// NO counter on desktop (Daniel, 2026-08-17) — the filter bar below shows the
// applied filters, so a number here would repeat what is already on screen.
// The button carries a --gray-a4 fill while the card is open, which is Button
// `ghost`'s own press fill, so `isPressed` holds that look for as long as the
// menu shows (the same pattern as the sidebar's Create row).
interface FilterTriggerProps {
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
}

function FiltersButton({ selection, onSelectionChange }: FilterTriggerProps) {
  const card = useAnchoredCard("right", "[data-concept-filters-sub]");
  return (
    <div ref={card.anchorRef}>
      <Button
        variant="ghost"
        size="lg"
        leftIcon="bars-filter"
        isPressed={card.open}
        onClick={() => card.setOpen(!card.open)}
      >
        Filters
      </Button>
      <FiltersMenuCard card={card} selection={selection} onSelectionChange={onSelectionChange} />
    </div>
  );
}

// The filter bar's "plus" — the same menu, opened LEFT-aligned under the button
// because it sits at the left of the bar (Daniel, 2026-08-17).
function AddFilterButton({ selection, onSelectionChange }: FilterTriggerProps) {
  const card = useAnchoredCard("left", "[data-concept-filters-sub]");
  return (
    <div ref={card.anchorRef}>
      {/* md, not lg — it lines up with the 32px chips (Daniel, 2026-08-17). */}
      <IconButton
        icon="plus"
        variant="ghost"
        size="md"
        aria-label="Add filter"
        isPressed={card.open}
        onClick={() => card.setOpen(!card.open)}
      />
      <FiltersMenuCard card={card} selection={selection} onSelectionChange={onSelectionChange} />
    </div>
  );
}

// ---- the filter bar --------------------------------------------------------

// FilterBar — Figma node 13889-19170. NO fill any more (Daniel, 2026-08-18):
// 14px above and below the chips, 16px sides, 16px between the chips block and
// the button on the right, and a medium Divider under the whole bar. The chips
// wrap, 10px apart, and the "plus" that adds another filter is the last item in
// that same wrapping row.
//
// The bar exists while the tab locks a Status filter OR the user has applied at
// least one filter of their own — so on the "All" tab with nothing applied there
// is no bar at all.
//
// The button on the right appears as soon as the user has added a filter of
// their own, and its copy depends on the tab (Daniel, 2026-08-18):
//   - "All", which locks nothing: "Clear all", no icon (Figma node 13911-11708).
//     Everything in the bar goes with it.
//   - every other tab: "Reset" with `arrows-rotate-reverse` (node 13911-11776).
//     It clears the user's filters and leaves the tab's locked Status chip, so
//     the view returns to its default rather than to nothing.
// With only the locked chip in the bar there is no button at all — there is
// nothing of the user's to clear. FLAGGED: the node's copy is "Clear all", not
// the "Clear" you wrote.
//
// FLAGGED to Daniel: DESKTOP only. The node is the desktop screen, and the mobile
// Filters button carries a counter instead — which is only worth having if the
// chips are not on screen. But the file does hold mobile condition/value drawers
// (nodes 13874-8307 / 13874-8586), so the chips presumably live somewhere on
// mobile too. Say where and it is one line to switch on.
interface FilterBarProps {
  /** The statuses the current tab locks — the first, inert chip. */
  lockedStatuses: BadgeJobStatusStatus[];
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
}

const FilterBar = ({ lockedStatuses, selection, onSelectionChange }: FilterBarProps) => {
  const chips = activeFilters(FILTERS, selection);
  if (chips.length === 0 && lockedStatuses.length === 0) return null;

  return (
    <>
      <div className={styles.filterBar}>
        <div className={styles.filterBarItems}>
          {lockedStatuses.length > 0 && <LockedStatusChip statuses={lockedStatuses} />}
          {/* One chip per APPLICATION, in the order they were added — two
              "Assignee" chips can stand side by side. */}
          {chips.map(({ def, instance }) => (
            <FilterChip
              key={instance.key}
              def={def}
              instance={instance}
              selection={selection}
              onSelectionChange={onSelectionChange}
            />
          ))}
          <AddFilterButton selection={selection} onSelectionChange={onSelectionChange} />
        </div>
        {chips.length > 0 &&
          (lockedStatuses.length === 0 ? (
            <Button variant="ghost" size="md" onClick={() => onSelectionChange([])}>
              Clear all
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="md"
              leftIcon="arrows-rotate-reverse"
              onClick={() => onSelectionChange([])}
            >
              Reset
            </Button>
          ))}
      </div>
      <Divider contrast="medium" />
    </>
  );
};

// ---- the tab's locked chip -------------------------------------------------

// The Status chip a tab applies (Figma node 13889-19207). The SAME surface as a
// normal chip, but only THREE segments — name, condition, value — and no remove
// button: the user cannot change or remove what the tab locks.
//
// The VALUE segment is the one target (Daniel, 2026-08-18): clicking it opens
// the same option list as a normal chip, so the user can SEE which statuses are
// on and which are not — but every row is DISABLED, so nothing can be ticked.
//
// The condition reads "is" even when the tab locks two statuses ("Status is 2
// statuses" in the node). A user chip would say "is any of" there — FLAGGED, the
// node's copy is what this builds.
const STATUS_FILTER = FILTERS.find((def) => def.id === "status")!;

// The read-only option list: every status, the tab's ones ticked, all disabled.
// It reuses `filterList`'s own width, so the locked list and the editable one
// are exactly the same size.
function lockedStatusList(statuses: BadgeJobStatusStatus[]) {
  const counts = optionCounts(JOBS, STATUS_FILTER);
  const items = (
    <SelectListItemGroup>
      {STATUS_FILTER.options.map((option) => (
        <SelectListItem
          key={option.id}
          label={option.label}
          select="multi"
          selected={statuses.includes(option.id as BadgeJobStatusStatus)}
          disabled
          slotLeft={option.slotLeft}
          tag={countLabel(counts[option.id] ?? 0)}
        />
      ))}
    </SelectListItemGroup>
  );
  // Measured against an empty application, so the width never depends on what
  // the tab happens to lock.
  return { items, width: filterList(STATUS_FILTER, newFilterInstance(STATUS_FILTER), noop).width };
}

const LockedStatusChip = ({ statuses }: { statuses: BadgeJobStatusStatus[] }) => {
  const valueCard = useAnchoredCard("left");
  const shown = valueDisplay(STATUS_FILTER, { ids: statuses, negated: false });
  const list = lockedStatusList(statuses);

  return (
    <div className={clsx(styles.chip, styles.chipLocked)}>
      <span className={styles.chipSegment}>
        <Icon
          icon={STATUS_FILTER.icon}
          pack={STATUS_FILTER.pack}
          rotate={STATUS_FILTER.rotate}
          size={14}
          container="square"
        />
        {STATUS_FILTER.label}
      </span>
      <span className={styles.chipDivider} />
      <span className={styles.chipSegment}>is</span>
      <span className={styles.chipDivider} />
      {/* Capped and truncating like every other chip's value segment. A locked
          status reads "2 statuses" at its longest, so it never reaches 240 —
          the rule is here so the two chips cannot drift apart. */}
      <div ref={valueCard.anchorRef} className={clsx(styles.chipAnchor, styles.chipValue)}>
        <button
          type="button"
          className={clsx(styles.chipSegment, styles.chipButton, valueCard.open && styles.chipButtonOpen)}
          onClick={() => valueCard.setOpen(!valueCard.open)}
        >
          {shown.slotLeft}
          <span className={styles.chipValueLabel}>{shown.label}</span>
        </button>
        {valueCard.pos != null &&
          createPortal(
            <div ref={valueCard.cardRef} className={styles.filtersSub} style={valueCard.pos}>
              <SelectList
                variant="inline"
                open={valueCard.open}
                onClose={() => valueCard.setOpen(false)}
                multiSelect
                style={{ width: list.width, minWidth: list.width, maxWidth: list.width }}
              >
                {list.items}
              </SelectList>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
};

// ---- one filter chip -------------------------------------------------------

// The chip is FOUR segments on one 36px surface, divided by 1px --gray-a3 lines
// (Figma node 13857-26698): the filter's icon + name, the condition, the value,
// and a 36px square remove button. The surface is --surface-interactive-default
// with the xs/down shadow and a 6px radius — Button `subtle`'s look.
//
// PROTOTYPE-LOCAL, and flagged as such: it is not a DS component. It cannot be
// one Button (three of its four segments are separate targets sharing a single
// surface, with no gaps), and it is not in the DS yet. Only the NAME segment is
// inert — Daniel: "3 parts are clickable — condition, value and remove".
interface FilterChipProps {
  def: FilterDef;
  /** The application this chip stands for. */
  instance: FilterInstance;
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
  /**
   * The chip inside the mobile Filters sheet (Figma node 13932-9592). Bigger on
   * purpose — 36px tall, 12px inside each segment, a 36px remove square — and it
   * fills the row, so the value segment stretches and truncates. Its condition
   * and value open DRAWERS instead of cards anchored to the chip.
   */
  mobile?: boolean;
}

const FilterChip = ({ def, instance, selection, onSelectionChange, mobile = false }: FilterChipProps) => {
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
    <div className={clsx(styles.chip, mobile && styles.chipMobile)}>
      {/* The filter's name — not a target. */}
      <span className={styles.chipSegment}>
        <Icon icon={def.icon} pack={def.pack} rotate={def.rotate} size={14} container="square" />
        {def.label}
      </span>

      <span className={styles.chipDivider} />

      {/* The condition — "is" / "is not" / "is any of" (nodes 13861-1837 and
          13870-7296), whose two choices depend on how many values are picked.
          On MOBILE the same rows arrive as a drawer instead (nodes 13902-21573
          and, for a duration, 13874-10423) — there is no room beside a
          full-width chip.

          A value with only ONE choice — a date range, a `within` duration —
          is plain text like the filter's name: nothing to open. */}
      {fixedCondition ? (
        <span className={styles.chipSegment}>{conditionLabel(instance)}</span>
      ) : (
      <div ref={conditionCard.anchorRef} className={styles.chipAnchor}>
        <button
          type="button"
          className={clsx(styles.chipSegment, styles.chipButton, conditionCard.open && styles.chipButtonOpen)}
          onClick={() => conditionCard.setOpen(!conditionCard.open)}
        >
          {conditionLabel(instance)}
        </button>
        {mobile
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
            )}
      </div>
      )}

      <span className={styles.chipDivider} />

      {/* The value — one option with its icon, or "N priorities". Clicking it
          opens the SAME options the Filters menu shows (Daniel, 2026-08-17),
          minus the condition chips: this list's header is the search alone
          (Figma nodes 13912-13977 / 13911-10955).
          A date chip whose value is already CUSTOM skips the list and opens the
          Custom popover straight away (Figma node 13914-15128) — the list would
          only offer presets, which is not what that chip holds. */}
      {/* The value segment is capped at --size-60 (240px) and truncates there,
          on both breakpoints (Daniel, 2026-08-24) — see `.chipValue`. */}
      <div ref={valueCard.anchorRef} className={clsx(styles.chipAnchor, styles.chipValue)}>
        <button
          type="button"
          className={clsx(styles.chipSegment, styles.chipButton, valueCard.open && styles.chipButtonOpen)}
          onClick={() => {
            setCustomOpen(false);
            valueCard.setOpen(!valueCard.open);
          }}
        >
          {shown.slotLeft}
          <span className={styles.chipValueLabel}>{shown.label}</span>
        </button>
        {/* MOBILE: the options arrive as the same drawer the Filters sheet uses
            (node 13923-22399) — a draft plus an Apply footer — with no condition
            chips, since the chip's own segment holds the condition. */}
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
                style={listWidth(list.width)}
              >
                {list.items}
              </SelectList>
            </div>,
            document.body,
          )}
        {/* The Custom DIALOG — a centred modal (nodes 13962-8889 / 13962-8893
            for a date, 13983-37497 for a duration), so it needs no anchor: it
            opens the same way whether the chip's VALUE segment held a custom
            value already (`isCustomValue`) or the list's "Custom..." row was
            picked. */}
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
      </div>

      <span className={styles.chipDivider} />

      {/* Remove — a 32px square with the tooltip the node shows above it.
          HoverTooltip wraps its child in an inline-flex span, so that span needs
          the stretch too: without it the span hugged the 16px glyph and the
          button's hit area was 32x16 instead of 32x32. */}
      <HoverTooltip text="Remove" className={styles.chipAnchor}>
        <button
          type="button"
          className={clsx(styles.chipSegment, styles.chipButton, styles.chipRemove)}
          aria-label={`Remove ${def.label} filter`}
          onClick={remove}
        >
          <Icon icon="xmark" pack="regular" size={14} />
        </button>
      </HoverTooltip>
    </div>
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
  labels: 240,
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

const JobsTable = ({ jobs }: { jobs: Job[] }) => (
  <Table
    className={styles.jobsTable}
    header={
      <TableRow variant="header">
        <CellHeader label="ID" width={COLUMNS.id} isPinned isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader label="Service" width={COLUMNS.service} isPinned isLastPinned isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader label="Status" width={COLUMNS.status} isSortable dataType="other" onClick={noop} />
        <CellHeader label="Labels" width={COLUMNS.labels} />
        <CellHeader label="Type" width={COLUMNS.type} />
        <CellHeader label="Priority" width={COLUMNS.priority} isSortable dataType="other" onClick={noop} />
        <CellHeader label="Source" width={COLUMNS.source} isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader label="Source ID" width={COLUMNS.sourceId} isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader label="Assignees" width={COLUMNS.techs} />
        <CellHeader label="Date Received" width={COLUMNS.received} isSortable dataType="timing" onClick={noop} />
        <CellHeader label="Client" width={COLUMNS.client} isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader label="Location Name" width={COLUMNS.locationName} isSortable dataType="alphabetical" onClick={noop} />
        <CellHeader label="Location Address" width={COLUMNS.locationAddress} isSortable dataType="alphabetical" onClick={noop} />
        {/* The view is sorted by Scheduled For, ascending. */}
        <CellHeader label="Scheduled For" width={COLUMNS.scheduledFor} isSortable dataType="timing" sortOrder="ascending" onClick={noop} />
        <CellHeader label="Duration" width={COLUMNS.duration} isSortable dataType="numerical" onClick={noop} />
        <CellHeader label="Status Changed" width={COLUMNS.statusChanged} />
        <CellHeader label="Last Modified" width={COLUMNS.lastModified} isSortable dataType="timing" onClick={noop} />
      </TableRow>
    }
  >
    {jobs.map((job) => (
      <TableRow key={job.id} isClickable onClick={noop}>
        <CellBody width={COLUMNS.id} isTabular>
          {job.id}
        </CellBody>
        <CellBody width={COLUMNS.service} isLastPinned>
          {serviceOf(job).name}
        </CellBody>
        <CellBody width={COLUMNS.status} content="badge">
          <BadgeJobStatus status={job.status} />
        </CellBody>
        <CellBody width={COLUMNS.labels} content="badge">
          {labelsOf(job).map((label) => (
            <Badge key={label.id}>{label.name}</Badge>
          ))}
        </CellBody>
        <CellBody width={COLUMNS.type} slotLeft={typeIcon(job.type)}>
          {job.type === "recall" ? "Recall" : "New"}
        </CellBody>
        <CellBody width={COLUMNS.priority} slotLeft={priorityIcon(job.priority)}>
          {priorityOf(job.priority).label}
        </CellBody>
        <CellBody width={COLUMNS.source}>{sourceOf(job).name}</CellBody>
        <CellBody width={COLUMNS.sourceId} isTabular>
          {job.sourceRef ?? ""}
        </CellBody>
        <CellBody width={COLUMNS.techs} content="assignee">
          {job.assigneeIds.length > 0 ? (
            <AvatarGroup
              size="md"
              items={assigneesOf(job).map((tech) => ({ content: "image", imageSrc: tech.avatar, name: tech.name }))}
            />
          ) : undefined}
        </CellBody>
        <CellBody width={COLUMNS.received} isTabular>
          {formatDay(job.receivedAt)}
        </CellBody>
        <CellBody width={COLUMNS.client}>{clientOf(job).name}</CellBody>
        {/* Both are OPTIONAL now (2026-08-24): a location may have no name of
            its own, or no address. An empty string is what makes CellBody draw
            its own "—" placeholder. */}
        <CellBody width={COLUMNS.locationName}>{locationOf(job).name ?? ""}</CellBody>
        <CellBody width={COLUMNS.locationAddress}>{locationAddress(locationOf(job))}</CellBody>
        {/* A past-due job's scheduled time reads as an error. */}
        <CellBody
          width={COLUMNS.scheduledFor}
          isTabular
          colorScheme={job.status === "pastDue" ? "error" : "default"}
        >
          {formatDateTime(job.scheduledFor)}
        </CellBody>
        <CellBody width={COLUMNS.duration}>{formatDuration(job.durationMinutes)}</CellBody>
        <CellBody width={COLUMNS.statusChanged} isTabular>
          {formatDay(job.statusChangedAt)}
        </CellBody>
        <CellBody width={COLUMNS.lastModified} isTabular>
          {formatDay(job.lastModifiedAt)}
        </CellBody>
      </TableRow>
    ))}
  </Table>
);

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
  tab: string;
  onTabChange: (next: string) => void;
  /** The current tab's locked Status filter — the filter bar's first chip. */
  lockedStatuses: BadgeJobStatusStatus[];
  selection: FilterSelection;
  onSelectionChange: (next: FilterSelection) => void;
}

const DesktopShell = ({ jobs, tab, onTabChange, lockedStatuses, selection, onSelectionChange }: ShellProps) => (
  <div className={styles.desktop}>
    <Sidebar />
    <div className={styles.workArea}>
      <TopBar />
      <ViewBar tab={tab} onTabChange={onTabChange} selection={selection} onSelectionChange={onSelectionChange} />
      {/* Only rendered while the tab locks a status or something is applied. */}
      <FilterBar
        lockedStatuses={lockedStatuses}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      {/* The Table is its own scroll container (that is what lets its header
          stick), so it replaces the page ScrollArea rather than nesting in one. */}
      <div className={styles.mainArea}>
        {jobs.length > 0 ? <JobsTable jobs={jobs} /> : <NoResults onClear={() => onSelectionChange([])} />}
      </div>
    </div>
  </div>
);

// No filter bar on mobile (the node has none): the tab Button shows the tab and
// the Filters button shows how many of the user's filters are on.
const MobileShell = ({ jobs, tab, onTabChange, selection, onSelectionChange }: ShellProps) => {
  // A drag scrolls the table one way at a time — see useSingleAxisScroll.
  const tableRef = useSingleAxisScroll(true);

  return (
    <div className={styles.mobile}>
      <TopBar mobile />
      <ViewBar
        mobile
        tab={tab}
        onTabChange={onTabChange}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
      <div className={styles.mainArea} ref={tableRef}>
        {jobs.length > 0 ? <JobsTable jobs={jobs} /> : <NoResults onClear={() => onSelectionChange([])} />}
      </div>
      {/* The bar owns its own home-indicator inset, so the shell reserves none. */}
      <BottomBarNav breakpoint="mobile" className={styles.bottomBar}>
        <BottomBarNavItem icon="house" label="Home" />
        <BottomBarNavItem icon={semanticIcons.job} label="Jobs" active />
        <BottomBarNavItem icon="plus" label="Create" strong />
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
  const [tab, setTab] = useState("all");
  // A TAB IS A VIEW (Daniel, 2026-08-18), and a view owns its filters: they are
  // kept per tab and never carried from one to another. Custom views come later
  // and will slot in the same way — a view id with its own set.
  const [selections, setSelections] = useState<Record<string, FilterSelection>>({});
  const selection = selections[tab] ?? EMPTY_SELECTION;
  const setSelection = (next: FilterSelection) =>
    setSelections((current) => ({ ...current, [tab]: next }));

  const lockedStatuses = tabById(tab).statuses;
  const jobs = useMemo(() => {
    const filtered = applyFilters(JOBS, FILTERS, selection);
    if (lockedStatuses.length === 0) return filtered;
    return filtered.filter((job) => lockedStatuses.includes(job.status));
  }, [selection, lockedStatuses]);

  const shellProps = {
    jobs,
    tab,
    onTabChange: setTab,
    lockedStatuses,
    selection,
    onSelectionChange: setSelection,
  };
  return isDesktop ? <DesktopShell {...shellProps} /> : <MobileShell {...shellProps} />;
};

export default Filters;
