import clsx from "clsx";

import TruncatingText from "../Tooltip/TruncatingText";

import styles from "./PopoverHeaderCaption.module.scss";
import { PopoverHeaderCaptionProps } from "./PopoverHeaderCaption.types";

// The Caption part of a PopoverHeader: a caption with optional left and right
// Icon slots, spaced --size-2 from the text.
export default function PopoverHeaderCaption({
  caption,
  leftSlot,
  rightSlot,
  className,
}: PopoverHeaderCaptionProps) {
  return (
    <div className={clsx(styles.row, className)}>
      {leftSlot && <span className={styles.left}>{leftSlot}</span>}
      <TruncatingText text={caption} className={styles.caption} />
      {rightSlot && <span className={styles.right}>{rightSlot}</span>}
    </div>
  );
}
