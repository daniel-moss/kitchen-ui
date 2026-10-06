import { Fragment, isValidElement, ReactNode } from "react";
import clsx from "clsx";

import SegmentedControl from "../SegmentedControl/SegmentedControl";
import TabGroup from "../Tabs/TabGroup";

import styles from "./SidePanelNavigation.module.scss";
import { SidePanelNavigationProps } from "./SidePanelNavigation.types";

// Both sets arrive as PROPS, so writing more than one child needs a fragment
// (`topLevel={<><Segment/><Segment/></>}`) — and TabGroup and SegmentedControl
// both read their children with Children.toArray, which does NOT look inside a
// fragment: every child would silently lose its value, its selection and its
// click. Unwrap one level of fragment before handing them over.
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
        <div className={styles.scroller}>
          <TabGroup variant="underlined" value={value} defaultValue={defaultValue} onChange={onChange}>
            {unwrapFragment(children)}
          </TabGroup>
        </div>
      </div>
    </div>
  );
}
