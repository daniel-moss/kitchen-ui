import { ReactNode } from "react";

/** Where a field sits inside the fused row (drives its border radius + seam). */
export type InputGroupPosition = "first" | "middle" | "last";

/**
 * Injected by InputGroup into each child field (via the internal `_group`
 * prop). When present, the field renders "grouped": bare of its own error
 * message, as a flex segment, with the fused-border chrome; validity, disabled
 * and read-only are inherited from the group so the whole box acts as one.
 */
export interface InputGroupChildContext {
  position: InputGroupPosition;
  disabled?: boolean;
  readOnly?: boolean;
  isValid?: boolean;
}

export interface InputGroupProps {
  /**
   * The fields to fuse — two or more field components (DateField, TextField,
   * SelectField, …). InputGroup renders them as segments of one bordered box.
   * The Figma component defines three variants: DateField+SelectField,
   * TextField+SelectField and DateField+TextField+SelectField (date + time +
   * AM/PM — fixed 64px time segment, hugging select); the implementation
   * stays flexible on purpose (Daniel). Label and help text live on the
   * Input wrapper — the group is bare.
   */
  children: ReactNode;

  /** false → the whole group shows the error border + one message below. */
  isValid?: boolean;
  /**
   * The shared error message. Default: "Provide [Label]", derived from the
   * surrounding Input's string label.
   */
  errorMessage?: ReactNode;
  /** Dims + disables every segment. */
  disabled?: boolean;
  /** Transparent, non-editable every segment (mutually exclusive with disabled). */
  readOnly?: boolean;

  className?: string;
}
