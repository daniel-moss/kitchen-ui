import {
  Children,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import { setRowDragActive } from "../../utils/dragLock";
import Button from "../Button/Button";
import { Divider } from "../Divider/Divider";
import { suppressListItemTaps } from "../ListItem/ListItem";

import itemStyles from "../ListItem/ListItem.module.scss";
import styles from "./ItemGroup.module.scss";
import { ItemGroupProps } from "./ItemGroup.types";

// Long-press anywhere on a row starts a drag (no need to aim at the grip):
// hold this long without moving further than the tolerance.
const LONG_PRESS_MS = 250;
const LONG_PRESS_TOLERANCE = 8;

// Geometry captured when a drag starts (positions relative to the root,
// measured BEFORE any shifts — the math below adds the shift offsets).
type DragGeometry = {
  from: number;
  grabOffset: number; // pointer y offset inside the dragged item
  grabOffsetX: number; // pointer x offset inside the dragged item (cards)
  rows: { top: number; bottom: number; left: number; right: number; width: number }[];
  target: number; // current drop index in the final (post-move) order
};

// What the drag visuals render: the lifted copy position + the item shifts.
type DragState = {
  from: number;
  copyTop: number;
  left: number;
  width: number;
  height: number; // dragged item height = the empty-slot size
  target: number;
};

// ItemGroup — the container for a group of ListItems (`view="list"`, default) or
// Cards (`view="cards"`, a wrap grid). Both views support an optional GroupLabel
// header, a bottom divider that separates stacked groups, accordion collapse via
// the header, truncation ("Show N more" — one-way), and drag-and-drop reorder
// (`onReorder`). The list view also has a `separated` variant (dividers between
// items). See Figma "ItemGroup".
export default function ItemGroup({
  children,
  view = "list",
  cardCountBasis,
  label,
  divider = false,
  separated = false,
  truncateAfter,
  onReorder,
  accordion = false,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  className,
  ...rest
}: ItemGroupProps) {
  const isCards = view === "cards";
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);
  // Truncation is two-way: "Show N more" expands, "Show less" collapses back.
  const [expanded, setExpanded] = useState(false);
  // Cards view: a uniform card width so a wrapped (short) row matches the first
  // row's card width (#8) — see the measuring effect below.
  const [cardWidth, setCardWidth] = useState<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragGeometry | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  // A pending long-press: cancelled by release, pointer loss, or moving
  // beyond the tolerance (that is a scroll / a normal drag intent).
  const pendingPress = useRef<{ cancel: () => void } | null>(null);

  // Unmounting with a press still pending: drop its timer + window listeners.
  useEffect(() => () => pendingPress.current?.cancel(), []);

  const items = Children.toArray(children);
  // Separated is a list-only variant.
  const isSeparated = separated && !isCards;
  // Truncation applies when there are more items than truncateAfter; it is
  // two-way (the button toggles `expanded`).
  const canTruncate = !isSeparated && truncateAfter != null && items.length > truncateAfter;
  const hiddenCount = canTruncate ? items.length - truncateAfter : 0;
  const shown = canTruncate && !expanded ? items.slice(0, truncateAfter) : items;

  // Cards view: measure a uniform card width. Columns = how many cards fit at
  // their min width (106); every card then takes the resulting width (capped at
  // 184), so a lone card on a wrapped row matches the first row (#8).
  useLayoutEffect(() => {
    if (!isCards) return undefined;
    const el = itemsRef.current;
    if (el == null || shown.length === 0) return undefined;
    const GAP = 12; // --size-3
    const MIN = 106;
    const MAX = 184;
    // Size columns to `cardCountBasis` when given (the module's fullest group)
    // so sibling groups share one card width; otherwise this group's own count.
    const n = cardCountBasis ?? shown.length;
    const compute = () => {
      const cs = getComputedStyle(el);
      const inner = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (inner <= 0) return;
      const cols = Math.max(1, Math.min(n, Math.floor((inner + GAP) / (MIN + GAP))));
      setCardWidth(Math.min(MAX, Math.floor((inner - (cols - 1) * GAP) / cols)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isCards, shown.length, cardCountBasis]);

  // ---- drag-and-drop reorder ----------------------------------------------
  // Two ways in: an immediate drag from a ListItem's grip handle, or a
  // long-press anywhere on the item (cards have no handle, so a card always
  // starts by long-press). While dragging, the dragged item leaves its place
  // (its wrapper goes invisible, keeping its slot), a lifted copy follows the
  // pointer, and the other items translate so the empty slot always sits at the
  // drop position. The layout size never changes. List = a vertical shift;
  // cards = a 2D shift into the new grid slot.
  const startDrag = (from: number, clientX: number, clientY: number) => {
    const container = itemsRef.current;
    const root = rootRef.current;
    if (container == null || root == null || dragRef.current != null) return;

    const rootRect = root.getBoundingClientRect();
    const fromRect = Array.from(container.children)[from].getBoundingClientRect();
    const geometry: DragGeometry = {
      from,
      grabOffset: clientY - fromRect.top,
      grabOffsetX: clientX - fromRect.left,
      rows: Array.from(container.children).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: r.top - rootRect.top,
          bottom: r.bottom - rootRect.top,
          left: r.left - rootRect.left,
          right: r.right - rootRect.left,
          width: r.width,
        };
      }),
      target: from,
    };
    dragRef.current = geometry;
    // Everyone else stands down while the drag runs: the Popover sheet must not
    // dismiss-drag along, and the release must not read as a tap.
    setRowDragActive(true);
    // Lift immediately — a long-press drag starts with the pointer still, and
    // without instant feedback the user can not tell the hold "took".
    setDrag({
      from,
      copyTop: clientY - geometry.grabOffset,
      left: isCards ? clientX - geometry.grabOffsetX : rootRect.left + geometry.rows[from].left,
      width: geometry.rows[from].width,
      height: geometry.rows[from].bottom - geometry.rows[from].top,
      target: from,
    });

    // A long-press drag begins MID-gesture: touch-action was already decided
    // at pointerdown (rows allow panning), so without this the first finger
    // move starts a native scroll and pointercancel kills the drag.
    const blockTouchScroll = (ev: TouchEvent) => ev.preventDefault();
    window.addEventListener("touchmove", blockTouchScroll, { passive: false });

    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      const rootEl = rootRef.current;
      if (d == null || rootEl == null) return;
      ev.preventDefault();
      const rect = rootEl.getBoundingClientRect();
      const height = d.rows[d.from].bottom - d.rows[d.from].top;
      let target = 0;
      if (isCards) {
        // 2D reading-order: a card is "before" the pointer when the pointer is
        // below its row, or on its row and past its horizontal center.
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        for (let i = 0; i < d.rows.length; i++) {
          if (i === d.from) continue;
          const r = d.rows[i];
          if (y > r.bottom || (y >= r.top && y <= r.bottom && x > (r.left + r.right) / 2)) target++;
        }
      } else {
        // Vertical list: how many OTHER rows sit above the pointer, compared at
        // their CURRENT (shifted) midpoints — the shift gives natural hysteresis.
        const y = ev.clientY - rect.top;
        for (let i = 0; i < d.rows.length; i++) {
          if (i === d.from) continue;
          let mid = (d.rows[i].top + d.rows[i].bottom) / 2;
          if (i > d.from && i <= d.target) mid -= height;
          else if (i >= d.target && i < d.from) mid += height;
          if (y > mid) target++;
        }
      }
      d.target = target;
      setDrag({
        from: d.from,
        // VIEWPORT coordinates — the lifted copy renders in a body portal
        // (position: fixed), so no scroll container can clip it. Cards follow
        // the pointer on both axes; list rows only on Y.
        copyTop: ev.clientY - d.grabOffset,
        left: isCards ? ev.clientX - d.grabOffsetX : rect.left + d.rows[d.from].left,
        width: d.rows[d.from].width,
        height,
        target,
      });
    };
    const finish = (commit: boolean) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("touchmove", blockTouchScroll);
      setRowDragActive(false);
      // The trailing click (fires right after this pointerup) must not toggle
      // the row / open the card. suppressListItemTaps covers ListItems; a card's
      // own onClick is a plain handler, so swallow the next click for cards.
      suppressListItemTaps(350);
      if (isCards) {
        const blockClick = (ev: MouseEvent) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        window.addEventListener("click", blockClick, { capture: true, once: true });
        window.setTimeout(() => window.removeEventListener("click", blockClick, true), 400);
      }
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!commit || d == null) return;
      if (d.target !== d.from && onReorder != null) onReorder(d.from, d.target);
    };
    const up = () => finish(true);
    const cancel = () => finish(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  };

  const beginLongPress = (from: number, e: ReactPointerEvent<HTMLDivElement>) => {
    pendingPress.current?.cancel();
    const start = { x: e.clientX, y: e.clientY };
    const last = { x: e.clientX, y: e.clientY };
    const cancel = () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", cancel);
      window.removeEventListener("pointercancel", cancel);
      pendingPress.current = null;
    };
    const onMove = (ev: PointerEvent) => {
      last.x = ev.clientX;
      last.y = ev.clientY;
      if (Math.abs(ev.clientX - start.x) > LONG_PRESS_TOLERANCE || Math.abs(ev.clientY - start.y) > LONG_PRESS_TOLERANCE) {
        cancel();
      }
    };
    const timer = window.setTimeout(() => {
      cancel();
      startDrag(from, last.x, last.y);
    }, LONG_PRESS_MS);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", cancel);
    window.addEventListener("pointercancel", cancel);
    pendingPress.current = { cancel };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (onReorder == null || isSeparated || e.button !== 0 || !e.isPrimary || drag != null) return;
    const container = itemsRef.current;
    if (container == null) return;
    const target = e.target as Element;

    let row: Element | null = target;
    while (row != null && row.parentElement !== container) row = row.parentElement;
    const from = row == null ? -1 : Array.from(container.children).indexOf(row);
    if (from < 0) return;

    if (target.closest("[data-listitem-handle]") != null) {
      e.preventDefault(); // no text selection / focus steal while dragging
      // A row drag must stay a row drag: without this, the pointer events also
      // reach an enclosing Popover drawer, which starts dragging the whole
      // sheet down along with the row.
      e.stopPropagation();
      startDrag(from, e.clientX, e.clientY);
      return;
    }
    if (isCards) {
      // Cards have no handle → long-press starts the drag. But a press on a
      // real control inside the card (the ⋯ menu button, a link) must NOT
      // hijack into a drag — its click would then fire on release.
      if (target.closest("button, a, input, select, textarea") != null) return;
    } else {
      // Long-press path — from anywhere on the row EXCEPT the interactive slots:
      // hijacking a held button (a pin, a real switch) into a drag would also
      // let its click fire on release, over whatever it lands on.
      if (target.closest(`.${itemStyles.slotStop}`) != null || target.closest(`.${itemStyles.slotBottom}`) != null) return;
    }
    beginLongPress(from, e);
  };

  // Reorderable items get a wrapper the group owns; the consumer's elements stay
  // untouched inside. While dragging, the dragged wrapper turns invisible (its
  // space = the empty drop slot) and the others translate so the slot follows
  // the target. Transforms only: the layout size never changes.
  const renderReorderRows = () =>
    shown.map((item, i) => {
      let style: React.CSSProperties | undefined;
      if (drag != null) {
        if (i === drag.from) style = { visibility: "hidden" };
        else if (i > drag.from && i <= drag.target) style = { transform: `translateY(${-drag.height}px)` };
        else if (i >= drag.target && i < drag.from) style = { transform: `translateY(${drag.height}px)` };
      }
      return (
        <div
          key={(isValidElement(item) && item.key) || i}
          className={clsx(styles.row, drag != null && styles.rowAnimated)}
          style={style}
        >
          {item}
        </div>
      );
    });

  // Cards view: each card sits in a flex cell (106–184px). During a drag the
  // dragged cell hides in place and the others translate to their new grid slot
  // (2D FLIP — each cell's delta = target slot rect − its own start rect).
  const renderCards = () =>
    shown.map((item, i) => {
      const style: React.CSSProperties = {};
      if (cardWidth != null) {
        // Fixed, uniform width — overrides the flex:1 fallback so every card
        // (incl. a lone one on a wrapped row) is the measured first-row width.
        style.width = cardWidth;
        style.flexGrow = 0;
        style.flexShrink = 0;
        style.flexBasis = "auto";
      }
      if (drag != null && dragRef.current != null) {
        if (i === drag.from) {
          style.visibility = "hidden";
        } else {
          const rows = dragRef.current.rows;
          const order = shown.map((_, k) => k).filter((k) => k !== drag.from);
          order.splice(drag.target, 0, drag.from); // final visual order of the slots
          const slot = order.indexOf(i);
          style.transform = `translate(${rows[slot].left - rows[i].left}px, ${rows[slot].top - rows[i].top}px)`;
        }
      }
      return (
        <div
          key={(isValidElement(item) && item.key) || i}
          className={clsx(styles.cardCell, drag != null && styles.rowAnimated)}
          style={style}
        >
          {item}
        </div>
      );
    });

  const content = isCards
    ? renderCards()
    : isSeparated
      ? items.flatMap((item, i) => (i === 0 ? [item] : [<Divider key={`divider-${i}`} padding="var(--size-1) 0" />, item]))
      : onReorder != null
        ? renderReorderRows()
        : shown;

  const header =
    accordion && isValidElement(label)
      ? cloneElement(label as ReactElement<Record<string, unknown>>, {
          accordion: true,
          open: isOpen,
          onOpenChange: setOpen,
          disabled,
        })
      : label;

  const body = (
    <>
      <div
        ref={itemsRef}
        className={clsx(
          isCards ? styles.cardItems : styles.items,
          onReorder != null && styles.reorderable,
          drag != null && styles.itemsDragging,
        )}
        onPointerDown={onReorder != null ? onPointerDown : undefined}
        // Android fires contextmenu on a long-press — that must not interrupt
        // (or pop a menu over) a pending or running row drag.
        onContextMenu={(e) => {
          if (pendingPress.current != null || drag != null) e.preventDefault();
        }}
      >
        {content}
      </div>
      {canTruncate && (
        <div className={styles.showMore}>
          {expanded ? (
            <Button
              variant="ghost"
              size="lg"
              isFullWidth
              leftIcon="regular-collapse"
              leftIconPack="custom"
              onClick={() => setExpanded(false)}
            >
              Show less
            </Button>
          ) : (
            <Button variant="ghost" size="lg" isFullWidth leftIcon="angles-up-down" onClick={() => setExpanded(true)}>
              Show {hiddenCount} more
            </Button>
          )}
        </div>
      )}
    </>
  );

  return (
    <div ref={rootRef} role="group" className={clsx(styles.root, className)} {...rest}>
      {label != null && (
        <div className={clsx(styles.header, accordion && !isOpen && styles.headerClosed)}>{header}</div>
      )}
      {accordion ? (
        <div className={clsx(styles.collapse, isOpen && styles.collapseOpen)}>
          <div className={styles.collapseInner}>{body}</div>
        </div>
      ) : (
        body
      )}
      {divider && <Divider padding="0 var(--size-4)" />}
      {/* The lifted copy = the dragged child cloned into its "dragging" look,
          rendered in a body portal (fixed position) so no overflow ancestor —
          e.g. a drawer's scrolling body — can clip it. List items take
          isDragging (their card look); cards take Card's `dragging` prop. */}
      {drag != null &&
        isValidElement(shown[drag.from]) &&
        createPortal(
          <div className={styles.dragCopy} style={{ top: drag.copyTop, left: drag.left, width: drag.width }} aria-hidden="true">
            {cloneElement(
              shown[drag.from] as ReactElement<Record<string, unknown>>,
              isCards ? { dragging: true } : { isDragging: true, disabled: false },
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
