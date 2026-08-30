import clsx from "clsx";

import PopoverFooter from "../Popover/PopoverFooter";
import { Divider } from "../Divider/Divider";

import styles from "./SelectListFooter.module.scss";
import { SelectListFooterProps } from "./SelectListFooter.types";

// SelectListFooter — the footer of a select menu. "menuItem" (default) = a top
// divider + a 4px-padded container with MenuItem(s), e.g. an "Add new" action.
// "actionBar" = a PopoverFooter (top divider + button row — optional ghost
// Cancel pinned left, trailing buttons right). See Figma "SelectListFooter".
//
// Both variants' top line is `medium` (--gray-a4) since 2026-08-20, Daniel: the
// actionBar's comes from PopoverFooter, which moved that day, and this one is
// set here to match — the two variants must not draw different lines. FLAGGED:
// the Figma component still draws --gray-a3 (node 13951-16467).
export default function SelectListFooter(props: SelectListFooterProps) {
  if (props.variant === "actionBar") {
    const { variant, ...footerProps } = props;
    return <PopoverFooter {...footerProps} />;
  }

  const { children, className } = props;
  return (
    <div className={clsx(styles.footer, className)}>
      <Divider contrast="medium" />
      <div className={styles.items}>{children}</div>
    </div>
  );
}
