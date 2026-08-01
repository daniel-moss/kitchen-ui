import { AvatarSize } from "./Avatar.types";

export type AvatarUserContent = "image" | "letters" | "icon" | "counter" | "placeholder";

export interface AvatarUserProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** User content — mirrors Avatar `type=user`. Default "image". */
  content?: AvatarUserContent;
  /** Letters (content "letters"). Default "AB". */
  letter?: string;
  /** Image URL (content "image"). Defaults to a person portrait. */
  imageSrc?: string;
  /** Count (content "counter"). Default 2. */
  count?: number;
  /**
   * Primary user → a crown icon addOn. Only for image/icon/letters content
   * (ignored on counter/placeholder and xxs). Default false.
   */
  isPrimary?: boolean;
  className?: string;
}
