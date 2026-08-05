/** The values the form produces on Create. Empty strings = not filled. */
export interface NewEquipment {
  /** The equipment's display name (required). */
  name: string;
  /** The equipment category (required). */
  category: string;
  /** The equipment type — one of the chosen category's types. */
  type: string;
  manufacturer: string;
  model: string;
  serial: string;
  /** Unknown / Owned / Leased / Rented. */
  ownership: string;
  /** Where the equipment sits in the location, e.g. "The kitchen". */
  area: string;
  /** null = not filled. */
  installDate: Date | null;
  labels: string[];
  notes: string;
}

export interface NewEquipmentFormProps {
  open: boolean;
  /** Called on any dismissal (Cancel / X / scrim) AND after Create. */
  onClose: () => void;
  /**
   * The location the equipment will belong to — the header caption (equipment
   * always belongs to a service location, and the flow that opens the form
   * knows it already).
   */
  location: string;
  /**
   * Called after Create with the new equipment's values. The CALLER decides the
   * follow-up (put it on the job, just close, …) — the form itself only shows
   * the "Equipment created" toast.
   */
  onCreated?: (equipment: NewEquipment) => void;
  /** Presentation, like Dialog: "auto" (default) / "desktop" / "mobile". */
  breakpoint?: "auto" | "desktop" | "mobile";
}
