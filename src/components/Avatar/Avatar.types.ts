import { HTMLAttributes } from "react";

import { IconPack } from "../Icon/Icon.types";

/** Avatar sizes (px): xxs 16, xs 20, sm 24, md 28, lg 32, xl 36. */
export type AvatarSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Avatar shape. `square` is a rounded square — `--border-radius-1` (4px) on
 * xxs/xs, `--border-radius-1_5` (6px) from sm up. `circle` is a full circle at
 * every size.
 */
export type AvatarShape = "square" | "circle";

/**
 * Avatar content. `icon` shows an icon — free on `square`, locked to the `user`
 * glyph on `circle`; `letters` shows one or two letters; `image` fills the
 * shape; `counter` shows a `+N` count (not used on xxs).
 */
export type AvatarContent = "icon" | "letters" | "image" | "counter";

/**
 * AddOn in the bottom-right corner. Both cut a notch out of the avatar (SVG
 * mask) and sit in it — the notch is a real hole, so the gap ring shows the
 * surface behind the avatar. `statusDot` places a dot; `icon` places an icon.
 * The `icon` addOn is not allowed on `xxs`; neither is allowed on `counter`
 * content or while loading.
 */
export type AvatarAddOn = "none" | "statusDot" | "icon";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  /** Square size. Default "md". */
  size?: AvatarSize;
  /** Shape. Default "square". */
  shape?: AvatarShape;
  /** What fills the avatar. Default "icon". */
  content?: AvatarContent;
  /** Corner addOn. Default "none". */
  addOn?: AvatarAddOn;

  /** Icon name (content "icon", `square` only). Default "diamonds-4". */
  icon?: string;
  /** Icon pack / weight (content "icon", `square` only). Default "solid". */
  iconPack?: IconPack;
  iconClassName?: string;
  /** Icon color override for icon content (e.g. AvatarFile). Default per shape. */
  iconColor?: string;

  /** Background override for the avatar surface (e.g. AvatarFile scale-9 fill). */
  backgroundColor?: string;

  /**
   * Letters (content "letters"), shown uppercase. Sliced to fit: one letter on
   * xxs/xs, two from sm up — the same on both shapes. Default "AB".
   */
  characters?: string;

  /** Image URL (content "image"). Defaults to a mesh-gradient placeholder. */
  imageSrc?: string;
  /** Alt text for the image. Default "" (decorative). */
  imageAlt?: string;

  /** Count (content "counter"). Shown as `+N`, or `99+` above 99. Default 2. */
  count?: number;

  /**
   * Loading state. Replaces the content and any addOn with the plain pulsing
   * surface while data loads — the size, shape and corners stay. Default false.
   */
  isLoading?: boolean;

  /** Icon name for the `icon` addOn. Default "diamonds-4". */
  addOnIcon?: string;
  /** Pack / weight for the `icon` addOn. Default "solid". */
  addOnIconPack?: IconPack;
  /** Color override for the `icon` addOn (CSS color). Default `--gray-12`. */
  addOnIconColor?: string;
  /** Rotation (deg) for the `icon` addOn glyph. Default 0. */
  addOnIconRotate?: number;
  /** Color override for the `statusDot` addOn (CSS color). Default `--gray-12`. */
  statusDotColor?: string;

  className?: string;
}
