import { AvatarSize } from "./Avatar.types";

export type AvatarPOStatus =
  | "none"
  | "draft"
  | "unsent"
  | "sent"
  | "acknowledged"
  | "inTransit"
  | "unstocked"
  | "unpaid"
  | "paid"
  | "cancelled";

export interface AvatarPOProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarPOStatus;
  className?: string;
}
