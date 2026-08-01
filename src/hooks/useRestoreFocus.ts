import { RefObject, useEffect, useRef } from "react";

// While `active`, remember the element that had focus when the overlay
// opened, and give focus back to it when the overlay deactivates. Keeps
// keyboard users anchored to the trigger that opened a Dialog / Menu /
// SelectList.
//
// Pass `containerRef` (the overlay layer) when available: at close time the
// overlay is usually still mounted (exit animation) with focus inside it, and
// the container check recognizes that case. Without it, focus is restored
// only when it was already lost to the body.
export default function useRestoreFocus(active: boolean, containerRef?: RefObject<HTMLElement | null>) {
  const previous = useRef<HTMLElement | null>(null);
  const hadVisibleFocus = useRef(false);
  const wasActive = useRef(false);

  // Capture during RENDER, at the exact moment the overlay turns active —
  // effects run later, and an overlay that focuses its own content on open
  // (e.g. the SelectList search autofocus) would already hold focus by then.
  // An effect-time capture then memorizes the overlay's OWN input, and the
  // close "restores" focus into the dying overlay (on iOS that also scrolls
  // the page toward it — a visible bounce).
  if (active && !wasActive.current) {
    const el = document.activeElement as HTMLElement | null;
    previous.current = el;
    // Was the trigger's focus VISIBLE (keyboard) when the overlay opened?
    // Touch/mouse triggers have no ring — and must not gain one on restore.
    try {
      hadVisibleFocus.current = el?.matches(":focus-visible") ?? false;
    } catch {
      hadVisibleFocus.current = false;
    }
  }
  wasActive.current = active;

  useEffect(() => {
    if (!active) return;
    return () => {
      const target = previous.current;
      if (!target) return;
      // never restore INTO the closing overlay itself (a stale capture)
      if (containerRef?.current?.contains(target) === true) return;
      const current = document.activeElement;
      const inOverlay = containerRef?.current ? containerRef.current.contains(current) : false;
      // Restore when focus is inside the (closing) overlay or already lost —
      // never steal it from somewhere else the user has clicked. preventScroll:
      // restoring must not scroll the page (iOS bounces otherwise).
      if (inOverlay || current === document.body || current === null) {
        target.focus({ preventScroll: true });
        // Safari paints :focus-visible on PROGRAMMATIC focus even after a
        // touch/mouse interaction — the trigger then shows a phantom focus
        // ring (Daniel saw it surface once a covering toast dismissed). If
        // the trigger had no visible focus at open, it must not gain one.
        try {
          if (!hadVisibleFocus.current && target.matches(":focus-visible")) target.blur();
        } catch {
          /* :focus-visible unsupported — keep focus as is */
        }
      }
    };
  }, [active, containerRef]);
}
