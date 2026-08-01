import { isValidElement } from "react";
import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";

import styles from "./Chip.module.scss";
import { ChipProps } from "./Chip.types";

// Chip — a compact filter / selection control: md (28px) or lg (32px), an
// optional left slot (Icon or any avatar — the avatar is strictly xxs/16px),
// an `active` (selected) look, and a loading skeleton. See Figma "Chip".
export default function Chip({
  size = "md",
  active,
  slotLeft,
  isLoading = false,
  isDisabled = false,
  className,
  onClick,
  children,
  type = "button",
  ...rest
}: ChipProps) {
  // Loading also replaces the slot: a gray circle — 14px for an Icon, 16px
  // for an avatar (both per Figma).
  const slotSize = isValidElement(slotLeft) && slotLeft.type === Icon ? 14 : 16;
  const slot = isLoading && slotLeft != null ? <Skeleton circle width={slotSize} height={slotSize} /> : slotLeft;

  return (
    <button
      type={type}
      className={clsx(styles.chip, styles[size], active && styles.active, isLoading && styles.loading, className)}
      disabled={isDisabled}
      aria-pressed={active}
      aria-busy={isLoading || undefined}
      onClick={isLoading ? undefined : onClick}
      {...rest}
    >
      {slotLeft != null && <span className={styles.slotLeft}>{slot}</span>}
      {isLoading ? (
        <SkeletonTypography variant={size === "lg" ? "bodyCompact" : "captionMD"} width={40} />
      ) : (
        <span className={styles.label}>{children}</span>
      )}
    </button>
  );
}
