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
  /**
   * Shown in place of the items when the group has none — a caption-only
   * EmptyState, e.g. "No contacts here yet" (Figma 23819-13139). Without it
   * an empty group renders just its header.
   */
  emptyCaption?: string;
  /** Bottom divider separating this group from the next. Default true. */
  divider?: boolean;
  className?: string;
}
