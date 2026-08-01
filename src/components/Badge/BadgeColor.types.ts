import { ReactNode } from "react";

import { BadgeSize } from "./Badge.types";
import { IconPack, IconSize } from "../Icon/Icon.types";

export type BadgeColorScheme =
  | "gray"
  | "brown"
  | "amber"
  | "orange"
  | "tomato"
  | "crimson"
  | "violet"
  | "blue"
  | "cyan"
  | "jade";

export interface BadgeColorProps {
  /** Size. Default "md". */
  size?: BadgeSize;
  /** Color scheme (tinted fill, colored border/text/icon). Default "gray". */
  colorScheme?: BadgeColorScheme;
  /** The label. */
  children?: ReactNode;

  /** Left icon name (icon slot). No avatar slot on BadgeColor. */
  leftIcon?: string;
  /** Left icon pack / weight. Default "regular". */
  leftIconPack?: IconPack;
  /** Left icon size override. Default 12 (sm) / 14. */
  leftIconSize?: IconSize;
  /** Left icon rotation in degrees (e.g. 90, 180, 270). */
  leftIconRotate?: number;
  /** Show a small dot (scheme color) in the left slot instead of an icon. */
  leftDot?: boolean;

  /** Show a dismiss (×) button on the right. Default false. */
  isDismissable?: boolean;
  /** Called when the dismiss button is clicked. */
  onDismiss?: () => void;

  className?: string;
}
