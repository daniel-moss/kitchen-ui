import { AvatarSize } from "./Avatar.types";

export type AvatarLaborStatus = "none" | "active" | "review" | "inactive";

export interface AvatarLaborProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarLaborStatus;
  className?: string;
}
