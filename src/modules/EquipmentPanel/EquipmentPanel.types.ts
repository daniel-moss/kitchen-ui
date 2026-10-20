import { Equipment, Warranty } from "../../data/db";
import { ModuleFile } from "../FilesModule/FilesModule.types";

import { NewWarranty } from "../NewWarrantyForm/NewWarrantyForm.types";
import { WarrantyEdits } from "../WarrantyPanel/WarrantyPanel.types";
import { EquipmentEdits } from "./forms/EditGeneralDetailsDialog";
import { HistoryKind, HistoryRow, WarrantyRow } from "./equipmentData";

/** The panel's four sub-sections — the navigation's tab values. */
export type EquipmentPanelTab = "details" | "warranties" | "files" | "history";

export interface EquipmentPanelProps {
  /** Controls the open/close animation and mounting, like SidePanel. */
  open: boolean;
  /** Called on any dismissal: the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The equipment this panel shows. Every module reads it — the panel holds no
   * record of its own, so the caller stays the source of truth.
   */
  equipment: Equipment;

  /** Selected tab (controlled). */
  tab?: EquipmentPanelTab;
  /** Uncontrolled initial tab. Default "details". */
  defaultTab?: EquipmentPanelTab;
  onTabChange?: (tab: EquipmentPanelTab) => void;

  // ---- edits (the three forms hand their result up) ----

  /** Save from the "General" form. Return `false` (or a Promise of it) to say the save FAILED: the designed error toast shows and the form stays open. */
  onSaveDetails?: (edits: EquipmentEdits) => void | boolean | Promise<void | boolean>;
  /** Save from the "Labels" select list — label NAMES, in pick order. Return `false` (or a Promise of it) to say the save FAILED: the designed error toast shows and the form stays open. */
  onSaveLabels?: (labels: string[]) => void | boolean | Promise<void | boolean>;
  /** Save from the "Notes" text-area dialog. Return `false` (or a Promise of it) to say the save FAILED: the designed error toast shows and the form stays open. */
  onSaveNotes?: (notes: string) => void | boolean | Promise<void | boolean>;

  // ---- navigation out of the panel ----

  /**
   * The "Location" row. A link inside a side panel never opens a SECOND panel:
   * the caller swaps this panel's content and keeps the stack (the SidePanel
   * rule), so this only reports the intent.
   */
  onOpenLocation?: () => void;
  /**
   * A warranty row was opened — by clicking it, by its context menu's
   * "Preview", or by the "Preview" CTA on the "Warranty created" toast.
   *
   * The PANEL does the opening itself: the warranty's view REPLACES this
   * panel's header and body and the back arrow appears — a link inside a side
   * panel never stacks a second panel (the SidePanel rule). This only reports
   * the intent.
   */
  onOpenWarranty?: (warranty: WarrantyRow) => void;
  /**
   * The "Add warranty" button was pressed. The PANEL opens the "New warranty"
   * form itself (it owns that form, like the three edit forms) — this only
   * reports the intent.
   */
  onAddWarranty?: () => void;
  /**
   * Create from the "New warranty" form. The panel already adds the warranty
   * to the list it shows; this hands the values to the caller to store.
   */
  onCreateWarranty?: (warranty: NewWarranty) => void;
  /**
   * Delete a warranty, after its Prompt is confirmed — from the list row's
   * menu, or from the open warranty's own context menu (which then goes back
   * to the list).
   */
  onDeleteWarranty?: (warranty: WarrantyRow) => void | boolean | Promise<void | boolean>;

  // ---- the open warranty's own edits ----
  //
  // Both may return `false` (or a Promise of it) to report that the save
  // FAILED — the form then shows the designed error toast and stays open. The
  // panel updates the warranty it shows either way.

  /** Save from the warranty's "General details" form. */
  onSaveWarrantyDetails?: (warranty: Warranty, edits: WarrantyEdits) => void | boolean | Promise<void | boolean>;
  /** Save from the warranty's "Notes" text-area dialog. */
  onSaveWarrantyNotes?: (warranty: Warranty, notes: string) => void | boolean | Promise<void | boolean>;
  /** A History row — "opens an object on a separate tab" (its annotation). */
  onOpenHistoryObject?: (row: HistoryRow) => void;
  /** Initial History filter — "all", or one object type. Default "all". */
  defaultHistoryFilter?: "all" | HistoryKind;
  /** Download one file — the PUBLIC view's file-row button. */
  onDownloadFile?: (file: ModuleFile) => void;

  // ---- view ----

  /**
   * The PUBLIC view — what the client sees (Figma "Public View", 22438-33582):
   * - no "History" tab, and the Details tab never turns amber;
   * - "General": no edit button, no warning state (copy stays);
   * - no "Labels" module; "Notes" keeps Copy only;
   * - "Warranties": no add button, no row menu — a row only opens;
   * - "Files": public files only, one flat list, no add / re-order / menu,
   *   a Download button per row.
   * A warranty row only REPORTS `onOpenWarranty` here: the warranty view this
   * panel swaps in is the editable one, and its public version is not built.
   * Default false.
   */
  isPublicView?: boolean;

  // ---- state ----

  /**
   * Loading. The Details tab does not know the warranty and file COUNTS yet,
   * so its navigation hides both counters; by the time the Warranties or Files
   * tab loads those counts have arrived with the Details tab, so they show
   * (Daniel, 2026-09-28, from the eng discussion).
   */
  isLoading?: boolean;
  /** Body state, passed straight to SidePanel. */
  state?: "content" | "error" | "offline";
  onRetry?: () => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
