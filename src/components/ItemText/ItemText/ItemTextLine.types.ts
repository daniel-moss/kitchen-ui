import { ReactNode } from "react";

/**
 * The three text styles a row line can use. They are the only type styles the
 * row components share, so a line is always one of them:
 *
 * - `bodyMedium` — `body-500-compact` (Inter Medium 14/20). Titles.
 * - `bodyRegular` — `body-400-compact` (Inter Regular 14/20). Tags, and the
 *   titles of MenuItem / SelectListItem's default row.
 * - `caption` — `caption-medium-400` (Inter Regular 13/20). Captions.
 *
 * Figma calls this axis `style`; `style` is reserved on a React element, so the
 * prop is `textStyle` here.
 */
export type ItemTextLineStyle = "bodyMedium" | "bodyRegular" | "caption";

/**
 * Text color, applied as a token on the line. The slots' icons inherit it
 * (`currentColor`) — an icon only differs when it sets a color of its own.
 */
export type ItemTextLineColor = "strong" | "subtle" | "placeholder" | "warning" | "error";

/**
 * Truncation rule for one line. Default 1 = ellipsis after one line; 2 / 3 =
 * ellipsis after that many lines; "wrap" = never truncate. Whenever a string
 * line actually truncates, hovering shows a tooltip with the full text. The
 * rule belongs to the screen, not to the component — the designs specify it,
 * and where they do not, the default is used.
 */
export type ItemTextLines = 1 | 2 | 3 | "wrap";

export interface ItemTextLineProps {
  /**
   * The text. A string truncates with a full-text hover tooltip; a ReactNode is
   * rendered as-is and the caller owns any truncation.
   */
  label?: ReactNode;
  /** Text style. Default "bodyMedium". */
  textStyle?: ItemTextLineStyle;
  /** Text color. Default "strong". The slot icons follow it. */
  color?: ItemTextLineColor;
  /**
   * Left slot — an `Icon` or an `Avatar` (xs, any type). Sits 8px before the
   * text in a 20px box centered on the line. The icon's name, style, size and
   * rotation are the caller's choice.
   */
  slotLeft?: ReactNode;
  /**
   * Right slot — an `Avatar`, `Badge`, `BadgeColor`, `Counter`, `HintTrigger`
   * or `Icon`,
   * 8px after the text. The text hugs its content, so the slot sits next to the
   * text rather than at the far edge. A Badge is 28px tall, so it is only used
   * on a title-only block.
   */
  slotRight?: ReactNode;
  /** Truncation rule. Default 1. */
  lines?: ItemTextLines;
  /**
   * Loading: the text becomes a `SkeletonTypography` bar on the same line box,
   * and the slots are dropped — they hold a badge, a counter or a hint trigger,
   * all of which are data nobody has yet. The bar fills the line; in a right
   * block, which hugs its content, it falls back to `--size-24` (96px).
   * Default false.
   */
  isLoading?: boolean;
  className?: string;
}
