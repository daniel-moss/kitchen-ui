import { ReactNode } from "react";

import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";

/** Which side of the trigger the tooltip sits on (where the tongue points). */
export type TooltipPlacement = "top" | "bottom" | "left" | "right";

/**
 * Tongue position along the placement edge. For top/bottom: start=left,
 * center, end=right. For left/right: start=top, center, end=bottom.
 */
export type TooltipAlign = "start" | "center" | "end";

/** Body content type. */
export type TooltipVariant = "text" | "avatarGroup" | "slot";

export interface TooltipProps {
  /** Placement (tongue side). Default "bottom". */
  placement?: TooltipPlacement;
  /** Tongue position along the edge. Default "center". */
  align?: TooltipAlign;
  /** Body content type. Default "text". */
  variant?: TooltipVariant;

  /** Text (variant "text"). */
  text?: string;
  /** Text alignment (variant "text"). Default "center". */
  textAlign?: "center" | "left";

  /** Avatars (variant "avatarGroup") — rendered as an xs stack, no truncation. */
  items?: AvatarGroupItem[];

  /** Arbitrary content (variant "slot"). */
  children?: ReactNode;

  /** Max width. Default 240. */
  maxWidth?: number | string;
  className?: string;
}
