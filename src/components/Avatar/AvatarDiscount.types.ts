import { AvatarSize } from "./Avatar.types";

export type AvatarDiscountStatus = "none" | "active" | "review" | "inactive";

export interface AvatarDiscountProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarDiscountStatus;
  className?: string;
}
