import { LaborItem } from "../../data/db";

/** What the "General" form hands back — the editable half of that module. */
export type LaborRateGeneral = Pick<LaborItem, "name" | "subtypeId">;

/**
 * What the "Pricing" form hands back. The whole module travels together: a
 * unit type decides the suffix on both money fields, and a price strategy
 * decides whether the rate was typed or derived — so saving one without the
 * others could leave the three disagreeing.
 */
export type LaborRatePricing = Pick<
  LaborItem,
  "unitType" | "cost" | "rate" | "taxable" | "priceStrategy" | "priceAdjustmentAmount" | "priceAdjustmentPercent"
>;

/**
 * Which actions the signed-in user may take. Production gates each one on its
 * own pricebook permission, and the Figma annotates every button with "Only
 * shown, if a user has required permissions" — so a missing permission HIDES
 * the control, it does not disable it.
 *
 * Everything defaults to true: a prototype with no permission wired shows the
 * full panel.
 */
export interface LaborRatePermissions {
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
export interface LaborRatePanelActions {
  /** Save from the "General" form — the name and the subtype. */
  onSaveGeneral?: (edits: LaborRateGeneral) => void | boolean | Promise<void | boolean>;
  /** Save from the "Pricing" form — the whole money module at once. */
  onSavePricing?: (edits: LaborRatePricing) => void | boolean | Promise<void | boolean>;
  /** Save from the "Accounting" form — the QuickBooks revenue account's id. */
  onSaveAccounting?: (quickbooksAccountId: string) => void | boolean | Promise<void | boolean>;
  /** Save from the Labels picker — label NAMES, in pick order. */
  onSaveLabels?: (labels: string[]) => void | boolean | Promise<void | boolean>;
  /** Save from the "Description" dialog (production's `summary_template`). */
  onSaveSummary?: (summary: string) => void | boolean | Promise<void | boolean>;
  /** Save from the "Internal notes" dialog. */
  onSaveNotes?: (notes: string) => void | boolean | Promise<void | boolean>;

  /** Deactivate, after the "Deactivate labor rate?" Prompt is confirmed. */
  onDeactivate?: () => void | boolean | Promise<void | boolean>;
  /** Reactivate, from the inactive banner's link. */
  onReactivate?: () => void | boolean | Promise<void | boolean>;
  /**
   * Confirm a rate in Review — production's `confirmed = true`. It becomes
   * Active and moves to the list's "Confirmed" view.
   */
  onConfirm?: () => void | boolean | Promise<void | boolean>;
  /**
   * Delete, after the "Delete labor rate?" Prompt is confirmed. Only a rate in
   * Review can be deleted; the handler removes the record and decides where to
   * go next.
   */
  onDelete?: () => void | boolean | Promise<void | boolean>;
}

export interface LaborRatePanelProps extends LaborRatePanelActions {
  /** Controls the open/close animation and mounting, like SidePanel. */
  open: boolean;
  /** Called on any dismissal: the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The labor rate this panel shows. Every module reads it — the panel holds
   * no record of its own, so the caller stays the source of truth.
   */
  rate: LaborItem;

  /** The workspace's labor-rate labels, by name. A label can also be created. */
  labelPool?: string[];
  /**
   * Every other labor rate's name, for the "General" form's duplicate check —
   * production's `description` is unique per company. The rate's own name is
   * ignored, so re-saving it unchanged is never an error.
   */
  existingNames?: string[];
  /**
   * The company requires a subtype on a pricebook item
   * (`ServiceCompany.require_subtypes`). The "General" form then loses the
   * field's "(optional)" tag and its "No subtype" clear row. Default false.
   */
  requireSubtypes?: boolean;
  /**
   * The company uses taxes. False drops the Taxability row and the Pricing
   * form's field ("Only shown when a company uses taxes"). Default true.
   */
  useTaxes?: boolean;
  /**
   * Whether the whole "Accounting" module appears — true only when the company
   * is on QuickBooks Desktop AND uses the DETAILED line-item scheme, the one
   * setup where a labor rate carries its own revenue account
   * (`PriceBookItem.clean`). Default true.
   */
  hasQuickbooksAccounting?: boolean;
  /** Which actions this user may take. See `LaborRatePermissions`. */
  permissions?: LaborRatePermissions;

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
