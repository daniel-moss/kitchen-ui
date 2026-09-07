import { ButtonHTMLAttributes } from "react";

/**
 * The range band behind the chip (Figma DateCell "band"): `none` — no range
 * through this cell; `middle` — the band runs on to both neighbors (square);
 * `capLeft` / `capRight` — the band stops at that edge with a
 * `--border-radius-1_5` (6px) cap (a range end, a row break, or the hover
 * preview's end — they all look the same); `capBoth` — caps on both sides
 * (the only banded chip in its row).
 */
export type DateChipBand = "none" | "middle" | "capLeft" | "capRight" | "capBoth";

export interface DateChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "disabled" | "type" | "onClick"> {
  /**
   * The label to show — a day number (1–31) in a calendar, or a period label
   * ("Jan", "2027") where the cell stands for a month or a year (the Figma
   * DateCell carries all three).
   */
  day: number | string;
  /**
   * The picked date (single mode) or a range end: `--gray-a2` fill + a 1px
   * `--gray-12` inside stroke, Medium text. Hover/press step the fill like
   * the unselected chip (a3 / a4); the stroke stays.
   */
  isSelected?: boolean;
  /** The current date: `--text-error` text (in every state). */
  isToday?: boolean;
  /** Dimmed (0.3) + inert — days outside the min/max limits. */
  disabled?: boolean;

  /** The range band behind the chip. Default "none". */
  band?: DateChipBand;

  /** Accessible label — the full date (e.g. "Friday, January 15, 2027"). */
  "aria-label"?: string;
  onClick?: () => void;
  className?: string;
}
