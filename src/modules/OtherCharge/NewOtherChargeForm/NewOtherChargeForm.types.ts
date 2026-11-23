import { PriceStrategy, PricebookSubtype, QuickbooksAccount } from "../../../data/db/types";

/** What the form hands back — one new other charge (production `PriceBookItem`, type 3). */
export interface NewOtherCharge {
  /** Production `description`. Required, unique per company. */
  name: string;
  /** The chosen subtype's id. Undefined unless the company requires a subtype. */
  subtypeId?: string;
  /**
   * Production `cost`. Always a value: an empty Cost is saved as 0, which is
   * what production does today.
   */
  cost: number;
  /** Production `price_strategy`. Default "manual". */
  priceStrategy: PriceStrategy;
  /** Production `default_price` — the typed Price under "manual", the markup's result otherwise. */
  price: number;
  /** Production `price_adjustment_amount`. Only with "fixedMarkup". */
  fixedMarkup?: number;
  /** Production `price_adjustment_percent`. Only with "percentMarkup". */
  percentMarkup?: number;
  /** Production `default_is_taxable`. Pre-selected from the company default. */
  isTaxable: boolean;
  /**
   * The chosen QuickBooks income account's id. Only present for a company on
   * QuickBooks Desktop with the detailed line-item scheme.
   */
  quickbooksAccountId?: string;
}

export interface NewOtherChargeFormProps {
  /** Controls the open/close animation and mounting, like Dialog. */
  open: boolean;
  /** Called on any dismissal: Cancel, the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The company's other-charge subtypes. The form shows the Subtype field
   * only when `requireSubtypes` is on and there are subtypes; with exactly one
   * it is shown read-only, with that subtype selected.
   */
  subtypes?: PricebookSubtype[];
  /** The company requires a subtype (`require_subtypes`). Default false. */
  requireSubtypes?: boolean;
  /**
   * The company uses taxes (`use_taxes`). False removes the Taxability field
   * altogether, the way production hides it. Default true.
   */
  useTaxes?: boolean;
  /**
   * The company's default taxability for other charges
   * (`pricebook_default_taxable_other`) — Taxability opens on it, so the field
   * is never empty. Default true.
   */
  defaultIsTaxable?: boolean;
  /**
   * The QuickBooks Desktop accounting block. PRESENT means the company is on
   * QuickBooks Desktop AND uses the "Detailed Split" line-item setup — the
   * only setup where an other charge carries its own revenue account.
   * `accounts` are the synced INCOME accounts.
   */
  quickbooks?: { accounts: QuickbooksAccount[] };

  /**
   * The names already taken, for the duplicate Name error. Production checks
   * it case-insensitively across the WHOLE pricebook, so the caller passes
   * whatever it knows.
   */
  existingNames?: string[];

  /**
   * Create. Return `false` (or a Promise of it) to say it FAILED: the form
   * shows an error toast and stays open with the values intact. Anything else
   * — a missing handler included — counts as success.
   */
  onCreated?: (charge: NewOtherCharge) => void | boolean | Promise<void | boolean>;

  /**
   * Called right after a successful create, once the form has closed — the
   * Create button "opens the SidePanel" on the new charge. The caller owns the
   * panel; an entry point with no panel to open (a job, estimate or invoice
   * form) leaves it out.
   */
  onOpenCreated?: (charge: NewOtherCharge) => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
