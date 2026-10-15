import { AvatarSize } from "./Avatar.types";

/**
 * The corner addOn. `active` / `inactive` = a statusDot (jade / gray);
 * `preferred` = an amber crown icon.
 */
export type AvatarVendorAddOn = "none" | "active" | "inactive" | "preferred";

export interface AvatarVendorProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Icon or image. Default "icon". */
  content?: "icon" | "image";
  /**
   * Corner addOn: `active` / `inactive` show a statusDot, `preferred` shows
   * the crown icon. `preferred` is not available on xxs (Avatar has no icon
   * addOn there). Default "none".
   */
  addOn?: AvatarVendorAddOn;
  /** Image URL (content "image"). Defaults to the object placeholder. */
  imageSrc?: string;
  className?: string;
}
