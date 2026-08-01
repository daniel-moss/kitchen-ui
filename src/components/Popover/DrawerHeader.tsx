import clsx from "clsx";

import PopoverHeader from "./PopoverHeader";

import styles from "./DrawerHeader.module.scss";
import { DrawerHeaderProps } from "./DrawerHeader.types";

// Header for drawers on mobile: a drag handle above a PopoverHeader. The close
// button is forbidden whenever the handle is shown (swipe-down dismisses), so it
// is only rendered in the bodyOnly variant. (See drawer-header.md.)
export default function DrawerHeader({
  variant = "default",
  children,
  back,
  close = true,
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
        <PopoverHeader back={back} close={hasHandle ? false : close} onBack={onBack} onClose={onClose}>
          {children}
        </PopoverHeader>
      )}
    </div>
  );
}
