import { AvatarSize } from "./Avatar.types";

export type AvatarOtherStatus = "none" | "active" | "review" | "inactive";

export interface AvatarOtherProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarOtherStatus;
  className?: string;
}
