import { ReactNode } from "react";

/** Layout: title only, title + caption, or caption above title. */
export type ListItemTextVariant = "title" | "titleCaption" | "titleCaptionReversed";

/**
 * Truncation rule for one text line. Default 1 = truncate after one line;
 * 2 / 3 = truncate after that many lines; "wrap" = never truncate. Whenever
 * text is actually truncated, hovering shows a tooltip with the full text
 * (the PopoverHeader behavior). The rule to use is specified in the designs.
 */
export type ListItemTextLines = 1 | 2 | 3 | "wrap";

export interface ListItemTextLeftProps {
  /** Default "title". */
  variant?: ListItemTextVariant;
  /** Inter Medium 14/20, strong. A string truncates with a full-text hover
   *  tooltip; a ReactNode is rendered as-is (the caller owns any truncation). */
  title: ReactNode;
  /** Inter Regular 13/20, subtle. */
  /** A non-string caption is rendered as-is — the caller owns truncation
   *  (e.g. its own TruncatingText with `children` + `tooltipText`). */
  caption?: ReactNode;
  /** Title truncation rule. Default 1. */
  titleLines?: ListItemTextLines;
  /** Caption truncation rule. Default 1. */
  captionLines?: ListItemTextLines;
  /** Optional extra class for the title line (e.g. a status color). */
  titleClassName?: string;
  /** Optional extra class for the caption line (e.g. a warning color). */
  captionClassName?: string;
  /**
   * Left slot on the CAPTION line — an `Icon` for now (Figma 28927-35531).
   * Its size, weight and color are the caller's call: the slot only places the
   * glyph, 8px before the caption and top-aligned with its first line.
   */
  captionSlotLeft?: ReactNode;
  className?: string;
}
