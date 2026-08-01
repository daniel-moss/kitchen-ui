import { HTMLAttributes, ReactNode } from "react";

export type CheckboxGroupOrientation = "vertical" | "horizontal";

export interface CheckboxGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  /** Item layout. Default "vertical" (stacked); "horizontal" lays them in an equal-width row. */
  orientation?: CheckboxGroupOrientation;

  /** false → error state: items turn error and the error message shows. Default true. */
  isValid?: boolean;
  /**
   * Error message shown under the items when invalid. Default: "Choose
   * [Label]", derived from the surrounding Input's string label. Label and
   * help text live on the Input wrapper — the group is bare.
   */
  errorMessage?: ReactNode;

  /** The CheckboxItems — always rendered as the card variant. Up to 4. */
  children: ReactNode;

  className?: string;
}
