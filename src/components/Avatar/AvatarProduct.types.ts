import { AvatarSize } from "./Avatar.types";

export type AvatarProductStatus = "none" | "active" | "inactive" | "review";

export interface AvatarProductProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Icon or image. Default "icon". */
  content?: "icon" | "image";
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarProductStatus;
  /** Image URL (content "image"). Defaults to the object placeholder. */
  imageSrc?: string;
  className?: string;
}
