import { Warranty } from "../../data/db";

/** What the "General details" form hands back — the editable half of a Warranty. */
export type WarrantyEdits = Pick<Warranty, "name" | "startDate" | "endDate">;

/**
 * What a warranty view can DO. Shared by the standalone panel and by the
 * Equipment panel, which shows the same view inside its own panel.
 *
 * Every one of the three may return `false` (or a Promise of it) to report that
 * the action FAILED — the view then shows the designed error toast ('Could not
 * update "General details"' / 'Could not update "Notes"' / "Could not delete
 * the warranty") and the form stays open with the values intact. Anything else,
 * a missing handler included, counts as success. Same contract as the "New
 * warranty" form's `onCreated`.
 */
export interface WarrantyPanelActions {
  /** Save from the "General details" form. */
  onSaveDetails?: (edits: WarrantyEdits) => void | boolean | Promise<void | boolean>;
  /** Save from the "Notes" text-area dialog. */
  onSaveNotes?: (notes: string) => void | boolean | Promise<void | boolean>;
  /**
   * Delete, after the "Delete warranty?" Prompt is confirmed. The view shows
   * the toast; the handler removes the record and decides where to go next
   * (the standalone panel closes, the Equipment panel goes back to its list).
   */
  onDelete?: (warranty: Warranty) => void | boolean | Promise<void | boolean>;
}

export interface WarrantyPanelProps extends WarrantyPanelActions {
  /** Controls the open/close animation and mounting, like SidePanel. */
  open: boolean;
  /** Called on any dismissal: the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The warranty this panel shows. Both modules read it — the panel holds no
   * record of its own, so the caller stays the source of truth.
   */
  warranty: Warranty;

  /**
   * Shown as the header's back arrow. A link inside a side panel never opens a
   * SECOND panel (the SidePanel rule): when this panel replaces an Equipment
   * panel's content, the CALLER keeps the stack and passes this.
   */
  onBack?: () => void;

  // ---- state ----

  /**
   * Loading: both module bodies render skeletons and every action button is
   * hidden — there is nothing to edit, copy or delete yet (the Loading frame,
   * node 21945-1764). The header keeps the real title: SidePanel takes a
   * string, so the node's title skeleton is not buildable today — the
   * Equipment panel behaves the same way.
   */
  isLoading?: boolean;
  /** Body state, passed straight to SidePanel. */
  state?: "content" | "error" | "offline";
  onRetry?: () => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
