import { RefObject, useEffect } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keep Tab / Shift+Tab cycling inside `containerRef` while `active`, and move
// focus into the container when it activates (the first focusable element).
// For true modals (Dialog, Prompt) — page content behind the scrim must not
// be reachable by keyboard. The initial focus retries on a short timer: the
// overlay (and the Popover inside it) mounts a few frames after `active`
// flips because of the mount transitions, so the content appears late.
export default function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;

    let timer = 0;
    let attempts = 0;
    const tryInitialFocus = () => {
      const container = containerRef.current;
      const first = container?.querySelector<HTMLElement>(FOCUSABLE);
      if (container == null || !first) {
        if (attempts++ < 30) timer = window.setTimeout(tryInitialFocus, 16);
        return;
      }
      // Only a FALLBACK: never steal focus the content already placed inside
      // the trap itself (a SelectList dialog's search autofocus, an autoFocus
      // field). Both that autofocus and this trap poll on mount timers — in
      // either winning order, the content's own focus must be the survivor.
      if (container.contains(document.activeElement)) return;
      first.focus();
    };
    timer = window.setTimeout(tryInitialFocus, 0);

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const current = document.activeElement;

      if (e.shiftKey) {
        if (current === firstEl || !container.contains(current)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else if (current === lastEl || !container.contains(current)) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handler);
    };
  }, [containerRef, active]);
}
