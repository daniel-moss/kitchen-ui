export interface ProgressBarProps {
  /** Progress, 0–100. Values outside the range are clamped. Default 0. */
  value?: number;
  /**
   * Color of the progress line (a CSS color, normally a token var like
   * `var(--jade-9)`). Default `--gray-12`.
   */
  color?: string;
  /**
   * Loading state. Shows the empty bar with the standard pulsing animation.
   * Default false.
   */
  isLoading?: boolean;
  /**
   * Accessible name, e.g. "Upload progress". Read out with the percentage.
   * Ignored when `isDecorative` is set.
   */
  ariaLabel?: string;
  /**
   * Decorative bar — drops the `progressbar` role and hides it from screen
   * readers. Use it when the bar is a chart, not a task in progress: a chart
   * bar announced as "40% complete" is wrong. Default false.
   */
  isDecorative?: boolean;
  className?: string;
}
