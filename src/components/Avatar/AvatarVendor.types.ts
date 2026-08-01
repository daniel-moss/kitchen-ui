import { AvatarSize } from "./Avatar.types";

export type AvatarVendorStatus = "none" | "active" | "inactive";

export interface AvatarVendorProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Icon or image. Default "icon". */
  content?: "icon" | "image";
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarVendorStatus;
  /** Image URL (content "image"). Defaults to the object placeholder. */
  imageSrc?: string;
  className?: string;
}
