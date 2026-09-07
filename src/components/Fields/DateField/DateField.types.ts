import { InputHTMLAttributes, ReactNode } from "react";

import { Breakpoint } from "../../../hooks/useIsDesktop";
import type { InputGroupChildContext } from "../InputGroup/InputGroup.types";

interface DateFieldBaseProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "defaultValue" | "onChange" | "type" | "disabled" | "readOnly" | "placeholder" | "size" | "className"
  > {
  /**
   * The date value (controlled). null = empty. The user types a date in ANY
   * format (the Chrono parser standardizes it on commit — blur or Enter) or
   * picks one in the DatePicker. NO placeholder, per the docs. Label and help
   * text live on the Input wrapper — the field is bare.
   */
  value?: Date | null;
  /** Uncontrolled initial value. */
  defaultValue?: Date | null;
  /** Called when a typed date commits (parsed Date, or null when cleared). */
  onDateChange?: (date: Date | null) => void;

  /** false → error border + error help text below. Default true. */
  isValid?: boolean;
  /**
   * The error message (shown when isValid is false). Default: "Choose [Label]",
   * derived from the surrounding Input's string label.
   */
  errorMessage?: ReactNode;

  /**
   * Clicking the field opens the DatePicker (desktop card below, left-aligned;
   * mobile drawer with this field + Apply). Default true. Set false for a
   * type-only field.
   */
  withPicker?: boolean;
  /** Earliest selectable day (inclusive), forwarded to the DatePicker. */
  minDate?: Date;
  /** Latest selectable day (inclusive), forwarded to the DatePicker. */
  maxDate?: Date;
  /** Override "today" (deterministic stories), forwarded to the DatePicker. */
  today?: Date;
  /**
   * The label of the mobile picker drawer's inner DateField (the drawer
   * always contains one — this field is not reachable under it). Default:
   * the surrounding Input's string label, else "Date".
   */
  pickerLabel?: string;
  /**
   * Which DatePicker presentation to use: "auto" (default) tracks the viewport;
   * "desktop"/"mobile" force one. Force "mobile" inside a DeviceFrame — the
   * auto check reads the real window width, not the phone frame.
   */
  breakpoint?: Breakpoint;

  /**
   * Override how the committed date is displayed. Default is the standardized
   * "Monday, January 1, 2026" — the year is always shown. Typed input is
   * still parsed by Chrono the same way — this only changes the shown text.
   */
  formatValue?: (date: Date) => string;

  /**
   * Fires on EVERY keystroke with the Chrono parse of the current text: a
   * Date when it parses, null when the text is empty, undefined when it does
   * not parse. The DatePicker's inner field uses it to select the matching
   * date chip in real time; committing still goes through `onDateChange`.
   */
  onDateInput?: (date: Date | null | undefined) => void;

  /** @internal Injected by InputGroup — do not set directly. */
  _group?: InputGroupChildContext;

  className?: string;
}

/**
 * `disabled` and `readOnly` are mutually exclusive — a field is one or the
 * other, never both. Neither can be invalid. Empty + read-only does not exist
 * (Daniel): only use `readOnly` on a filled field.
 */
export type DateFieldProps = DateFieldBaseProps &
  ({ disabled?: boolean; readOnly?: never } | { readOnly?: boolean; disabled?: never });
