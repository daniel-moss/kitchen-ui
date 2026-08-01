export type StrengthIndicatorState = "weak" | "average" | "strong" | "excellent";

export interface StrengthIndicatorProps {
  /** Password strength. Drives the word, the color, and the bar fill. */
  state: StrengthIndicatorState;

  className?: string;
}
