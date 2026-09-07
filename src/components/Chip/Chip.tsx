import { isValidElement } from "react";
import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";

import styles from "./Chip.module.scss";
import { ChipProps } from "./Chip.types";

// Chip — a compact filter / selection control: sm (28px), md (32px) or lg
// (36px), an optional left slot (an Icon, or an avatar sized xxs/16 in sm and
// xs/20 in md and lg), an `isSelected` look, an `isValid=false` error
// treatment, and a loading skeleton. The label + a default-colored Icon are
// `--text-subtle` on a resting inactive chip and `--text-strong` everywhere
// else — the CSS drives both through `color`; the error look drives them to
// `--text-error` the same way. See Figma "Chip" (node 29520-29010).
export default function Chip({
  size = "md",
  isSelected,
  slotLeft,
  isValid = true,
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
      // Loading suppresses the error look (a tomato skeleton would say
      // nothing); it returns when the value lands.
      className={clsx(
        styles.chip,
        styles[size],
        isSelected && styles.selected,
        !isValid && !isLoading && styles.invalid,
        isLoading && styles.loading,
        className,
      )}
      disabled={isDisabled}
      aria-pressed={isSelected}
      aria-busy={isLoading || undefined}
      onClick={isLoading ? undefined : onClick}
      {...rest}
    >
      {slotLeft != null && <span className={styles.slotLeft}>{slot}</span>}
      {isLoading ? (
        <SkeletonTypography variant="bodyCompact" width={40} />
      ) : (
        <span className={styles.label}>{children}</span>
      )}
    </button>
  );
}
