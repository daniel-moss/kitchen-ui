import { InputHTMLAttributes } from "react";

export type SearchFieldType = "field" | "bar";

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "value" | "defaultValue"> {
  /** field = a bordered 32px box; bar = a filled 36px row with a 1px Divider below. Default "field". */
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
