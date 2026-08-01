import { AvatarSize } from "./Avatar.types";

export type AvatarJobSeriesStatus = "none" | "open" | "closed";

export interface AvatarJobSeriesProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner statusDot. "none" shows no addOn. Default "none". */
  status?: AvatarJobSeriesStatus;
  className?: string;
}
