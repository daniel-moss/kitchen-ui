import clsx from "clsx";

import { Icon } from "../Icon/Icon";

import styles from "./ActivityLogSubItem.module.scss";
import { ActivityLogSubItemProps } from "./ActivityLogSubItem.types";

// ActivityLogSubItem — one line of event detail inside an expanded log. Usually
// "how one field changed": the field name over `old value → new value`, the old
// value struck through. See Figma "Sublog".
export default function ActivityLogSubItem({
  title,
  oldValue,
  newValue,
  caption,
  emptyText = "No value",
  className,
  ...rest
}: ActivityLogSubItemProps) {
  const change =
    caption != null ? (
      caption
    ) : (
      <>
        <span className={styles.oldValue}>{oldValue ?? emptyText}</span>
        {" → "}
        {newValue != null ? <span className={styles.newValue}>{newValue}</span> : emptyText}
      </>
    );

  return (
    <div className={clsx(styles.root, className)} {...rest}>
      <span className={styles.icon}>
        <Icon icon="arrow-turn-down-right" size={14} />
      </span>
      <div className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.caption}>{change}</span>
      </div>
    </div>
  );
}
