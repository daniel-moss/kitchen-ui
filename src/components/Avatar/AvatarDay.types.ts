/**
 * Color schemes — the 14 Radix scales this avatar supports. The scheme drives
 * two things only: the tile background (`<scale>-a3`) and both text colors
 * (`<scale>-a11`). The day container stays `--surface-level-second`.
 */
export type AvatarDayColorScheme =
  | "gray"
  | "brown"
  | "amber"
  | "orange"
  | "tomato"
  | "crimson"
  | "pink"
  | "plum"
  | "violet"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "jade";

export interface AvatarDayProps {
  /** Color scheme. Default "gray". */
  colorScheme?: AvatarDayColorScheme;
  /**
   * Month label. Always rendered uppercase and cut to 3 letters — the tile is
   * one fixed size and fits no more. Default "JAN".
   */
  month?: string;
  /** Day of the month. Default 1. */
  day?: string | number;
  /**
   * Loading state. Replaces the tile with the generic Avatar skeleton (a
   * pulsing `--gray-a3` square of the same size and radius). Default false.
   */
  isLoading?: boolean;
  /**
   * Accessible label for the whole tile (e.g. "1 January"). When set, the tile
   * becomes one image for screen readers and its inner text is hidden. When
   * unset, screen readers read the month and day text as written.
   */
  ariaLabel?: string;
  className?: string;
}
