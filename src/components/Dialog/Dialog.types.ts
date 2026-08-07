import { CSSProperties, ReactNode } from "react";

export type DialogBreakpoint = "auto" | "desktop" | "mobile";

/**
 * Body state. "content" shows the children. "error" (couldn't fetch data) and
 * "offline" (no internet) replace the body with an EmptyState and hide the
 * footer / steps; the action retries via onRetry.
 */
export type DialogState = "content" | "error" | "offline";

/** Copy overrides for the warning Prompt shown when dismissing loses progress. */
export interface DialogDismissPrompt {
  title?: string;
  body?: string;
  cancelLabel?: string;
  actionLabel?: string;
}

interface DialogBaseProps {
  /** Controls the open/close animation and mounting. */
  open: boolean;
  /** Called on any dismissal: close button, scrim tap, Cancel, or (mobile) swipe. */
  onClose: () => void;
  /** The dialog title (shown in the header). */
  title: string;
  /** Optional caption line under the title (single line, truncates). */
  caption?: string;
  /** Optional left slot on the caption — an Icon (e.g. the owning object's icon). */
  captionLeftSlot?: ReactNode;
  /** Show an info icon after the title. */
  titleHint?: boolean;
  /**
   * Hint bubble content for the title's info icon (a HoverHint caption, like
   * FormModule's `titleHintContent`). Implies the trigger — `titleHint` is not
   * needed when this is set.
   */
  titleHintContent?: ReactNode;
  /**
   * "auto" (default) picks desktop ≥ 1024px, else mobile. "desktop" / "mobile"
   * force one. On mobile, a default dialog is a drawer; a focus dialog is a
   * full-screen modal.
   */
  breakpoint?: DialogBreakpoint;
  /** Body content — the scrolling region (shown when state is "content"). */
  children: ReactNode;
  /**
   * Wrap the content in the standard content slot (16px sides, 24px between
   * items; top/bottom 16px for a default dialog, 24px for a focus dialog).
   * Default true. Set false for full-bleed content that manages its own insets
   * (e.g. edge-to-edge dividers, list rows).
   */
  bodyPadded?: boolean;
  /** Optional error AlertBanner, pinned above the footer. */
  errorMessage?: ReactNode;

  /** Body state. Default "content". */
  state?: DialogState;
  /** Retry handler for the error / offline states (Reload / Try again). */
  onRetry?: () => void;

  /**
   * When true, dismissing (scrim / close / Cancel) shows a warning Prompt
   * instead of closing — pass it only while there ARE unsaved changes (no
   * prompt when nothing changed — Daniel's rule, applies to focus dialogs
   * too). Default false.
   */
  confirmOnDismiss?: boolean;
  /** Copy overrides for the dismiss warning Prompt. */
  dismissPrompt?: DialogDismissPrompt;

  className?: string;
}

/** A standard dialog: 560px centered card (desktop) / drawer (mobile). No steps. */
export interface DialogDefaultProps extends DialogBaseProps {
  type?: "default";
  /** Footer actions — a PopoverFooter. */
  footer?: ReactNode;
  /**
   * Optional chrome pinned below the header, above the scrolling body — e.g.
   * a search bar (SelectListHeader) or tabs. Hidden in error/offline states.
   */
  subHeader?: ReactNode;
  /**
   * Style overrides for the desktop card (e.g. a custom max-height). Merged
   * over the defaults; desktop presentation only.
   */
  cardStyle?: CSSProperties;
  /**
   * MOBILE only — how the drawer's header looks. "bodyOnly" (default) is the
   * title row with the close button; "dragHandle" drops the row and leaves the
   * grab handle alone, for a drawer that is dismissed by dragging or tapping
   * the scrim. `title` is still required and still names the dialog for screen
   * readers. Desktop is unaffected.
   */
  drawerHeader?: "bodyOnly" | "dragHandle";
}

/**
 * A focus dialog for a multi-step flow: near-fullscreen (desktop) / full-screen
 * (mobile), always with a StepItemGroup. Its footer is generated from the step
 * position — Cancel/Back on the left, Next/final action on the right.
 */
export interface DialogFocusProps extends DialogBaseProps {
  type: "focus";
  /** The StepItemGroup (a focus dialog always has steps). */
  stepGroup: ReactNode;
  /** Current step, 0-based. */
  currentStep: number;
  /** Total number of steps. */
  stepCount: number;
  /** Go to the previous step (the "Back" button, shown after the first step). */
  onBack: () => void;
  /** Advance to the next step (the "Next" button, shown on all but the last step). */
  onNext: () => void;
  /** Complete the flow (the primary action on the last step). */
  onFinish: () => void;
  /** Label for the last-step primary action (e.g. "Create"). */
  finalActionLabel: string;
  /**
   * Optional extra action in the trailing button group, before Next / the
   * final action (e.g. a ghost "Save progress" Button).
   */
  secondaryAction?: ReactNode;
  /**
   * When true, the Next / final-action button is DISABLED until the body is
   * scrolled to the bottom (re-armed on each step). If a step's content does
   * not overflow, the button stays enabled. Default false.
   */
  requireScrollToEnd?: boolean;
}

export type DialogProps = DialogDefaultProps | DialogFocusProps;
