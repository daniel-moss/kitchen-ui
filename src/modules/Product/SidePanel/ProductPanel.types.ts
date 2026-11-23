import { InventoryLevel, ProductItem } from "../../../data/db";
import { InventoryLocation, Vendor } from "../../../data/db/types";
import { HistoryRow } from "../../EquipmentPanel/equipmentData";
import { AccountingEdits } from "../../shared/EditAccountingDialog";
import { PricebookAccountLists } from "../../shared/pricebookAccounting";
import { NewProductVendorCost } from "../NewProductForm/NewProductForm.types";
import { StockFigures } from "../InventoryLevel/InventoryLevelCard";

/**
 * The panel's five tabs (Figma 3167-22768). "Inventory levels" exists only for
 * an Inventory product, "Accounting" only on QuickBooks Desktop with the
 * "Detailed Split" setup.
 * "Inventory levels" exists only for an Inventory product.
 */
export type ProductPanelTab = "details" | "vendorCosts" | "inventoryLevels" | "accounting" | "history";

/** What the "General" form hands back — the editable half of that module. */
export type ProductGeneral = Pick<ProductItem, "name" | "subtypeId" | "manufacturer" | "partNumber" | "barcode" | "trackInventory">;

/**
 * What the "Pricing" form hands back. The whole module travels together: the
 * cost strategy decides the cost, and the price strategy decides whether the
 * price was typed or derived from that cost.
 */
export type ProductPricing = Pick<
  ProductItem,
  "costStrategy" | "cost" | "priceStrategy" | "price" | "fixedMarkup" | "percentMarkup" | "taxable"
>;

/**
 * What the "Details" form hands back — Image URL, the three dimensions with
 * their unit, and the weight with its unit. A unit travels only with its values.
 */
export type ProductDetails = Pick<ProductItem, "imageUrl" | "length" | "width" | "height" | "dimensionUnit" | "weight" | "weightUnit">;

/**
 * Which actions the signed-in user may take — the Labor rate panel's three
 * pricebook permissions. A missing permission HIDES the control ("Only shown
 * if a user has required permissions"). Everything defaults to true.
 */
export interface ProductPermissions {
  /** `pricebook_edit_permission` FULL — every pen, and Confirm. */
  edit?: boolean;
  /** `pricebook_delete_permission` ≥ RESTRICTED — Deactivate and Reactivate. */
  deactivate?: boolean;
  /** `pricebook_delete_permission` FULL — Delete, which only Review offers. */
  remove?: boolean;
}

type Result = void | boolean | Promise<void | boolean>;

/**
 * What the panel can DO. Every handler may return `false` (or a Promise of it)
 * to report that the action FAILED — the panel then shows the designed error
 * toast and, for a form, keeps it open with the values intact. Anything else,
 * a missing handler included, counts as success.
 */
export interface ProductPanelActions {
  /** Save from the "General" form. */
  onSaveGeneral?: (edits: ProductGeneral) => Result;
  /** Save from the "Pricing" form — the whole money module at once. */
  onSavePricing?: (edits: ProductPricing) => Result;
  /** Save from the "Details" form. */
  onSaveDetails?: (edits: ProductDetails) => Result;
  /** Save from the Labels picker — label NAMES, in pick order. */
  onSaveLabels?: (labels: string[]) => Result;
  /** Save from the "Description" dialog (production's `summary_template`). */
  onSaveDescription?: (description: string) => Result;
  /** Save from the "Internal notes" dialog. */
  onSaveNotes?: (notes: string) => Result;
  /** Deactivate, after the "Deactivate product?" Prompt is confirmed. */
  onDeactivate?: () => Result;
  /** Reactivate, from the Inactive footer. */
  onReactivate?: () => Result;
  /** Confirm a product in Review — it becomes Active. */
  onConfirm?: () => Result;
  /** Delete, after the "Delete product?" Prompt. Only a Review product can be deleted. */
  onDelete?: () => Result;
  /** Save from the "Accounting" form — the revenue account, plus the two inventory accounts for an Inventory product. */
  onSaveAccounting?: (edits: AccountingEdits) => Result;
  /** Opens a History row (a job or an invoice). */
  onOpenHistory?: (row: HistoryRow) => void;
  /** Save from a location's "Inventory levels" Dialog — the product's whole level there. */
  onSaveInventoryLevel?: (locationId: string, level: StockFigures) => Result;
  /**
   * Any change on the "Vendor costs" tab — an add, an edit, a new preferred
   * vendor or a delete. Gets the product's WHOLE list after the change and the
   * Pricing module it leads to: under Min / Max / Avg vendor cost the cost is
   * re-derived (a markup price with it), and deleting the last vendor cost
   * moves the strategy to Manual with the last manual cost.
   */
  onSaveVendorCosts?: (costs: NewProductVendorCost[], pricing: ProductPricing) => Result;
}

export interface ProductPanelProps extends ProductPanelActions {
  /** Controls the open/close animation and mounting, like SidePanel. */
  open: boolean;
  /** Called on any dismissal: the close button, the scrim, or Escape. */
  onClose: () => void;

  /** The product this panel shows. The caller stays the source of truth. */
  product: ProductItem;

  /** The workspace's product labels, by name. A label can also be created. */
  labelPool?: string[];
  /**
   * Every other product's name, for the "General" form's duplicate check —
   * production's `description` is unique per company. The product's own name
   * is ignored.
   */
  existingNames?: string[];
  /**
   * Every other product's barcode → that product's name, for the "General"
   * form's "Already registered to …" check. Default: the demo database.
   */
  registeredBarcodes?: Record<string, string>;
  /**
   * The product's vendor costs — the "Vendor costs" tab's cards, and what the
   * Pricing form's three vendor strategies read (with none they are disabled).
   * Exactly one is preferred. Default: the demo database.
   */
  vendorCosts?: NewProductVendorCost[];
  /** Every vendor — the cards' names and the "Add vendor cost" list. Default: the demo database. */
  vendors?: Vendor[];
  /**
   * The company is on QuickBooks Desktop with the "Detailed Split" line-item
   * setup — the condition for the "Accounting" tab. Default true.
   */
  hasQuickbooksAccounting?: boolean;
  /**
   * The "History" tab's rows. Default: the demo database as seeded. The demo
   * app passes rows built from its LIVE jobs and charge lines.
   */
  historyRows?: HistoryRow[];
  /** The QuickBooks account lists and the company defaults. Default: the demo company's. */
  accountLists?: PricebookAccountLists;
  /** The company requires a subtype (`require_subtypes`). Default false. */
  requireSubtypes?: boolean;
  /** The company uses taxes. False drops Taxability. Default true. */
  useTaxes?: boolean;
  /**
   * The company has the inventory feature (`feature_inventory_enabled`). False
   * drops the Stock type row and field. Default true.
   */
  hasInventory?: boolean;
  /**
   * The company's ACTIVE inventory locations — every one is a row of the
   * "Inventory levels" tab. Default: the demo company's live list.
   */
  inventoryLocations?: InventoryLocation[];
  /** The product's levels (any order). Default: the demo database. */
  inventoryLevels?: InventoryLevel[];
  /** Which actions this user may take. See `ProductPermissions`. */
  permissions?: ProductPermissions;

  /** The tab the panel opens on, and returns to for a new product. Default "details". */
  initialTab?: ProductPanelTab;

  /** Shown as the header's back arrow, when this panel replaces another's content. */
  onBack?: () => void;

  /**
   * Use the FAKE barcode scanner in the "General" form (a still picture that
   * reads demo codes when tapped). For stories — a real camera needs HTTPS.
   */
  simulatedScanner?: boolean;

  /** Loading: every module body renders skeletons and every action button is hidden. */
  isLoading?: boolean;
  /** Body state, passed straight to SidePanel. */
  state?: "content" | "error" | "offline";
  onRetry?: () => void;

  /**
   * Desktop: `false` = NON-MODAL (no scrim, the page behind stays usable) —
   * the panel opened from its pricebook list. Passed to SidePanel. Default true.
   */
  isModal?: boolean;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
