import { ReactNode } from "react";

export interface PopoverHeaderContentProps {
  /** The text block (a PopoverHeaderText). */
  children: ReactNode;
  /** Left slot — an Avatar (any template or generic). Must be the xl size. */
  avatar?: ReactNode;
  /** Right slot — up to 2 IconButtons (md, ghost). */
  actions?: ReactNode;
  className?: string;
}
