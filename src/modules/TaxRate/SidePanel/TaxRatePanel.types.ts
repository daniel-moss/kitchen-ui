import { TaxRateItem } from "../../../data/db";

/** The panel's two tabs. Accounting exists only with `hasQuickbooksAccounting`. */
export type TaxRatePanelTab = "details" | "accounting";

/** What the "General" form hands back — a tax rate has a name and no subtype. */
export type TaxRateGeneral = Pick<TaxRateItem, "name">;

/** What the "Pricing" form hands back — the percent (production `default_price`). */
export type TaxRatePricing = Pick<TaxRateItem, "rate">;

/**
 * Which actions the signed-in user may take. A missing permission HIDES the
 * control ("Only shown, if a user has required permissions"). Everything
 * defaults to true.
 */
export interface TaxRatePermissions {
  /** `pricebook_edit_permission` FULL — every pen, and Confirm. */
  edit?: boolean;
  /** `pricebook_delete_permission` ≥ RESTRICTED — Deactivate and Reactivate. */
  deactivate?: boolean;
  /** `pricebook_delete_permission` FULL — Delete, which only Review offers. */
  remove?: boolean;
}

/**
 * What the panel can DO. Every handler may return `false` (or a Promise of it)
 * to report that the action FAILED — the panel then shows the designed error
 * toast and, for a form, keeps it open.
 */
export interface TaxRatePanelActions {
  onSaveGeneral?: (edits: TaxRateGeneral) => void | boolean | Promise<void | boolean>;
  onSavePricing?: (edits: TaxRatePricing) => void | boolean | Promise<void | boolean>;
  /** Save from the "Accounting" form — the QuickBooks vendor (tax collection agency) id. */
  onSaveAccounting?: (quickbooksVendorId: string) => void | boolean | Promise<void | boolean>;
  /** Label NAMES, in pick order. */
  onSaveLabels?: (labels: string[]) => void | boolean | Promise<void | boolean>;
  /** Production's `summary_template`. */
  onSaveDescription?: (description: string) => void | boolean | Promise<void | boolean>;
  onSaveNotes?: (notes: string) => void | boolean | Promise<void | boolean>;
  onDeactivate?: () => void | boolean | Promise<void | boolean>;
  onReactivate?: () => void | boolean | Promise<void | boolean>;
  /** Confirm a rate in Review — production's `confirmed = true`. */
  onConfirm?: () => void | boolean | Promise<void | boolean>;
  /** Delete, after the Prompt. Review only. */
  onDelete?: () => void | boolean | Promise<void | boolean>;
}

export interface TaxRatePanelProps extends TaxRatePanelActions {
  open: boolean;
  onClose: () => void;
  /** The tax rate this panel shows — the caller stays the source of truth. */
  rate: TaxRateItem;
  /** The workspace's tax-rate labels, by name. A label can also be created. */
  labelPool?: string[];
  /** Every other pricebook item's name, for the duplicate Name check. */
  existingNames?: string[];
  /**
   * Whether the "Accounting" tab appears — a company on QuickBooks Desktop,
   * WHATEVER its line-item setup (a tax rate's agency does not depend on it).
   * Default true.
   */
  hasQuickbooksAccounting?: boolean;
  /** Which actions this user may take. */
  permissions?: TaxRatePermissions;
  /** Shown as the header's back arrow, when this panel replaces another's content. */
  onBack?: () => void;

  /** Loading: skeletons, and every action button hidden. */
  isLoading?: boolean;
  /** Body state, passed straight to SidePanel. */
  state?: "content" | "error" | "offline";
  onRetry?: () => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
