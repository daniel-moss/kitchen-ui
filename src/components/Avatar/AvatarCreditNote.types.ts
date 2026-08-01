import { AvatarSize } from "./Avatar.types";

export type AvatarCreditNoteStatus = "none" | "draft" | "unsent" | "issued" | "voided";

export interface AvatarCreditNoteProps {
  /** Avatar size (xxs–xl). Default "md". */
  size?: AvatarSize;
  /** Status → the corner icon addOn. "none" shows no addOn. Default "none". */
  status?: AvatarCreditNoteStatus;
  className?: string;
}
