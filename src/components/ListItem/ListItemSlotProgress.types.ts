export interface ListItemSlotProgressProps {
  /** Progress, 0–100. Values outside the range are clamped. Default 0. */
  value?: number;
  /**
   * Color of the progress ring (a CSS color, normally a token var like
   * `var(--jade-9)`). Default `--gray-12`.
   */
  color?: string;
  /** Loading state — the empty ring with the standard pulsing animation. */
  isLoading?: boolean;
  /** Accessible name, e.g. "Upload progress". Read out with the percentage. */
  ariaLabel?: string;
  className?: string;
}
