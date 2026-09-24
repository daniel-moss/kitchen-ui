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
  isAccordion?: boolean;
  /** Controlled open state (isAccordion). */
  open?: boolean;
  /** Uncontrolled initial open state (isAccordion). Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accordion only — dimmed, non-interactive. */
  disabled?: boolean;

  /**
   * Loading: the label becomes a single 96px bar and everything else is
   * hidden — the caret, the counter, the caption, the left slot and the
   * action. Those are controls or data, and neither exists yet. The header
   * keeps its own shape (primary its filled bar, secondary transparent) and
   * stops being interactive. Default false.
   */
  isLoading?: boolean;

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
