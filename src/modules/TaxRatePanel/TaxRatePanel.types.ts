import { TaxRateItem } from "../../data/db";

/** What the "General details" form hands back — the editable half of the module. */
export type TaxRateDetails = Pick<TaxRateItem, "name" | "rate">;

/**
 * Which actions the signed-in user may take. Production gates each one on its
 * own pricebook permission, and the Figma annotates every button with "Only
 * shown, if a user has required permissions" — so a missing permission HIDES
 * the control, it does not disable it.
 *
 * Everything defaults to true: a prototype with no permission wired shows the
 * full panel.
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
 * toast and, for a form, keeps it open with the values intact. Anything else, a
 * missing handler included, counts as success.
 */
export interface TaxRatePanelActions {
  /** Save from the "General details" form. */
  onSaveDetails?: (edits: TaxRateDetails) => void | boolean | Promise<void | boolean>;
  /** Save from the "Accounting" form — the QuickBooks agency's id. */
  onSaveAccounting?: (quickbooksVendorId: string) => void | boolean | Promise<void | boolean>;
  /** Save from the Labels picker — label NAMES, in pick order. */
  onSaveLabels?: (labels: string[]) => void | boolean | Promise<void | boolean>;
  /** Save from the "Summary template" dialog. */
  onSaveSummary?: (summary: string) => void | boolean | Promise<void | boolean>;
  /** Save from the "Internal notes" dialog. */
  onSaveNotes?: (notes: string) => void | boolean | Promise<void | boolean>;

  /** Deactivate, after the "Deactivate tax rate?" Prompt is confirmed. */
  onDeactivate?: () => void | boolean | Promise<void | boolean>;
  /** Reactivate, from the inactive banner's link. */
  onReactivate?: () => void | boolean | Promise<void | boolean>;
  /**
   * Confirm a rate in Review — production's `confirmed = true`. It becomes
   * Active and moves to the list's "Confirmed" view.
   */
  onConfirm?: () => void | boolean | Promise<void | boolean>;
  /**
   * Delete, after the "Delete tax rate?" Prompt is confirmed. Only a rate in
   * Review can be deleted; the handler removes the record and decides where to
   * go next.
   */
  onDelete?: () => void | boolean | Promise<void | boolean>;
}

export interface TaxRatePanelProps extends TaxRatePanelActions {
  /** Controls the open/close animation and mounting, like SidePanel. */
  open: boolean;
  /** Called on any dismissal: the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The tax rate this panel shows. Every module reads it — the panel holds no
   * record of its own, so the caller stays the source of truth.
   */
  rate: TaxRateItem;

  /** The workspace's tax-rate labels, by name. A label can also be created. */
  labelPool?: string[];
  /**
   * Whether the company has an accounting integration. False hides the whole
   * "Accounting" module ("Only shown if a company has accounting integration").
   * Default true.
   */
  hasAccountingIntegration?: boolean;
  /** Which actions this user may take. See `TaxRatePermissions`. */
  permissions?: TaxRatePermissions;

  /**
   * Shown as the header's back arrow. A link inside a side panel never opens a
   * SECOND panel (the SidePanel rule): when this panel replaces another's
   * content, the CALLER keeps the stack and passes this.
   */
  onBack?: () => void;

  // ---- state ----

  /**
   * Loading: every module body renders skeletons and every action button is
   * hidden — there is nothing to edit, copy or act on yet (the Loading frame,
   * node 1-7247).
   */
  isLoading?: boolean;
  /** Body state, passed straight to SidePanel. */
  state?: "content" | "error" | "offline";
  onRetry?: () => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
