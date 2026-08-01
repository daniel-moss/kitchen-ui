import { ReactNode } from "react";

export interface PopoverHeaderCaptionProps {
  /** The caption text (single line, truncates with ellipsis). */
  caption: string;
  /** Optional left slot — an Icon. */
  leftSlot?: ReactNode;
  /** Optional right slot — an Icon. */
  rightSlot?: ReactNode;
  className?: string;
}
