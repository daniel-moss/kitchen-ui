import { HTMLAttributes, MouseEvent, ReactNode } from "react";

export type AlertBannerType = "card" | "banner";
export type AlertBannerOrientation = "horizontal" | "vertical";
export type AlertBannerStatus = "info" | "success" | "warning" | "error";

interface AlertBannerBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  /** The alert text. Wraps with no line limit. */
  children: ReactNode;
  /** card = bordered tinted box; banner = same tint, no border/radius. Default "card". */
  type?: AlertBannerType;
  /** Drives every color and the icon. Default "info". */
  status?: AlertBannerStatus;

  ctaHref?: string;
  ctaOnClick?: (event: MouseEvent<HTMLElement>) => void;
  /**
   * Optional icon name shown before the CTA label (e.g. "wand-magic-sparkles").
   * It inherits the status color from the LinkButton.
   */
  ctaIcon?: string;

  /** When provided, shows a muted dismiss button (xmark) that calls this. */
  onDismiss?: () => void;

  className?: string;
}

/**
 * Horizontal alerts must have a CTA — a horizontal alert without a CTA is not
 * allowed (use the vertical orientation instead). Default orientation.
 */
interface AlertBannerHorizontalProps extends AlertBannerBaseProps {
  orientation?: "horizontal";
  /**
   * CTA label. Renders a LinkButton in the scheme that matches the status.
   * Required for horizontal. Pair with ctaHref (renders <a>) or ctaOnClick (<button>).
   */
  ctaLabel: string;
}

/** Vertical alerts may omit the CTA; when present it drops below the text. */
interface AlertBannerVerticalProps extends AlertBannerBaseProps {
  orientation: "vertical";
  ctaLabel?: string;
}

export type AlertBannerProps = AlertBannerHorizontalProps | AlertBannerVerticalProps;
