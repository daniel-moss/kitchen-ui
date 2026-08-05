import { HTMLAttributes, MouseEvent, ReactNode } from "react";

export type DisplayModuleVariant = "default" | "accordion" | "bodyOnly";
export type DisplayModuleStatus = "none" | "info" | "success" | "warning" | "error";

/** Config for the optional alert banner. Its color/icon come from `status`. */
export interface DisplayModuleBanner {
  children: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: (event: MouseEvent<HTMLElement>) => void;
  onDismiss?: () => void;
}

interface DisplayModuleBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "content"> {
  /**
   * default = header + divider + body; accordion = collapsible (interactive
   * header); bodyOnly = just the body (no header). Default "default".
   */
  variant?: DisplayModuleVariant;

  /** Title text — used by default / accordion. Truncates with an ellipsis. */
  title?: ReactNode;
  /** Left slot — an Avatar (object / user / template), md (28px) size. */
  slotLeft?: ReactNode;
  /** Right slot — up to 2 elements: IconButton, Button (ghost), or a live Avatar. */
  slotRight?: ReactNode;

  /** Body content slot — any content (required). In the accordion it shows when open. */
  content: ReactNode;
  /**
   * Whether the body adds its default `--size-4` (16px) padding around
   * `content`. Set false when the content brings its own — the body then adds
   * none, so any padding the content needs is possible. Default true.
   */
  bodyPadded?: boolean;

  // ---- error ("no fetching data") ----
  /**
   * When true, the body is replaced by the "content failed to load" error
   * EmptyState (red circle-xmark + "Reload"), like Card. The header stays.
   */
  error?: boolean;
  /** Reload handler for the error state's "Reload" button. */
  onRetry?: () => void;

  // ---- status / banner (like Card) ----
  /** Any status other than "none" draws a 1px status-colored ring. Default "none". */
  status?: DisplayModuleStatus;
  /** Show an alert banner at the top (uses the status color). Needs a real status. */
  banner?: DisplayModuleBanner;

  // ---- accordion ----
  /** Open state (controlled). */
  open?: boolean;
  /** Uncontrolled initial open state. Default false. */
  defaultOpen?: boolean;
  /** Called with the next open state when the accordion header is toggled. */
  onOpenChange?: (open: boolean) => void;
  /** Accordion only: dim the header and make it non-interactive. */
  disabled?: boolean;

  className?: string;
}

/**
 * The title's badge slot and the caption are mutually exclusive — a title row
 * can have either a trailing badge or a caption below, not both.
 */
export type DisplayModuleProps = DisplayModuleBaseProps &
  ({ titleSlotRight?: ReactNode; caption?: never } | { caption?: ReactNode; titleSlotRight?: never });
