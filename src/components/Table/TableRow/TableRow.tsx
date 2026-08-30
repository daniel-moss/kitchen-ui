import { KeyboardEvent } from "react";

import clsx from "clsx";

import styles from "./TableRow.module.scss";
import { TableRowProps } from "./TableRow.types";

/**
 * One row of a table — the header row or a body row.
 *
 * The row owns the two things every cell used to repeat for itself: the HEIGHT
 * and the DIVIDER. Cells fill the height they are given and never draw a bottom
 * border, so the separator line is one element per row and cannot break in the
 * middle when a cell forgets it.
 *
 * The divider sits below the cells rather than inside their box, which keeps
 * the cell heights round (40 header / 48 body) and makes the row pitch 41 and
 * 49 — the numbers a virtualized table must scroll by.
 */
export function TableRow({ variant = "body", children, isClickable = false, onClick, className }: TableRowProps) {
  // Only a clickable BODY row is interactive. Header rows never are.
  const isInteractive = variant === "body" && isClickable;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="row"
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={clsx(styles.row, styles[variant], { [styles.clickable]: isInteractive }, className)}
    >
      <div className={styles.cells}>{children}</div>
      <div className={styles.divider} />
    </div>
  );
}
