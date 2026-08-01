/**
 * The text styles a typography skeleton can stand in for. Each variant sets the
 * container height (the text's line box) and the bar height (the visible
 * placeholder), so the skeleton matches the text it replaces.
 */
export type SkeletonTypographyVariant =
  | "captionSM"
  | "captionMD"
  | "bodyCompact"
  | "bodySpacious"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

export interface SkeletonTypographyProps {
  /** Which text style this skeleton replaces. */
  variant: SkeletonTypographyVariant;
  /** Width of the placeholder bar. Defaults to "100%". */
  width?: number | string;
  className?: string;
}
