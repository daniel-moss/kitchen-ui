/** The values the form produces on Create. */
export interface NewWarranty {
  /** The warranty's name (required). Production `EquipmentWarranty.name`. */
  name: string;
  /** Start date (required). */
  startDate: Date;
  /** End date. null = the warranty does not expire (the db's unset `endDate`). */
  endDate: Date | null;
  /**
   * The "Notes" field. It is stored as the db's `Warranty.details` — the form
   * keeps the visible label's wording. "" = not filled.
   */
  notes: string;
}

export interface NewWarrantyFormProps {
  open: boolean;
  /** Called on any dismissal (Cancel / X / scrim) AND after a successful Create. */
  onClose: () => void;
  /**
   * The equipment the warranty is added to — the header caption ("Equipment
   * for which the warranty is being added. Format: [equipment_name]", the
   * caption's own annotation). The flow that opens the form knows it already.
   */
  equipmentName: string;
  /**
   * Called on Create with the new warranty. The CALLER decides the follow-up
   * (store it, refresh a list, …) — the form itself only shows the toast.
   *
   * Return `false` (or a Promise of it) to say the create FAILED: the form
   * then shows the designed error toast and stays open with the values
   * intact. Anything else (including no handler) counts as success.
   */
  onCreated?: (warranty: NewWarranty) => void | boolean | Promise<void | boolean>;
  /**
   * The success toast's "Preview" CTA — it opens the "Warranty" side panel
   * (the CTA's own annotation). The panel is not part of this module, so the
   * caller opens it; with no handler the toast shows no CTA.
   */
  onPreview?: (warranty: NewWarranty) => void;
  /** Presentation, like Dialog: "auto" (default) / "desktop" / "mobile". */
  breakpoint?: "auto" | "desktop" | "mobile";
}
