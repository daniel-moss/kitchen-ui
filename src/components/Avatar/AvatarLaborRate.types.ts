import { AvatarSize } from "./Avatar.types";

export type AvatarLaborRateStatus = "none" | "active" | "review" | "inactive";

export interface AvatarLaborRateProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner statusDot. "none" shows no addOn. Default "none". */
  status?: AvatarLaborRateStatus;
  className?: string;
}
