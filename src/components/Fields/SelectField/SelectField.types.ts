import { HTMLAttributes, ReactNode } from "react";

import type { InputGroupChildContext } from "../InputGroup/InputGroup.types";

interface SelectFieldBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, "prefix"> {
  /** The selected value (shown in the body). Presence = "filled". */
  value?: ReactNode;

  /** Left slot in the body — an Icon (use `container="square"`) or a user Avatar. */
  slotLeft?: ReactNode;
  /** Right suffix text in the body. */
  suffix?: ReactNode;

  // ---- multi-select ----
  /** Enable multi-select: when filled, a count pill is shown before the value. */
  multiSelect?: boolean;
  /** Number of selected options (drives "filled" + the counter in multi-select). */
  count?: number;
  /**
   * Multi-select display when more than one option is selected. Default
   * "Options selected"; pass custom copy (e.g. "Locations") when designs specify
   * it. With exactly one option selected, `value` (its name) is shown instead.
   */
  multiSelectLabel?: ReactNode;
  /** Clear-all handler for the counter's × button. */
  onClearSelection?: () => void;

  // ---- validity ----
  /** false → error border + error help text below. Default true. */
  isValid?: boolean;
  /**
   * The error message (shown when isValid is false). Default: "Choose [Label]",
   * derived from the surrounding Input's string label.
   */
  errorMessage?: ReactNode;
  /** Force the active (open) look — a gray-12 border, as when the menu is open. */
  open?: boolean;

  /**
   * Hug the value instead of filling the container (the DS default is full
   * width, like every other field).
   */
  fitContent?: boolean;

  /** @internal Injected by InputGroup — do not set directly. */
  _group?: InputGroupChildContext;

  className?: string;
}

/**
 * `disabled` and `readOnly` are mutually exclusive — a field is one or the other,
 * never both. Neither can be invalid. Empty + read-only does not exist (Daniel):
 * only use `readOnly` on a filled field.
 */
export type SelectFieldProps = SelectFieldBaseProps &
  (
    | { disabled?: boolean; readOnly?: never }
    | { readOnly?: boolean; disabled?: never }
  );
