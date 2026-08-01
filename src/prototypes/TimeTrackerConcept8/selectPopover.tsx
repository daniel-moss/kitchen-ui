import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import SelectList from "../../components/SelectList/SelectList";

import styles from "./selectPopover.module.scss";

// Wires a SelectField trigger to a SelectList: desktop = a floating card pinned
// under the trigger (portaled to <body> so it escapes the dialog's scroll),
// mobile = the SelectList's own drawer. Shared by the Job Details edit forms.

// Anchored position. `top` OR `bottom` is set (the card flips up when it would
// be cramped below the trigger); `maxHeight` keeps a ≥24px gap to the screen
// edge so a tall list scrolls internally instead of being clipped.
export interface SelectPopover {
  open: boolean;
  pos: { top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null;
  cardRef: RefObject<HTMLDivElement>;
  toggle: (el: HTMLElement) => void;
  close: () => void;
}

const GAP = 4; // trigger ↔ card
const EDGE = 24; // min gap to the screen edge (Daniel's rule)

export function useSelectPopover(mobile: boolean): SelectPopover {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<SelectPopover["pos"]>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const measure = (el: HTMLElement): SelectPopover["pos"] => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
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
  const close = () => setOpen(false);

  // Desktop: keep the card glued to the trigger on scroll/resize, and close on
  // an outside click (the trigger's own click toggles, so it is excluded).
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
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    // Capture phase: the Dialog card stops pointerdown from bubbling to the
    // document, so a bubble-phase listener never sees clicks inside the dialog.
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [open, mobile]);

  return { open, pos, cardRef, toggle, close };
}

// Renders the SelectList for a popover: mobile drawer or desktop anchored card.
export function SelectPopoverList({
  pop,
  mobile,
  title,
  multiSelect,
  searchable,
  searchPlaceholder,
  noResultsCaption,
  footer,
  children,
}: {
  pop: SelectPopover;
  mobile: boolean;
  title?: string;
  multiSelect?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsCaption?: string;
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
      multiSelect={multiSelect}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      noResultsCaption={noResultsCaption}
      footer={footer}
      // Desktop: match the trigger's width (the SelectField → SelectList rule).
      // maxWidth override too — the card's default max-width (384) would clamp a
      // wider trigger (e.g. the full-width Assignees select). maxHeight keeps the
      // list inside the screen (≥24px edge gap) so it scrolls instead of clipping.
      style={
        mobile || pop.pos == null
          ? undefined
          : { width: pop.pos.width, maxWidth: pop.pos.width, maxHeight: pop.pos.maxHeight }
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
      style={{ top: pop.pos.top, bottom: pop.pos.bottom, left: pop.pos.left }}
    >
      {list}
    </div>,
    document.body
  );
}
