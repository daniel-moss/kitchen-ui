import { HTMLAttributes, ReactNode } from "react";

export interface ActivityLogEmphasisProps extends HTMLAttributes<HTMLSpanElement> {
  /** The emphasised text — a user name, a field name, a new value. */
  children: ReactNode;
  className?: string;
}
