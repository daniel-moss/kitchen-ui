import { AvatarSize } from "./Avatar.types";

export type AvatarEstimateStatus =
  | "none"
  | "draft"
  | "unsent"
  | "awaitingApproval"
  | "expired"
  | "unconverted"
  | "jobbed"
  | "invoiced"
  | "cancelled";

export interface AvatarEstimateProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarEstimateStatus;
  className?: string;
}
