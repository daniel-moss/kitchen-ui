import clsx from "clsx";

import SelectListItemCopy from "./SelectListItemCopy";
import { SelectListItemCopyProps } from "./SelectListItemCopy.types";

import styles from "./SelectListItemContent.module.scss";
import { SelectListItemContentProps } from "./SelectListItemContent.types";

// SelectListItemContent — the content region of a SelectListItem: an optional
// left slot (icon / xs avatar) and the copy (label + optional caption / tag).
// Top-aligned. See Figma "SelectListItem › Content".
export default function SelectListItemContent({ slotLeft, label, caption, tag, className, ...rest }: SelectListItemContentProps) {
  // caption / tag are mutually exclusive at the prop level; re-wrap for Copy's union.
  const copyProps = { caption, tag } as SelectListItemCopyProps;
  return (
    <div className={clsx(styles.content, className)} {...rest}>
      {slotLeft != null && <span className={styles.slotLeft}>{slotLeft}</span>}
      <SelectListItemCopy className={styles.copy} label={label} {...copyProps} />
    </div>
  );
}
