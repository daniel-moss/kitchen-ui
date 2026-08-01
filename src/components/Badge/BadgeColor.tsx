import clsx from "clsx";

import Badge from "./Badge";

import styles from "./BadgeColor.module.scss";
import { BadgeColorProps } from "./BadgeColor.types";

// A colored Badge — the same Badge, re-skinned per color scheme. The scheme
// class sets the --badge-* variables that Badge's shared rules consume.
// Left slot is icon-only (no avatar), and there is no loading state.
// (See badge-color.md.)
export default function BadgeColor({
  size = "md",
  colorScheme = "gray",
  children,
  leftIcon,
  leftIconPack,
  leftIconSize,
  leftIconRotate,
  leftDot = false,
  isDismissable = false,
  onDismiss,
  className,
}: BadgeColorProps) {
  return (
    <Badge
      size={size}
      leftIcon={leftIcon}
      leftIconPack={leftIconPack}
      leftIconSize={leftIconSize}
      leftIconRotate={leftIconRotate}
      leftDot={leftDot}
      isDismissable={isDismissable}
      onDismiss={onDismiss}
      className={clsx(styles[colorScheme], className)}
    >
      {children}
    </Badge>
  );
}
