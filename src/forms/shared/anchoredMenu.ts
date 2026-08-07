import { MouseEvent as ReactMouseEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

export interface AnchoredMenuPos {
  top: number;
  left?: number;
  right?: number;
}

// Owns the open state + trigger wiring for a Menu anchored to a trigger
// button. Desktop: the Menu card renders in a fixed wrapper 4px below the
// trigger, aligned to its start edge by default; outside clicks close it (same
// pattern as NavSidebar's Create menu). Mobile (`outsideClose` FALSE): the
// drawer dismisses via its own scrim — a document-level pointerdown closer
// fires BEFORE the tap's click and kills every menu-item tap (see MOBILE.md).
//
// Placement rule (Daniel, 2026-08-07): the menu hangs from the trigger's LEFT
// edge; only when it does not fit does it try the other edge, and clamping to
// the viewport is the last resort. Vertically it flips above the trigger when
// there is no room below.
export function useAnchoredMenu(outsideClose: boolean, align: "start" | "end" = "start") {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<AnchoredMenuPos | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Place the menu card below the trigger (aligned to its start/end edge), but
  // FLIP it above when it would overflow the viewport bottom, and CLAMP it
  // horizontally — so a menu on a bottom row / near an edge stays reachable.
  // Needs the card's measured size, so it runs from a layout effect once open.
  const place = () => {
    const el = triggerRef.current;
    if (el == null) return;
    const r = el.getBoundingClientRect();
    const card = cardRef.current;
    const m = 8; // keep this far from the viewport edges
    const mh = card?.offsetHeight ?? 0;
    const mw = card?.offsetWidth ?? 0;
    const below = r.bottom + 4;
    const flipUp = mh > 0 && below + mh > window.innerHeight - m && r.top - 4 - mh >= m;
    const top = flipUp ? r.top - 4 - mh : below;
    // Preferred edge first; if the card does not fit there, try the opposite
    // edge; if neither fits, clamp inside the viewport.
    const preferred = align === "end" ? r.right - mw : r.left;
    const alternate = align === "end" ? r.left : r.right - mw;
    let left = preferred;
    if (mw > 0) {
      const fits = (x: number) => x >= m && x + mw <= window.innerWidth - m;
      if (!fits(preferred) && fits(alternate)) left = alternate;
      left = Math.min(Math.max(m, left), window.innerWidth - mw - m);
    }
    setPos({ top, left });
  };

  const onActions = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (open) {
      setOpen(false);
      return;
    }
    triggerRef.current = e.currentTarget;
    // Rough initial position (the card is not measurable yet); the layout
    // effect below refines it — flip / clamp — before paint.
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: align === "end" ? r.right : r.left });
    setOpen(true);
  };

  // Accurate placement once the card is rendered + measurable; keep it glued to
  // the trigger while open on any scroll (capture — panel/sidebar scroll
  // containers, not just the window) and on resize.
  //
  // The card is also WATCHED for its own size changes. Menu is
  // content-adaptive (160–384px) and settles its width AFTER this layout
  // effect, so the first measurement can read the 160px minimum — an
  // end-aligned menu then sat 80px too far right, overflowing its trigger and
  // reading as centred (Daniel spotted it on the form preview panel,
  // 2026-08-06). Re-placing on every resize of the card fixes that, and any
  // later content change with it.
  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    const observer = new ResizeObserver(() => place());
    if (cardRef.current != null) observer.observe(cardRef.current);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align]);

  // Desktop: clicking outside the card closes (the trigger's own click
  // toggles instead — ignored here so it does not close-then-reopen).
  useEffect(() => {
    if (!open || !outsideClose) return undefined;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (cardRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, outsideClose]);

  return { open, pos, cardRef, onActions, close: () => setOpen(false) };
}
