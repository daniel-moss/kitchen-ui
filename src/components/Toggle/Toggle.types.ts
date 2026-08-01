import { InputHTMLAttributes } from "react";

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** On (active) state — controlled. */
  checked?: boolean;
  /** Uncontrolled initial on value. */
  defaultChecked?: boolean;

  /** Error styling (tomato track). */
  error?: boolean;
  /** Non-interactive, dimmed. */
  disabled?: boolean;
  /** Non-interactive; pulsing track with no knob and the native busy cursor. */
  loading?: boolean;

  className?: string;
}
