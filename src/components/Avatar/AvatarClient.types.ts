import { AvatarSize } from "./Avatar.types";

/**
 * Client type — drives the icon. `generic` (unknown) is icon-only with no
 * addOns; `business` and `individual` support icon or image and a status.
 */
export type AvatarClientType = "generic" | "business" | "individual";

export type AvatarClientContent = "icon" | "image";

export type AvatarClientStatus = "none" | "active" | "inactive";

export interface AvatarClientProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Client type. Default "business". */
  type?: AvatarClientType;
  /** Icon or image. `generic` is always icon. Default "icon". */
  content?: AvatarClientContent;
  /** Status → corner icon addOn (business/individual only). Default "none". */
  status?: AvatarClientStatus;
  /** Image URL (content "image"). Defaults to the object placeholder. */
  imageSrc?: string;
  className?: string;
}
