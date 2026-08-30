import clsx from "clsx";

import styles from "./ChipGroup.module.scss";
import { ChipGroupProps } from "./ChipGroup.types";

// ChipGroup — the container for a row of Chips: they wrap onto more lines when
// the row runs out of width, with `--size-2` (8px) between them on both axes.
// Layout only: selection stays with the consumer, which sets each Chip's
// `active`. See Figma "ChipGroup" (node 29520-32986).
export default function ChipGroup({ children, className, ...rest }: ChipGroupProps) {
  return (
    <div className={clsx(styles.group, className)} {...rest}>
      {children}
    </div>
  );
}
