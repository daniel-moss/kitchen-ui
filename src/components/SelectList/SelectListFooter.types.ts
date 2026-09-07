import { ReactNode } from "react";

import { PopoverFooterProps } from "../Popover/PopoverFooter.types";

/**
 * SelectListFooter — the footer of a select menu. Two variants (Figma's
 * third, "selectInput", is not built):
 *
 * - "menuItem" (Figma's default): a top divider + a 4px-padded container
 *   holding MenuItem element(s) — e.g. an "Add new" action.
 * - "actionBar": exactly a PopoverFooter (top divider + button row), so it
 *   takes the PopoverFooter props.
 */
export type SelectListFooterProps =
  | {
      variant?: "menuItem";
      /** The action row(s) — MenuItem elements. */
      children: ReactNode;
      slotLeft?: never;
      leadingButton?: never;
      stretch?: never;
      className?: string;
    }
  | ({ variant: "actionBar" } & PopoverFooterProps);
