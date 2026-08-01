import { UIEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import { Divider } from "../Divider/Divider";
import NavTopBarLiveUsers from "./NavTopBarLiveUsers";
import NavTopBarRightElements from "./NavTopBarRightElements";

import styles from "./NavTopBar.module.scss";
import { NavTopBarProps } from "./NavTopBar.types";

// The desktop tabs scroller: tabs scroll horizontally when space is tight,
// with a fade at the edge(s) where content continues behind the container
// (the doc's fade-out effect — desktop only; mobile scrolls without it).
function TabsScroller({ children }: { children: React.ReactNode }) {
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

// NavTopBar — the page's top navigation bar. `list` (object lists: title on
// the left; live users + search + create on the right) or `details` (object
// details pages: back + ID + actions, navigation tabs, live users). On
// mobile the details tabs move to a second 52px bar row. See Figma
// "NavTopBar".
export default function NavTopBar(props: NavTopBarProps) {
  const { children, liveUsers = [], hideOnScroll = false, breakpoint = "auto", className } = props;
  const variant = props.variant ?? "list";
  const isDesktop = useIsDesktop(breakpoint);

  // Mobile hide-on-scroll (the doc's YouTube-like rule): scrolling down
  // slides the top row away; scrolling up (or reaching the top) brings it
  // back. Listens on the nearest scrollable ancestor.
  const barRef = useRef<HTMLDivElement>(null);
  const [barHidden, setBarHidden] = useState(false);
  const active = hideOnScroll && !isDesktop;
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
          <div className={styles.left}>{children}</div>
          <NavTopBarRightElements
            avatars={liveUsers}
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

  // details
  const tabs = props.tabs;
  return (
    <div ref={barRef} className={barClass}>
      <div className={styles.inner}>
        {isDesktop ? (
          <div className={styles.navigation}>
            <div className={styles.leftElements}>{children}</div>
            {tabs != null && <TabsScroller>{tabs}</TabsScroller>}
          </div>
        ) : (
          <div className={styles.left}>{children}</div>
        )}
        <NavTopBarLiveUsers users={liveUsers} breakpoint={breakpoint} />
      </div>
      <Divider />
      {!isDesktop && tabs != null && (
        <div className={clsx(styles.tabsCollapse, active && barHidden && styles.tabsCollapsed)}>
          <div className={styles.tabsBar}>{tabs}</div>
          <Divider />
        </div>
      )}
    </div>
  );
}
