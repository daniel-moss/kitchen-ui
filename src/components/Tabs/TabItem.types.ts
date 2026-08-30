import { ButtonHTMLAttributes, ReactNode } from "react";

import { IconPack } from "../Icon/Icon.types";

export type TabItemVariant = "default" | "container" | "underline";
export type TabItemSize = "sm" | "md" | "lg";
export type TabItemOrientation = "horizontal" | "vertical";

export interface TabItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /**
   * default = soft fill when selected; container = raised segmented look;
   * underline = bottom line. Note: underline is specced for `sm`/`md` only.
   */
  variant?: TabItemVariant;
  /** sm / md / lg. Default "md". */
  size?: TabItemSize;
  /**
   * Vertical stacks the icon over the label. Only the container variant
   * supports it, and it is specced for the `lg` size.
   */
  orientation?: TabItemOrientation;

  /** Selected (active) tab. */
  selected?: boolean;
  /** Identifier used by TabGroup to match the selected tab and wire onChange. */
  value?: string;

  /**
   * Left (or top, vertical) slot — an icon name. Rendered Regular when
   * unselected, Solid when selected. Glyph is 12px at `sm`, 14px at `md`/`lg`.
   * Mutually exclusive with `avatar` (icon wins if both are set).
   */
  icon?: string;
  /**
   * Icon name override for the selected state. For kit (custom) glyphs the
   * weight lives in the NAME (e.g. "regular-timeline-view" /
   * "solid-timeline-view"), so the pack flip alone can't switch them.
   */
  selectedIcon?: string;
  /** Force one icon pack for both states (kit glyphs use "custom"). */
  iconPack?: IconPack;
  /**
   * Left slot alternative to `icon` — an avatar element (user / client /
   * generic). Use `xxs` (16px) at `sm` and `xs` (20px) at `md`/`lg` to match
   * the spec. Ignored when `icon` is also set.
   */
  avatar?: ReactNode;
  /** Optional plain-text counter after the label (just text, not the Counter component). */
  counter?: string | number;
  /** Show only the icon or avatar (and counter, if any) — hides the label. */
  iconOnly?: boolean;

  /**
   * When false, the tab does NOT paint its own selected surface — the
   * container's raised background or the underline's bottom line. A parent
   * TabGroup sets this so it can slide one shared indicator to the selected
   * tab instead. Selected text styling is unchanged. Default true (a
   * standalone tab paints its own surface).
   */
  selectedSurface?: boolean;

  /**
   * Attention state: the tab's icon and label turn amber (`--text-warning`) to
   * signal that something on that tab needs the user's attention (e.g. required
   * data is missing). The color holds in every state — selected, unselected,
   * hover and pressed — so an INACTIVE tab still points at the problem.
   *
   * Built for SidePanel's navigation (Daniel, 2026-08-05), so it is specced for
   * the `default` and `container` variants only. Pair it with
   * `icon="warning" iconPack="solid"` — the icon is the caller's, not built in.
   */
  warning?: boolean;

  /** Dimmed, non-interactive. */
  disabled?: boolean;
  /** Skeleton placeholder in place of the content. */
  loading?: boolean;

  /** The tab label. */
  children?: ReactNode;

  className?: string;
}
