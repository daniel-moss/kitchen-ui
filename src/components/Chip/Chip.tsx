import { isValidElement } from "react";
import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";

import styles from "./Chip.module.scss";
import { ChipProps } from "./Chip.types";

// Chip — a compact filter / selection control: sm (28px), md (32px) or lg
// (36px), an optional left slot (an Icon, or an avatar sized xxs/16 in sm and
// xs/20 in md and lg), an `active` (selected) look, and a loading skeleton.
// The label + a default-colored Icon are `--text-subtle` on a resting inactive
// chip and `--text-strong` everywhere else — the CSS drives both through
// `color`. See Figma "Chip" (node 29520-29010).
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
  // Loading also replaces the slot with a gray circle — 14px for an Icon, and
  // the avatar's own size (16 in sm, 20 in md/lg) for an avatar (per Figma).
  const isIconSlot = isValidElement(slotLeft) && slotLeft.type === Icon;
  const slotSize = isIconSlot ? 14 : size === "sm" ? 16 : 20;
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
        <SkeletonTypography variant={size === "sm" ? "captionMD" : "bodyCompact"} width={40} />
      ) : (
        <span className={styles.label}>{children}</span>
      )}
    </button>
  );
}
