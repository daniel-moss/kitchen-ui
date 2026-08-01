import { AvatarSize } from "./Avatar.types";

export type AvatarInvoiceStatus =
  | "none"
  | "draft"
  | "unsent"
  | "outstanding"
  | "overdue"
  | "paid"
  | "voided"
  | "forgiven";

export interface AvatarInvoiceProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarInvoiceStatus;
  className?: string;
}
