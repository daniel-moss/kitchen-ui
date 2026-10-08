import { QuickbooksVendor } from "../../data/db";

/** What the form hands back — one new tax rate (production `PriceBookItem`). */
export interface NewTaxRate {
  /** Production `description`. Required, max 50 characters. */
  name: string;
  /** Production `default_price`, a PERCENT: 0–100, up to 2 decimals. Required. */
  rate: number;
  /**
   * The chosen QuickBooks collection agency's id. Undefined when the company
   * has no QuickBooks Desktop integration, because the field is not shown then.
   */
  quickbooksVendorId?: string;
  /** Label NAMES, in pick order. A name the pool did not have is a new label. */
  labels: string[];
  /** Production `summary_template`. "" = left empty. */
  summary: string;
  /** Production `notes`. "" = left empty. */
  notes: string;
}

/** The company's QuickBooks Desktop context — see `quickbooks` below. */
export interface TaxRateQuickBooks {
  /**
   * The company's synced QuickBooks Desktop vendors — the agencies a rate can
   * be collected for. An EMPTY list is the "nothing synced yet" state: the
   * module is its warning banner alone and Create is blocked, because
   * production requires the agency and there is nothing to choose.
   */
  vendors: QuickbooksVendor[];
}

export interface NewTaxRateFormProps {
  /** Controls the open/close animation and mounting, like Dialog. */
  open: boolean;
  /** Called on any dismissal: Cancel, the close button, the scrim, or Escape. */
  onClose: () => void;

  /** The workspace's tax-rate labels, by name. A label can also be created. */
  labelPool?: string[];
  /**
   * The names already taken, for the duplicate check. Production's uniqueness
   * is case-insensitive and spans EVERY pricebook item of the company, not just
   * the tax rates, so a caller that has the whole pricebook should pass all of
   * it.
   */
  existingNames?: string[];
  /**
   * The company's QuickBooks Desktop context. Present = the "Accounting" module
   * is shown; leave it out and the module, its notice and the agency field all
   * disappear.
   *
   * Production requires the agency for EVERY company whose
   * `accounting_integration` is QuickBooks Desktop
   * (`PriceBookItemSerializer._validate_tax_items`) — the line-item scheme is
   * not part of that condition for a tax item, though the module's annotation
   * now says it is (flagged to Daniel 2026-10-08).
   */
  quickbooks?: TaxRateQuickBooks;

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
