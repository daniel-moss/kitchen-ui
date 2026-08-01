import { HTMLAttributes, ReactNode } from "react";

export type InputHelpTextStatus = "neutral" | "info" | "success" | "warning" | "error";

export interface InputHelpTextProps extends HTMLAttributes<HTMLDivElement> {
  /** The help text. */
  children: ReactNode;

  /** Colors the text (and status icon). Default "neutral". */
  status?: InputHelpTextStatus;

  /** Show a left icon. Status variants use their own icon; neutral uses `icon`. */
  slotLeft?: boolean;
  /** Left icon name for the neutral status (status variants pick their own). */
  icon?: string;

  /** Show a skeleton line instead of the text. */
  isLoading?: boolean;

  className?: string;
}
