import { HTMLAttributes } from "react";

/**
 * Pack / style of the icon. One axis (matches the Kitchen UI spec):
 * - "regular"        classic, regular weight (default)
 * - "solid"          classic, solid weight
 * - "brand"          brand pack (FA Brands font)
 * - "custom"         kit custom pack (FA Custom font)
 * - "custom-duotone" kit custom duotone pack (renders single-layer here)
 */
export type IconPack = "regular" | "solid" | "brand" | "custom" | "custom-duotone";

/**
 * Container box around the glyph:
 * - "fixedHeight" height = icon size, width adapts to the glyph (default).
 * - "square"      fixed width AND height (size + 2px for sizes ≤ 16, + 4px for ≥ 18).
 */
export type IconContainer = "fixedHeight" | "square";

/** Pixel size. The fixed Kitchen UI scale (matches the production Icon). */
export type IconSize = 8 | 10 | 12 | 14 | 16 | 18 | 20 | 24;

export interface IconProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
  /**
   * Icon name, e.g. "plus" or "wrench-simple". It maps to a `.g-<name>` glyph
   * class from the icon font set. (In the codebase this is a Font Awesome
   * IconProp object; here we use the name so the playground needs no Pro kit.)
   */
  icon: string;
  /** Pixel size from the fixed scale (8–24). Default 14. */
  size?: IconSize;
  /** Pack / style. Default "regular". */
  pack?: IconPack;
  /** Container box. Default "fixedHeight". */
  container?: IconContainer;
  /** Spin animation (used for loading spinners). */
  spin?: boolean;
  /** Static rotation in degrees (e.g. 90, 180, 270). */
  rotate?: number;
  /**
   * Loading state. Replaces the icon with a filled "circle" placeholder in
   * --gray-a3, pulsing like SkeletonTypography. Used while content loads.
   */
  isLoading?: boolean;
  className?: string;
}
