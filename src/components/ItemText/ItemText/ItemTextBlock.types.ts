import { ReactNode } from "react";

import { ItemTextLineColor, ItemTextLines, ItemTextLineStyle } from "./ItemTextLine.types";

/** Which lines the block holds, and in which order. */
export type ItemTextBlockVariant = "title" | "titleCaption" | "captionTitle" | "tag";

/**
 * Which side of the row the block sits on. `left` fills the width and aligns
 * left; `right` hugs its content and aligns right. `ItemText` sets it — a
 * standalone block only sets it when it is used without `ItemText`.
 */
export type ItemTextBlockAlign = "left" | "right";

export interface ItemTextBlockProps {
  /** Default "title". */
  variant?: ItemTextBlockVariant;
  /** Default "left". */
  align?: ItemTextBlockAlign;

  /** Title text. Preset: `bodyMedium` / `strong`. */
  title?: ReactNode;
  /** Caption text. Preset: `caption` / `subtle`. */
  caption?: ReactNode;
  /** Tag text — the `tag` variant's single line. Preset: `bodyRegular` / `subtle`. */
  tag?: ReactNode;

  /** Overrides the title's preset color, e.g. "error" for an overdue value. */
  titleColor?: ItemTextLineColor;
  /** Overrides the caption's preset color, e.g. "warning" or "placeholder". */
  captionColor?: ItemTextLineColor;
  /** Overrides the tag's preset color. */
  tagColor?: ItemTextLineColor;

  /**
   * Overrides the title's preset text style. Default `bodyMedium` (Inter
   * Medium 14/20). Figma exposes the same axis on the nested ItemTextLine —
   * MenuItem's label, for instance, is `bodyRegular` and still strong.
   */
  titleStyle?: ItemTextLineStyle;
  /** Overrides the caption's preset text style. Default `caption`. */
  captionStyle?: ItemTextLineStyle;
  /** Overrides the tag's preset text style. Default `bodyRegular`. */
  tagStyle?: ItemTextLineStyle;

  /** Icon before the title. */
  titleSlotLeft?: ReactNode;
  /** Badge / Counter / HintTrigger / Icon after the title. */
  titleSlotRight?: ReactNode;
  /** Icon before the caption. */
  captionSlotLeft?: ReactNode;
  /** Slot after the caption. */
  captionSlotRight?: ReactNode;
  /** Icon before the tag. */
  tagSlotLeft?: ReactNode;
  /** Slot after the tag. */
  tagSlotRight?: ReactNode;

  /** Title truncation rule. Default 1. */
  titleLines?: ItemTextLines;
  /** Caption truncation rule. Default 1. */
  captionLines?: ItemTextLines;
  /** Tag truncation rule. Default 1. */
  tagLines?: ItemTextLines;

  /**
   * Loading: every line this variant renders shows a bar instead of its text.
   * Set it here rather than on the lines — the block owns which lines exist, so
   * a block can never end up half loaded. Default false.
   */
  isLoading?: boolean;

  /** Extra class on the title line (escape hatch — prefer `titleColor`). */
  titleClassName?: string;
  /** Extra class on the caption line (escape hatch — prefer `captionColor`). */
  captionClassName?: string;
  /** Extra class on the tag line (escape hatch — prefer `tagColor`). */
  tagClassName?: string;

  className?: string;
}
