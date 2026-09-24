import { isValidElement, useEffect } from "react";
import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";

import { useChipSelectionMode } from "./ChipSelectionModeContext";
import styles from "./Chip.module.scss";
import { ChipProps } from "./Chip.types";

// Chip — a compact filter / selection control: sm (28px), md (32px) or lg
// (36px), an optional left slot (an Icon, or an avatar sized xxs/16 in sm and
// xs/20 in md and lg), an `isSelected` look, an `isValid=false` error
// treatment, and a loading skeleton. `orientation="vertical"` stacks the slot
// above the label in a one-size, hugging chip. The label + a default-colored
// Icon are `--text-subtle` on a resting inactive chip and `--text-strong`
// everywhere else — the CSS drives both through `color`; the error look drives
// them to `--text-error` the same way. See Figma "Chip" (node 29520-29010).
export default function Chip({
  size = "md",
  orientation = "horizontal",
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
  const selectionMode = useChipSelectionMode();
  const isVertical = orientation === "vertical";

  // Figma has no vertical variant without a slot, and the layout means nothing
  // without one — but `slotLeft` is a ReactNode, so the types cannot carry the
  // rule (the ListItem `CONTROLS_BLOCKING_CLICK` precedent). Report it instead.
  const missingSlot = isVertical && slotLeft == null;
  useEffect(() => {
    if (missingSlot) {
      console.warn('Chip: orientation="vertical" needs a slotLeft — without one it is only a taller horizontal chip.');
    }
  }, [missingSlot]);

  // Loading also replaces the slot with a gray circle — 14px for an Icon, and
  // the avatar's own size (16 in sm, 20 in md/lg) for an avatar (per Figma).
  const isIconSlot = isValidElement(slotLeft) && slotLeft.type === Icon;
  const slotSize = isIconSlot ? 14 : size === "sm" ? 16 : 20;
  const slot = isLoading && slotLeft != null ? <Skeleton circle width={slotSize} height={slotSize} /> : slotLeft;

  // Inside a single-select group the chip is one option of a radio group, not
  // a toggle — the roles differ, the look does not.
  const isRadio = selectionMode === "single";

  return (
    <button
      type={type}
      // Loading suppresses the error look (a tomato skeleton would say
      // nothing); it returns when the value lands.
      className={clsx(
        styles.chip,
        styles[size],
        isVertical && styles.vertical,
        isSelected && styles.selected,
        !isValid && !isLoading && styles.invalid,
        isLoading && styles.loading,
        className,
      )}
      disabled={isDisabled}
      role={isRadio ? "radio" : undefined}
      aria-checked={isRadio ? Boolean(isSelected) : undefined}
      aria-pressed={isRadio ? undefined : isSelected}
      aria-busy={isLoading || undefined}
      onClick={isLoading ? undefined : onClick}
      {...rest}
    >
      {slotLeft != null && <span className={styles.slotLeft}>{slot}</span>}
      {isLoading ? (
        // The bar hugs at 40px in a horizontal chip and FILLS a vertical one
        // (per Figma) — a vertical chip is laid out by a full-width group.
        <SkeletonTypography variant={size === "sm" ? "captionMD" : "bodyCompact"} width={isVertical ? "100%" : 40} />
      ) : (
        <span className={styles.label}>{children}</span>
      )}
    </button>
  );
}
