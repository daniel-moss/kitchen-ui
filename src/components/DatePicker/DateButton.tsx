import { forwardRef } from "react";

import clsx from "clsx";

import styles from "./DateButton.module.scss";
import { DateButtonProps } from "./DateButton.types";

// DateButton — one day cell of the calendar (36×36). A real <button> with an
// inner `.cell`: at rest the cell fills the button (radius 6) and carries the
// type fill; on focus the button draws a 2px gray-12 ring + 4px gap and the
// cell shrinks to the inner 24px box (radius 2) — box-sizing keeps the 36px
// so nothing shifts. See Figma "#️⃣ DateButton". States (hover/press/focus)
// are CSS-driven off the real button.
const DateButton = forwardRef<HTMLButtonElement, DateButtonProps>(function DateButton(
  { day, type = "default", disabled = false, onClick, className, ...rest },
  ref
) {
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      className={clsx(styles.button, styles[type], disabled && styles.disabled, className)}
      disabled={disabled}
      aria-pressed={type === "selected" || undefined}
      onClick={onClick}
    >
      <span className={styles.cell}>{day}</span>
    </button>
  );
});

export default DateButton;
