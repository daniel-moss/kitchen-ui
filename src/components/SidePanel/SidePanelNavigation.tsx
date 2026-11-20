import { Fragment, isValidElement, ReactNode, SyntheticEvent, useRef } from "react";
import clsx from "clsx";

import useHorizontalWheel from "../../hooks/useHorizontalWheel";

import SegmentedControl from "../SegmentedControl/SegmentedControl";
import TabGroup from "../Tabs/TabGroup";

import styles from "./SidePanelNavigation.module.scss";
import { SidePanelNavigationProps } from "./SidePanelNavigation.types";

// Both sets arrive as PROPS, so writing more than one child needs a fragment
// (`topLevel={<><Segment/><Segment/></>}`) — and TabGroup and SegmentedControl
// both read their children with Children.toArray, which does NOT look inside a
// fragment: every child would silently lose its value, its selection and its
// click. Unwrap one level of fragment before handing them over.
/** The scroller's 16px sides (its ::before / ::after spacers, `--size-4`). */
const EDGE_INSET = 16;

/**
 * Scrolls the object tabs so the tab under the event is fully visible — AND
 * its neighbours, so the user can see and reach the next tab (or, moving left,
 * the previous one) without scrolling by hand (Daniel, 2026-11-20). Happens
 * when a tab is clicked or reached with the keyboard, keeping the 16px inset
 * the row has at rest. Nothing moves when the tab and its neighbours are
 * already in view.
 *
 * On a row too narrow to show all three, the picked tab is centred, so a part
 * of each neighbour still shows on either side.
 */
function revealTab(event: SyntheticEvent<HTMLDivElement>) {
  const scroller = event.currentTarget;
  const tab = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
  if (tab == null || !scroller.contains(tab)) return;

  const tabs = Array.from(scroller.querySelectorAll<HTMLElement>('[role="tab"]'));
  const index = tabs.indexOf(tab);
  const previous = tabs[index - 1];
  const next = tabs[index + 1];

  const box = scroller.getBoundingClientRect();
  const rect = tab.getBoundingClientRect();
  const spanLeft = (previous ?? tab).getBoundingClientRect().left;
  const spanRight = (next ?? tab).getBoundingClientRect().right;

  const before = spanLeft - (box.left + EDGE_INSET);
  const after = spanRight - (box.right - EDGE_INSET);
  let delta: number;
  if (before < 0 && after > 0) {
    // The tab and both neighbours do not fit: centre the tab.
    delta = rect.left + rect.width / 2 - (box.left + box.width / 2);
  } else {
    delta = before < 0 ? before : after > 0 ? after : 0;
  }
  if (Math.abs(delta) < 1) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scroller.scrollBy({ left: delta, behavior: reduceMotion ? "auto" : "smooth" });
}

const unwrapFragment = (node: ReactNode): ReactNode =>
  isValidElement(node) && node.type === Fragment ? (node.props as { children?: ReactNode }).children : node;

// The SidePanel's navigation block, pinned under the header while the body
// scrolls. Two levels, two different controls (Figma 28952-41216):
//
//   Object row  (always)  UNDERLINED tabs, scrolling sideways when they
//                         overflow. 56px, 16px sides, a medium bottom divider.
//   Top level   (opt-in)  a full-width SegmentedControl ABOVE it, which
//                         switches WHICH OBJECT the panel shows — that row
//                         reconfigures the panel rather than navigating inside
//                         it (Daniel, 2026-09-30). 6px/16px padding and NO
//                         divider: the object row's line closes the block.
//
// The object tabs were PILL tabs until 2026-10-04.
export default function SidePanelNavigation({
  children,
  value,
  defaultValue,
  onChange,
  topLevel,
  topLevelValue,
  topLevelDefaultValue,
  onTopLevelChange,
  className,
}: SidePanelNavigationProps) {
  // A plain vertical mouse wheel scrolls the tabs sideways (no Shift needed).
  const scrollerRef = useRef<HTMLDivElement>(null);
  useHorizontalWheel(scrollerRef);

  return (
    <div className={clsx(styles.nav, className)}>
      {topLevel != null && (
        <div className={styles.topRow}>
          <SegmentedControl
            size="lg"
            isFullWidth
            value={topLevelValue}
            defaultValue={topLevelDefaultValue}
            onChange={onTopLevelChange}
            className={styles.topGroup}
          >
            {unwrapFragment(topLevel)}
          </SegmentedControl>
        </div>
      )}

      <div className={styles.row}>
        {/* The object tabs scroll sideways when they overflow; the scrollbar is
            hidden and there is no edge fade (Daniel, 2026-08-05). */}
        {/* Click covers the mouse and touch (Safari does not focus a button
            on click); focus covers the keyboard's arrow keys. */}
        <div ref={scrollerRef} className={styles.scroller} onClick={revealTab} onFocus={revealTab}>
          <TabGroup variant="underlined" value={value} defaultValue={defaultValue} onChange={onChange}>
            {unwrapFragment(children)}
          </TabGroup>
        </div>
      </div>
    </div>
  );
}
