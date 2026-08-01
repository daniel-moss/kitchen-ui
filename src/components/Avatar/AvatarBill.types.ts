import { AvatarSize } from "./Avatar.types";

export type AvatarBillStatus = "none" | "draft" | "outstanding" | "overdue" | "paid" | "voided";

export interface AvatarBillProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Bill status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarBillStatus;
  className?: string;
}
