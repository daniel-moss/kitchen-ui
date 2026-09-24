import clsx from "clsx";

import ItemTextBlock from "./ItemTextBlock";

import styles from "./ItemText.module.scss";
import { ItemTextProps } from "./ItemText.types";

// ItemText — the text region of a row: the left text block (flattened props,
// fills and truncates) and an optional right block (hugs, never truncates),
// 16px apart and vertically centered. Shared: ListItem, SelectListItem,
// DisplayModule and MenuItem all build their copy from it, so the text styles,
// colors and slots are defined once. It has no height of its own — the row
// component sets that. See Figma "ItemText".
export default function ItemText({ right, className, ...blockProps }: ItemTextProps) {
  const left = <ItemTextBlock {...blockProps} align="left" className={styles.left} />;

  if (right == null) return <div className={clsx(styles.row, className)}>{left}</div>;

  return (
    <div className={clsx(styles.row, className)}>
      {left}
      <div className={styles.right}>{right}</div>
    </div>
  );
}
