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
  /**
   * What the caption line shows when there is NO value for it — "No Location
   * name", "No Manufacturer", "No End date".
   *
   * The row's standard empty behaviour, from the ListItem Template copy doc
   * (Figma 27171-15212): "The placeholder is shown if the value is missing.
   * The placeholder inherits the `--text-placeholder` token." The copy is
   * always "No " + the field as it is named.
   *
   * Shown INSTEAD of `caption` whenever `caption` is null or undefined, so the
   * caller passes the value it has and this in case it has none; with neither,
   * the caption line renders nothing. Needs a caption variant, like `caption`
   * itself — a `title` row has no second line to put it on. The same prop
   * `SelectListItem` carries (2026-09-12); this is its ListItem half
   * (2026-09-14).
   */
  captionPlaceholder?: ReactNode;
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
