import { AvatarSize } from "./Avatar.types";

export type AvatarSeriesStatus = "none" | "open" | "closed";

export interface AvatarSeriesProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner statusDot. "none" shows no addOn. Default "none". */
  status?: AvatarSeriesStatus;
  className?: string;
}
