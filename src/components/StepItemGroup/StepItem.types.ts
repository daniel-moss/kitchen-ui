import { HTMLAttributes, MouseEvent } from "react";

export type StepItemProgress = "incompleted" | "current" | "completed" | "warning" | "error";

export interface StepItemProps extends Omit<HTMLAttributes<HTMLElement>, "onClick"> {
  /** Which step state this is. Drives the icon, colors, and status line. */
  progress: StepItemProgress;
  /** The step label. Truncates with an ellipsis + full-text tooltip on hover. */
  label: string;
  /**
   * When set, the step is interactive: it renders a <button> with hover / focus
   * / press states. Without it, it renders a static <div>. In a Stepper this is
   * passed to the completed / error steps.
   */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  isDisabled?: boolean;
  isLoading?: boolean;

  // Used by stories to show states without real interaction.
  _isHovered?: boolean;
  _isFocused?: boolean;
  isPressed?: boolean;

  className?: string;
}
