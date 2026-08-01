import { HTMLAttributes, ReactNode } from "react";

export interface SelectListItemGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** The options — SelectListItem elements. */
  children: ReactNode;
  /**
   * Header slot — a GroupLabel, rendered in a padded header row above the
   * items. Pairing rule: a PRIMARY GroupLabel goes with "object"
   * SelectListItems; a SECONDARY GroupLabel goes with "default" ones.
   */
  label?: ReactNode;
  /** Bottom divider separating this group from the next. Default true. */
  divider?: boolean;
  className?: string;
}
