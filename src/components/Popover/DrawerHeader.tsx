import clsx from "clsx";

import PopoverHeader from "./PopoverHeader";

import styles from "./DrawerHeader.module.scss";
import { DrawerHeaderProps } from "./DrawerHeader.types";

// Header for drawers on mobile: a drag handle above a PopoverHeader. The close
// button is forbidden whenever the handle is shown (swipe-down dismisses), so it
// is only rendered in the bodyOnly variant. (See drawer-header.md.)
//
// `divider` is PopoverHeader's and is passed straight through — it was in this
// component's props type from the start but never forwarded, so turning the line
// off did nothing (found 2026-08-19).
export default function DrawerHeader({
  variant = "default",
  children,
  back,
  close = true,
  divider = true,
  onBack,
  onClose,
  className,
}: DrawerHeaderProps) {
  const hasHandle = variant !== "bodyOnly";
  const hasBody = variant !== "dragHandle";

  return (
    <div className={clsx(styles.drawerHeader, className)}>
      {hasHandle && (
        <div className={clsx(styles.handle, { [styles.withBody]: variant === "default" })}>
          <div className={styles.bar} />
        </div>
      )}

      {hasBody && (
        <PopoverHeader
          back={back}
          close={hasHandle ? false : close}
          divider={divider}
          onBack={onBack}
          onClose={onClose}
        >
          {children}
        </PopoverHeader>
      )}
    </div>
  );
}
