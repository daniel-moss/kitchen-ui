import { ReactNode } from "react";

export interface SelectFieldCounterProps {
  /** Number of selected options. */
  count: ReactNode;
  /** Clear-all handler (the × button). */
  onClear?: () => void;
  /** Read-only display: an outlined number, no × button. */
  readOnly?: boolean;
  className?: string;
}
