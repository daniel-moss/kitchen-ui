import { Children } from "react";
import clsx from "clsx";

import { Divider } from "../Divider/Divider";
import EmptyState from "../EmptyState/EmptyState";

import styles from "./SelectListItemGroup.module.scss";
import { SelectListItemGroupProps } from "./SelectListItemGroup.types";

// SelectListItemGroup — groups SelectListItems inside a select menu: an
// optional padded GroupLabel header, the items stack (4px padding), and an
// optional bottom divider (16px inset) separating it from the next group.
// Pairing rule: primary GroupLabel + "object" items; secondary GroupLabel +
// "default" items. See Figma "SelectListItemGroup".
export default function SelectListItemGroup({ children, label, emptyCaption, divider = true, className, ...rest }: SelectListItemGroupProps) {
  // A group with no options at all shows the caption-only EmptyState. Search
  // never lands here: SelectList's filter DROPS groups it empties, so this is
  // only the "this group really has none" case.
  const isEmpty = Children.toArray(children).length === 0;

  return (
    <div role="group" className={clsx(styles.group, className)} {...rest}>
      {label != null && <div className={styles.header}>{label}</div>}
      <div className={styles.items}>{isEmpty && emptyCaption != null ? <EmptyState caption={emptyCaption} /> : children}</div>
      {divider && (
        <div className={styles.dividerWrap}>
          <Divider />
        </div>
      )}
    </div>
  );
}
