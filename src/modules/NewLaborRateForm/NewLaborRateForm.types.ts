import { PricebookSubtype, QuickbooksAccount } from "../../data/db/types";

/** How a labor rate is billed — the form's "Rate type" (production `default_unit_type`). */
export type LaborRateType = "hourly" | "flat";

/** What the form hands back — one new labor rate (production `PriceBookItem`, type 1). */
export interface NewLaborRate {
  /** Production `description`. Required, unique per company. */
  name: string;
  /** The chosen subtype's id. Undefined unless the company requires a subtype. */
  subtypeId?: string;
  /** Production `default_unit_type`. Required. */
  rateType: LaborRateType;
  /** Production `cost`. Required. */
  cost: number;
  /** Production `default_price`. Required. */
  rate: number;
  /** Production `default_is_taxable`. Pre-selected from the company default. */
  isTaxable: boolean;
  /**
   * The chosen QuickBooks income account's id. Only present for a company on
   * QuickBooks Desktop with the detailed line-item scheme.
   */
  quickbooksAccountId?: string;
}

export interface NewLaborRateFormProps {
  /** Controls the open/close animation and mounting, like Dialog. */
  open: boolean;
  /** Called on any dismissal: Cancel, the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The company's labor subtypes. An empty list removes the Subtype field.
   * With EXACTLY ONE (and the company requiring a subtype) the field is not
   * shown and that subtype is sent — production picks it on the backend.
   */
  subtypes?: PricebookSubtype[];
  /**
   * The company requires a subtype (`require_subtypes`). The form holds
   * required fields only, so the Subtype field is shown ONLY with 2+ subtypes
   * AND this flag. Without it there is no field — a subtype is set later from
   * the side panel. Default false.
   */
  requireSubtypes?: boolean;
  /**
   * The company uses taxes (`use_taxes`). False removes the Taxability field
   * altogether, the way production hides it. Default true.
   */
  useTaxes?: boolean;
  /**
   * The company's default taxability for labor
   * (`pricebook_default_taxable_service`) — Taxability opens on it, so the
   * field is never empty. Default false.
   */
  defaultTaxable?: boolean;
  /**
   * The QuickBooks Desktop accounting block. PRESENT means the company is on
   * QuickBooks Desktop AND uses the "Detailed Split" line-item setup — the
   * only setup where a labor rate carries its own revenue account. `accounts`
   * are the synced INCOME accounts. (With none synced the list is simply
   * empty — the backend owns that case, Daniel + devs 2026-10-21.)
   */
  quickbooks?: { accounts: QuickbooksAccount[] };

  /**
   * The names already taken, for the second Name error ("Labor rate with this
   * name already exists"). Production checks it case-insensitively across the
   * WHOLE pricebook, not just labor — so the caller passes whatever it knows.
   */
  existingNames?: string[];

  /**
   * Create. Return `false` (or a Promise of it) to say it FAILED: the form
   * shows an error toast and stays open with the values intact. Anything else
   * — a missing handler included — counts as success.
   */
  onCreated?: (rate: NewLaborRate) => void | boolean | Promise<void | boolean>;

  /**
   * Called right after a successful create, once the form has closed — the
   * Create button "opens the SidePanel" on the new rate. The caller owns the
   * panel; an entry point with no panel to open (a job, estimate or invoice
   * form) leaves it out.
   */
  onOpenCreated?: (rate: NewLaborRate) => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
