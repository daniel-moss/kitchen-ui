import clsx from "clsx";

import { Icon } from "../Icon/Icon";

import styles from "./PopoverFooterText.module.scss";
import { PopoverFooterTextProps } from "./PopoverFooterText.types";

// Display-only text for PopoverFooter's left slot — Figma's SlotLeft
// variant=text (component 29736:1461). A 14px regular icon (optional) plus a
// body-500-compact label that truncates with an ellipsis. The label and the
// icon are colored independently; both default to --text-strong.
export default function PopoverFooterText({ children, icon, color, iconColor, className }: PopoverFooterTextProps) {
  const resolvedIconColor = iconColor ?? color;
  return (
    <div className={clsx(styles.text, className)}>
      {icon && (
        <Icon
          icon={icon}
          size={14}
          pack="regular"
          className={styles.icon}
          style={resolvedIconColor ? { color: resolvedIconColor } : undefined}
        />
      )}
      <span className={styles.label} style={color ? { color } : undefined}>
        {children}
      </span>
    </div>
  );
}
