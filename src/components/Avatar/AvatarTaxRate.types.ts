import { AvatarSize } from "./Avatar.types";

export type AvatarTaxRateStatus = "none" | "active" | "review" | "inactive";

export interface AvatarTaxRateProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner statusDot. "none" shows no addOn. Default "none". */
  status?: AvatarTaxRateStatus;
  className?: string;
}
