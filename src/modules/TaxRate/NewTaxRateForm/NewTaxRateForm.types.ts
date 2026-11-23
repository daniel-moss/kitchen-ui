import { QuickbooksVendor } from "../../../data/db/types";

/** What the form hands back — one new tax rate (production `PriceBookItem`, type 5). */
export interface NewTaxRate {
  /** Production `description`. Required, unique across the pricebook. */
  name: string;
  /** Production `default_price`, a PERCENT: 0–100, up to 3 decimals. */
  rate: number;
  /**
   * The chosen QuickBooks vendor's id — production
   * `quickbooks_desktop_tax_agency_vendor_id`. Only present for a company on
   * QuickBooks Desktop.
   */
  quickbooksVendorId?: string;
}

export interface NewTaxRateFormProps {
  /** Controls the open/close animation and mounting, like Dialog. */
  open: boolean;
  /** Called on any dismissal: Cancel, the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The QuickBooks Desktop block. PRESENT means the company is on QuickBooks
   * Desktop, WHATEVER its line-item setup — the only case a tax rate needs a
   * collection agency. `vendors` are the company's synced QuickBooks vendors
   * (all of them: production keeps no "tax agency" flag). An EMPTY list shows
   * the "Sync QuickBooks vendors first" Prompt instead of the form.
   */
  quickbooks?: { vendors: QuickbooksVendor[] };

  /** The names already taken, for the duplicate Name error (the whole pricebook). */
  existingNames?: string[];

  /**
   * Create. Return `false` (or a Promise of it) to say it FAILED: the form
   * shows an error toast and stays open with the values intact.
   */
  onCreated?: (rate: NewTaxRate) => void | boolean | Promise<void | boolean>;
  /** Called right after a successful create — "opens the SidePanel" on the new rate. */
  onOpenCreated?: (rate: NewTaxRate) => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
