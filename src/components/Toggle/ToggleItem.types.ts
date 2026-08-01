import { InputHTMLAttributes, ReactNode } from "react";

export interface ToggleItemProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** The label text (rendered with the Label component). */
  label: ReactNode;
  /** Optional caption below the label — subtle, wraps if it doesn't fit one line. */
  caption?: ReactNode;

  /** On (active) state — controlled. */
  checked?: boolean;
  /** Uncontrolled initial on value. */
  defaultChecked?: boolean;

  /** Error styling (tomato track). */
  error?: boolean;
  /** Non-interactive, dims the whole item. */
  disabled?: boolean;
  /** Non-interactive, dims only the toggle (label stays full color). */
  readOnly?: boolean;
  /** Non-interactive; skeleton text + pulsing toggle. */
  loading?: boolean;

  className?: string;
}
