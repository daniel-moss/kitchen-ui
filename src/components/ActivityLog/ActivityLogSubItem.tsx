import clsx from "clsx";
import { ReactNode } from "react";

import { Divider } from "../Divider/Divider";
import { Icon } from "../Icon/Icon";

import ActivityLogValue from "./ActivityLogValue";
import styles from "./ActivityLogSubItem.module.scss";
import { ActivityLogSubItemProps } from "./ActivityLogSubItem.types";

const isEmpty = (value: ReactNode) => value == null || value === "";

// ActivityLogSubItem — one detail inside an open log, under its own low divider
// (Figma "Sublog"). Usually how one field changed: the field name over
// `old value → new value`. Without a title it is the caption alone, in the
// spacious style — a text field changed on its own (`title = false`).
export default function ActivityLogSubItem({
  title,
  oldValue,
  oldIcon,
  newValue,
  newIcon,
  newIconColor,
  isUnchanged = false,
  caption,
  emptyText = "No value",
  className,
  ...rest
}: ActivityLogSubItemProps) {
  const hasTitle = title != null;
  const oldEmpty = isEmpty(oldValue);
  const newEmpty = isEmpty(newValue);

  // The new value on its own — after the arrow, or alone when unchanged.
  const current = newEmpty ? (
    <span className={styles.empty}>{emptyText}</span>
  ) : (
    <ActivityLogValue icon={newIcon} iconColor={newIconColor} isLeading={isUnchanged}>
      {newValue}
    </ActivityLogValue>
  );

  const change =
    caption != null ? (
      caption
    ) : isUnchanged ? (
      // An unchanged field (DS doc "Sub-logs"): its value only, no arrow.
      current
    ) : (
      <>
        <span className={styles.oldValue}>
          {/* The old value opens the line: no space before its icon. */}
          <ActivityLogValue icon={oldEmpty ? undefined : oldIcon} isLeading>
            {oldEmpty ? emptyText : oldValue}
          </ActivityLogValue>
        </span>
        {/* Before an icon the value brings its own 6px — no word space. */}
        {!newEmpty && newIcon != null ? " →" : " → "}
        {current}
      </>
    );

  return (
    <div className={clsx(styles.root, className)} {...rest}>
      <Divider />
      {hasTitle ? (
        <div className={styles.content}>
          <span className={styles.icon} aria-hidden="true">
            <Icon icon="arrow-turn-down-right" size={14} />
          </span>
          <div className={styles.text}>
            <span className={styles.title}>{title}</span>
            <span className={styles.caption}>{change}</span>
          </div>
        </div>
      ) : (
        <div className={styles.captionSpacious}>{change}</div>
      )}
    </div>
  );
}
