import { ChangeEvent, ReactNode, RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import Button from "../../components/Button/Button";
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
import switchStyles from "../../components/Toggle/ToggleSwitch.module.scss";
import useMountTransition from "../../hooks/useMountTransition";

import Chip from "../../components/Chip/Chip";
import {
  ATTRIBUTES,
  COLUMNS,
  DEFAULT_ACTIVE_ATTRIBUTES,
  SCHEDULED_OPTIONS,
  SORT_META,
  TIMELINE_TOGGLES,
  TIME_FRAMES,
  columnByKey,
} from "./columns";
import styles from "./ViewMenu.module.scss";

const PIN_LIMIT = 3;
const HINT_TEXT = {
  pinLimit: "Only 3 columns can be pinned at a time. Please unpin one before pinning another.",
  minVisible: "The table must have at least one column",
};

type HintKind = keyof typeof HINT_TEXT;
type HintState = { kind: HintKind; x: number; y: number } | null;

// The "Unpinned" divider — a prototype-local assembly of two DS Dividers
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
// section, right-aligned 16px in from its right edge (the old CSS anchoring),
// re-measured on scroll/resize while open. Kept mounted so the exit plays.
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

/**
 * View Menu prototype — the table view controls: Table/Cards switcher,
 * Sort by (column select + sort-order button), and the Columns section
 * (visibility toggles, pinning with a limit of 3, drag reorder within a
 * group). Desktop = popover card; mobile = drawer, without pinning.
 * Composed from DS components; see Figma "View Menu — Next Update".
 */
export default function ViewMenu({ mobile = false }: { mobile?: boolean }) {
  const [view, setView] = useState("table");
  const [menuOpen, setMenuOpen] = useState(true);

  // Column order and state. Mobile has no pinning — everything is unpinned.
  const [pinned, setPinned] = useState<string[]>(mobile ? [] : ["id", "client"]);
  const [unpinned, setUnpinned] = useState<string[]>(
    COLUMNS.map((c) => c.key).filter((k) => (mobile ? true : k !== "id" && k !== "client")),
  );
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);

  // Cards view: which attributes each card shows
  const [activeAttrs, setActiveAttrs] = useState<string[]>(DEFAULT_ACTIVE_ATTRIBUTES);
  const toggleAttr = (key: string) =>
    setActiveAttrs((a) => (a.includes(key) ? a.filter((k) => k !== key) : [...a, key]));

  const [sortKey, setSortKey] = useState("id");
  const [sortAsc, setSortAsc] = useState(true);
  const [sortListOpen, setSortListOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Timeline view settings
  const [orientation, setOrientation] = useState("horizontal");
  const [timeFrame, setTimeFrame] = useState("day");
  const [timelineFlags, setTimelineFlags] = useState<Record<string, boolean>>(
    Object.fromEntries(TIMELINE_TOGGLES.map((o) => [o.key, true])),
  );

  // "Scheduled date" filter (Table + Cards tabs, shared value)
  const [scheduledKey, setScheduledKey] = useState("all");
  const [scheduledOpen, setScheduledOpen] = useState(false);
  const scheduledLabel = SCHEDULED_OPTIONS.find((o) => o.key === scheduledKey)?.label ?? "All dates";

  const [hint, setHint] = useState<HintState>(null);
  // keeps the hint drawer's text stable while its exit animation plays
  const lastHintKind = useRef<HintKind>("minVisible");
  if (hint != null) lastHintKind.current = hint.kind;

  const wrapRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const sortSectionRef = useRef<HTMLDivElement>(null);
  const scheduledSectionRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement | null>());

  const { mounted, visible } = useMountTransition(menuOpen, 200);

  // Desktop: clicking outside the trigger + menu closes everything.
  useEffect(() => {
    if (mobile || !menuOpen) return;
    const onDown = (e: PointerEvent) => {
      // The dropdown lists live in a body portal — clicks inside them are
      // inside the menu, even though they are outside the wrap in the DOM.
      if ((e.target as Element).closest?.("[data-floating-list]") != null) return;
      if (wrapRef.current != null && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setSortListOpen(false);
        setScheduledOpen(false);
        setHint(null);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [mobile, menuOpen]);

  const showHint = (kind: HintKind, anchor: HTMLElement) => {
    const body = bodyRef.current;
    if (body == null) return;
    const b = body.getBoundingClientRect();
    const r = anchor.getBoundingClientRect();
    setHint({ kind, x: r.left + r.width / 2 - b.left, y: r.top - b.top });
  };

  // ---- columns ----
  const visibleCount = COLUMNS.length - hiddenKeys.length;
  const pinLimitReached = pinned.length >= PIN_LIMIT;

  const togglePin = (key: string) => {
    if (pinned.includes(key)) {
      // unpin → the column returns to the top of the unpinned group
      setPinned((p) => p.filter((k) => k !== key));
      setUnpinned((u) => [key, ...u]);
    } else if (!pinLimitReached) {
      setUnpinned((u) => u.filter((k) => k !== key));
      setPinned((p) => [...p, key]);
    }
  };

  const toggleVisible = (key: string, next: boolean) => {
    if (!next) {
      // the last visible column's switch is toggleDisabled, so this branch
      // only guards against races
      if (visibleCount === 1) return;
      setHiddenKeys((h) => [...h, key]);
      // a hidden column can not stay pinned
      if (pinned.includes(key)) {
        setPinned((p) => p.filter((k) => k !== key));
        setUnpinned((u) => [key, ...u]);
      }
    } else {
      setHiddenKeys((h) => h.filter((k) => k !== key));
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

  const reorder = (setList: typeof setPinned) => (from: number, to: number) =>
    setList((list) => {
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

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
    const isLastVisible = visibleCount === 1 && !hiddenKeys.includes(col.key);
    return (
      <ColumnRow
        key={col.key}
        label={col.label}
        checked={!hiddenKeys.includes(col.key)}
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
  const sortMeta = SORT_META[columnByKey(sortKey).type][sortAsc ? "asc" : "desc"];
  const shownColumns = useMemo(
    () => COLUMNS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
    [query],
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
          selected={c.key === sortKey}
          onClick={() => {
            setSortKey(c.key); // the direction is kept when the column changes
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

  const scheduledItems = (
    <SelectListItemGroup>
      {SCHEDULED_OPTIONS.map((o) => (
        <SelectListItem
          key={o.key}
          label={o.label}
          selected={o.key === scheduledKey}
          onClick={() => setScheduledKey(o.key)}
        />
      ))}
    </SelectListItemGroup>
  );

  // ---- the menu body (shared desktop / mobile) ----
  const body = (
    <div ref={bodyRef} className={styles.body}>
      <div className={styles.switcher}>
        <TabGroup variant="contained" size="lg" orientation="vertical" isFullWidth value={view} onChange={setView}>
          <TabItem value="table" icon="table">
            Table
          </TabItem>
          <TabItem value="cards" icon="grid-2">
            Cards
          </TabItem>
          <TabItem value="timeline" icon="regular-timeline-view" selectedIcon="solid-timeline-view" iconPack="custom">
            Timeline
          </TabItem>
        </TabGroup>
      </div>
      <Divider />
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
                  onClick={() => setSortAsc((a) => !a)}
                />
              </HoverTooltip>
              <SelectField
                fitContent
                value={columnByKey(sortKey).label}
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
      {view !== "timeline" && <Divider />}
      {view !== "timeline" && (
        <>
          <div ref={scheduledSectionRef} className={styles.sortSection}>
            <ListItem
              variant="title"
              title="Scheduled date"
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
          <Divider />
        </>
      )}
      {view === "table" ? (
        <div className={styles.columnsSection}>
          <div className={styles.columnsTitle}>
            <Label as="span">Columns</Label>
          </div>
          {pinned.length > 0 && <ItemGroup onReorder={reorder(setPinned)}>{pinned.map(columnRow)}</ItemGroup>}
          {pinned.length > 0 && <UnpinnedDivider />}
          <ItemGroup onReorder={reorder(setUnpinned)}>{unpinned.map(columnRow)}</ItemGroup>
        </div>
      ) : view === "cards" ? (
        <div className={styles.attrsSection}>
          <div className={styles.attrsTitle}>
            <Label as="span">Attributes</Label>
          </div>
          <div className={styles.attrChips}>
            {ATTRIBUTES.map((a) => (
              <Chip key={a.key} size="lg" active={activeAttrs.includes(a.key)} onClick={() => toggleAttr(a.key)}>
                {a.label}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.timelineSettings}>
            <div className={styles.settingBlock}>
              <span className={styles.settingTitle}>Orientation</span>
              <TabGroup
                variant="contained"
                size="lg"
                orientation="vertical"
                isFullWidth
                value={orientation}
                onChange={setOrientation}
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
              <TabGroup variant="contained" size="lg" isFullWidth value={timeFrame} onChange={setTimeFrame}>
                {TIME_FRAMES.map((f) => (
                  <TabItem key={f.key} value={f.key}>
                    {f.label}
                  </TabItem>
                ))}
              </TabGroup>
            </div>
          </div>
          <Divider />
          <div className={styles.timelineToggles}>
            {TIMELINE_TOGGLES.map((o) => (
              <ListItem
                key={o.key}
                isClickable
                toggle
                checked={timelineFlags[o.key]}
                onCheckedChange={(next) => setTimelineFlags((f) => ({ ...f, [o.key]: next }))}
                variant="title"
                title={o.label}
                className={styles.sortRow}
              />
            ))}
          </div>
        </>
      )}
      {!mobile && hint != null && renderHintBubble(hint)}
    </div>
  );

  // ---- mobile: drawer over the app, sort list as a second drawer ----
  if (mobile) {
    return (
      <div className={styles.mobileStage}>
        {!menuOpen && (
          <div className={styles.mobileTrigger}>
            <Button variant="subtle" size="md" leftIcon="sliders" onClick={() => setMenuOpen(true)}>
              View
            </Button>
          </div>
        )}
        {mounted && (
          <Popover drawer open={visible} onClose={() => setMenuOpen(false)} header={<DrawerHeader variant="dragHandle" />}>
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
        <SelectList
          variant="drawer"
          title="Scheduled date"
          breakpoint="mobile"
          open={scheduledOpen}
          onClose={() => setScheduledOpen(false)}
        >
          {scheduledItems}
        </SelectList>
      </div>
    );
  }

  // ---- desktop: trigger button + popover card, right-aligned, 4px gap ----
  return (
    <div className={styles.desktopStage}>
      <div ref={wrapRef} className={styles.triggerWrap}>
        <Button
          variant="subtle"
          size="md"
          leftIcon="sliders"
          isPressed={menuOpen}
          noDebounce
          onClick={() => setMenuOpen((o) => !o)}
        >
          View
        </Button>
        {mounted && (
          <div className={styles.popoverAnchor}>
            <Popover open={visible} className={clsx(styles.card)}>
              {body}
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}
