import { RefObject, useLayoutEffect } from "react";

// A plain vertical mouse wheel scrolls a horizontal scroller sideways — no
// Shift needed. Real horizontal input (a trackpad swipe, Shift + wheel) is
// left to the browser, and a row that does not overflow lets the wheel scroll
// the page as usual.
//
// A native non-passive listener: React's onWheel is registered passive, so
// it cannot preventDefault the page scroll.
//
// Used by every horizontally scrolling tab row: TopBarNav, TopBarView and
// SidePanelNavigation (added there 2026-11-20).
export default function useHorizontalWheel(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref]);
}
