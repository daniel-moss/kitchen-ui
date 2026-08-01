import { HTMLAttributes, ReactNode } from "react";

export interface CounterProps extends HTMLAttributes<HTMLSpanElement> {
  /** The value to display (usually a number). */
  value: ReactNode;

  className?: string;
}
