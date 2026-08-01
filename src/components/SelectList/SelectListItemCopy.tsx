import clsx from "clsx";

import styles from "./SelectListItemCopy.module.scss";
import { SelectListItemCopyProps } from "./SelectListItemCopy.types";

// SelectListItemCopy — the text block of a SelectListItem: the label, an optional
// tag to its right (label truncates first), and an optional caption below. See
// Figma "SelectListItem › Copy".
export default function SelectListItemCopy({ label, caption, tag, className, ...rest }: SelectListItemCopyProps) {
  return (
    <div className={clsx(styles.copy, className)} {...rest}>
      <div className={styles.titleRow}>
        <span className={styles.title}>{label}</span>
        {tag != null && <span className={styles.tag}>{tag}</span>}
      </div>
      {caption != null && <span className={styles.caption}>{caption}</span>}
    </div>
  );
}
