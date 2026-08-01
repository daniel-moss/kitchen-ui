import { ListItemTextVariant } from "./ListItemTextLeft.types";

/** The right block adds a `tag` variant to the text layouts. */
export type ListItemTextRightVariant = ListItemTextVariant | "tag";

export interface ListItemTextRightProps {
  /** Default "title". */
  variant?: ListItemTextRightVariant;
  /** Inter Medium 14/20, strong. Right-aligned, hugs (no truncation). */
  title?: string;
  /** Inter Regular 13/20, subtle. Right-aligned, hugs. */
  caption?: string;
  /** Tag variant — Inter Regular 14/20, subtle. Right-aligned, hugs. */
  tag?: string;
  className?: string;
}
