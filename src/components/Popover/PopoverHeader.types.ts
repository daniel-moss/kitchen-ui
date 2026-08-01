import { PopoverHeaderBodyProps } from "./PopoverHeaderBody.types";

// Same props as the Body, plus the bottom Divider (which can be turned off — e.g.
// the focus Dialog, where the StepItemGroup below provides the separation).
export type PopoverHeaderProps = PopoverHeaderBodyProps & {
  /** Show the bottom divider. Default true. */
  divider?: boolean;
};
