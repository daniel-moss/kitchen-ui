import { DimensionUnit, PricebookSubtype, Vendor, WeightUnit } from "../../../data/db/types";

import { CostStrategy, PriceStrategy } from "./productRules";

/** One vendor's cost for the product — production `VendorPartCost`. */
export interface NewProductVendorCost {
  /** → VENDORS. The pair (vendor, product) is unique, so a vendor appears once. */
  vendorId: string;
  /** Production `vendor_cost`. Required — the card cannot be saved without it. */
  cost: number;
  /** Production `vendor_part_number`. Required, 100 characters. */
  partNumber: string;
}

/** What the form hands back — one new product (production `PriceBookItem`, type 2). */
export interface NewProduct {
  /** Production `description`. Required, unique per company. */
  name: string;
  /** The chosen subtype's id. Undefined when the company writes no subtypes. */
  subtypeId?: string;
  /** Label NAMES, in pick order. A name the pool did not have is a new label. */
  labels: string[];
  /** Production `manufacturer`. "" = left empty. */
  manufacturer: string;
  /** Production `part_number` — the MANUFACTURER's number, not a vendor's. */
  partNumber: string;
  /** Production `barcode`. "" = never registered. Unique per company when set. */
  barcode: string;

  /** The vendor cost cards, in the order they were added. */
  vendorCosts: NewProductVendorCost[];
  /** Production `cost_strategy`. Opens on "manual", the node's default selection. */
  costStrategy: CostStrategy;
  /**
   * Production `cost`. Typed under "Manual" (0 when left empty), and under any
   * vendor strategy the value the form resolved from the cards — which is what
   * production's database trigger would compute.
   */
  cost: number;
  /** Production `price_strategy`. Required — the form opens with NO selection. */
  priceStrategy: PriceStrategy;
  /** Production `default_price` — typed under "Manual", computed under a markup. */
  price: number;
  /** Production `price_adjustment_amount`. Only under the fixed markup. */
  fixedMarkup?: number;
  /** Production `price_adjustment_percent`. Only under the percent markup. */
  percentMarkup?: number;
  /** Production `default_is_taxable`. Required — the form opens with no selection. */
  isTaxable: boolean;

  /** Production `image_url`. "" = left empty. A link, never an upload. */
  imageUrl: string;
  /**
   * Production `weight` + `weight_unit`. The unit travels ONLY with a value:
   * the server rejects one without the other, and an untouched field means no
   * weight however the unit select looks (Daniel, 2026-10-13).
   */
  weight?: number;
  weightUnit?: WeightUnit;
  /** Production `length` / `width` / `height` + `dimension_unit`. All four or none. */
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: DimensionUnit;

  /** Production `summary_template` — copied onto every line item. "" = empty. */
  description: string;
  /** Production `notes` — staff only. "" = empty. */
  notes: string;
}

export interface NewProductFormProps {
  /** Controls the open/close animation and mounting, like Dialog. */
  open: boolean;
  /** Called on any dismissal: Cancel, the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The company's product subtypes. The Subtype field is "only shown if a
   * company supports subtypes", so an empty list removes it. With EXACTLY ONE
   * and `requireSubtypes` the field is filled and read-only.
   */
  subtypes?: PricebookSubtype[];
  /** The company requires a subtype (`require_subtypes`). Default false. */
  requireSubtypes?: boolean;
  /** The company uses taxes (`use_taxes`). False removes Taxability. Default true. */
  useTaxes?: boolean;

  /** The vendors a cost can be added for. Only ACTIVE ones belong here. */
  vendors?: Vendor[];
  /**
   * The user may create a vendor (`vendors_create_permission`). The vendor
   * list's "Add vendor" footer row exists only then — its own annotation.
   */
  canCreateVendor?: boolean;
  /**
   * Opens the "New vendor" form above this one. The annotation: after creating
   * a vendor the user comes back here with that vendor selected.
   */
  onCreateVendor?: () => void;
  /** The workspace's product labels, by name. A label can also be created here. */
  labelPool?: string[];
  /**
   * The names already taken, for the second Name error ("Product with this
   * name already exists"). Production checks case-insensitively.
   */
  existingNames?: string[];
  /**
   * The barcodes already registered, by product name — the Barcode field and
   * the scanner both name the product a code belongs to.
   */
  existingBarcodes?: Record<string, string>;

  /**
   * Block Create. This is NOT validation — it is for a form that can not be
   * saved at all yet: the button stays disabled however the fields are filled.
   * The demo app sets it while the Inventory section is unbuilt, so a product
   * can not be half created. Default false.
   */
  isCreateBlocked?: boolean;

  /**
   * Create. Return `false` (or a Promise of it) to say it FAILED: the form
   * shows an error toast and stays open with the values intact.
   */
  onCreated?: (product: NewProduct) => void | boolean | Promise<void | boolean>;
  /** Wires the success toast's "Preview" link. With no handler the toast shows none. */
  onPreview?: (product: NewProduct) => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
