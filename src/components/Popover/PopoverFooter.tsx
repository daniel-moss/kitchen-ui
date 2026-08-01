import clsx from "clsx";

import { Divider } from "../Divider/Divider";

import styles from "./PopoverFooter.module.scss";
import { PopoverFooterProps } from "./PopoverFooter.types";

// Action bar for popover-like containers (Popover, Dialog, SidePanel, …). A
// full-width Divider on top plus a Body row of buttons. An optional leading
// Cancel (ghost) is pinned far left; the trailing buttons hug the right edge
// (or stretch to fill the width in the navigation/mobile variant).
// See Kitchen UI/components/popover-footer.md.
export default function PopoverFooter({
  children,
  leadingButton,
  stretch = false,
  className,
}: PopoverFooterProps) {
  return (
    <div className={clsx(styles.footer, className)}>
      <Divider orientation="horizontal" contrast="low" />
      <div className={clsx(styles.body, { [styles.stretch]: stretch })}>
        {leadingButton}
        <div className={styles.buttons}>{children}</div>
      </div>
    </div>
  );
}
