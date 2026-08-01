import { HTMLAttributes, ReactNode } from "react";

export interface MenuItemGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** The actions — MenuItem elements. */
  children: ReactNode;
  /** Bottom divider separating this group from the next. Default false. */
  divider?: boolean;
  className?: string;
}
