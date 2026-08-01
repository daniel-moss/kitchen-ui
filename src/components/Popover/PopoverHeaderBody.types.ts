import { ReactNode } from "react";

export interface PopoverHeaderBodyProps {
  /** The Content (a PopoverHeaderContent). */
  children: ReactNode;
  /** Show the back button (ghost, arrow-left). Default false. */
  back?: boolean;
  /** Show the close button (muted, xmark). Default true. */
  close?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
}
