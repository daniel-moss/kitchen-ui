import clsx from "clsx";

import PopoverHeaderBody from "./PopoverHeaderBody";
import { Divider } from "../Divider/Divider";

import styles from "./PopoverHeader.module.scss";
import { PopoverHeaderProps } from "./PopoverHeader.types";

// The full PopoverHeader: the Body row plus a full-width Divider at the bottom.
// No background of its own — it sits on whatever popover surface contains it.
export default function PopoverHeader({ children, className, divider = true, ...bodyProps }: PopoverHeaderProps) {
  return (
    <div className={clsx(styles.header, className)}>
      <PopoverHeaderBody {...bodyProps}>{children}</PopoverHeaderBody>
      {divider && <Divider orientation="horizontal" contrast="low" />}
    </div>
  );
}
