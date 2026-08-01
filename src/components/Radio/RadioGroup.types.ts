import { HTMLAttributes, ReactNode } from "react";

export type RadioGroupOrientation = "vertical" | "horizontal";

export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "content" | "onChange"> {
  /** Item layout. Default "vertical" (stacked); "horizontal" is an equal-width row. */
  orientation?: RadioGroupOrientation;

  /** false → error state: items turn error and the error message shows. Default true. */
  isValid?: boolean;
  /**
   * Error message shown under the items when invalid. Default: "Choose
   * [Label]", derived from the surrounding Input's string label. Label and
   * help text live on the Input wrapper — the group is bare.
   */
  errorMessage?: ReactNode;

  /** Shared radio name (auto-generated if omitted). */
  name?: string;
  /** Selected value (controlled). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onChange?: (value: string) => void;

  /** The RadioItems (each with a `value`) — always rendered as the card variant. Up to 4. */
  children: ReactNode;

  className?: string;
}
