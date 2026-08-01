import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import SelectList from "../../components/SelectList/SelectList";
import { SelectListEmptyState } from "../../components/SelectList/SelectList.types";

import styles from "./selectPopover.module.scss";

// Wires a SelectField trigger to a SelectList: desktop = a floating card pinned
// under the trigger (portaled to <body> so it escapes the dialog's scroll),
// mobile = the SelectList's own drawer. Shared by the Job Details edit forms.

// Anchored position. `top` OR `bottom` is set (the card flips up when it would
// be cramped below the trigger); `maxHeight` keeps a ≥24px gap to the screen
// edge so a tall list scrolls internally instead of being clipped.
export interface SelectPopover {
  open: boolean;
  pos: {
    top?: number;
    bottom?: number;
    left?: number;
    /** Distance from the RIGHT viewport edge ("left" placement). */
    right?: number;
    /** Match the trigger's width ("below" placement only). */
    width?: number;
    maxWidth?: number;
    maxHeight: number;
  } | null;
  cardRef: RefObject<HTMLDivElement>;
  toggle: (el: HTMLElement) => void;
  /** Open anchored to `el` WITHOUT toggling — for autocompletes that open on typing. */
  openAt: (el: HTMLElement) => void;
  close: () => void;
}

const GAP = 4; // trigger ↔ card
const EDGE = 24; // min gap to the screen edge (Daniel's rule)

/**
 * Desktop placements: "below" (default) pins the card under the trigger at the
 * trigger's width (the SelectField rule); "left" pins it to the trigger's LEFT,
 * top edges aligned, at the card's natural width (the icon-button-anchored
 * lists, e.g. the New-location Labels picker — Figma 25810-6069).
 */
export type SelectPopoverPlacement = "below" | "left";

export function useSelectPopover(mobile: boolean, placement: SelectPopoverPlacement = "below"): SelectPopover {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<SelectPopover["pos"]>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const measure = (el: HTMLElement): SelectPopover["pos"] => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (placement === "left") {
      // Card's right edge 4px left of the trigger, top edges aligned, natural
      // width (clamped so it never leaves the screen).
      return {
        top: r.top,
        right: window.innerWidth - r.left + GAP,
        maxWidth: Math.max(160, r.left - GAP - EDGE),
        maxHeight: Math.max(160, vh - r.top - EDGE),
      };
    }
    const below = vh - r.bottom - GAP - EDGE; // room under the trigger
    const above = r.top - GAP - EDGE; // room over the trigger
    // Flip up only when it is cramped below AND there is more room above.
    const openUp = below < 240 && above > below;
    return openUp
      ? { bottom: vh - r.top + GAP, left: r.left, width: r.width, maxHeight: Math.max(160, above) }
      : { top: r.bottom + GAP, left: r.left, width: r.width, maxHeight: Math.max(160, below) };
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
  const openAt = (el: HTMLElement) => {
    triggerRef.current = el;
    if (!mobile) setPos(measure(el));
    setOpen(true);
  };
  const close = () => setOpen(false);

  // Desktop: the card is measured ONCE when it opens and stays FIXED there —
  // it deliberately does NOT follow a trigger that moves from layout changes
  // (e.g. badges pushing the labels plus-button; Daniel, 2026-07-28). No
  // scroll re-measure either: growing dialog content emits scroll events,
  // which dragged the card along. Only a window RESIZE re-measures (the whole
  // layout legitimately moved). Outside clicks close (the trigger's own click
  // toggles, so it is excluded).
  useEffect(() => {
    if (!open || mobile) return undefined;
    const update = () => {
      if (triggerRef.current != null) setPos(measure(triggerRef.current));
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (cardRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("resize", update);
    // Capture phase: the Dialog card stops pointerdown from bubbling to the
    // document, so a bubble-phase listener never sees clicks inside the dialog.
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", onDown, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mobile]);

  return { open, pos, cardRef, toggle, openAt, close };
}

// Renders the SelectList for a popover: mobile drawer or desktop anchored card.
export function SelectPopoverList({
  pop,
  mobile,
  title,
  caption,
  multiSelect,
  searchable,
  searchPlaceholder,
  noResultsCaption,
  createFromSearch,
  state,
  emptyState,
  footer,
  children,
}: {
  pop: SelectPopover;
  mobile: boolean;
  title?: string;
  caption?: string;
  multiSelect?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsCaption?: string;
  createFromSearch?: { label: string; onCreate: (query: string) => void };
  state?: "default" | "empty" | "noResults";
  emptyState?: SelectListEmptyState;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const list = (
    <SelectList
      variant={mobile ? "drawer" : "inline"}
      breakpoint={mobile ? "mobile" : "desktop"}
      open={pop.open}
      onClose={pop.close}
      title={title}
      caption={caption}
      multiSelect={multiSelect}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      noResultsCaption={noResultsCaption}
      createFromSearch={createFromSearch}
      state={state}
      emptyState={emptyState}
      footer={footer}
      // Desktop: match the trigger's width (the SelectField → SelectList rule).
      // maxWidth override too — the card's default max-width (384) would clamp a
      // wider trigger (e.g. the full-width Assignees select). maxHeight keeps the
      // list inside the screen (≥24px edge gap) so it scrolls instead of clipping.
      style={
        mobile || pop.pos == null
          ? undefined
          : pop.pos.width != null
            ? { width: pop.pos.width, maxWidth: pop.pos.width, maxHeight: pop.pos.maxHeight }
            : { maxWidth: pop.pos.maxWidth, maxHeight: pop.pos.maxHeight }
      }
    >
      {children}
    </SelectList>
  );

  if (mobile) return list;
  if (pop.pos == null) return null;
  return createPortal(
    <div
      ref={pop.cardRef}
      className={styles.selectAnchor}
      style={{ top: pop.pos.top, bottom: pop.pos.bottom, left: pop.pos.left, right: pop.pos.right }}
    >
      {list}
    </div>,
    document.body
  );
}
