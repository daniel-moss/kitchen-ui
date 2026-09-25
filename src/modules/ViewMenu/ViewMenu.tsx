import { ChangeEvent, ReactNode, RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import IconButton from "../../components/IconButton/IconButton";
import Popover from "../../components/Popover/Popover";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import { Divider } from "../../components/Divider/Divider";
import Hint from "../../components/Hint/Hint";
import HoverHint from "../../components/Hint/HoverHint";
import { Icon } from "../../components/Icon/Icon";
import type { IconPack } from "../../components/Icon/Icon.types";
import Label from "../../components/Label/Label";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import ItemValue from "../../components/ItemText/ItemValue/ItemValue";
import SelectList from "../../components/SelectList/SelectList";
import SelectListHeader from "../../components/SelectList/SelectListHeader";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import SelectListItem from "../../components/SelectList/SelectListItem";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import Chip from "../../components/Chip/Chip";
import ChipGroup from "../../components/Chip/ChipGroup";
import EmptyState from "../../components/EmptyState/EmptyState";
import switchStyles from "../../components/Toggle/ToggleSwitch.module.scss";
import useMountTransition from "../../hooks/useMountTransition";

import { SCHEDULED_OPTIONS, SORT_META, TIMELINE_TOGGLES, TIME_FRAMES } from "./viewMenuData";
import { ViewMenuColumn, ViewMenuProps, ViewMenuView } from "./ViewMenu.types";
import styles from "./ViewMenu.module.scss";

// The View Menu MODULE — the table view controls: view switcher, Sort by
// (column select + sort-order button), Schedule horizon (jobs only — renamed
// from "Scheduled date", Daniel 2026-09-04), and the Columns section
// (visibility toggles, pinning with a limit of 3, drag reorder within a
// group). The Schedule horizon row and the Timeline view exist ONLY for jobs
// — other objects have no schedule — so both arrive as opt-in props and are
// simply absent when not passed. Desktop = popover card; mobile = drawer, without
// pinning. Composed from DS components; see Figma "View Menu — Next Update".
//
// Extracted from the ViewMenu prototype on 2026-09-03 (Daniel: "if I need to
// update View Menu, I update it in one place and it'll be updated in every
// prototype it's used"). Everything the menu SHOWS and EDITS is a controlled
// prop; the CONSUMER owns the trigger, the card's position, and the
// outside-click close — and that closer must treat the [data-floating-list]
// body portals as inside the menu.

// The view switcher's chips. Chip leaves its slot icon entirely to the caller,
// so the resting / selected pair lives here: Table and Cards keep one glyph and
// step from the regular to the solid pack, while Timeline is a kit CUSTOM glyph
// whose two styles are separate names. Read off Figma 14215-55178 / 14205-72167
// / 14215-55121.
const VIEW_CHIPS: {
  key: ViewMenuView;
  label: string;
  rest: { icon: string; pack: IconPack };
  selected: { icon: string; pack: IconPack };
}[] = [
  { key: "table", label: "Table", rest: { icon: "table", pack: "regular" }, selected: { icon: "table", pack: "solid" } },
  {
    key: "cards",
    label: "Cards",
    rest: { icon: "grid-2", pack: "regular" },
    selected: { icon: "grid-2", pack: "solid" },
  },
  {
    key: "timeline",
    label: "Timeline",
    rest: { icon: "regular-timeline-view", pack: "custom" },
    selected: { icon: "solid-timeline-view", pack: "custom" },
  },
];

// The Timeline "Orientation" chips follow the same regular → solid rule.
const ORIENTATION_CHIPS: { key: "horizontal" | "vertical"; label: string; icon: string }[] = [
  { key: "horizontal", label: "Horizontal", icon: "objects-align-left" },
  { key: "vertical", label: "Vertical", icon: "objects-align-top" },
];

const PIN_LIMIT = 3;
const HINT_TEXT = {
  pinLimit: "Only 3 columns can be pinned at a time. Please unpin one before pinning another.",
  minVisible: "The table must have at least one column",
};

type HintKind = keyof typeof HINT_TEXT;
type HintState = { kind: HintKind; x: number; y: number } | null;

// Desktop dropdown lists float in a document.body portal. Anchored inside the
// popover card they extend the card body's scrollable area — a scrollbar
// appears while the list is open and the whole menu visibly narrows — and the
// card's overflow: hidden would clip them.
//
// THE TRIGGER IS THE WHOLE ROW (Daniel, 2026-09-25), not the ItemValue inside
// it: the anchor is the ListItem's own box, so the list sits `GAP` below the
// ROW's bottom with their RIGHT EDGES flush — which is what the nodes draw
// (Figma 14215-55217 and 14205-71987 both put the list 4px under a 40px row,
// right edges aligned). Re-measured on scroll/resize while open, and kept
// mounted so the exit plays.
//
// If the list would not fit below, it flips ABOVE the row by the same gap.
// Flipping left/right is not implemented — the list is right-aligned inside a
// 360px card, so it is the vertical edge that runs out first.
const GAP = 4;
const SCREEN_MARGIN = 8;

const FloatingList = ({
  open,
  anchorRef,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLDivElement>;
  children: ReactNode;
}) => {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect == null) return;
      const height = listRef.current?.offsetHeight ?? 0;
      const below = rect.bottom + GAP;
      // Flip above only when there is genuinely no room below AND the room
      // above is better — otherwise a tall list would jump to a worse spot.
      const roomBelow = window.innerHeight - below - SCREEN_MARGIN;
      const roomAbove = rect.top - GAP - SCREEN_MARGIN;
      const flip = height > 0 && height > roomBelow && roomAbove > roomBelow;
      setPos({
        top: flip ? Math.max(SCREEN_MARGIN, rect.top - GAP - height) : below,
        right: window.innerWidth - rect.right,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
    // `children` is in the deps so the flip re-measures when the list's own
    // height changes — a search that filters the options down, for instance.
  }, [open, anchorRef, children]);

  if (!pos) return null; // nothing to place until the first open
  return createPortal(
    <div ref={listRef} data-floating-list className={styles.floatingList} style={{ top: pos.top, right: pos.right }}>
      {children}
    </div>,
    document.body,
  );
};

// A settings row — "Schedule horizon" and "Sort by". The whole row is the
// trigger and the value is an ItemValue in the right slot (with its own
// `angles-up-down` chevron); ListItem stops slot clicks reaching the row, so
// the sort-order IconButton beside the value keeps its own click.
const SettingRow = ({
  title,
  value,
  isOpen,
  onClick,
  before,
}: {
  title: string;
  value: string;
  isOpen: boolean;
  onClick: () => void;
  before?: ReactNode;
}) => (
  <ListItem
    size="compact"
    isClickable
    variant="title"
    title={title}
    aria-expanded={isOpen}
    onClick={onClick}
    slotRight={
      <>
        {before}
        <ItemValue value={value} />
      </>
    }
  />
);

// One column row. This wrapper exists for the hint anchor / hover handlers —
// and it must FORWARD isDragging/disabled, because ItemGroup injects them
// into its direct child to draw the lifted drag copy and the hidden original.
interface ColumnRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  /** The last visible column: its switch dims and stops responding. */
  toggleDisabled?: boolean;
  pinSlot?: ReactNode;
  rowRef: (el: HTMLDivElement | null) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  /** Mobile: a tap on the blocked row opens the hint drawer. */
  onTap?: () => void;
  // injected by ItemGroup during a drag
  isDragging?: boolean;
  disabled?: boolean;
}

const ColumnRow = ({
  label,
  checked,
  onCheckedChange,
  toggleDisabled = false,
  pinSlot,
  rowRef,
  onHoverStart,
  onHoverEnd,
  onTap,
  isDragging = false,
  disabled = false,
}: ColumnRowProps) => (
  <div ref={rowRef} onMouseEnter={onHoverStart} onMouseLeave={onHoverEnd} onClick={onTap}>
    <ListItem
      size="compact"
      isDraggable
      isDragging={isDragging}
      disabled={disabled}
      isClickable
      toggle
      checked={checked}
      onCheckedChange={onCheckedChange}
      toggleDisabled={toggleDisabled}
      variant="title"
      title={label}
      slotRight={pinSlot}
    />
  </div>
);

export default function ViewMenu({
  open,
  onClose,
  breakpoint = "desktop",
  columns,
  columnsState,
  onColumnsStateChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  attributes,
  activeAttributes,
  onActiveAttributesChange,
  disabledViews,
  scheduled,
  timeline,
  className,
}: ViewMenuProps) {
  const mobile = breakpoint === "mobile";
  const { pinned, unpinned, hidden } = columnsState;

  const columnByKey = (key: string): ViewMenuColumn => columns.find((c) => c.key === key) ?? columns[0]!;

  const [sortListOpen, setSortListOpen] = useState(false);
  const [scheduledOpen, setScheduledOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [hint, setHint] = useState<HintState>(null);
  // keeps the hint drawer's text stable while its exit animation plays
  const lastHintKind = useRef<HintKind>("minVisible");
  if (hint != null) lastHintKind.current = hint.kind;

  const bodyRef = useRef<HTMLDivElement>(null);
  const sortSectionRef = useRef<HTMLDivElement>(null);
  const scheduledSectionRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement | null>());

  const { mounted, visible } = useMountTransition(open, 200);

  // Closing the menu takes the sub-lists and the hint with it.
  useEffect(() => {
    if (!open) {
      setSortListOpen(false);
      setScheduledOpen(false);
      setQuery("");
      setHint(null);
    }
  }, [open]);

  const showHint = (kind: HintKind, anchor: HTMLElement) => {
    const body = bodyRef.current;
    if (body == null) return;
    const b = body.getBoundingClientRect();
    const r = anchor.getBoundingClientRect();
    setHint({ kind, x: r.left + r.width / 2 - b.left, y: r.top - b.top });
  };

  // ---- columns ----
  const visibleCount = columns.length - hidden.length;
  const pinLimitReached = pinned.length >= PIN_LIMIT;

  const togglePin = (key: string) => {
    if (pinned.includes(key)) {
      // unpin → the column returns to the top of the unpinned group
      onColumnsStateChange({ ...columnsState, pinned: pinned.filter((k) => k !== key), unpinned: [key, ...unpinned] });
    } else if (!pinLimitReached) {
      onColumnsStateChange({ ...columnsState, unpinned: unpinned.filter((k) => k !== key), pinned: [...pinned, key] });
    }
  };

  const toggleVisible = (key: string, next: boolean) => {
    if (!next) {
      // the last visible column's switch is toggleDisabled, so this branch
      // only guards against races
      if (visibleCount === 1) return;
      // a hidden column can not stay pinned
      const wasPinned = pinned.includes(key);
      onColumnsStateChange({
        pinned: wasPinned ? pinned.filter((k) => k !== key) : pinned,
        unpinned: wasPinned ? [key, ...unpinned] : unpinned,
        hidden: [...hidden, key],
      });
    } else {
      onColumnsStateChange({ ...columnsState, hidden: hidden.filter((k) => k !== key) });
    }
  };

  // Desktop, "only one column left": hovering the last visible row shows the
  // hint above its toggle.
  const showMinVisibleHint = (key: string) => {
    const row = rowRefs.current.get(key);
    const anchor = row?.querySelector<HTMLElement>(`.${switchStyles.track}`) ?? row;
    if (anchor != null) showHint("minVisible", anchor);
  };

  // The DS Hint floats above the anchor; the tongue alignment is picked so it
  // points at the anchor even when the 320px bubble is clamped to the menu.
  const renderHintBubble = (h: NonNullable<HintState>) => {
    const clamp = (v: number) => Math.max(8, Math.min(v, 32)); // menu 360, bubble 320
    let alignment: "start" | "center" | "end" = "center";
    let left = clamp(h.x - 160);
    if (left !== h.x - 160) {
      if (h.x - 160 > 32) {
        alignment = "end";
        left = clamp(h.x + 18 - 320);
      } else {
        alignment = "start";
        left = clamp(h.x - 18);
      }
    }
    return (
      <div className={styles.hintPos} style={{ left, bottom: `calc(100% - ${h.y - 10}px)` }}>
        <Hint state="error" caption={HINT_TEXT[h.kind]} tongue="bottom" tongueAlignment={alignment} />
      </div>
    );
  };

  const reorder = (list: string[], write: (next: string[]) => void) => (from: number, to: number) => {
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    write(next);
  };

  // Each row is a whole-row toggle (the DS rule: a Toggle in the right slot
  // makes the entire ListItem the switch). The pin button sits before the
  // switch; its clicks do not flip the row.
  const columnRow = (key: string) => {
    const col = columnByKey(key);
    const isPinned = pinned.includes(key);
    // Pin limit reached → the remaining pin buttons are disabled and hovering
    // one shows the hint (the button gets pointer-events: none, so the
    // HoverHint wrapper receives the hover).
    const pinDisabled = !isPinned && pinLimitReached;
    const pinButton = (
      <IconButton
        icon="thumbtack"
        iconPack={isPinned ? "solid" : "regular"}
        variant="ghost"
        size="md"
        aria-label={isPinned ? "Unpin" : "Pin"}
        isDisabled={pinDisabled}
        className={pinDisabled ? styles.pinDisabled : undefined}
        noDebounce
        onClick={() => togglePin(col.key)}
      />
    );
    const isLastVisible = visibleCount === 1 && !hidden.includes(col.key);
    return (
      <ColumnRow
        key={col.key}
        label={col.label}
        checked={!hidden.includes(col.key)}
        onCheckedChange={(next) => toggleVisible(col.key, next)}
        toggleDisabled={isLastVisible}
        rowRef={(el) => rowRefs.current.set(col.key, el)}
        onHoverStart={!mobile && isLastVisible ? () => showMinVisibleHint(col.key) : undefined}
        onHoverEnd={!mobile && isLastVisible ? () => setHint(null) : undefined}
        onTap={mobile && isLastVisible ? () => setHint({ kind: "minVisible", x: 0, y: 0 }) : undefined}
        pinSlot={
          !mobile ? (
            pinDisabled ? (
              <HoverHint
                position="top"
                state="error"
                caption={HINT_TEXT.pinLimit}
                breakpoint="desktop"
                className={styles.pinHintWrap}
              >
                {pinButton}
              </HoverHint>
            ) : (
              <HoverTooltip text={isPinned ? "Unpin" : "Pin"}>{pinButton}</HoverTooltip>
            )
          ) : undefined
        }
      />
    );
  };

  // ---- sort ----
  const sortMeta = SORT_META[columnByKey(sort.key).type][sort.ascending ? "asc" : "desc"];
  // Only the columns the table can actually sort by (`sortable !== false`).
  const sortableColumns = useMemo(() => columns.filter((c) => c.sortable !== false), [columns]);
  const shownColumns = useMemo(
    () => sortableColumns.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
    [sortableColumns, query],
  );

  // The Column list's NO-SEARCH-MATCHES state (Figma 14767-81877 desktop /
  // 14767-81874 mobile, 2026-09-14): the DS `EmptyState` in its caption-only
  // form — one centred line, "No matches", body/400 compact in --text-subtle.
  // No icon, no title, no action, which is what makes it different from
  // SelectList's built-in no-results block. The 16px around it is the node's
  // (`body` padding there, the EmptyState's own here — see `.sortNoMatches`).
  const sortNoMatches = <EmptyState caption="No matches" className={styles.sortNoMatches} />;

  const sortSearch = (
    <SelectListHeader
      value={query}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
      onClear={() => setQuery("")}
      placeholder="Column..."
    />
  );

  const sortItems = (
    <SelectListItemGroup>
      {shownColumns.map((c) => (
        <SelectListItem
          key={c.key}
          label={c.label}
          selected={c.key === sort.key}
          onClick={() => {
            onSortChange({ ...sort, key: c.key }); // the direction is kept when the column changes
            setQuery("");
          }}
        />
      ))}
    </SelectListItemGroup>
  );

  const closeSortList = () => {
    setSortListOpen(false);
    setQuery("");
  };

  const scheduledLabel = SCHEDULED_OPTIONS.find((o) => o.key === scheduled?.value)?.label ?? "All dates";
  const scheduledItems = (
    <SelectListItemGroup>
      {SCHEDULED_OPTIONS.map((o) => (
        <SelectListItem
          key={o.key}
          label={o.label}
          selected={o.key === scheduled?.value}
          onClick={() => scheduled?.onChange(o.key)}
        />
      ))}
    </SelectListItemGroup>
  );

  // ---- the Columns section ----
  // Desktop with something pinned: two labelled groups — "Pinned" (thumbtack)
  // above "Not pinned" (thumbtack-slash), the first carrying the divider
  // between them. With nothing pinned: ONE group headed plainly "Columns",
  // no icon. Mobile always shows that plain "Columns" header, because a phone
  // cannot pin — but it still renders the two regions as SEPARATE groups
  // (the second headerless, so the two read as one list), because a drag must
  // stay inside its own region: a phone can never change the desktop's pinned
  // set.
  const reorderPinned = reorder(pinned, (next) => onColumnsStateChange({ ...columnsState, pinned: next }));
  const reorderUnpinned = reorder(unpinned, (next) => onColumnsStateChange({ ...columnsState, unpinned: next }));
  const columnsHeader = <GroupLabel label="Columns" />;

  const columnsSection = mobile ? (
    pinned.length > 0 ? (
      <>
        <ItemGroup label={columnsHeader} onReorder={reorderPinned}>
          {pinned.map(columnRow)}
        </ItemGroup>
        <ItemGroup onReorder={reorderUnpinned}>{unpinned.map(columnRow)}</ItemGroup>
      </>
    ) : (
      <ItemGroup label={columnsHeader} onReorder={reorderUnpinned}>
        {unpinned.map(columnRow)}
      </ItemGroup>
    )
  ) : pinned.length > 0 ? (
    <>
      <ItemGroup
        divider
        label={<GroupLabel label="Pinned" slotLeft={<Icon icon="thumbtack" pack="regular" size={14} />} />}
        onReorder={reorderPinned}
      >
        {pinned.map(columnRow)}
      </ItemGroup>
      <ItemGroup
        label={<GroupLabel label="Not pinned" slotLeft={<Icon icon="thumbtack-slash" pack="regular" size={14} />} />}
        onReorder={reorderUnpinned}
      >
        {unpinned.map(columnRow)}
      </ItemGroup>
    </>
  ) : (
    <ItemGroup label={columnsHeader} onReorder={reorderUnpinned}>
      {unpinned.map(columnRow)}
    </ItemGroup>
  );

  // ---- the menu body (shared desktop / mobile) ----
  const body = (
    <div ref={bodyRef} className={styles.body}>
      <div className={styles.switcher}>
        {/* Pick-one: `selectionMode="single"` gives the row radio semantics and
            the arrow keys. The icon is the CONSUMER's — Chip does not swap
            packs — so the switch to solid on selection happens here. */}
        <ChipGroup isFullWidth selectionMode="single">
          {VIEW_CHIPS.filter((v) => v.key !== "timeline" || timeline != null).map((v) => {
            const art = view === v.key ? v.selected : v.rest;
            return (
              <Chip
                key={v.key}
                orientation="vertical"
                slotLeft={<Icon icon={art.icon} pack={art.pack} size={14} />}
                isSelected={view === v.key}
                isDisabled={disabledViews?.includes(v.key)}
                onClick={() => onViewChange(v.key)}
              >
                {v.label}
              </Chip>
            );
          })}
        </ChipGroup>
      </div>
      <Divider contrast="medium" padding="0 var(--size-4)" />
      {/* Schedule horizon FIRST, Sort by second — the design's order — in ONE
          ItemGroup whose own bottom divider separates it from what follows.
          Schedule horizon is JOBS ONLY, so its row exists only when the
          consumer passes `scheduled`. Each row anchors its own floating list,
          hence the ref wrappers. */}
      {view !== "timeline" && (
        <ItemGroup divider>
          {scheduled != null && (
            <div ref={scheduledSectionRef}>
              <SettingRow
                title="Schedule horizon"
                value={scheduledLabel}
                isOpen={scheduledOpen}
                onClick={() => {
                  setSortListOpen(false);
                  setScheduledOpen((o) => !o);
                }}
              />
            </div>
          )}
          <div ref={sortSectionRef}>
            <SettingRow
              title="Sort by"
              value={columnByKey(sort.key).label}
              isOpen={sortListOpen}
              onClick={() => {
                setScheduledOpen(false);
                setSortListOpen((o) => !o);
              }}
              before={
                <HoverTooltip text={sortMeta.label}>
                  <IconButton
                    icon={sortMeta.icon}
                    variant="ghost"
                    size="md"
                    aria-label={sortMeta.label}
                    noDebounce
                    onClick={() => onSortChange({ ...sort, ascending: !sort.ascending })}
                  />
                </HoverTooltip>
              }
            />
          </div>
        </ItemGroup>
      )}
      {/* A list can not live inside its row — ListItem clips its content
          (overflow: hidden). Both float in a body portal (FloatingList).

          NO WIDTH of its own (Daniel, 2026-09-14): "the 'Column' SelectList
          within the 'View' menu should be a default DS SelectList
          component. So, it only has max width. No min width." The DS card
          hugs its rows up to its own 384 cap — the 208 floor belongs to the
          Filters prototype, which adds it on top for its own lists, not to
          the component. */}
      {view !== "timeline" && !mobile && (
        <>
          <FloatingList open={sortListOpen} anchorRef={sortSectionRef}>
            <SelectList
              variant="inline"
              breakpoint="desktop"
              open={sortListOpen}
              onClose={closeSortList}
              header={sortSearch}
              state={query !== "" && shownColumns.length === 0 ? "noResults" : "default"}
              noResultsState={sortNoMatches}
            >
              {sortItems}
            </SelectList>
          </FloatingList>
          {scheduled != null && (
            <FloatingList open={scheduledOpen} anchorRef={scheduledSectionRef}>
              <SelectList
                variant="inline"
                breakpoint="desktop"
                open={scheduledOpen}
                onClose={() => setScheduledOpen(false)}
                style={{ width: 151 }}
              >
                {scheduledItems}
              </SelectList>
            </FloatingList>
          )}
        </>
      )}
      {view === "table" ? (
        columnsSection
      ) : view === "cards" ? (
        <div className={styles.attrsSection}>
          <div className={styles.attrsTitle}>
            <Label as="span">Attributes</Label>
          </div>
          <ChipGroup>
            {attributes.map((a) => (
              <Chip
                key={a.key}
                size="lg"
                isSelected={activeAttributes.includes(a.key)}
                onClick={() =>
                  onActiveAttributesChange(
                    activeAttributes.includes(a.key)
                      ? activeAttributes.filter((k) => k !== a.key)
                      : [...activeAttributes, a.key],
                  )
                }
              >
                {a.label}
              </Chip>
            ))}
          </ChipGroup>
        </div>
      ) : timeline != null ? (
        <>
          <div className={styles.timelineSettings}>
            <div className={styles.settingBlock}>
              <Label as="span">Orientation</Label>
              {/* Vertical chips — the icon is a picture of the layout, and it
                  goes solid on the selected one (the same rule as the view
                  switcher). */}
              <ChipGroup isFullWidth selectionMode="single">
                {ORIENTATION_CHIPS.map((o) => (
                  <Chip
                    key={o.key}
                    orientation="vertical"
                    slotLeft={
                      <Icon
                        icon={o.icon}
                        pack={timeline.value.orientation === o.key ? "solid" : "regular"}
                        size={14}
                      />
                    }
                    isSelected={timeline.value.orientation === o.key}
                    onClick={() => timeline.onChange({ ...timeline.value, orientation: o.key })}
                  >
                    {o.label}
                  </Chip>
                ))}
              </ChipGroup>
            </div>
            <div className={styles.settingBlock}>
              <Label as="span">Time frame</Label>
              <ChipGroup isFullWidth selectionMode="single">
                {TIME_FRAMES.map((f) => (
                  <Chip
                    key={f.key}
                    size="lg"
                    isSelected={timeline.value.timeFrame === f.key}
                    onClick={() => timeline.onChange({ ...timeline.value, timeFrame: f.key })}
                  >
                    {f.label}
                  </Chip>
                ))}
              </ChipGroup>
            </div>
          </div>
          <Divider contrast="medium" padding="0 var(--size-4)" />
          <ItemGroup>
            {TIMELINE_TOGGLES.map((o) => (
              <ListItem
                key={o.key}
                size="compact"
                isClickable
                toggle
                checked={timeline.value.flags[o.key] ?? true}
                onCheckedChange={(next) =>
                  timeline.onChange({ ...timeline.value, flags: { ...timeline.value.flags, [o.key]: next } })
                }
                variant="title"
                title={o.label}
              />
            ))}
          </ItemGroup>
        </>
      ) : null}
      {!mobile && hint != null && renderHintBubble(hint)}
    </div>
  );

  // ---- mobile: drawer over the app, sort list as a second drawer ----
  if (mobile) {
    return (
      <>
        {mounted && (
          <Popover drawer open={visible} onClose={onClose} header={<DrawerHeader variant="dragHandle" />}>
            <div className={styles.drawerBody}>{body}</div>
          </Popover>
        )}
        {/* mobile hint = the DS Hint drawer, stacked over the menu. Both
            overlays stay mounted with `open` driving them, so the slide-down
            exit plays; the caption keeps the last kind during the exit. */}
        <Hint
          variant="drawer"
          state="error"
          open={hint != null}
          caption={HINT_TEXT[hint?.kind ?? lastHintKind.current]}
          onClose={() => setHint(null)}
        />
        <SelectList
          variant="drawer"
          title="Sort by"
          breakpoint="mobile"
          open={sortListOpen}
          onClose={closeSortList}
          header={sortSearch}
          state={query !== "" && shownColumns.length === 0 ? "noResults" : "default"}
          noResultsState={sortNoMatches}
        >
          {sortItems}
        </SelectList>
        {scheduled != null && (
          <SelectList
            variant="drawer"
            title="Schedule horizon"
            breakpoint="mobile"
            open={scheduledOpen}
            onClose={() => setScheduledOpen(false)}
          >
            {scheduledItems}
          </SelectList>
        )}
      </>
    );
  }

  // ---- desktop: the popover card, positioned by the consumer ----
  if (!mounted) return null;
  return (
    <Popover open={visible} className={clsx(styles.card, className)}>
      {body}
    </Popover>
  );
}
