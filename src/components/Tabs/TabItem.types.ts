import { ButtonHTMLAttributes, ReactNode } from "react";

/** Tab styles: a soft filled shape, or a line on the row's bottom edge. */
export type TabItemVariant = "pill" | "underline";

/** Tab sizes (px): md 32, lg 36. `underline` has one size — see `size`. */
export type TabItemSize = "md" | "lg";

export interface TabItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * **pill** marks the selected tab with a soft filled shape, so the row can
   * sit anywhere. **underline** marks it with a line on the row's bottom edge,
   * for the row that labels the content directly underneath it. Default "pill",
   * or whatever the surrounding TabGroup sets.
   */
  variant?: TabItemVariant;
  /**
   * md = `--size-8` (32px), lg = `--size-9` (36px). The step up changes the
   * padding only — both carry `body-500-compact` (14/20).
   *
   * **`underline` has one size.** It has no height of its own (it fills the bar
   * it sits in) and no horizontal padding, so the two sizes would draw the same
   * tab. Default "md", or whatever the surrounding TabGroup sets.
   */
  size?: TabItemSize;

  /** Selected (active) tab. TabGroup sets it from its own value. */
  selected?: boolean;
  /** Identifier TabGroup matches against its value and passes to `onChange`. */
  value?: string;

  /**
   * An Icon or an avatar before the label. All the Icon's parameters are the
   * caller's — the tab no longer changes its weight on selection; the avatar is
   * `xs` (20px). Ignored while `warning` is on.
   */
  slotLeft?: ReactNode;
  /**
   * A number after the label, in the label's own font with regular figures.
   * Needs a label.
   */
  counter?: string | number;

  /**
   * When false, the tab does NOT paint its own selected mark — a parent
   * TabGroup sets this for the `underline` style so it can slide one shared
   * line to the selected tab instead. The selected text colour is unchanged.
   * Default true (a standalone tab paints its own).
   */
  selectedSurface?: boolean;

  /**
   * Points at something behind the tab that needs attention — a detail that is
   * missing, a value that does not add up. The icon and the label take
   * `--text-warning` and hold it in every state, so an inactive tab still shows
   * the problem.
   *
   * The slot draws the solid `warning` icon and REPLACES `slotLeft`. It needs a
   * label; on a slot-only tab a coloured glyph alone says nothing.
   */
  warning?: boolean;

  /** Dimmed, non-interactive. */
  disabled?: boolean;
  /**
   * Skeleton in place of the content — a bar for the label, a circle for the
   * slot. A tab loads because its content is not known yet, so it loads
   * unselected.
   */
  loading?: boolean;

  /** The label. Leave it out for a slot-only tab, and pass an `aria-label`. */
  children?: ReactNode;

  className?: string;
}
