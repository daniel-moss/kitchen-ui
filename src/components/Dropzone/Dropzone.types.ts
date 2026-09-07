import { ReactNode } from "react";

export interface DropzoneProps {
  /**
   * The title. The default is the master's generic copy — the consumer passes
   * the real remaining count (e.g. "Add up to 4 files"; singular "Add up to
   * 1 file"). Default "Add up to N files".
   */
  title?: ReactNode;
  /**
   * The caption. The consumer passes the real per-file size limit (e.g.
   * "Drag and drop or click to upload. Up to 100 MB per file."). Default
   * "Drag and drop or click to upload. Up to N MB per file.".
   */
  caption?: ReactNode;
  /**
   * Title shown in the warning state. Default "You've reached the N-file
   * limit".
   */
  warningTitle?: ReactNode;
  /**
   * Caption shown in the warning state. Default "Remove a file to upload
   * another one".
   */
  warningCaption?: ReactNode;

  /**
   * The file limit is reached: amber look, warning copy, and the Dropzone is
   * non-interactive — clicks and drops do nothing. Default false.
   */
  isWarning?: boolean;
  /**
   * Disabled: the whole component at 30% opacity, non-interactive. Wins over
   * `isWarning` (a disabled Dropzone shows the default copy, dimmed). Default
   * false.
   */
  isDisabled?: boolean;

  /**
   * Files picked in the native dialog or dropped onto the target. The
   * Dropzone does not validate — size / type / count checks (and their
   * Toasts) are the consumer's.
   */
  onFilesSelected?: (files: File[]) => void;
  /**
   * `accept` for the native file input. It only filters the picker dialog —
   * dropped files are NOT filtered; validate in the consumer.
   */
  accept?: string;
  /** Allow picking several files at once. Default true. */
  multiple?: boolean;

  // Used by stories to show the drag-over look without a real drag.
  _isDragOver?: boolean;

  className?: string;
}
