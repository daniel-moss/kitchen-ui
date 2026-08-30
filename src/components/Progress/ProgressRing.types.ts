export interface ProgressRingProps {
  /** Progress, 0–100. Values outside the range are clamped. Default 0. */
  value?: number;
  /**
   * Color of the progress ring (a CSS color, normally a token var like
   * `var(--jade-9)`). Default `--gray-12`.
   */
  color?: string;
  /**
   * Loading state. Shows the empty ring with the standard pulsing animation.
   * Default false.
   */
  isLoading?: boolean;
  /** Accessible name, e.g. "Sync progress". Read out with the percentage. */
  ariaLabel?: string;
  className?: string;
}
