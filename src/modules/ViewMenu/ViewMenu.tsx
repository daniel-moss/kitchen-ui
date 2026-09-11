import { ChangeEvent, ReactNode, RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import IconButton from "../../components/IconButton/IconButton";
import Popover from "../../components/Popover/Popover";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import { Divider } from "../../components/Divider/Divider";
import Hint from "../../components/Hint/Hint";
import HoverHint from "../../components/Hint/HoverHint";
import Label from "../../components/Label/Label";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import SelectList from "../../components/SelectList/SelectList";
import SelectListHeader from "../../components/SelectList/SelectListHeader";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import SelectListItem from "../../components/SelectList/SelectListItem";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import Chip from "../../components/Chip/Chip";
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

const PIN_LIMIT = 3;
const HINT_TEXT = {
  pinLimit: "Only 3 columns can be pinned at a time. Please unpin one before pinning another.",
  minVisible: "The table must have at least one column",
};

type HintKind = keyof typeof HINT_TEXT;
type HintState = { kind: HintKind; x: number; y: number } | null;

// The "Unpinned" divider — a module-local assembly of two DS Dividers
// (dashed, high contrast) with the word between, separating pinned from
// unpinned columns.
const UnpinnedDivider = () => (
  <div className={styles.unpinnedDivider} aria-hidden="true">
    <Divider dashed contrast="high" className={styles.unpinnedLine} />
    <span className={styles.unpinnedText}>Unpinned</span>
    <Divider dashed contrast="high" className={styles.unpinnedLine} />
  </div>
);

// Desktop dropdown lists float in a document.body portal. Anchored inside the
// popover card they extend the card body's scrollable area — a scrollbar
// appears while the list is open and the whole menu visibly narrows — and the
// card's overflow: hidden would clip them. Position: fixed below the anchor
// section, right-aligned 16px in from its right edge, re-measured on
// scroll/resize while open. Kept mounted so the exit plays.
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

  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ top: rect.bottom - 8, right: window.innerWidth - rect.right + 16 });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  if (!pos) return null; // nothing to place until the first open
  return createPortal(
    <div data-floating-list className={styles.floatingList} style={{ top: pos.top, right: pos.right }}>
      {children}
    </div>,
    document.body,
  );
};

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
      className={styles.columnRow}
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

  const sortSearch = (
    <SelectListHeader
      value={query}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
      onClear={() => setQuery("")}
      placeholder="Search by column name..."
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

  // ---- the menu body (shared desktop / mobile) ----
  const body = (
    <div ref={bodyRef} className={styles.body}>
      <div className={styles.switcher}>
        <TabGroup
          variant="contained"
          size="lg"
          orientation="vertical"
          isFullWidth
          value={view}
          onChange={(next) => onViewChange(next as ViewMenuView)}
        >
          <TabItem value="table" icon="table" disabled={disabledViews?.includes("table")}>
            Table
          </TabItem>
          <TabItem value="cards" icon="grid-2" disabled={disabledViews?.includes("cards")}>
            Cards
          </TabItem>
          {/* Timeline is JOBS ONLY — the tab exists only when the consumer
              passes `timeline`. */}
          {timeline != null && (
            <TabItem
              value="timeline"
              icon="regular-timeline-view"
              selectedIcon="solid-timeline-view"
              iconPack="custom"
              disabled={disabledViews?.includes("timeline")}
            >
              Timeline
            </TabItem>
          )}
        </TabGroup>
      </div>
      <Divider contrast="medium" />
      {view !== "timeline" && (
        <div ref={sortSectionRef} className={styles.sortSection}>
          <ListItem
            variant="title"
            title="Sort by"
            className={styles.sortRow}
            slotRight={
              <>
                <HoverTooltip text={sortMeta.label}>
                  <IconButton
                    icon={sortMeta.icon}
                    variant="ghost"
                    size="lg"
                    aria-label={sortMeta.label}
                    noDebounce
                    onClick={() => onSortChange({ ...sort, ascending: !sort.ascending })}
                  />
                </HoverTooltip>
                <SelectField
                  fitContent
                  value={columnByKey(sort.key).label}
                  open={sortListOpen}
                  onClick={() => {
                    setScheduledOpen(false);
                    setSortListOpen((o) => !o);
                  }}
                />
              </>
            }
          />
          {/* The list can not live inside the row — ListItem clips its content
              (overflow: hidden). It floats in a body portal (FloatingList). */}
          {!mobile && (
            <FloatingList open={sortListOpen} anchorRef={sortSectionRef}>
              <SelectList
                variant="inline"
                breakpoint="desktop"
                open={sortListOpen}
                onClose={closeSortList}
                header={sortSearch}
                state={query !== "" && shownColumns.length === 0 ? "noResults" : "default"}
                style={{ width: 240 }}
              >
                {sortItems}
              </SelectList>
            </FloatingList>
          )}
        </div>
      )}
      {view !== "timeline" && <Divider contrast="medium" />}
      {/* Schedule horizon is JOBS ONLY — the row exists only when the
          consumer passes `scheduled`. */}
      {view !== "timeline" && scheduled != null && (
        <>
          <div ref={scheduledSectionRef} className={styles.sortSection}>
            <ListItem
              variant="title"
              title="Schedule horizon"
              className={styles.sortRow}
              slotRight={
                <SelectField
                  fitContent
                  value={scheduledLabel}
                  open={scheduledOpen}
                  onClick={() => {
                    setSortListOpen(false);
                    setScheduledOpen((o) => !o);
                  }}
                />
              }
            />
            {!mobile && (
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
          </div>
          <Divider contrast="medium" />
        </>
      )}
      {view === "table" ? (
        <div className={styles.columnsSection}>
          <div className={styles.columnsTitle}>
            <Label as="span">Columns</Label>
          </div>
          {pinned.length > 0 && (
            <ItemGroup onReorder={reorder(pinned, (next) => onColumnsStateChange({ ...columnsState, pinned: next }))}>
              {pinned.map(columnRow)}
            </ItemGroup>
          )}
          {/* Mobile has no pin functionality (the rows already hide the pin
              button), so it gets no "Unpinned" divider either (Daniel,
              2026-09-10). The two regions render as one continuous list —
              drags still stay within their region, so a phone can never
              change the desktop's pinned set. */}
          {pinned.length > 0 && !mobile && <UnpinnedDivider />}
          <ItemGroup onReorder={reorder(unpinned, (next) => onColumnsStateChange({ ...columnsState, unpinned: next }))}>
            {unpinned.map(columnRow)}
          </ItemGroup>
        </div>
      ) : view === "cards" ? (
        <div className={styles.attrsSection}>
          <div className={styles.attrsTitle}>
            <Label as="span">Attributes</Label>
          </div>
          <div className={styles.attrChips}>
            {attributes.map((a) => (
              <Chip
                key={a.key}
                size="md"
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
          </div>
        </div>
      ) : timeline != null ? (
        <>
          <div className={styles.timelineSettings}>
            <div className={styles.settingBlock}>
              <span className={styles.settingTitle}>Orientation</span>
              <TabGroup
                variant="contained"
                size="lg"
                orientation="vertical"
                isFullWidth
                value={timeline.value.orientation}
                onChange={(next) =>
                  timeline.onChange({ ...timeline.value, orientation: next as "horizontal" | "vertical" })
                }
              >
                <TabItem value="horizontal" icon="objects-align-left">
                  Horizontal
                </TabItem>
                <TabItem value="vertical" icon="objects-align-top">
                  Vertical
                </TabItem>
              </TabGroup>
            </div>
            <div className={styles.settingBlock}>
              <span className={styles.settingTitle}>Time frame</span>
              <TabGroup
                variant="contained"
                size="lg"
                isFullWidth
                value={timeline.value.timeFrame}
                onChange={(next) => timeline.onChange({ ...timeline.value, timeFrame: next })}
              >
                {TIME_FRAMES.map((f) => (
                  <TabItem key={f.key} value={f.key}>
                    {f.label}
                  </TabItem>
                ))}
              </TabGroup>
            </div>
          </div>
          <Divider contrast="medium" />
          <div className={styles.timelineToggles}>
            {TIMELINE_TOGGLES.map((o) => (
              <ListItem
                key={o.key}
                isClickable
                toggle
                checked={timeline.value.flags[o.key] ?? true}
                onCheckedChange={(next) =>
                  timeline.onChange({ ...timeline.value, flags: { ...timeline.value.flags, [o.key]: next } })
                }
                variant="title"
                title={o.label}
                className={styles.sortRow}
              />
            ))}
          </div>
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
