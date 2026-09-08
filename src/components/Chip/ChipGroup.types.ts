import { HTMLAttributes, ReactNode } from "react";

export interface ChipGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The Chips. They keep their own props — the group only lays them out, it
   * does not control which one is `active`.
   */
  children: ReactNode;
  /**
   * Stretch mode (like TabGroup's): the chips stop hugging and share the
   * row's full width equally, and the row does not wrap. Used for the
   * weekday "Repeat on" row. Default false — a wrapping row of hug-width
   * chips.
   */
  isFullWidth?: boolean;
  /** false → error state: the chips turn error and the error message shows. Default true. */
  isValid?: boolean;
  /**
   * Error message shown under the chips when invalid. Default: "Choose
   * [Label]", derived from the surrounding Input's string label. Label and
   * help text live on the Input wrapper — the group is bare.
   */
  errorMessage?: ReactNode;
  className?: string;
}
