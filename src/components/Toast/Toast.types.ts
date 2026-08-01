import { ReactNode } from "react";

import { LinkButtonProps } from "../LinkButton/LinkButton.types";

/**
 * Status. Icon + title color are fixed per type — only `neutral` may use a
 * custom icon (the docs: "Icon on neutral status is not pre-defined").
 */
export type ToastType = "neutral" | "processing" | "success" | "informative" | "warning" | "error";

export type ToastVariant = "default" | "detailed";

/** A CTA is a LinkButton (black, md) — pass its props; `children` = label. */
export type ToastCta = Omit<LinkButtonProps, "colorScheme" | "size">;

interface ToastBaseProps {
  type: ToastType;
  /** The message (Medium 14/22, colored by type). Wraps when too long. */
  title: ReactNode;
  /** The action LinkButton ("Action" on default, "Primary" on detailed). */
  cta?: ToastCta;
  /** NEUTRAL only: a custom icon name. Default "circle-question". */
  icon?: string;
  /** Shows the dismiss (×) button. Default true. */
  isDismissible?: boolean;
  /** Dismiss (×) click. The toaster wires this to removal. */
  onDismiss?: () => void;
  className?: string;
}

export interface ToastDefaultProps extends ToastBaseProps {
  variant?: "default";
  caption?: never;
  secondaryCta?: never;
}

export interface ToastDetailedProps extends ToastBaseProps {
  variant: "detailed";
  /** The support text below the title (subtle 14/22). Wraps. */
  caption?: ReactNode;
  /** The second CTA, next to the primary one. */
  secondaryCta?: ToastCta;
}

export type ToastProps = ToastDefaultProps | ToastDetailedProps;
