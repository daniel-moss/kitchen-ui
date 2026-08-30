import { InputHTMLAttributes } from "react";

export type SearchFieldType = "field" | "bar";

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "value" | "defaultValue"> {
  /** field = a bordered 36px box with a `--gray-a2` fill; bar = a bare 40px row (no fill, no border, no divider). Default "field". */
  type?: SearchFieldType;

  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;

  /** Hint text shown while the field is empty. */
  placeholder?: string;

  /** Dimmed to 30%, non-interactive; the "Clear" button is hidden. */
  disabled?: boolean;
  /** Skeleton placeholder in place of the field. */
  loading?: boolean;

  /** Called when the "Clear" (×) button is clicked. */
  onClear?: () => void;

  className?: string;
}
