import { DialogBreakpoint } from "../../../components/Dialog/Dialog.types";

export interface NewJobFormProps {
  /** Controls the open/close animation and mounting. */
  open: boolean;
  /** Any dismissal (close ×, Cancel, scrim) — the caller flips `open`. */
  onClose: () => void;
  /**
   * The final "Create" ran: the module closed the form and showed the "Job
   * created" toast. The caller decides the follow-up.
   */
  onCreated?: () => void;
  /**
   * "Save as draft" ran: the module closed the form and showed the "Job
   * saved as draft" toast.
   */
  onSavedAsDraft?: () => void;
  /** The draft toast's "Edit" action — the caller reopens the form. */
  onEditDraft?: () => void;
  /** "auto" (default) follows the viewport; desktop/mobile force one. */
  breakpoint?: DialogBreakpoint;
}
