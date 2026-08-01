import { InputHTMLAttributes } from "react";

export interface OTPBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "size"> {
  /** The digit shown in the box — a single character, or "" when empty. */
  value?: string;
  /** false → tomato border + red placeholder. Default true. */
  isValid?: boolean;
  className?: string;
}
