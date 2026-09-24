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

/**
 * The content region of a ListItem: an optional left slot (an xl / 36px
 * Avatar), the left text block, and an optional right block. The text is an
 * `ItemTextBlock` — this layer only maps ListItem's prop names onto it and
 * adds the two ListItem-specific rules (the caption placeholder and the
 * single-line row height).
 */
export interface ListItemContentProps {
  /**
   * Left slot — an Avatar (any type; for now the slot supports avatars only).
   * The only strict parameter: the size must be xl (36px).
   */
  avatar?: ReactNode;
  /** Default "title". */
  variant?: ListItemTextVariant;
  /** Inter Medium 14/20, strong. A string truncates with a full-text hover
   *  tooltip; a ReactNode is rendered as-is (the caller owns any truncation). */
  title: ReactNode;
  /** Inter Regular 13/20, subtle. A non-string caption is rendered as-is — the
   *  caller owns truncation (e.g. its own TruncatingText with `children` +
   *  `tooltipText`). */
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
   * glyph, 8px before the caption in a 20px box centered on the line. On a
   * caption that wraps, the glyph centers against the whole block — that is
   * `ItemTextLine`'s rule, which every row component now shares.
   */
  captionSlotLeft?: ReactNode;
  /**
   * Right block — an `ItemTextBlock` with `align="right"`, the same component
   * the left block is built from. Hugs its content and never truncates, so the
   * LEFT text is the one that gives way.
   */
  right?: ReactNode;
  /**
   * Loading: each line the variant renders shows a bar instead of its text, and
   * the caption's slot is dropped. Set it on the ROW (`ListItem`) — it reaches
   * here through the content props, and the row also hides its grip, caret and
   * slots while loading. Default false.
   */
  isLoading?: boolean;
  className?: string;
}
