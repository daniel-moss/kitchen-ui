import { HTMLAttributes } from "react";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerContrast = "low" | "medium" | "high";

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Line direction. Default "horizontal". */
  orientation?: DividerOrientation;
  /** Line contrast. Default "low". */
  contrast?: DividerContrast;
  /** Dashed (round-dot) line instead of solid. Default false. */
  dashed?: boolean;
  /**
   * Padding around the line (any CSS padding value; a number is px). The line
   * sits inside the padding, so it insets/spaces on all sides.
   */
  padding?: number | string;
  className?: string;
}
