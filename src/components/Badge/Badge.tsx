import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import Avatar from "../Avatar/Avatar";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";

import styles from "./Badge.module.scss";
import { BadgeProps, BadgeSize } from "./Badge.types";

// Loading label skeleton per size (variant matches the label's line box; width
// is a fixed placeholder).
const SKELETON: Record<BadgeSize, { variant: "captionSM" | "captionMD" | "bodyCompact"; width: number }> = {
  sm: { variant: "captionSM", width: 40 },
  md: { variant: "captionMD", width: 44 },
  lg: { variant: "bodyCompact", width: 48 },
};

// A small bordered chip for a short label, with an optional left slot (icon or
// avatar) and an optional dismiss button. Composes Icon / Avatar /
// SkeletonTypography. (See badge.md.)
export default function Badge({
  size = "md",
  children,
  leftIcon,
  leftIconPack,
  leftIconColor,
  leftIconSize,
  leftIconRotate,
  leftDot = false,
  avatarSrc,
  isDismissable = false,
  onDismiss,
  isLoading = false,
  className,
}: BadgeProps) {
  const iconSize = leftIconSize ?? (size === "sm" ? 12 : 14);
  const slot = leftDot ? "dot" : avatarSrc ? "avatar" : leftIcon ? "icon" : "none";
  const skeleton = SKELETON[size];

  return (
    <span
      className={clsx(
        styles.badge,
        styles[size],
        { [styles.dismissable]: isDismissable && !isLoading },
        className,
      )}
    >
      <span className={styles.main}>
        {slot === "dot" && <span className={styles.dot} />}

        {slot === "icon" &&
          (isLoading ? (
            <Icon icon={leftIcon!} isLoading size={iconSize} />
          ) : (
            <Icon
              icon={leftIcon!}
              pack={leftIconPack}
              size={iconSize}
              rotate={leftIconRotate}
              className={styles.icon}
              style={leftIconColor ? { color: leftIconColor } : undefined}
            />
          ))}

        {slot === "avatar" &&
          (isLoading ? (
            <Avatar shape="circle" size="xxs" isLoading />
          ) : (
            <Avatar shape="circle" content="image" size="xxs" imageSrc={avatarSrc} />
          ))}

        {isLoading ? (
          <SkeletonTypography variant={skeleton.variant} width={skeleton.width} />
        ) : (
          <span className={styles.label}>{children}</span>
        )}
      </span>

      {isDismissable && !isLoading && (
        <button type="button" className={styles.dismiss} aria-label="Remove" onClick={onDismiss}>
          <Icon icon="xmark" size={14} />
        </button>
      )}
    </span>
  );
}
