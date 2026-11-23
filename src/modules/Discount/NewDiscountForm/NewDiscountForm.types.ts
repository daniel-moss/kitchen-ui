import { PricebookSubtype, QuickbooksAccount } from "../../../data/db/types";

/** What the form hands back — one new discount (production `PriceBookItem`, type 4). */
export interface NewDiscount {
  /** Production `description`. Required, unique per company. */
  name: string;
  /** The chosen subtype's id. Undefined unless the company requires a subtype. */
  subtypeId?: string;
  /**
   * Production `default_price` — ZERO OR NEGATIVE. The field takes a positive
   * amount and the form hands it back with the sign flipped.
   */
  price: number;
  /**
   * The chosen QuickBooks income account's id. Only present for a company on
   * QuickBooks Desktop with the detailed line-item scheme.
   */
  quickbooksAccountId?: string;
}

export interface NewDiscountFormProps {
  /** Controls the open/close animation and mounting, like Dialog. */
  open: boolean;
  /** Called on any dismissal: Cancel, the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The company's discount subtypes. The form shows the Subtype field only
   * when `requireSubtypes` is on and there are subtypes; with exactly one it
   * is shown read-only, with that subtype selected.
   */
  subtypes?: PricebookSubtype[];
  /** The company requires a subtype (`require_subtypes`). Default false. */
  requireSubtypes?: boolean;
  /**
   * The QuickBooks Desktop accounting block. PRESENT means the company is on
   * QuickBooks Desktop AND uses the "Detailed Split" line-item setup.
   * `accounts` are the synced INCOME accounts.
   */
  quickbooks?: { accounts: QuickbooksAccount[] };

  /** The names already taken, for the duplicate Name error (the whole pricebook). */
  existingNames?: string[];

  /**
   * Create. Return `false` (or a Promise of it) to say it FAILED: the form
   * shows an error toast and stays open with the values intact.
   */
  onCreated?: (discount: NewDiscount) => void | boolean | Promise<void | boolean>;
  /**
   * Called right after a successful create, once the form has closed — the
   * Create button "opens the SidePanel" on the new discount. An entry point
   * with no panel to open (a job, estimate or invoice) leaves it out.
   */
  onOpenCreated?: (discount: NewDiscount) => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
