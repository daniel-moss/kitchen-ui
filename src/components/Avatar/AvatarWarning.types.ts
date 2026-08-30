import { AvatarSize } from "./Avatar.types";

export interface AvatarWarningProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /**
   * Loading state. Shows the generic Avatar skeleton (a pulsing `--gray-a3`
   * shape) instead of the amber tile and icon. Default false.
   */
  isLoading?: boolean;
  className?: string;
}
