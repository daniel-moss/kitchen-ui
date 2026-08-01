import clsx from "clsx";

import styles from "./SkeletonTypography.module.scss";
import { SkeletonTypographyProps } from "./SkeletonTypography.types";

// Replaces a text layer while content loads. The outer span matches the text's
// line box (the variant container height) so the layout does not shift; the
// inner bar is the visible placeholder, vertically centered in that line box.
export function SkeletonTypography({ variant, width = "100%", className }: SkeletonTypographyProps) {
  return (
    <span className={clsx(styles.container, styles[variant], className)} style={{ width }}>
      <span className={styles.bar} />
    </span>
  );
}
