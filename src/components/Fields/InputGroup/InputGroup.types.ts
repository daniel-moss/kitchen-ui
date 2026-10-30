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
  isLoading?: boolean;
}

export interface InputGroupProps {
  /**
   * The fields to fuse — two to four field components (DateField, TextField,
   * SelectField). InputGroup renders them as segments of one bordered box.
   * Widths follow the Figma segments (2026-10-30): text and date fill, a
   * SelectField hugs its value, and a typed time is a TextField the consumer
   * fixes at 64px (the session form's `.time`). Label and help text live on
   * the Input wrapper — the group is bare.
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
  /**
   * Every segment shows the loading block instead of its content (Figma
   * `state=loading`). No error while loading.
   */
  isLoading?: boolean;

  className?: string;
}
