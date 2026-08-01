import { InputHTMLAttributes, ReactNode } from "react";

import type { InputGroupChildContext } from "../InputGroup/InputGroup.types";

/**
 * The mobile keyboard (docs "Mobile keyboard"): default "text"; email-format
 * data → "email"; URLs → "url"; phone numbers → "tel"; phone extensions and
 * other digit-only data → "numeric".
 */
export type TextFieldKeyboard = "text" | "email" | "url" | "tel" | "numeric";

interface TextFieldBaseProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "prefix" | "type" | "inputMode" | "disabled" | "readOnly" | "placeholder" | "size" | "className"
  > {
  /**
   * NO placeholder on purpose (the docs): informative text goes to the hint
   * or the help text. `value`/`defaultValue`/`onChange` are the native input
   * props (controlled or uncontrolled). Label and help text live on the Input
   * wrapper — the field is bare.
   */

  /** Prefix — subtle text before the value (e.g. "NET", "every"). */
  prefix?: ReactNode;
  /** Suffix — subtle text after the value (e.g. "hr", "minutes"). */
  suffix?: ReactNode;

  /**
   * Opt-in placeholder. The DS default is NO placeholder (informative text goes
   * to the hint / help text) — set this only for a format hint like a masked
   * time input ("00:00"), where the placeholder shows the shape and clears as
   * the user types.
   */
  placeholder?: string;

  /** The mobile keyboard. Default "text". */
  keyboard?: TextFieldKeyboard;

  /** false → error border + error help text below. Default true. */
  isValid?: boolean;
  /**
   * The error message (shown when isValid is false). Default: "Enter [Label]",
   * derived from the surrounding Input's string label.
   */
  errorMessage?: ReactNode;

  /** @internal Injected by InputGroup — do not set directly. */
  _group?: InputGroupChildContext;

  className?: string;
}

/**
 * `disabled` and `readOnly` are mutually exclusive — a field is one or the
 * other, never both. Neither can be invalid. Empty + read-only does not exist
 * (Daniel): only use `readOnly` on a filled field.
 */
export type TextFieldProps = TextFieldBaseProps &
  ({ disabled?: boolean; readOnly?: never } | { readOnly?: boolean; disabled?: never });
