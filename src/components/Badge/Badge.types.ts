import { ReactNode } from "react";

import { IconPack, IconSize } from "../Icon/Icon.types";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  /** Size. Default "md". */
  size?: BadgeSize;
  /** The label. */
  children?: ReactNode;

  /** Left icon name. Takes the icon slot (ignored if `avatarSrc` is set). */
  leftIcon?: string;
  /** Left icon pack / weight. Default "regular". */
  leftIconPack?: IconPack;
  /** Left icon color override (customizable per Figma). Default `--gray-12`. */
  leftIconColor?: string;
  /** Left icon size override (customizable per Figma). Default 12 (sm) / 14. */
  leftIconSize?: IconSize;
  /** Left icon rotation in degrees (e.g. 90, 180, 270). */
  leftIconRotate?: number;

  /** Show a small dot (currentColor) in the left slot instead of an icon. */
  leftDot?: boolean;

  /** Avatar image URL. Takes the (16px user) avatar slot. */
  avatarSrc?: string;

  /** Show a dismiss (×) button on the right. Default false. */
  isDismissable?: boolean;
  /** Called when the dismiss button is clicked. */
  onDismiss?: () => void;

  /** Loading state: label → skeleton, left slot → faded circle, no dismiss. */
  isLoading?: boolean;

  className?: string;
}
