import { QuickbooksVendor } from "../../data/db";

/** What the form hands back — one new tax rate (production `PriceBookItem`). */
export interface NewTaxRate {
  /** Production `description`. Required. */
  name: string;
  /** Production `default_price`, a PERCENT: 0–100, up to 3 decimals. Required. */
  rate: number;
  /**
   * The chosen QuickBooks collection agency's id. Undefined when the company
   * has no QuickBooks integration, because the field is not shown then.
   */
  quickbooksVendorId?: string;
  /** Label NAMES, in pick order. A name the pool did not have is a new label. */
  labels: string[];
  /** Production `summary_template`. "" = left empty. */
  summary: string;
  /** Production `notes`. "" = left empty. */
  notes: string;
}

export interface NewTaxRateFormProps {
  /** Controls the open/close animation and mounting, like Dialog. */
  open: boolean;
  /** Called on any dismissal: Cancel, the close button, the scrim, or Escape. */
  onClose: () => void;

  /** The workspace's tax-rate labels, by name. A label can also be created. */
  labelPool?: string[];
  /**
   * The company's QuickBooks Desktop vendors — the agencies a rate can be
   * collected for.
   *
   * This list IS the integration signal: production shows the agency field
   * (and the sync notice above the form) only when the company's accounting
   * integration is QuickBooks Desktop, and then the field is REQUIRED. Leave
   * it out and both disappear.
   */
  quickbooksVendors?: QuickbooksVendor[];

  /**
   * Create. Return `false` (or a Promise of it) to say it FAILED: the form
   * shows the designed error toast and stays open with the values intact.
   * Anything else — a missing handler included — counts as success.
   */
  onCreated?: (rate: NewTaxRate) => void | boolean | Promise<void | boolean>;
  /**
   * Wires the success toast's "Preview" link, which opens the "Tax rate" side
   * panel. With no handler the toast shows no link.
   */
  onPreview?: (rate: NewTaxRate) => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
