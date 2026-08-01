import { HTMLAttributes, ReactNode } from "react";

export interface ActivityLogProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The month groups — `ActivityLogGroup`s. The component keeps the order it
   * is given; by convention the NEWEST month comes first, so the most recent
   * activity sits at the top.
   */
  children?: ReactNode;
  className?: string;
}
