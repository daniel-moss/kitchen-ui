import { Children, ReactElement, ReactNode, isValidElement } from "react";

import clsx from "clsx";

import { Divider } from "../Divider/Divider";

import styles from "./ValueDisplayGroup.module.scss";
import { ValueDisplayGroupProps } from "./ValueDisplayGroup.types";

const isVertical = (child: ReactNode) =>
  isValidElement(child) && (child as ReactElement<{ orientation?: string }>).props.orientation === "vertical";

// ValueDisplayGroup — a list of label–value pairs, usually inside a
// DisplayModule. The doc's rules are enforced by the component: horizontal
// pairs are grouped first (4px apart), vertical pairs always follow, and
// every vertical pair is its own section — sections are separated by a
// Divider with 12px on both sides. Consumers just pass ValueDisplays in any
// order. See Figma "ValueDisplayGroup".
export default function ValueDisplayGroup({ children, className }: ValueDisplayGroupProps) {
  const items = Children.toArray(children);
  const horizontal = items.filter((c) => !isVertical(c));
  const vertical = items.filter(isVertical);

  const blocks: ReactNode[] = [];
  if (horizontal.length > 0) {
    blocks.push(
      <div key="horizontal" className={styles.horizontalGroup}>
        {horizontal}
      </div>,
    );
  }
  blocks.push(...vertical);

  return (
    <div role="group" className={clsx(styles.group, className)}>
      {blocks.flatMap((block, i) => (i === 0 ? [block] : [<Divider key={`divider-${i}`} />, block]))}
    </div>
  );
}
