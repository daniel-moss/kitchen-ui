import clsx from "clsx";

import ListItemText from "./ListItemText";

import styles from "./ListItemContent.module.scss";
import { ListItemContentProps } from "./ListItemContent.types";

// ListItemContent — the content region of a ListItem: an optional left slot
// (an xl / 36px Avatar, any type) before the text region. Top-aligned; the
// slot's 2px vertical padding centers the 36px avatar against the 40px text
// block. See Figma "ListItem › Content".
export default function ListItemContent({ avatar, className, ...textProps }: ListItemContentProps) {
  return (
    <div className={clsx(styles.content, className)}>
      {avatar != null && <span className={styles.slotLeft}>{avatar}</span>}
      <ListItemText {...textProps} className={styles.text} />
    </div>
  );
}
