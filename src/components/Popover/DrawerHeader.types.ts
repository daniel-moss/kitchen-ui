import { ReactNode } from "react";

import { PopoverHeaderProps } from "./PopoverHeader.types";

export type DrawerHeaderVariant = "default" | "dragHandle" | "bodyOnly";

export interface DrawerHeaderProps extends Omit<PopoverHeaderProps, "children"> {
  /** The Content (a PopoverHeaderContent). Not needed for the dragHandle variant. */
  children?: ReactNode;
  /**
   * default = handle + PopoverHeader; dragHandle = handle only; bodyOnly =
   * PopoverHeader only. Default "default".
   */
  variant?: DrawerHeaderVariant;
}
