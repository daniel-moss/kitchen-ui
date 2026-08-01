import { MouseEvent as ReactMouseEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Icon } from "../../components/Icon/Icon";
import { IconPack } from "../../components/Icon/Icon.types";
import { toast } from "../../components/Toast/Toaster";

// Shared helpers of the Job Details prototype (used by the shell AND the
// details panel — keep them out of JobDetails.tsx to avoid import cycles).

export const noop = () => {};

/** MenuItem left icon (square 16px box). `pack` for kit custom icons. */
export const slot = (icon: string, pack?: IconPack) => <Icon icon={icon} pack={pack} container="square" />;

// Real copy — the clipboard API needs a secure context; the textarea fallback
// covers plain-http LAN testing on the phone. Success/failure show the
// designed toasts ('"<label>" copied' / detailed error).
export const copyText = async (text: string, label: string) => {
  try {
    if (navigator.clipboard != null) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) throw new Error("execCommand failed");
    }
    toast({ type: "neutral", icon: "copy", title: `"${label}" copied` });
  } catch {
    toast({
      type: "error",
      variant: "detailed",
      title: `Could not copy "${label}"`,
      caption: "Something went wrong. Please try again.",
    });
  }
};

export interface AnchoredMenuPos {
  top: number;
  left?: number;
  right?: number;
}

// Owns the open state + trigger wiring for a Menu anchored to a trigger
// button. Desktop: the Menu card renders in a fixed wrapper 4px below the
// trigger, aligned to its start or end edge; outside clicks close it (same
// pattern as NavSidebar's Create menu). Mobile (`outsideClose` FALSE): the
// drawer dismisses via its own scrim — a document-level pointerdown closer
// fires BEFORE the tap's click and kills every menu-item tap (see MOBILE.md).
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
    let left = align === "end" ? r.right - mw : r.left;
    if (mw > 0) left = Math.min(Math.max(m, left), window.innerWidth - mw - m);
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
  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
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
