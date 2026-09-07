import { CSSProperties } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

/** A picked range. Either end may still be null while the user is choosing. */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DatePickerBaseProps {
  /**
   * Initial visible month. Defaults to the selection's month (a range opens
   * with its start date's month), else today's month.
   */
  defaultMonth?: Date;
  /** Earliest selectable day (inclusive). Days before it are dimmed + inert. */
  minDate?: Date;
  /** Latest selectable day (inclusive). Days after it are dimmed + inert. */
  maxDate?: Date;
  /** Override "today" (for deterministic stories). Defaults to the current date. */
  today?: Date;

  /** auto (default) tracks the viewport; desktop/mobile force one presentation. */
  breakpoint?: Breakpoint;

  /**
   * Mount + animation control (like Menu): keep mounted and flip this. Default
   * true. Desktop plays the Popover card fade; mobile the drawer slide.
   */
  open?: boolean;
  /**
   * Desktop: Esc, or the DatePicker applying a single date. Mobile: scrim tap /
   * swipe-down (changes are discarded) or Apply. Outside-click dismissal on
   * desktop is the consumer's wiring (DateField does it).
   */
  onClose?: () => void;

  /**
   * Desktop only: render the inner DateField(s) above the calendar — needed
   * when the trigger is a Button, not a DateField. The mobile drawer always
   * has them (the trigger field is not reachable under the drawer). Default
   * false.
   */
  input?: boolean;

  className?: string;
  style?: CSSProperties;
}

export interface DatePickerSingleProps extends DatePickerBaseProps {
  /** Single-date mode (default). */
  isRange?: false;
  /** Selected date (controlled). null = none. */
  value?: Date | null;
  /** Uncontrolled initial selection. */
  defaultValue?: Date | null;
  /**
   * A date was applied — desktop: a chip was clicked (the picker also calls
   * onClose); mobile: Apply was tapped.
   */
  onChange?: (date: Date) => void;
  /** The inner DateField's label. Default "Date". */
  label?: string;

  range?: never;
  defaultRange?: never;
  onRangeChange?: never;
  fromLabel?: never;
  toLabel?: never;
}

export interface DatePickerRangeProps extends DatePickerBaseProps {
  /** Range mode: two calendars on desktop, From/To fields on mobile. */
  isRange: true;
  /** Selected range (controlled). */
  range?: DateRange;
  /** Uncontrolled initial range. */
  defaultRange?: DateRange;
  /**
   * The range changed — desktop: on every click (start set, end set, restart);
   * mobile: once, on Apply.
   */
  onRangeChange?: (range: DateRange) => void;
  /** The start field's label. Default "From". */
  fromLabel?: string;
  /** The end field's label. Default "To". */
  toLabel?: string;

  value?: never;
  defaultValue?: never;
  onChange?: never;
  label?: never;
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;
