import {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import AvatarWarning from "../../components/Avatar/AvatarWarning";
import Button from "../../components/Button/Button";
import Chip from "../../components/Chip/Chip";
import { Divider } from "../../components/Divider/Divider";
import EmptyState from "../../components/EmptyState/EmptyState";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import { Icon } from "../../components/Icon/Icon";
import Menu from "../../components/Menu/Menu";
import MenuHeader from "../../components/Menu/MenuHeader";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import SelectList from "../../components/SelectList/SelectList";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListHeader from "../../components/SelectList/SelectListHeader";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import FilterChip from "../../components/TopBarFilter/FilterChip";
import TopBarFilter from "../../components/TopBarFilter/TopBarFilter";
import { noop } from "../../stories/helpers";

import { AnchoredCard, useAnchoredCard } from "./appShell";
import {
  AnyFilterDef,
  ConditionChoice,
  FilterId,
  FilterInstance,
  FilterOption,
  FilterSelection,
  FilterValue,
  activeFilterCount,
  activeFilters,
  conditionChoices,
  conditionLabel,
  isConditionActive,
  isEmptyValue,
  newFilterInstance,
  removeFilter,
  upsertFilter,
  valueDisplay,
  withCondition,
} from "./filterDefs";
import { CustomDialog, scheduledValueEnd } from "./filterKinds";

import styles from "./Filters.module.scss";

// FILTERS — THE SHELL. Daniel's Figma node 14199-63395 ("The Shell", inside the
// "Filters ↳ Shared Behavior" page 14199-65429) is the filter interface itself,
// whatever the list holds: the Filters menu and its search, "No Filters Found",
// a filter's option list, the applied chips and the filter bar.
//
// This module is that node. It lived inside the JOBS page until the 2026-09-11
// re-organisation, which is why the Estimates page had to import its filter UI
// out of the Jobs page and why `FiltersPrototype.tsx` exists at all (see the
// import-cycle note there). Both pages import this now, and neither page can
// reach the other.
//
// It never knows WHICH list it is filtering. Every piece takes an
// `AnyFilterDef[]` registry as a `defs` prop and asks the def for what it needs
// — its label, its options, its own option tags (`FilterDef.optionTags`), its
// own window presets. Even an option's "13 jobs" tag is the REGISTRY's copy,
// so this module never has to name what a list holds. The one thing that is
// not object-neutral, and is passed in from outside, is the JOBS-only schedule
// horizon (`ScheduleHorizon`): the Estimates page has none and does not pass it.
//
// A KIND's own UI is NOT here — the date / duration / address Custom dialogs
// live with their kind in filterKinds.tsx.

// ---- the "Filters" menu ----------------------------------------------------

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

// NOTHING MATCHED THE SEARCH — one block for all four surfaces that can hit
// it. The nodes draw the SAME thing on each: the Filters menu with no matching
// row (14310-59924 desktop / 14310-59921 mobile) and a multi-select filter's
// option list with no matching option (14310-60254 / 14310-60389).
//
// PLAIN TEXT since 2026-09-12 (Daniel: "I want to try an option without the
// EmptyState component. Just simple text") — it was the DS `EmptyState` with
// its caption only, which brought the component's own 32px padding and its
// block layout with it. All four nodes now draw one centred line in the card's
// own `body` slot: 16px around it, body/400 compact, --text-subtle. No icon,
// no title, no action. The measurements live in `.noMatches` — including how
// the line centres itself in the taller mobile drawer.
//
// In the menu it stands in for the rows; in the lists it replaces the DS
// SelectList's built-in no-results block (an icon over a title and a caption)
// through the component's `noResultsState` slot. FLAGGED, and now a bigger
// difference than before: the DS's own no-results state is still the
// EmptyState one. If this plain-text trial is kept, that default is worth
// revisiting — the other consumers (JobDetails' service picker, the address
// autocomplete) still take the built-in block.
const noMatches = <p className={styles.noMatches}>No matching options</p>;

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
  // The class is only there for the EMPTY state: it is one of the two boxes
  // between the drawer's body and the no-match line, and both have to pass the
  // height down for the line to centre in the sheet. See `.menuFillBody`.
  <div className={styles.filterSection}>
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
 * The two AMOUNT kinds: a duration in minutes and money in dollars. They share
 * one value shape (`AmountValue`), one list, one condition set and one Custom
 * dialog — only the unit, the presets and the formatting differ, and those come
 * from the kind. Written once here so a third amount kind is one line.
 */
const isAmountKind = (def: AnyFilterDef) => def.kind === "duration" || def.kind === "money";

/**
 * Does this filter hold ONE value rather than a set? Date and the amount kinds
 * all do, and everything that follows from it is the same for them: a
 * single-select list (so it closes on the pick), no counts, no Apply bar on
 * mobile, and a "Custom..." row in the footer that opens a dialog. Type is
 * single-SELECT without being single-value (`isSingleSelect` below carries the
 * list behavior); this test alone gates the Custom-dialog machinery, which only
 * a date or an amount has.
 */
const isSingleValue = (def: AnyFilterDef) => def.kind === "date" || isAmountKind(def);

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

  // An AMOUNT filter — a DURATION (Figma node 13874-11407) or the MONEY kind
  // that copies it (14299-49183, built 2026-09-12) — is the date list's twin:
  // preset amounts, SINGLE-select, no icon, no count and no search, over a
  // "Custom..." row the caller wires. Picking a preset CLEARS any custom value —
  // the two are alternatives, like a date's preset and its custom date — and
  // KEEPS the condition, which the header's chips have already set.
  if (isAmountKind(def)) {
    const picked = instance.amount?.preset ?? null;
    const compare = instance.amount?.compare ?? "over";
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
                amount: {
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

  // What each row shows in its tag — the REGISTRY's copy, already worded for
  // whatever this list holds. See `FilterDef.optionTags`.
  const tags = def.optionTags?.() ?? {};
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
        captionPlaceholder={option.captionPlaceholder}
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
        tag={def.hideCounts === true ? undefined : tags[option.id]}
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
  if (value.amount != null) {
    return `${value.amount.preset}|${value.amount.from}|${value.amount.to}`;
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
        // With nothing matching, the sheet's body is one line — and the node
        // centres it in the full height (14310-59921). The height has to be
        // handed down explicitly: `Menu` puts its children inside a
        // `[role="menu"]` box, and this section adds one more, and a
        // percentage height stops at the first box that sizes to its content.
        className={filters.rows.length === 0 ? styles.menuFillBody : undefined}
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
          selected={statuses.includes(option.id)}
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
export interface ScheduleHorizon {
  /** The horizon's last day, offset from today (`SCHEDULED_WINDOW_DAYS`). */
  days: number;
  /** Its View-menu label — "Next 1 week" — for the hint's caption. */
  label: string;
}


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
  // The conflict: only a WINDOW filter's chip (`dateWindows` — Scheduled for is
  // the only one), only under a finite horizon, and only when the value's last
  // matching day reaches past the horizon's (`null` end = an open "after",
  // beyond every horizon). The def carries its own windows, so this reads no
  // filter id.
  let conflict = false;
  if (def.dateWindows != null && scheduleHorizon != null) {
    const end = scheduledValueEnd(instance.date, def.dateWindows);
    conflict = end !== false && (end == null || end > scheduleHorizon.days);
  }
  // A date or duration chip's Custom DIALOG, opened from the value list's
  // "Custom" row. It is a centred modal, so this is a flag, not an anchor.
  const [customOpen, setCustomOpen] = useState(false);
  // This chip's value IS a custom one, so the value segment opens the dialog
  // instead of the preset list.
  const isCustomValue =
    (instance.date != null && instance.date.preset == null) ||
    (instance.amount != null && instance.amount.preset == null) ||
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
