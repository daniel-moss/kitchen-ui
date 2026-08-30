import { HTMLAttributes, MouseEvent, ReactNode } from "react";

export type CardStatus = "info" | "success" | "warning" | "error";

/**
 * Config for the optional in-card alert banner. The banner's color and icon
 * come from the Card's `status` — you only pass its content and actions.
 */
export interface CardBanner {
  /** Banner text. */
  children: ReactNode;
  /** CTA label — renders a LinkButton in the status color. */
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: (event: MouseEvent<HTMLElement>) => void;
  /** When set, shows a dismiss (xmark) button that calls this. */
  onDismiss?: () => void;
}

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  /** Body content. Any element; the card is a pure container. */
  children?: ReactNode;
  /** Click handler for the card body. The card is always interactive. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;

  /** Colors the ring and the banner. Defaults to "info" when a ring/banner shows. */
  status?: CardStatus;
  /** Draw a 1px status-colored ring around the card. */
  ring?: boolean;
  /** Show an alert banner pinned at the top of the card. Implies a matching ring. */
  banner?: CardBanner;

  /** Body inner padding. Number → px, or any CSS length/token. Default 16. */
  padding?: number | string;

  /** Non-interactive and dimmed. */
  disabled?: boolean;
  /** Non-interactive; shows the native busy (progress) cursor while content loads. */
  loading?: boolean;
  /** Lifted "dragging" look — 1px gray-12 border + a large lift shadow. Non-interactive. */
  dragging?: boolean;

  /** Error behavior — replaces the body with an error EmptyState (content failed to load). */
  error?: boolean;
  /** Retry handler for the error state's Reload button. */
  onRetry?: () => void;

  className?: string;
  /** Extra class on the inner body (the interactive content region). */
  bodyClassName?: string;
}
