import { ReactNode } from "react";

import { Breakpoint } from "../../../hooks/useIsDesktop";

export interface MediaFieldProps {
  /**
   * The uploaded files, as CardFile elements (the Figma slot). MediaField
   * sizes each card to the breakpoint's fixed width (106px mobile / 135px
   * desktop); empty vs filled is derived from their presence.
   */
  children?: ReactNode;

  /** Files picked in the native browse/camera dialog. */
  onFilesSelected?: (files: File[]) => void;
  /** `accept` for the native file input (e.g. "image/*"). */
  accept?: string;
  /** Allow picking several files at once. Default true. */
  multiple?: boolean;

  /** false → invalid trigger + error help text below. Default true. */
  isValid?: boolean;
  /**
   * The error message (shown when isValid is false). Default: "Add [Label]",
   * derived from the surrounding Input's string label.
   */
  errorMessage?: ReactNode;

  /**
   * Non-interactive, dimmed trigger (the cards keep their own state). A
   * disabled field can not be invalid. No read-only state (the component set).
   */
  disabled?: boolean;

  /** Force the size for stories/tests; "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;

  className?: string;
}
