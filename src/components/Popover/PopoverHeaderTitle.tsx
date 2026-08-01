import clsx from "clsx";

import TruncatingText from "../Tooltip/TruncatingText";

import styles from "./PopoverHeaderTitle.module.scss";
import { PopoverHeaderTitleProps } from "./PopoverHeaderTitle.types";

// The Title part of a PopoverHeader: a title with optional left slot (Icon) and
// right slot (Icon or HintTrigger). Slots are spaced --size-2 from the text.
export default function PopoverHeaderTitle({
  title,
  titleClassName,
  leftSlot,
  rightSlot,
  className,
}: PopoverHeaderTitleProps) {
  return (
    <div className={clsx(styles.row, className)}>
      {leftSlot && <span className={styles.left}>{leftSlot}</span>}
      <TruncatingText text={title} className={clsx(styles.title, titleClassName)} />
      {rightSlot && <span className={styles.right}>{rightSlot}</span>}
    </div>
  );
}
