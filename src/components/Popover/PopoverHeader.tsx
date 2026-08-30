import clsx from "clsx";

import PopoverHeaderBody from "./PopoverHeaderBody";
import { Divider } from "../Divider/Divider";

import styles from "./PopoverHeader.module.scss";
import { PopoverHeaderProps } from "./PopoverHeader.types";

// The full PopoverHeader: the Body row plus a full-width Divider at the bottom.
// No background of its own — it sits on whatever popover surface contains it.
//
// `medium` (--gray-a4) since 2026-08-20, Daniel — it was `low` (--gray-a3), and
// PopoverFooter's top line moved with it so the two stay a pair. FLAGGED: the
// Figma component still draws --gray-a3 (node 24913-68607), so the node needs
// the same change.
export default function PopoverHeader({ children, className, divider = true, ...bodyProps }: PopoverHeaderProps) {
  return (
    <div className={clsx(styles.header, className)}>
      <PopoverHeaderBody {...bodyProps}>{children}</PopoverHeaderBody>
      {divider && <Divider orientation="horizontal" contrast="medium" />}
    </div>
  );
}
