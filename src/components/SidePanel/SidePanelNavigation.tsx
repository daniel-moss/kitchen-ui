import { Fragment, isValidElement, ReactNode } from "react";
import clsx from "clsx";

import TabGroup from "../Tabs/TabGroup";

import styles from "./SidePanelNavigation.module.scss";
import { SidePanelNavigationProps } from "./SidePanelNavigation.types";

// Both tab sets arrive as PROPS, so writing more than one tab needs a fragment
// (`topLevel={<><TabItem/><TabItem/></>}`) — and TabGroup reads its children
// with Children.toArray, which does NOT look inside a fragment: every tab would
// silently lose its value, its selection and its click. Unwrap one level of
// fragment before handing the tabs over.
const unwrapFragment = (node: ReactNode): ReactNode =>
  isValidElement(node) && node.type === Fragment ? (node.props as { children?: ReactNode }).children : node;

// The SidePanel's navigation block, pinned under the header while the body
// scrolls. One row of object tabs (TabGroup default / md, scrolls sideways when
// it overflows), plus — when `topLevel` is passed — a second row above it with
// the top-level sections (TabGroup contained / lg, full width). Each row is
// 52px tall with 16px sides and its own bottom divider. See Figma "SidePanel →
// Parts → Navigation".
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
        <div className={styles.row}>
          <TabGroup
            variant="contained"
            size="lg"
            isFullWidth
            value={topLevelValue}
            defaultValue={topLevelDefaultValue}
            onChange={onTopLevelChange}
            className={styles.topGroup}
          >
            {unwrapFragment(topLevel)}
          </TabGroup>
        </div>
      )}

      <div className={styles.row}>
        {/* The object tabs scroll sideways when they overflow; the scrollbar is
            hidden and there is no edge fade (Daniel, 2026-08-05). */}
        <div className={styles.scroller}>
          <TabGroup variant="default" size="md" value={value} defaultValue={defaultValue} onChange={onChange}>
            {unwrapFragment(children)}
          </TabGroup>
        </div>
      </div>
    </div>
  );
}
