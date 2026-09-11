import { HTMLAttributes, ReactNode } from "react";

import { ButtonVariant } from "../Button/Button.types";
import { IconPack } from "../Icon/Icon.types";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  /** Optional left icon name (e.g. "arrows-rotate" for a Reload button). */
  leftIcon?: string;
  /**
   * The action Button's variant. Default "subtle" (the No Objects Match
   * states); the FilterChip conflict Hint draws its "Show settings" GHOST —
   * Daniel, 2026-09-10: "the EmptyState should support any button style".
   */
  variant?: ButtonVariant;
}

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "slot"> {
  /** The heading. Optional — omit for a caption-only empty state. */
  title?: string;
  /**
   * Optional supporting line below the title. A ReactNode since 2026-09-09
   * (the No Objects Match states): `<strong>` parts render body-500-compact
   * in `--text-strong` — the counts in "**N jobs** hidden by filters".
   */
  caption?: ReactNode;
  /** Error variant — recolors the icon and title to --text-error. */
  error?: boolean;

  /** Icon name for the top slot. EmptyState renders and colors it (error-aware). */
  icon?: string;
  /**
   * The icon's Font Awesome style. Default "regular" since 2026-09-10
   * (Daniel flipped it from "solid" with the Filters states update — every
   * EmptyState icon in the new boards is regular, e.g. `calendar` node
   * 14189-54588 and the error `circle-xmark` node 14199-62043).
   */
  iconPack?: IconPack;
  /**
   * A custom top slot, used when `icon` is unset. The Figma master's avatar
   * slot (updated 2026-09-10) maps here — any Avatar type works (the
   * FilterChip warning hint passes `<AvatarWarning size="lg" />`).
   */
  slot?: ReactNode;

  /** Primary action — a subtle Button (the right button when two are shown). */
  primaryAction?: EmptyStateAction;
  /**
   * Secondary action, placed to the left of the primary. A SUBTLE Button too,
   * since 2026-09-09 — the No Objects Match combined state draws both actions
   * subtle (node 14205-65570); it rendered ghost before, per an earlier read.
   */
  secondaryAction?: EmptyStateAction;

  className?: string;
}
