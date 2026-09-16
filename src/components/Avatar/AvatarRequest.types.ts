import { AvatarSize } from "./Avatar.types";

export type AvatarRequestStatus = "none" | "pending" | "accepted" | "finalized" | "declined";

export interface AvatarRequestProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarRequestStatus;
  className?: string;
}
