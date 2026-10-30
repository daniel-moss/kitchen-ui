import { HTMLAttributes, ReactNode } from "react";

import type { InputGroupChildContext } from "../InputGroup/InputGroup.types";

interface SelectFieldBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, "prefix"> {
  /** The selected value (shown in the body). Presence = "filled". */
  value?: ReactNode;
  /**
   * Shown while the field is empty. Optional in a full-width field; a hugging
   * field (`fitContent`, or any SelectField inside an InputGroup) needs one,
   * or the empty field has no width (Figma, 2026-10-30).
   */
  placeholder?: ReactNode;

  // ---- single-select clear ----
  /**
   * Single-select only: a clear (×) button before the chevron while the field
   * is filled and interactive. Use it on an OPTIONAL field instead of a
   * "No …" option in the list. It clears at once — no confirm Prompt (unlike
   * TextArea): choosing again is quick. Multi-select clears with the
   * counter's × instead.
   */
  isClearable?: boolean;
  /** Called when the clear button is clicked. */
  onClear?: () => void;

  /**
   * The loading block instead of the field (Figma `state=loading`): no value,
   * no placeholder, no icons. Inside an InputGroup the group's `isLoading` wins.
   */
  isLoading?: boolean;

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
   * Hug the value instead of filling the container. Standalone the default is
   * full width, like every other field. Inside an `InputGroup` the default is
   * to HUG (the Figma select segment, 2026-10-30): the segment takes only its
   * content's width and never shrinks, so the other segments get the rest of
   * the row. Pass `fitContent={false}` to make a grouped select share the row.
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
