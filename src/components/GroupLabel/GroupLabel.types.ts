import { HTMLAttributes, ReactNode } from "react";

interface GroupLabelBaseProps extends HTMLAttributes<HTMLDivElement> {
  /** The group title. Truncates. */
  label: ReactNode;
  /**
   * Right slot — an IconButton: 32px (`size="md"`, ghost) in primary, 24px
   * (`size="xs"`, muted) in secondary. Clicks do not toggle the accordion.
   */
  slotRight?: ReactNode;

  /** Accordion: the row becomes a toggle with a caret + interaction states. */
  accordion?: boolean;
  /** Controlled open state (accordion). */
  open?: boolean;
  /** Uncontrolled initial open state (accordion). Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accordion only — dimmed, non-interactive. */
  disabled?: boolean;

  className?: string;
}

/**
 * primary = 40px filled (`gray-a2`) row with slotLeft / counter / caption.
 * secondary = 28px transparent row (label + optional slotRight only); its
 * accordion caret sits right after the label.
 */
export type GroupLabelProps =
  | (GroupLabelBaseProps & {
      variant?: "primary";
      /** Left slot — an Icon (`container="square"`) or a sm (24px) Avatar. */
      slotLeft?: ReactNode;
      /** Count shown after the label, separated by a bullet dot. */
      counter?: number | string;
      /** Icon name shown to the left of the counter number. */
      counterIcon?: string;
      /** Caption shown after the label (and counter), separated by a bullet dot. */
      caption?: ReactNode;
    })
  | (GroupLabelBaseProps & {
      variant: "secondary";
      slotLeft?: never;
      counter?: never;
      counterIcon?: never;
      caption?: never;
    });
