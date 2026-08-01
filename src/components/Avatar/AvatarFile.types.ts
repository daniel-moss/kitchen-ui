import { AvatarSize } from "./Avatar.types";

export type AvatarFileType =
  | "generic"
  | "image"
  | "imagePlaceholder"
  | "gif"
  | "audio"
  | "video"
  | "pdf"
  | "word"
  | "spreadsheet"
  | "presentation"
  | "markdown"
  | "vector"
  | "archive";

export interface AvatarFileProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** File type → icon + colors. Default "generic". */
  type?: AvatarFileType;
  /** Image URL for the `image` type. Defaults to a generic placeholder. */
  imageSrc?: string;
  className?: string;
}
