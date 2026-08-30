import clsx from "clsx";

import ProgressRing from "../Progress/ProgressRing";

import styles from "./ListItemSlotProgress.module.scss";
import { ListItemSlotProgressProps } from "./ListItemSlotProgress.types";

// ListItemSlotProgress — the progress instance for a ListItem right slot: a
// fixed 32×32 box (matches the IconButton footprint, so mixed slots align)
// holding a 16px ProgressRing. See Figma "ListItem › Progress Ring Container".
export default function ListItemSlotProgress({
  value = 0,
  color,
  isLoading = false,
  ariaLabel,
  className,
}: ListItemSlotProgressProps) {
  return (
    <span className={clsx(styles.box, className)}>
      <ProgressRing value={value} color={color} isLoading={isLoading} ariaLabel={ariaLabel} />
    </span>
  );
}
