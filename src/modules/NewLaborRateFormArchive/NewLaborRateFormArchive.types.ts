import { PricebookSubtype } from "../../data/db/types";

import { PriceStrategy } from "./rateMath";

/** One synced QuickBooks Desktop income account. */
export interface QuickBooksAccount {
  /** The account's QuickBooks ListID — what the labor rate stores. */
  id: string;
  /** The account name as QuickBooks holds it (31 characters at most). */
  name: string;
  /** The account number, when QuickBooks has one ("4010"). */
  number?: string;
}

/** The unit a labor rate is billed in (production `default_unit_type`). */
export type LaborUnitType = "hourly" | "flat";

/** What the form hands back — one new labor rate (production `PriceBookItem`, type 1). */
export interface NewLaborRate {
  /** Production `description`. Required, unique per company. */
  name: string;
  /** The chosen subtype's id. Undefined when the company writes no subtypes. */
  subtypeId?: string;
  /** Production `default_unit_type`. Required. */
  unitType: LaborUnitType;
  /** Production `cost`. 0 when left empty ("No value = $0"). */
  cost: number;
  /** Production `price_strategy`. Required. */
  priceStrategy: PriceStrategy;
  /**
   * Production `default_price` — typed under "Manual", computed by the
   * database trigger under either markup. Either way this is the rate the
   * form showed.
   */
  rate: number;
  /** Production `price_adjustment_amount`. Only under the fixed markup. */
  fixedMarkup?: number;
  /** Production `price_adjustment_percent`. Only under the percent markup. */
  percentMarkup?: number;
  /** Production `default_is_taxable`. Pre-selected from the company default. */
  isTaxable: boolean;
  /**
   * The chosen QuickBooks income account's id. Only present for a company on
   * QuickBooks Desktop with the detailed line-item scheme.
   */
  quickbooksAccountId?: string;
  /** Label NAMES, in pick order. A name the pool did not have is a new label. */
  labels: string[];
  /** Production `summary_template` — the line item's default summary. "" = left empty. */
  description: string;
  /** Production `notes`. "" = left empty. */
  notes: string;
}

export interface NewLaborRateFormProps {
  /** Controls the open/close animation and mounting, like Dialog. */
  open: boolean;
  /** Called on any dismissal: Cancel, the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The company's labor subtypes. The Subtype field is "only shown if a
   * company supports subtypes" (its annotation), so an empty list removes it.
   * With EXACTLY ONE the field is filled and read-only — the only option is
   * chosen for the user.
   */
  subtypes?: PricebookSubtype[];
  /**
   * The company requires a subtype (`require_subtypes`). With subtypes AND
   * this flag the field is required — and a lone option is picked for the user
   * and locked. Without it the field is optional and the list offers "No
   * subtype" to clear it. Default false.
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
   * QuickBooks Desktop AND uses the detailed line-item scheme — the only setup
   * where a labor rate carries its own revenue account (under the generic
   * scheme the account comes from the subtype or the company, and the field
   * does not exist). `accounts` may be EMPTY: the integration is on but no
   * Web Connector session has imported the chart of accounts yet.
   */
  quickbooks?: { accounts: QuickBooksAccount[] };

  /** The workspace's labor labels, by name. A label can also be created here. */
  labelPool?: string[];
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
   * Wires the success toast's "Preview" link, which opens the "Labor rate"
   * side panel (node 2063-6176). With no handler the toast shows no link.
   */
  onPreview?: (rate: NewLaborRate) => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
