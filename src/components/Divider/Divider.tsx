import clsx from "clsx";

import styles from "./Divider.module.scss";
import { DividerProps } from "./Divider.types";

// A 1px separator line (2px when dashed). Pure presentation. The line sits in a
// padded box, so `padding` insets it on all sides. Vertical dividers need a
// parent that gives them a height (e.g. a flex row with stretch).
export function Divider({
  orientation = "horizontal",
  contrast = "low",
  dashed = false,
  padding,
  className,
  style,
  ...rest
}: DividerProps) {
  return (
    <div
      className={clsx(
        styles.divider,
        styles[orientation],
        styles[contrast],
        { [styles.dashed]: dashed },
        className,
      )}
      style={{ padding, ...style }}
      {...rest}
    >
      <span className={styles.line} />
    </div>
  );
}
