import { ReactNode } from "react";

export interface PopoverHeaderBodyProps {
  /** The Content (a PopoverHeaderContent). */
  children: ReactNode;
  /** Show the back button (ghost, arrow-left). Default false. */
  back?: boolean;
  /** Show the close button (muted, xmark). Default true. */
  close?: boolean;
  /**
   * Dim the close button and block it — for a surface that must not be
   * dismissed while an action runs (Dialog's `isProcessing`). Default false.
   */
  closeDisabled?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
}
