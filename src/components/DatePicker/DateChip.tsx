import { forwardRef } from "react";

import clsx from "clsx";

import styles from "./DateChip.module.scss";
import { DateChipProps } from "./DateChip.types";

// DateChip — one date cell of the calendar (Figma "#️⃣ DateChip"): fixed 36px
// height, 6px radius, fills the cell. A real <button> with an inner `.cell`
// span that carries the fills/typography (so a consumer can restyle it, and
// the range band on the button stays behind it). The band is a ::before
// layer: `--gray-a2`, square where it runs on, 6px caps where it stops.
// States (hover/press/focus) are CSS-driven; selected keeps its 1px gray-12
// stroke through every state.
const DateChip = forwardRef<HTMLButtonElement, DateChipProps>(function DateChip(
  { day, isSelected = false, isToday = false, disabled = false, band = "none", onClick, className, ...rest },
  ref
) {
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      className={clsx(
        styles.chip,
        isSelected && styles.selected,
        isToday && styles.today,
        disabled && styles.disabled,
        band === "middle" && styles.bandMiddle,
        band === "capLeft" && styles.bandCapLeft,
        band === "capRight" && styles.bandCapRight,
        band === "capBoth" && styles.bandCapBoth,
        className
      )}
      disabled={disabled}
      aria-pressed={isSelected || undefined}
      onClick={onClick}
    >
      <span className={styles.cell}>{day}</span>
    </button>
  );
});

export default DateChip;
