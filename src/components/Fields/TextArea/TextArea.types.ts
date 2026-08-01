import { TextareaHTMLAttributes } from "react";

interface TextAreaBaseProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "disabled" | "readOnly" | "placeholder" | "rows" | "className" | "value" | "defaultValue"
  > {
  /**
   * NO placeholder on purpose (the docs): informative text goes to the hint
   * or the help text. The mobile keyboard is always "text". The field is
   * min 4 rows tall and GROWS with the content — no inner scroll, no max
   * height (the docs: intentional, better mobile UX). Label and help text
   * live on the Input wrapper — the field is bare.
   */

  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;

  /**
   * The clear (×) button — shown whenever the field is filled (and
   * interactive). Clicking it opens the confirm Prompt ("Clear [label]?");
   * confirming empties the field. Controlled consumers get `onClear` to reset
   * their state. Default true.
   */
  clearable?: boolean;
  /** Called after the clear Prompt is confirmed. */
  onClear?: () => void;
  /**
   * The label used in the clear Prompt copy ("Clear [label]?"). Default: the
   * surrounding Input's string label, else "text".
   */
  clearPromptLabel?: string;

  /** false → error border + error help text below. Default true. */
  isValid?: boolean;
  /**
   * The error message (shown when isValid is false). Default: "Provide
   * [Label]", derived from the surrounding Input's string label.
   */
  errorMessage?: React.ReactNode;

  className?: string;
}

/**
 * `disabled` and `readOnly` are mutually exclusive — a field is one or the
 * other, never both. Neither can be invalid. Empty + read-only does not exist
 * (Daniel): only use `readOnly` on a filled field.
 */
export type TextAreaProps = TextAreaBaseProps &
  ({ disabled?: boolean; readOnly?: never } | { readOnly?: boolean; disabled?: never });
