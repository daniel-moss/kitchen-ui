import clsx from "clsx";

import styles from "./PopoverHeaderContent.module.scss";
import { PopoverHeaderContentProps } from "./PopoverHeaderContent.types";

// The Content of a PopoverHeader: an optional Avatar (xl), the Text block, and
// an optional Actions slot (up to 2 md ghost IconButtons).
export default function PopoverHeaderContent({
  children,
  avatar,
  actions,
  className,
}: PopoverHeaderContentProps) {
  return (
    <div className={clsx(styles.content, className)}>
      {avatar && <span className={styles.avatar}>{avatar}</span>}
      <div className={styles.text}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
