import { ReactNode } from "react";

export interface OTPFieldProps {
  /** The code (controlled). Characters past `length` are ignored. */
  value?: string;
  /** The initial code (uncontrolled). */
  defaultValue?: string;
  /** Fires on every edit with the current code. */
  onChange?: (code: string) => void;
  /** Fires once every box is filled, with the complete code. */
  onComplete?: (code: string) => void;

  /** Number of digit boxes. Default `6`. */
  length?: number;

  /**
   * false → tomato boxes + the error help text, and the error response: the
   * field shakes, holds the error for 2 seconds, then clears the digits. The
   * message stays until the user starts typing again. Default true.
   */
  isValid?: boolean;
  /**
   * The error message shown below when `isValid` is false. Default
   * "Enter the code". It stays after the auto-reset, until the user types again.
   */
  errorMessage?: ReactNode;

  /** Focus the first empty box on mount ("active by default"). Default true. */
  autoFocus?: boolean;
  /** Dim + block the whole field. Can not be invalid. Default false. */
  disabled?: boolean;

  className?: string;
}
