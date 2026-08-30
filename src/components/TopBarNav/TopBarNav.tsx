import { ReactNode, UIEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import { Divider } from "../Divider/Divider";
import { TabGroupDefaultSizeContext } from "../Tabs/TabGroupDefaultSizeContext";
import TopBarNavLiveUsers from "./TopBarNavLiveUsers";
import TopBarNavRightElements from "./TopBarNavRightElements";

import styles from "./TopBarNav.module.scss";
import { TopBarNavProps } from "./TopBarNav.types";

// The design's tabs are TabGroup default / lg (36px). The size flows in
// through TabGroupDefaultSizeContext — context, not prop cloning, so it
// survives a consumer's wrapper component around the TabGroup; an explicit
// `size` on the TabGroup still wins.
function SizedTabs({ children }: { children: ReactNode }) {
  return <TabGroupDefaultSizeContext.Provider value="lg">{children}</TabGroupDefaultSizeContext.Provider>;
}

// The tabs scroller: tabs scroll horizontally when space is tight, with a
// 40px fade at the edge(s) where content continues behind the container
// (the doc's fade-out effect — list bars and the desktop details bar; the
// mobile details tabs row scrolls WITHOUT it).
function TabsScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setFade((f) => (f.left === left && f.right === right ? f : { left, right }));
  };

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  });

  // A plain vertical mouse wheel scrolls the tabs horizontally (no Shift
  // needed). Native non-passive listener — React's onWheel can't
  // preventDefault (it's registered passive).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // real horizontal input works natively
      if (el.scrollWidth <= el.clientWidth) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onScroll = (_e: UIEvent) => measure();

  return (
    <div
      ref={ref}
      className={clsx(
        styles.tabsScroller,
        fade.left && fade.right && styles.fadeBoth,
        fade.left && !fade.right && styles.fadeLeft,
        !fade.left && fade.right && styles.fadeRight,
      )}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
}

// TopBarNav — the page's top navigation bar (the TopBar family). `list` for
// object lists (title + phase tabs; search + create on the right), `details`
// for object details pages (back + title + context menu + navigation tabs +
// live users) and `inner` for inner pages (back + title only). On mobile the
// details tabs move to a second 60px bar row that hides while scrolling
// down. See Figma "TopBarNav" (node 22250-61596).
export default function TopBarNav(props: TopBarNavProps) {
  const { children, breakpoint = "auto", className } = props;
  const variant = props.variant ?? "list";
  const isDesktop = useIsDesktop(breakpoint);

  // Mobile details hide-on-scroll (always on — the doc's YouTube-like rule):
  // scrolling down slides the tabs row away; scrolling up (or reaching the
  // top) brings it back. Listens on the nearest scrollable ancestor.
  const barRef = useRef<HTMLDivElement>(null);
  const [barHidden, setBarHidden] = useState(false);
  const tabs = variant === "inner" ? undefined : props.tabs;
  const active = variant === "details" && !isDesktop && tabs != null;
  useEffect(() => {
    if (!active) {
      setBarHidden(false);
      return undefined;
    }
    const el = barRef.current;
    if (el == null) return undefined;
    let sc: HTMLElement | null = el.parentElement;
    while (sc != null && !(sc.scrollHeight > sc.clientHeight && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) {
      sc = sc.parentElement;
    }
    // Collapsing the tabs row changes layout — stop the browser's scroll
    // anchoring from compensating (it reads as a scroll and feeds back).
    const prevAnchor = sc?.style.overflowAnchor ?? "";
    if (sc != null) sc.style.overflowAnchor = "none";
    const read = () => (sc != null ? sc.scrollTop : window.scrollY);
    let last = read();
    let ignoreUntil = 0;
    const onScroll = () => {
      const y = read();
      const dy = y - last;
      last = y;
      // Our own collapse can clamp scrollTop near the bottom — ignore the
      // echoes while the height transition runs.
      if (performance.now() < ignoreUntil) return;
      if (y <= 0) setBarHidden(false);
      else if (dy > 2) {
        setBarHidden(true);
        ignoreUntil = performance.now() + 250;
      } else if (dy < -2) setBarHidden(false);
    };
    const target: HTMLElement | Window = sc ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      if (sc != null) sc.style.overflowAnchor = prevAnchor;
    };
  }, [active]);

  const barClass = clsx(styles.bar, active && styles.sticky, className);

  if (variant === "list") {
    return (
      <div ref={barRef} className={barClass}>
        <div className={styles.inner}>
          <div className={styles.navigation}>
            <div className={styles.leftElements}>{children}</div>
            {tabs != null && (
              <TabsScroller>
                <SizedTabs>{tabs}</SizedTabs>
              </TabsScroller>
            )}
          </div>
          <TopBarNavRightElements
            onSearch={props.onSearch}
            onCreate={props.onCreate}
            createLabel={props.createLabel}
            breakpoint={breakpoint}
          />
        </div>
        <Divider />
      </div>
    );
  }

  if (variant === "inner") {
    return (
      <div ref={barRef} className={barClass}>
        <div className={styles.inner}>
          <div className={styles.navigation}>
            <div className={styles.leftElements}>{children}</div>
          </div>
        </div>
        <Divider />
      </div>
    );
  }

  // details
  const liveUsers = props.liveUsers ?? [];
  return (
    <div ref={barRef} className={barClass}>
      <div className={styles.inner}>
        <div className={styles.navigation}>
          <div className={styles.leftElements}>{children}</div>
          {isDesktop && tabs != null && (
            <TabsScroller>
              <SizedTabs>{tabs}</SizedTabs>
            </TabsScroller>
          )}
        </div>
        <TopBarNavLiveUsers users={liveUsers} breakpoint={breakpoint} />
      </div>
      <Divider />
      {!isDesktop && tabs != null && (
        <div className={clsx(styles.tabsCollapse, barHidden && styles.tabsCollapsed)}>
          <div className={styles.tabsBar}>
            <SizedTabs>{tabs}</SizedTabs>
          </div>
          <Divider />
        </div>
      )}
    </div>
  );
}
