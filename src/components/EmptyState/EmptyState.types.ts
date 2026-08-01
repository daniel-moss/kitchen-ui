import { HTMLAttributes, ReactNode } from "react";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  /** Optional left icon name (e.g. "arrows-rotate" for a Reload button). */
  leftIcon?: string;
}

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "slot"> {
  /** The heading. Optional — omit for a caption-only empty state. */
  title?: string;
  /** Optional supporting line below the title. */
  caption?: string;
  /** Error variant — recolors the icon and title to --text-error. */
  error?: boolean;

  /** Icon name for the top slot. EmptyState renders and colors it (error-aware). */
  icon?: string;
  /** A custom top slot (e.g. an Avatar or illustration). Used when `icon` is unset. */
  slot?: ReactNode;

  /** Primary action — a subtle Button (the right button when two are shown). */
  primaryAction?: EmptyStateAction;
  /** Secondary action — a ghost Button, placed to the left of the primary. */
  secondaryAction?: EmptyStateAction;

  className?: string;
}
