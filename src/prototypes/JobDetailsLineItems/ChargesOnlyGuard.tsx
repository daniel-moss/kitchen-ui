import { ReactNode, useEffect, useRef } from "react";

// "CHARGES ONLY" (Daniel, 2026-11-16): in the line-items user test, every
// control on the page is inert EXCEPT the Charges segment's modules.
//
// One listener on the page, in the capture phase, swallows clicks and keys whose
// target is NOT inside the segment (`data-charges-segment`, set by
// ChargesSegment). The page still looks and scrolls exactly like the real one —
// nothing is greyed out; the click simply does nothing.
//
// What the segment OPENS (select lists, line forms, Delete prompts, menus on
// mobile, the labor rate side panel) is portalled OUTSIDE this wrapper, so it
// never reaches this listener and stays fully usable.

const ALLOWED = "[data-charges-segment]";

/** Keys that only move focus or scroll — let them through. */
const PASS_KEYS = new Set(["Tab", "Shift", "PageUp", "PageDown", "Home", "End"]);

export default function ChargesOnlyGuard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (root == null) return;
    const outside = (e: Event) => !(e.target instanceof Element && e.target.closest(ALLOWED) != null);
    const block = (e: Event) => {
      if (!outside(e)) return;
      if (e instanceof KeyboardEvent && PASS_KEYS.has(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const events = ["click", "keydown"] as const;
    events.forEach((type) => root.addEventListener(type, block, true));
    return () => events.forEach((type) => root.removeEventListener(type, block, true));
  }, []);
  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
