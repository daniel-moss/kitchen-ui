import clsx from "clsx";

import styles from "./ListItemTextRight.module.scss";
import { ListItemTextRightProps } from "./ListItemTextRight.types";

// ListItemTextRight — the right text block of a ListItem: title / title +
// caption (either order) / a single tag line. Right-aligned; the texts hug
// their content (the LEFT block is the one that truncates). Single-line
// variants keep the 40px row height. See Figma "ListItem › Content Text Right".
export default function ListItemTextRight({ variant = "title", title, caption, tag, className }: ListItemTextRightProps) {
  const titleLine = title != null ? <span className={styles.title}>{title}</span> : null;
  const captionLine = caption != null ? <span className={styles.caption}>{caption}</span> : null;
  const singleLine = variant === "title" || variant === "tag";

  return (
    <div className={clsx(styles.text, singleLine && styles.singleLine, className)}>
      {variant === "tag" ? (
        <span className={styles.tag}>{tag}</span>
      ) : variant === "titleCaptionReversed" ? (
        <>
          {captionLine}
          {titleLine}
        </>
      ) : (
        <>
          {titleLine}
          {variant === "titleCaption" && captionLine}
        </>
      )}
    </div>
  );
}
