import { HTMLAttributes, ReactNode } from "react";

/**
 * Where the log sits in its stack — it decides which timeline connectors the
 * log draws. Normally DERIVED from the position in the stack (first / last /
 * only child); set it explicitly only to force one, e.g. in a story.
 */
export type ActivityLogItemPosition = "top" | "center" | "bottom" | "single";

export interface ActivityLogItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /**
   * The 20px symbol on the timeline — the event's "who / what". An `Avatar`
   * (`size="xs"`) for a person, or an `Icon` (`size={14}`) for a system action.
   * Default: an `Icon` with "diamonds-4" (the generic event symbol).
   */
  symbol?: ReactNode;
  /**
   * The log sentence. The base run is regular `--text-subtle`; wrap the parts
   * that carry the meaning (user name, field name, new value) in
   * `ActivityLogEmphasis`. Wraps onto more lines when it does not fit.
   */
  text: ReactNode;

  /**
   * When the event happened. The component derives both the shown label
   * ("1h ago" while recent, then the date "May 12") and the tooltip
   * ("Mon, Jan 1, 2026 at 12:00 PM" — always with the year) from it.
   */
  date?: Date;
  /** Overrides the label computed from `date`. */
  label?: string;
  /** Overrides the tooltip text computed from `date`. Set "" to drop the tooltip. */
  tooltipLabel?: string;

  /**
   * Makes the log an accordion: the whole row toggles, revealing the event
   * details. Default: true when the log has `children`.
   */
  accordion?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  /** Position in the stack. Leave it out — the stack position decides. */
  position?: ActivityLogItemPosition;

  /** The event details — `ActivityLogSubItem`s, one per changed field. */
  children?: ReactNode;
  className?: string;
}
