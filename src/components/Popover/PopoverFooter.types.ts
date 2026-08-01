import { ReactNode } from "react";

export interface PopoverFooterProps {
  /**
   * The trailing buttons, pushed to the right edge (e.g. Secondary, then
   * Primary). Priority increases left → right; the rightmost is the primary
   * action. All buttons should be the lg size. Max 3 buttons total (including
   * the leading button).
   */
  children: ReactNode;
  /**
   * Optional low-priority button pinned to the far left — typically a ghost
   * "Cancel". Stays left while the trailing buttons hug the right edge.
   */
  leadingButton?: ReactNode;
  /**
   * Navigation / mobile: buttons stretch to fill the row width equally
   * (each flex:1) instead of hugging the right edge. Default false.
   */
  stretch?: boolean;
  className?: string;
}
