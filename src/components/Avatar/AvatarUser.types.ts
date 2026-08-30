import { AvatarSize } from "./Avatar.types";

/**
 * User content. `image` is the uploaded or Gravatar picture; `letters` the
 * initials; `icon` the locked user glyph; `placeholder` an empty slot (dashed
 * ring); `counter` the `+N` overflow of a truncated group (not used on xxs).
 */
export type AvatarUserContent = "image" | "letters" | "icon" | "placeholder" | "counter";

export interface AvatarUserProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** What fills the avatar. Default "image". */
  content?: AvatarUserContent;
  /** Initials (content "letters"). One letter on xxs/xs, two from sm up. Default "AB". */
  characters?: string;
  /** Image URL (content "image"). Defaults to a person portrait. */
  imageSrc?: string;
  /** Count (content "counter"). Default 2. */
  count?: number;
  /**
   * Primary contact → a crown icon addOn. Only for image/letters/icon content
   * (ignored on counter/placeholder and on xxs, which takes no icon addOn).
   * Default false.
   */
  isPrimary?: boolean;
  /**
   * Loading state. Shows the pulsing user-icon variant — because we already
   * know the avatar will be a user, the icon reads better than an empty shape.
   * Default false.
   */
  isLoading?: boolean;
  className?: string;
}
