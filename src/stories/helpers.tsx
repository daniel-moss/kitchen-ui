import { CSSProperties, ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

import { ListItemTextLines } from "../components/ListItem/ListItemTextLeft.types";
import { DrawerRootContext } from "../components/Popover/DrawerRootContext";

// Shared Storybook helpers — import these instead of re-declaring them in
// every *.stories.tsx.

export const noop = () => {};

/**
 * The docs-page story frame (Daniel's spec, 2026-07-29): every story embedded
 * in a component's MDX docs page wraps its content in this — it mirrors the
 * Figma Documentation "Preview" frame. Fills the docs content column (700px
 * total, border-box) with --size-20 (80px) padding inside; centered in the
 * standalone story view. Pair it with `parameters: { layout: "fullscreen" }`
 * on the stories' meta — the frame provides the ONLY padding ("padded" would
 * stack Storybook's own on top).
 */
export const docsFrame: CSSProperties = {
  boxSizing: "border-box",
  maxWidth: 700,
  padding: "var(--size-20)",
  margin: "0 auto",
};

/** Wrapper version of `docsFrame` for docs-page stories. */
export const DocsFrame = ({ children }: { children: ReactNode }) => <div style={docsFrame}>{children}</div>;

/** Caption label above an example (state names, combo names). */
export const cap: CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

/**
 * storybook-addon-pseudo-states classes for a WRAPPER around the example —
 * every element inside is marked (fine when the example has no slot children
 * whose :hover/:active is excluded by the component).
 */
export const PSEUDO_ALL: Record<string, string> = {
  hover: "pseudo-hover-all",
  press: "pseudo-active-all",
  focus: "pseudo-focus-visible-all",
};

/**
 * Pseudo-state classes for the example element ITSELF (pass via className).
 * Use these when the component excludes slot hover/press via :has() — the
 * -all variants would mark the slots too and suppress the row state.
 */
export const PSEUDO_SELF: Record<string, string> = {
  hover: "pseudo-hover",
  press: "pseudo-active",
  focus: "pseudo-focus-visible",
};

// ---- device frame ------------------------------------------------------

export const STATUS_BAR = 44;

// The reserved home-indicator zone. Daniel measured 44px on his device
// (current iOS) — the classic 34px value is outdated there.
export const HOME_INDICATOR = 44;

interface DeviceFrameProps {
  children: ReactNode;
  /** Show the mock iOS status bar (time / 5G). Default false. */
  statusBar?: boolean;
  /** Show the mock home-indicator bar. Default false. */
  homeIndicator?: boolean;
  /** The faux page text behind the drawer. Default on. */
  pageText?: string;
}

/**
 * A 375×812 device frame for drawer stories. It is the position:relative
 * ancestor the Popover scrim fills, and it sets --popover-drawer-top-inset
 * so the drawer never covers the (mock) status bar.
 */
export const DeviceFrame = ({ children, statusBar = false, homeIndicator = false, pageText = "App content behind the drawer." }: DeviceFrameProps) => {
  // Modal drawers (Dialog / Prompt / nested SelectList) portal to <body>,
  // outside this frame, so they can't inherit the container vars below. Mirror
  // the mock insets onto :root while the frame is mounted so those drawers get
  // the same 44px home-indicator zone the in-frame drawers use.
  useLayoutEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--popover-drawer-top-inset", `${STATUS_BAR}px`);
    root.setProperty("--popover-drawer-bottom-inset", `${HOME_INDICATOR}px`);
    if (statusBar) root.setProperty("--phone-safe-top", `${STATUS_BAR}px`);
    if (homeIndicator) root.setProperty("--phone-safe-bottom", `${HOME_INDICATOR}px`);
    return () => {
      root.removeProperty("--popover-drawer-top-inset");
      root.removeProperty("--popover-drawer-bottom-inset");
      root.removeProperty("--phone-safe-top");
      root.removeProperty("--phone-safe-bottom");
    };
  }, [statusBar, homeIndicator]);

  const [rootEl, setRootEl] = useState<Element | null>(null);

  return (
  <DrawerRootContext.Provider value={rootEl}>
  <div
    ref={setRootEl}
    data-drawer-root
    style={
      {
        position: "relative",
        width: 375,
        height: 812,
        overflow: "hidden",
        borderRadius: 24,
        background: "var(--surface-level-first)",
        boxShadow: "0 0 0 1px var(--gray-a4)",
        "--popover-drawer-top-inset": `${STATUS_BAR}px`,
        "--popover-drawer-bottom-inset": `${HOME_INDICATOR}px`, // mock iOS home-indicator zone
        // Safe-area vars for app shells (JobDetails, …) — set only while the
        // matching mock chrome is visible, so shells without it get no gap.
        ...(statusBar ? { "--phone-safe-top": `${STATUS_BAR}px` } : null),
        ...(homeIndicator ? { "--phone-safe-bottom": `${HOME_INDICATOR}px` } : null),
      } as CSSProperties
    }
  >
    {statusBar && (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: STATUS_BAR,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 var(--size-5)",
          font: "var(--font-caption-medium-500)",
          color: "var(--text-strong)",
          pointerEvents: "none",
        }}
      >
        <span>9:41</span>
        <span style={{ color: "var(--text-subtle)" }}>5G</span>
      </div>
    )}
    <div
      style={{
        padding: `${STATUS_BAR + 8}px var(--size-4) var(--size-4)`,
        font: "var(--font-body-400-compact)",
        color: "var(--text-subtle)",
      }}
    >
      {pageText}
    </div>
    {children}
    {homeIndicator && (
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 134,
          height: 5,
          borderRadius: 3,
          background: "var(--gray-a8)",
          zIndex: 2,
        }}
      />
    )}
  </div>
  </DrawerRootContext.Provider>
  );
};

// ---- ListItem text truncation options (shared by the ListItem stories) ----
export const LINES: ListItemTextLines[] = [1, 2, 3, "wrap"];

// ---- real-device container ---------------------------------------------

// Full-device container for testing on a REAL phone.
//
// CRITICAL (learned on device, 2026-07-18): it must render in NORMAL FLOW
// (position: relative) with a CSS `height: 100vh`, NOT position:fixed with a
// JS-measured height. In iOS standalone the layout viewport that `position:fixed`
// and `bottom:0` resolve against is `window.innerHeight` (~768 = screen minus the
// status bar), NOT the physical screen (812). So a FIXED element's `bottom:0`
// lands ~44px ABOVE the home indicator and can never reach behind it. A
// normal-flow `height:100vh` block, by contrast, genuinely fills the physical
// 812 — and, because it makes the document 812 tall, the layout viewport itself
// resolves to 812, so even body-portaled fixed drawers (Dialog/Prompt) then reach
// the true bottom. This mirrors the proven bare-HTML prototypes and IndicatorTest.
export const PhoneViewport = ({ children }: { children: ReactNode }) => {
  const [rootEl, setRootEl] = useState<Element | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainerRef = (el: HTMLDivElement | null) => {
    containerRef.current = el;
    setRootEl(el);
  };
  // Home-screen app? Drives 100vh (standalone, full-screen) vs 100dvh (browser
  // tab, tracks the Safari toolbar). Fixed at mount — it does not change.
  const [standalone] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true),
  );
  // iPad standalone quirk (found on device, 2026-07-22): the page draws BEHIND
  // the status bar, but iPadOS reports a layout viewport (and 100vh) that does
  // NOT match the physical screen — a plain 100vh block leaves a dead strip at
  // the bottom, and 100vh + the top inset overshoots. So on iPad we size the
  // block to the MEASURED physical screen height: screen.width/height are the
  // hardware size in CSS px; pick per orientation with max/min so it works
  // whether or not iPadOS rotates the reported values. The document then equals
  // the physical screen exactly and iOS resolves the layout viewport to it
  // (same mechanism as the iPhone 100vh fix). iPhone stays plain 100vh — its
  // 100vh already IS the physical screen. iPadOS masquerades as "Macintosh" in
  // the UA; the maxTouchPoints check tells it apart from a real Mac.
  const [isIPad] = useState(
    () =>
      typeof navigator !== "undefined" &&
      (/iPad/.test(navigator.userAgent) ||
        (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)),
  );
  const measurePhysicalHeight = () => {
    const portrait = window.matchMedia("(orientation: portrait)").matches;
    return portrait
      ? Math.max(window.screen.width, window.screen.height)
      : Math.min(window.screen.width, window.screen.height);
  };
  const [iPadHeight, setIPadHeight] = useState<number | null>(() =>
    standalone && isIPad ? measurePhysicalHeight() : null,
  );
  useEffect(() => {
    if (!(standalone && isIPad)) return undefined;
    const update = () => setIPadHeight(measurePhysicalHeight());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standalone, isIPad]);
  useEffect(() => {
    const measureEnv = (expr: string) => {
      const probe = document.createElement("div");
      probe.style.cssText = `position:fixed;height:${expr};width:1px;visibility:hidden`;
      document.body.appendChild(probe);
      const v = probe.getBoundingClientRect().height;
      probe.remove();
      return v;
    };
    const update = () => {
      // Publish the real safe-area insets on :root for the body-portaled drawers
      // (Dialog / Prompt / their nested SelectList) — they render OUTSIDE this
      // container and read these vars for their indicator strip / top clearance.
      // With cover working these are just env(): 34px bottom, 44px top.
      const sab = measureEnv("env(safe-area-inset-bottom, 0px)");
      const sat = measureEnv("env(safe-area-inset-top, 0px)");
      const root = document.documentElement.style;
      root.setProperty("--popover-drawer-bottom-inset", `${Math.round(sab)}px`);
      root.setProperty("--phone-safe-bottom", `${Math.round(sab)}px`);
      root.setProperty("--popover-drawer-top-inset", `${Math.round(sat)}px`);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    const t1 = setTimeout(update, 300);
    const t2 = setTimeout(update, 1000);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
      clearTimeout(t1);
      clearTimeout(t2);
      const root = document.documentElement.style;
      root.removeProperty("--popover-drawer-bottom-inset");
      root.removeProperty("--phone-safe-bottom");
      root.removeProperty("--popover-drawer-top-inset");
    };
  }, [standalone]);
  return (
    <DrawerRootContext.Provider value={rootEl}>
    {/* Let 100vh fill the physical screen — strip Storybook's canvas padding /
        min-height so the device block starts at the top edge and is exactly
        one viewport tall. The document MUST stay a real, scrollable 100vh page:
        that is what makes iOS resolve the layout viewport to the full physical
        812 (a non-scrollable / overflow-hidden document collapses back to ~768
        and drawers stop above the home indicator). */}
    <style>{`
      body:has([data-drawer-root]) { margin: 0; }
      #storybook-root:has([data-drawer-root]),
      .sb-show-main:has([data-drawer-root]) { margin: 0 !important; padding: 0 !important; min-height: 0 !important; }
      /* Kill the iOS rubber-band bounce when dragging non-scrollable areas
         (e.g. the NavSidebar): overscroll-behavior stops the chain/bounce
         WITHOUT locking the document's scrollability — an overflow:hidden lock
         here would collapse the standalone layout viewport and re-break the
         home-indicator fix (see the height comment below). */
      html:has([data-drawer-root]),
      body:has([data-drawer-root]) { overscroll-behavior: none; }
    `}</style>
    <div
      ref={setContainerRef}
      data-drawer-root
      style={
        {
          position: "relative",
          width: "100%",
          // Normal-flow full-viewport height. MUST be 100vh in standalone (NOT
          // 100dvh): only 100vh produces the tall 812 document that makes iOS
          // resolve the layout viewport to the full physical screen so drawers
          // reach behind the home indicator. 100dvh (and any overflow lock)
          // collapses it back to ~768 and floats drawers above the indicator.
          // Browser tab keeps 100dvh so the bottom bar clears the Safari toolbar.
          // iPad standalone: neither 100vh nor 100vh+inset matches the physical
          // screen — use the MEASURED screen height (see isIPad above).
          height: standalone ? (iPadHeight != null ? `${iPadHeight}px` : "100vh") : "100dvh",
          // Clip drawers/content to the device edges (they are absolute inside).
          overflow: "hidden",
          background: "var(--surface-level-first)",
        } as CSSProperties
      }
    >
      {children}
    </div>
    </DrawerRootContext.Provider>
  );
};
