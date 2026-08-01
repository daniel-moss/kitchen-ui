import { InputHTMLAttributes } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Checked — shows a check glyph. */
  checked?: boolean;
  /** Uncontrolled initial checked value. */
  defaultChecked?: boolean;
  /** Indeterminate — shows a hyphen glyph. Takes visual precedence over `checked`. */
  indeterminate?: boolean;

  /** Error styling (tomato). */
  error?: boolean;
  /** Non-interactive, dimmed. */
  disabled?: boolean;
  /** Non-interactive; plain fill with no icon and the native busy cursor. */
  loading?: boolean;

  className?: string;
}
