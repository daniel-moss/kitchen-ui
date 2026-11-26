import { HTMLAttributes, ReactNode } from "react";

export interface ActivityLogSubtleProps extends HTMLAttributes<HTMLSpanElement> {
  /** The connecting words of a log sentence — "updated", "created the job". */
  children: ReactNode;
  className?: string;
}
