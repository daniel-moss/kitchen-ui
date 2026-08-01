import { HTMLAttributes, ReactNode } from "react";

export interface StepItemGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** The StepItems, in order. They stretch equally and share a continuous bar. */
  children: ReactNode;
  className?: string;
}
