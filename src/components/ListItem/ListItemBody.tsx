import clsx from "clsx";

import ListItemContent from "./ListItemContent";

import styles from "./ListItemBody.module.scss";
import { ListItemBodyProps } from "./ListItemBody.types";

// ListItemBody — the body of a ListItem: the content region plus an optional
// right slot (up to 3 instances, 8px apart, centered on the 40px row, 12px
// gap to the content). Top-aligned, so the slot stays on the first row when
// the text wraps. See Figma "ListItem › Body".
export default function ListItemBody({ slotRight, className, ...contentProps }: ListItemBodyProps) {
  return (
    <div className={clsx(styles.body, className)}>
      <ListItemContent {...contentProps} className={styles.content} />
      {slotRight != null && <div className={styles.slotRight}>{slotRight}</div>}
    </div>
  );
}
