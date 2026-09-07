import clsx from "clsx";

import styles from "./ChipGroup.module.scss";
import { ChipGroupProps } from "./ChipGroup.types";

// ChipGroup — the container for a row of Chips: they wrap onto more lines when
// the row runs out of width, with `--size-2` (8px) between them on both axes.
// `isFullWidth` flips to the stretch mode: one non-wrapping row where the
// chips share the width equally. Layout only: selection stays with the
// consumer, which sets each Chip's `active`. See Figma "ChipGroup"
// (node 29824-6190; isFullWidth variant added 2026-09-07).
export default function ChipGroup({ children, isFullWidth = false, className, ...rest }: ChipGroupProps) {
  return (
    <div className={clsx(styles.group, isFullWidth && styles.fullWidth, className)} {...rest}>
      {children}
    </div>
  );
}
