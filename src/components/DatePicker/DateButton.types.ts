import { ButtonHTMLAttributes } from "react";

/**
 * `default` — a normal day. `today` — the current date (a resting gray-a3
 * fill so it stands out). `selected` — the chosen date (gray-12 fill, white
 * Semibold text). `selected` wins over `today` when a day is both.
 */
export type DateButtonType = "default" | "today" | "selected";

export interface DateButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "disabled" | "type" | "onClick"> {
  /** The day number to show (1–31). */
  day: number;
  /** Visual type. Default "default". */
  type?: DateButtonType;
  /** Dimmed + non-interactive (outside-month days, or out of min/max range). */
  disabled?: boolean;
  /** Accessible label — the full date (e.g. "Friday, January 15, 2027"). */
  "aria-label"?: string;
  onClick?: () => void;
  className?: string;
}
