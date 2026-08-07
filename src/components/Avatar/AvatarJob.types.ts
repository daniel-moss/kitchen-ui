import { AvatarSize } from "./Avatar.types";

export type AvatarJobStatus =
  | "none"
  | "draft"
  | "unscheduled"
  | "upcoming"
  | "pastDue"
  | "active"
  | "quickPaused"
  | "onHoldExternal"
  | "onHoldInternal"
  | "completed"
  | "finalized"
  | "cancelled";

export interface AvatarJobProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarJobStatus;
  className?: string;
}
