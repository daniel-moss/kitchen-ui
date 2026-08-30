import { HTMLAttributes, ReactNode } from "react";

export interface MenuItemGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** The actions — MenuItem elements. */
  children: ReactNode;
  /**
   * Header slot — a SECONDARY GroupLabel, rendered in a padded header row
   * above the items (the Figma component's `header` variant).
   */
  label?: ReactNode;
  /** Bottom divider separating this group from the next. Default false. */
  divider?: boolean;
  className?: string;
}
