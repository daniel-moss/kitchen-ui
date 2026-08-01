import { CSSProperties, ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

export interface DatePickerProps {
  /** Selected date (controlled). null = none. */
  value?: Date | null;
  /** Uncontrolled initial selection. */
  defaultValue?: Date | null;
  /** A day was picked. */
  onChange?: (date: Date) => void;

  /** Initial visible month. Defaults to the selected date's month, else today. */
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
   * true. Desktop plays a card fade; mobile a drawer slide.
   */
  open?: boolean;
  /** Escape (desktop) / scrim tap + swipe-down (mobile) dismiss. */
  onClose?: () => void;

  /**
   * Mobile drawer only: a section pinned below a divider under the calendar —
   * used for the DateField + Apply footer. Omitted for a plain-Button trigger.
   * Ignored on desktop.
   */
  footer?: ReactNode;

  className?: string;
  style?: CSSProperties;
}
