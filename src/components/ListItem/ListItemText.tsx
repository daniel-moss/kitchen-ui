import clsx from "clsx";

import ListItemTextLeft from "./ListItemTextLeft";

import styles from "./ListItemText.module.scss";
import { ListItemTextProps } from "./ListItemText.types";

// ListItemText — the text region of a ListItem: the left text block (flex-1,
// truncates) and an optional right block (hugs), 16px apart. Without a right
// block it is just the left text at full width. See Figma "ListItem › Content Text".
export default function ListItemText({ variant, title, caption, titleLines, captionLines, titleClassName, captionClassName, captionSlotLeft, right, className }: ListItemTextProps) {
  const left = (
    <ListItemTextLeft
      variant={variant}
      title={title}
      caption={caption}
      titleLines={titleLines}
      captionLines={captionLines}
      titleClassName={titleClassName}
      captionClassName={captionClassName}
      captionSlotLeft={captionSlotLeft}
      className={styles.left}
    />
  );

  if (right == null) return <div className={clsx(styles.row, className)}>{left}</div>;

  return (
    <div className={clsx(styles.row, className)}>
      {left}
      <div className={styles.right}>{right}</div>
    </div>
  );
}
