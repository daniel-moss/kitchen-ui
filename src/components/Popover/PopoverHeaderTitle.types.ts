import { ReactNode } from "react";

export interface PopoverHeaderTitleProps {
  /** The title text (single line, truncates with ellipsis). */
  title: string;
  /** Optional extra class for the title text (e.g. a status color). */
  titleClassName?: string;
  /** Optional left slot — an Icon. */
  leftSlot?: ReactNode;
  /** Optional right slot — an Icon or a HintTrigger. */
  rightSlot?: ReactNode;
  className?: string;
}
