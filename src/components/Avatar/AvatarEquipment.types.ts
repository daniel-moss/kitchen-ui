import { AvatarSize } from "./Avatar.types";

export type AvatarEquipmentStatus = "none" | "covered" | "partiallyCovered" | "expired";

export interface AvatarEquipmentProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarEquipmentStatus;
  className?: string;
}
