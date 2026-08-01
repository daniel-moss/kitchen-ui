import { InputHTMLAttributes } from "react";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Selected. */
  checked?: boolean;
  /** Uncontrolled initial selected value. */
  defaultChecked?: boolean;

  /** Error styling (tomato). */
  error?: boolean;
  /** Non-interactive, dimmed. */
  disabled?: boolean;
  /** Non-interactive; plain fill with no dot and the native busy cursor. */
  loading?: boolean;

  className?: string;
}
