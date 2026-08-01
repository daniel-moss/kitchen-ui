import clsx from "clsx";

import { Icon } from "../Icon/Icon";

import styles from "./ListItemSlotIcon.module.scss";
import { ListItemSlotIconProps } from "./ListItemSlotIcon.types";

// ListItemSlotIcon — the icon instance for a ListItem right slot: a fixed
// 32×32 box (matches the IconButton footprint, so mixed slots align) with a
// 14px regular icon in gray-a9. See Figma "ListItem › Slot Right Instance".
export default function ListItemSlotIcon({ icon, className }: ListItemSlotIconProps) {
  return (
    <span className={clsx(styles.box, className)} aria-hidden="true">
      <Icon icon={icon} pack="regular" size={14} />
    </span>
  );
}
