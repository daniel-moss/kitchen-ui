import { HTMLAttributes } from "react";

import { IconPack } from "../Icon/Icon.types";

/** Avatar sizes (px): xxs 16, xs 20, sm 24, md 28, lg 32, xl 36. */
export type AvatarSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Avatar shape. `object` is a square; `user` is a circle; `live` is a circle
 * with a collaboration ring (md/lg/xl only, image/letters only, no addOns).
 */
export type AvatarType = "object" | "user" | "live";

/** Live-collaboration ring colors (the only colors the live ring may use). */
export type AvatarRingColor =
  | "crimson"
  | "pink"
  | "plum"
  | "violet"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "orange"
  | "amber";

/**
 * Avatar content. `icon` shows an icon; `letters` shows a single letter;
 * `image` fills the shape with an image; `counter` shows a `+N` count;
 * `placeholder` is a dashed empty circle with the `user` icon (user only).
 * `counter` and `placeholder` support no addOns; `counter` is not used on `xxs`.
 */
export type AvatarContent = "icon" | "letters" | "image" | "counter" | "placeholder";

/**
 * AddOn in the bottom-right corner. Both cut a notch out of the avatar (SVG
 * mask) and sit in it — the notch is a real hole, so the gap ring shows the
 * surface behind the avatar. `statusDot` places a dot; `icon` places an icon.
 * Not allowed on `xxs` (ignored there).
 */
export type AvatarAddOn = "none" | "statusDot" | "icon";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  /** Square size. Default "md". */
  size?: AvatarSize;
  /** Shape. Default "object". */
  type?: AvatarType;
  /** What fills the avatar. Default "icon". */
  content?: AvatarContent;
  /** Corner addOn. Default "none". */
  addOn?: AvatarAddOn;

  /** Icon name (content "icon"). Default "diamonds-4". */
  icon?: string;
  /** Icon pack / weight (content "icon"). Default "solid". */
  iconPack?: IconPack;
  iconClassName?: string;
  /** Icon color override for icon content (e.g. AvatarFile). Default per type. */
  iconColor?: string;

  /** Background override for the avatar surface (e.g. AvatarFile scale-9 fill). */
  backgroundColor?: string;

  /**
   * Letters (content "letters"), shown uppercase. Sliced to fit: object shows 1;
   * user shows 1 on xxs/xs and 2 on sm–xl. Default "AB".
   */
  letter?: string;

  /** Image URL (content "image"). Defaults to a mesh-gradient placeholder. */
  imageSrc?: string;
  /** Alt text for the image. Default "" (decorative). */
  imageAlt?: string;

  /** Count (content "counter"). Shown as `+N`, or `99+` above 99. Default 2. */
  count?: number;

  /** Live ring color (type "live" only). Default "crimson". */
  ringColor?: AvatarRingColor;

  /**
   * Loading state. Overrides content and addOns with a pulsing skeleton shape
   * while data loads. Default false.
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
