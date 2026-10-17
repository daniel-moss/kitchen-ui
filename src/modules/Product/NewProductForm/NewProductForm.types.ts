import { DimensionUnit, InventoryLocation, PricebookSubtype, QuickbooksAccount, Vendor, WeightUnit } from "../../../data/db/types";

import { CostStrategy, PriceStrategy } from "./productRules";

/** One vendor's cost for the product — production `VendorPartCost`. */
export interface NewProductVendorCost {
  /** → VENDORS. The pair (vendor, product) is unique, so a vendor appears once. */
  vendorId: string;
  /** Production `vendor_cost`. Required — the card cannot be saved without it. */
  cost: number;
  /** Production `vendor_part_number`. Required, 100 characters. */
  partNumber: string;
  /**
   * The preferred vendor — exactly ONE card carries it whenever there is at
   * least one. The first card added gets it.
   */
  isPreferred: boolean;
}

/** The product's stock at one inventory location — production `InventoryLevel`. */
export interface NewProductInventoryLevel {
  /** → INVENTORY_LOCATIONS. One card per location. */
  locationId: string;
  /** Required. The only quantity that may be negative. */
  onHand: number;
  /** 0 when left empty. */
  onOrder: number;
  /** "Set target" — undefined when it is unchecked. Greater than 0. */
  target?: number;
  /** Optional, and only with a target. Lower than the target. */
  alertAt?: number;
  /** "" = no bin location. 50 characters. */
  binLocation: string;
}

/** The QuickBooks Desktop side — present only on the DETAILED line-item scheme. */
export interface NewProductQuickbooks {
  /** The synced INCOME accounts. Empty = nothing synced yet: the form refuses to open. */
  revenueAccounts: QuickbooksAccount[];
  /** Cost of goods sold accounts — offered to an inventory product only. */
  cogsAccounts: QuickbooksAccount[];
  /** Inventory asset accounts — offered to an inventory product only. */
  assetAccounts: QuickbooksAccount[];
  /** The company defaults the two inventory accounts open on. */
  defaultCogsAccountId?: string;
  defaultAssetAccountId?: string;
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
  /** Production `price_strategy`. Opens on "manual", the node's default selection. */
  priceStrategy: PriceStrategy;
  /** Production `default_price` — typed under "Manual", computed under a markup. */
  price: number;
  /** Production `price_adjustment_amount`. Only under the fixed markup. */
  fixedMarkup?: number;
  /** Production `price_adjustment_percent`. Only under the percent markup. */
  percentMarkup?: number;
  /** Production `default_is_taxable`. Opens on the company's default. */
  isTaxable: boolean;

  /** Production `track_inventory` — the Stock type. False without the Inventory module. */
  trackInventory: boolean;
  /** The location cards, in the order added. Empty for a non-inventory product. */
  inventoryLevels: NewProductInventoryLevel[];

  /** Production `quickbooks_desktop_revenue_account_id`. Only on the detailed scheme. */
  revenueAccountId?: string;
  /** The cost of goods and inventory asset accounts — inventory products only. */
  cogsAccountId?: string;
  assetAccountId?: string;

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
  /**
   * The user has the "can't classify subtypes" flag. With `requireSubtypes`
   * and 2+ subtypes such a user can not create a product at all, so the form
   * opens as the "You can't create products" Prompt instead. Default false.
   */
  cannotClassifySubtypes?: boolean;
  /** The company uses taxes (`use_taxes`). False removes Taxability. Default true. */
  useTaxes?: boolean;
  /** What Taxability opens on — the company's product default. Default true (taxable). */
  defaultIsTaxable?: boolean;

  /**
   * EVERY vendor, active and inactive. Only active ones can be picked; the
   * inactive ones show, disabled, when they match the search or when no
   * active vendor exists.
   */
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
  /**
   * The Inventory module — only when the company enables the feature
   * (`feature_inventory_enabled`). Undefined removes the module. Every
   * location, active or not; with NO active location the Stock type is locked
   * on Non-inventory, whatever the default says.
   */
  inventory?: { locations: InventoryLocation[]; defaultTrackInventory: boolean };
  /**
   * The Accounting module — only on QuickBooks Desktop with the "Detailed
   * Split" line-item scheme. Undefined removes it. With no synced income
   * account the form opens as the "Sync QuickBooks accounts first" Prompt.
   */
  quickbooks?: NewProductQuickbooks;

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
   * Default false.
   */
  isCreateBlocked?: boolean;

  /**
   * Create. Return `false` (or a Promise of it) to say it FAILED: the form
   * shows an error toast and stays open with the values intact. On success
   * the form closes and shows the "Product created" toast; taking the user to
   * the Products list with the new product's side panel open is the caller's
   * follow-up (the Create button's annotation).
   */
  onCreated?: (product: NewProduct) => void | boolean | Promise<void | boolean>;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
