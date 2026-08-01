import { AvatarSize } from "./Avatar.types";

export type AvatarWarrantyStatus = "none" | "active" | "upcoming" | "expired";

export interface AvatarWarrantyProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarWarrantyStatus;
  className?: string;
}
