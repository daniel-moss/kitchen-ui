import { ReactNode, UIEvent, useLayoutEffect, useRef, useState } from "react";

import clsx from "clsx";

import { Divider } from "../Divider/Divider";
import { TabGroupDefaultSizeContext } from "../Tabs/TabGroupDefaultSizeContext";
import TopBarNavLiveUsers from "./TopBarNavLiveUsers";
import { TopBarNavLoadingContext } from "./TopBarNavLoadingContext";

import styles from "./TopBarNav.module.scss";
import { TopBarNavProps } from "./TopBarNav.types";

// The design's tabs are TabGroup default / lg (36px). The size flows in
// through TabGroupDefaultSizeContext — context, not prop cloning, so it
// survives a consumer's wrapper component around the TabGroup; an explicit
// `size` on the TabGroup still wins.
function SizedTabs({ children }: { children: ReactNode }) {
  return <TabGroupDefaultSizeContext.Provider value="lg">{children}</TabGroupDefaultSizeContext.Provider>;
}

// The tabs scroller: the tabs hug the title, and scroll horizontally when the
// row runs out of room, with a 40px fade at the edge(s) where content
// continues behind the container (the doc's fade-out effect).
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

// TopBarNav — the page's top navigation bar (the TopBar family): an optional
// back button, the title with its two slots, and an optional group of actions
// at the right end, over a MEDIUM Divider (`--gray-a4` — it was the low
// default until 2026-10-04, which read lighter than the bars stacked under
// it). One 60px row, always the same height, so
// the bar lines up with the bars beside it. The three page types — object
// list, object details, inner page — are compositions of these slots, not
// variants of the component. See Figma "TopBarNav" (node 23681-71465).
export default function TopBarNav({
  children,
  tabs,
  liveUsers,
  actions,
  isLoading = false,
  breakpoint = "auto",
  className,
}: TopBarNavProps) {
  // Loading suppresses everything that depends on the page's data. The back
  // button is not data, so it stays — TopBarNavLeftElements keeps it.
  const showTabs = !isLoading && tabs != null;
  const showLiveUsers = !isLoading && liveUsers != null && liveUsers.length > 0;
  const showActions = !isLoading && actions != null;

  return (
    <TopBarNavLoadingContext.Provider value={isLoading}>
      <div className={clsx(styles.bar, className)}>
        <div className={styles.inner}>
          {/* The navigation cluster: [left elements] 16px [tabs OR live users].
              Both sit beside the title, at both breakpoints. */}
          <div className={styles.navigation}>
            <div className={styles.leftElements}>{children}</div>
            {showTabs && (
              <TabsScroller>
                <SizedTabs>{tabs}</SizedTabs>
              </TabsScroller>
            )}
            {showLiveUsers && <TopBarNavLiveUsers users={liveUsers} breakpoint={breakpoint} />}
          </div>
          {showActions && <div className={styles.actions}>{actions}</div>}
        </div>
        <Divider contrast="medium" />
      </div>
    </TopBarNavLoadingContext.Provider>
  );
}
