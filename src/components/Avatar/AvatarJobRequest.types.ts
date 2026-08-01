import { AvatarSize } from "./Avatar.types";

export type AvatarJobRequestStatus = "none" | "pending" | "accepted" | "finalized" | "declined";

export interface AvatarJobRequestProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarJobRequestStatus;
  className?: string;
}
