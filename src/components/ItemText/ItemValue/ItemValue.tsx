import clsx from "clsx";

import { Icon } from "../../Icon/Icon";

import ItemTextLine from "../ItemText/ItemTextLine";

import styles from "./ItemValue.module.scss";
import { ItemValueProps } from "./ItemValue.types";

// ItemValue — a row's current value, changed in place. The ROW is the trigger;
// the value itself is not interactive. It is an ItemTextLine preset to
// bodyRegular, plus an "angles-up-down" chevron that says a list opens here —
// as opposed to a tag in the right text block, which means the value is only
// read here and changed somewhere else. A row never carries both chevrons.
// It goes in one of ListItem's right slots, not in the right text block, which
// is what lets a control sit before it. See Figma "ItemText › ItemValue".
export default function ItemValue({ value, color = "strong", slotLeft, className }: ItemValueProps) {
  return (
    <ItemTextLine
      label={value}
      textStyle="bodyRegular"
      color={color}
      slotLeft={slotLeft}
      slotRight={<Icon icon="angles-up-down" size={14} className={styles.chevron} />}
      // "wrap" rather than the default 1: the value never truncates, so it must
      // not get the ellipsis clamp or its hover tooltip. `.value` keeps it on
      // one line instead.
      lines="wrap"
      className={clsx(styles.value, className)}
    />
  );
}
