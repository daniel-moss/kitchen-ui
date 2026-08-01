import { HTMLAttributes, ReactNode } from "react";

export interface SelectFieldBodyProps extends Omit<HTMLAttributes<HTMLDivElement>, "prefix"> {
  /** The displayed value (truncates with an ellipsis when it overflows). */
  value?: ReactNode;

  /**
   * Left slot — for now an Icon (14px) or a user Avatar (xs / 20px). Sits before
   * the value with an 8px gap.
   */
  slotLeft?: ReactNode;

  /** Right slot — a suffix text (subtle) after the value, with an 8px gap. */
  suffix?: ReactNode;

  className?: string;
}
