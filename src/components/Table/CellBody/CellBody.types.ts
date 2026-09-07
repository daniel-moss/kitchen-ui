import { ReactNode } from "react";

/**
 * Text colour of the cell's value. Only meaningful for text content — a badge
 * or an avatar carries its own colour.
 */
export type CellColorScheme = "default" | "subtle" | "success" | "warning" | "caution" | "error";

/** Horizontal alignment. Set per COLUMN, so the header and every body cell agree. */
export type CellAlign = "left" | "right";

/**
 * What kind of value the cell holds. It decides the rules the cell applies on
 * its own — how the value overflows, and what an empty cell looks like:
 *
 * - `text`     a string: truncates, and a truncated one reveals the full copy
 *              on hover; empty → the "—" placeholder; loading → a text skeleton
 * - `number`   a string too, but right-aligned and tabular by default, and its
 *              left slot takes an icon only (no avatar)
 * - `badge`    Badge elements: at most two show, more collapse to the first
 *              plus a "+N" count and reveal every label on hover, one per line;
 *              empty → the "—" placeholder; loading → one badge
 * - `assignee` an AvatarGroup, sized by the cell to as many avatars as fit;
 *              hovering names them; empty → a dashed avatar placeholder and a
 *              "No assignees" tooltip; loading → one avatar
 */
export type CellContent = "text" | "number" | "badge" | "assignee";

export interface CellBodyProps {
  /**
   * Freezes the cell at the table's left edge while the columns scroll — set
   * on every cell of a pinned column, with `pinnedOffset` giving the summed
   * widths of the pinned columns before it, in px.
   */
  isPinned?: boolean;
  pinnedOffset?: number;
  /**
   * The cell's value. A plain string is styled and truncated by the cell. Any
   * other node — Badge, AvatarGroup — is rendered as-is. Leave it empty and the
   * cell draws the placeholder for its `content` type.
   */
  children?: ReactNode;
  /** What kind of value this is. Default "text". */
  content?: CellContent;
  /**
   * Horizontal alignment. Default "left", except `content="number"` which
   * defaults to "right". Set the same value on the column's CellHeader.
   */
  align?: CellAlign;
  /** Text colour for string content. Default "default". */
  colorScheme?: CellColorScheme;
  /**
   * Tabular (fixed-width) numerals for string content, so values line up down
   * the column. Defaults to true for `content="number"`. ONLY for columns of
   * currency or number-ONLY data, which are usually right-aligned (Daniel,
   * 2026-09-04) — never for dates, IDs, or other mixed text.
   */
  isTabular?: boolean;
  /** Column width in px. Omit to let the cell size itself. */
  width?: number;
  /**
   * Draws the pinned-region boundary on the cell's right edge. Set it on the
   * cells of the LAST pinned column only. The line is heavier than the row
   * divider so the frozen region reads as a stronger separation.
   */
  isLastPinned?: boolean;
  /** Replaces the value with a skeleton while data loads. */
  isLoading?: boolean;
  /**
   * Optional leading element inside the value — an Icon, or an avatar. It sits
   * next to the text and is not truncated with it.
   */
  slotLeft?: ReactNode;
  /**
   * Optional trailing element, kept out of the truncating value — an
   * IconButton such as "copy". Hidden while loading.
   */
  slotRight?: ReactNode;
  /**
   * Extra data revealed by hovering the cell, whether or not anything is
   * truncated — the doc's per-column tooltip. A string renders as tooltip text;
   * any other node renders as the tooltip's content. It takes precedence over
   * the tooltips the cell shows on its own (full copy, badge list, assignees).
   */
  tooltip?: ReactNode;
  className?: string;
}
