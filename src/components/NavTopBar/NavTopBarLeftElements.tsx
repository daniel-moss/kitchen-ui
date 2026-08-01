import clsx from "clsx";

import IconButton from "../IconButton/IconButton";

import styles from "./NavTopBarLeftElements.module.scss";
import { NavTopBarLeftElementsProps } from "./NavTopBarLeftElements.types";

// NavTopBarLeftElements — the top bar's left side: an optional back button,
// the title assembly (NavTopBarTitle), and an optional actions (ellipsis)
// button. Both buttons are 32px ghost IconButtons, 8px from the title. See
// Figma "#️⃣ NavTopBar_LeftElements".
export default function NavTopBarLeftElements({
  children,
  onBack,
  onActions,
  actionsPressed = false,
  className,
}: NavTopBarLeftElementsProps) {
  return (
    <div className={clsx(styles.root, className)}>
      {onBack != null && (
        <span className={styles.slotLeft}>
          <IconButton icon="arrow-left" variant="ghost" size="md" aria-label="Back" onClick={onBack} />
        </span>
      )}
      {children}
      {onActions != null && (
        <span className={styles.slotRight}>
          <IconButton
            icon="ellipsis"
            variant="ghost"
            size="md"
            aria-label="Actions"
            onClick={onActions}
            isPressed={actionsPressed}
            noDebounce
          />
        </span>
      )}
    </div>
  );
}
