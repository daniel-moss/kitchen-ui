import { ReactNode } from "react";

import { ItemTextBlockProps } from "./ItemTextBlock.types";

/**
 * The text region of a row: a left `ItemTextBlock` (its props are flattened
 * here) plus an optional right one, 16px apart and vertically centered.
 */
export interface ItemTextProps extends Omit<ItemTextBlockProps, "align" | "className"> {
  /**
   * Right block — an `ItemTextBlock` with `align="right"`. It hugs its content
   * and never truncates: when space runs out the right text keeps its width and
   * the left block truncates.
   */
  right?: ReactNode;
  className?: string;
}
