import { MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";

import { Icon } from "../../components/Icon/Icon";
import { toast } from "../../components/Toast/Toaster";

// Shared helpers of the Job Details prototype (used by the shell AND the
// details panel — keep them out of JobDetails.tsx to avoid import cycles).

export const noop = () => {};

/** MenuItem left icon (square 16px box). */
export const slot = (icon: string) => <Icon icon={icon} container="square" />;

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

  const measure = (el: HTMLElement): AnchoredMenuPos => {
    const rect = el.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: align === "start" ? rect.left : undefined,
      right: align === "end" ? window.innerWidth - rect.right : undefined,
    };
  };

  const onActions = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (open) {
      setOpen(false);
      return;
    }
    triggerRef.current = e.currentTarget;
    setPos(measure(e.currentTarget));
    setOpen(true);
  };

  // The menu must stay glued to its trigger: re-measure while open on any
  // scroll (capture — the sidebar/panel scroll containers, not the window)
  // and on resize. Same pattern as NavSidebar's Create menu.
  useEffect(() => {
    if (!open) return undefined;
    const update = () => {
      const el = triggerRef.current;
      if (el != null) setPos(measure(el));
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
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
