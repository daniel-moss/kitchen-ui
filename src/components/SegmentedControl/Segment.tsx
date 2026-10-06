import { useEffect } from "react";

import clsx from "clsx";

import { Icon } from "../Icon/Icon";

import styles from "./Segment.module.scss";
import { SegmentProps } from "./Segment.types";

// Segment — one option of a SegmentedControl: md (32px) or lg (36px), an
// optional slot (an Icon or an `xs`/20px avatar) before the label, and
// `isWarning` for a problem behind the segment. There is no counter — the
// options of a segmented control are known before any data arrives.
// `orientation="vertical"` stacks the slot above the label in a one-size,
// hugging segment. The label and a default-coloured Icon are `--text-subtle`
// on a resting inactive segment and `--text-strong` everywhere else — the CSS
// drives both through `color`, and the warning colour overrides every step of
// it. See Figma "Segment" (set 28712-128163).
//
// A Segment is not placed on its own: SegmentedControl lays the row out, owns
// the selection and injects `size`, `orientation` and `isSelected`.
export default function Segment({
  size = "lg",
  orientation = "horizontal",
  isSelected = false,
  isWarning = false,
  isDisabled = false,
  hasSelectedSurface = true,
  slotLeft,
  children,
  className,
  type = "button",
  ...rest
}: SegmentProps) {
  const isVertical = orientation === "vertical";

  // Two rules the Figma set carries as absent combinations. `slotLeft` and
  // `children` are ReactNodes, so the types cannot express either — the Chip
  // precedent is to report them instead.
  const missingSlot = isVertical && slotLeft == null && !isWarning;
  const warningWithoutLabel = isWarning && children == null;
  useEffect(() => {
    if (missingSlot) {
      console.warn('Segment: orientation="vertical" needs a slotLeft — the picture of the option is the point of the layout.');
    }
    if (warningWithoutLabel) {
      console.warn("Segment: isWarning needs a label — an amber glyph on its own says nothing.");
    }
  }, [missingSlot, warningWithoutLabel]);

  // The warning IS the icon (per the doc page), so it takes the slot over
  // rather than colouring whatever the caller put there.
  const slot = isWarning ? <Icon icon="warning" pack="solid" size={14} /> : slotLeft;

  return (
    <button
      type={type}
      className={clsx(
        styles.segment,
        styles[size],
        isVertical && styles.vertical,
        isSelected && styles.selected,
        // The group owns the moving surface → this segment drops its own. The
        // selected TEXT colour stays, so the label still reads as selected.
        isSelected && !hasSelectedSurface && styles.noSurface,
        isWarning && styles.warning,
        className,
      )}
      disabled={isDisabled}
      role="radio"
      aria-checked={isSelected}
      {...rest}
    >
      {slot != null && <span className={styles.slot}>{slot}</span>}
      {children != null && <span className={styles.label}>{children}</span>}
    </button>
  );
}
