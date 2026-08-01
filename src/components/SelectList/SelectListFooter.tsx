import clsx from "clsx";

import PopoverFooter from "../Popover/PopoverFooter";
import { Divider } from "../Divider/Divider";

import styles from "./SelectListFooter.module.scss";
import { SelectListFooterProps } from "./SelectListFooter.types";

// SelectListFooter — the footer of a select menu. "menuItem" (default) = a top
// divider + a 4px-padded container with MenuItem(s), e.g. an "Add new" action.
// "actionBar" = a PopoverFooter (top divider + button row — optional ghost
// Cancel pinned left, trailing buttons right). See Figma "SelectListFooter".
export default function SelectListFooter(props: SelectListFooterProps) {
  if (props.variant === "actionBar") {
    const { variant, ...footerProps } = props;
    return <PopoverFooter {...footerProps} />;
  }

  const { children, className } = props;
  return (
    <div className={clsx(styles.footer, className)}>
      <Divider />
      <div className={styles.items}>{children}</div>
    </div>
  );
}
