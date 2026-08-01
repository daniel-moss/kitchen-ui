import { InputHTMLAttributes, ReactNode } from "react";

export type PasswordFieldVariant = "default" | "new" | "confirm";

/** Condition badge state: default = not checked yet · invalid = not met · valid = met. */
export type PasswordConditionState = "default" | "invalid" | "valid";

export interface PasswordCondition {
  /** The requirement text (e.g. "At least 8 characters"). */
  label: ReactNode;
  /** Default "default". */
  state?: PasswordConditionState;
}

export interface PasswordFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "disabled" | "readOnly" | "placeholder" | "size" | "className" | "prefix"
  > {
  /**
   * default = sign-in password (error help text below) · new = create a
   * password (condition badges below) · confirm = repeat the password (one
   * match badge below). Label and help text live on the Input wrapper; the
   * strength indicator is Input's `strength` prop. NO placeholder (the docs).
   */
  variant?: PasswordFieldVariant;

  /**
   * variant="new": the requirement badges. Default: "At least 8 characters" /
   * "Letters" / "Numbers", all in the "default" state — the consumer drives
   * each badge's state as the user types. Conditions are independent from the
   * strength indicator (the docs: a password can be weak but meet all
   * requirements and vice-versa).
   */
  conditions?: PasswordCondition[];
  /**
   * variant="confirm": the match badge — "default" → "Passwords must match",
   * "valid" → "Passwords match", "invalid" → "Passwords do not match".
   */
  matchState?: PasswordConditionState;

  /**
   * Show the password-manager key icon (1Password, Apple Passwords, …) next
   * to the Show/Hide button while the field is focused (the docs: usually
   * shown on active state only). Display-only.
   */
  passwordManagerIcon?: boolean;

  /**
   * false → error border; on variant="default" the error help text also shows
   * below, and unmet ("default") badges turn invalid. Default true.
   */
  isValid?: boolean;
  /**
   * The error message (variant="default" only). Default: "Enter [Label]"
   * derived from the surrounding Input's string label, else "Enter password".
   */
  errorMessage?: ReactNode;

  /**
   * Dims + disables (30%); the badges and the Show/Hide button are hidden. A
   * password field has NO read-only state (Figma), and disabled can not be
   * invalid.
   */
  disabled?: boolean;

  className?: string;
}
