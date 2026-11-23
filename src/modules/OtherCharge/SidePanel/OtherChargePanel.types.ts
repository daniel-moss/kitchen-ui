import { ChargeItem } from "../../../data/db";
import { HistoryRow } from "../../EquipmentPanel/equipmentData";

/** The panel's three tabs. Accounting exists only with `hasQuickbooksAccounting`. */
export type OtherChargePanelTab = "details" | "accounting" | "history";

/** What the "General" form hands back — the editable half of that module. */
export type OtherChargeGeneral = Pick<ChargeItem, "name" | "subtypeId">;

/**
 * What the "Pricing" form hands back. The whole module travels together: a
 * price strategy decides whether the price was typed or derived from the
 * cost, so saving one without the others could leave them disagreeing.
 */
export type OtherChargePricing = Pick<ChargeItem, "cost" | "price" | "taxable" | "priceStrategy" | "fixedMarkup" | "percentMarkup">;

/**
 * Which actions the signed-in user may take. Production gates each one on its
 * own pricebook permission, and the Figma annotates every button with "Only
 * shown, if a user has required permissions" — so a missing permission HIDES
 * the control, it does not disable it. Everything defaults to true.
 */
export interface OtherChargePermissions {
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
export interface OtherChargePanelActions {
  /** Save from the "General" form — the name and the subtype. */
  onSaveGeneral?: (edits: OtherChargeGeneral) => void | boolean | Promise<void | boolean>;
  /** Save from the "Pricing" form — the whole money module at once. */
  onSavePricing?: (edits: OtherChargePricing) => void | boolean | Promise<void | boolean>;
  /** Save from the "Accounting" form — the QuickBooks revenue account's id. */
  onSaveAccounting?: (quickbooksAccountId: string) => void | boolean | Promise<void | boolean>;
  /** Save from the Labels picker — label NAMES, in pick order. */
  onSaveLabels?: (labels: string[]) => void | boolean | Promise<void | boolean>;
  /** Save from the "Description" dialog (production's `summary_template`). */
  onSaveDescription?: (description: string) => void | boolean | Promise<void | boolean>;
  /** Save from the "Internal notes" dialog. */
  onSaveNotes?: (notes: string) => void | boolean | Promise<void | boolean>;

  /** Deactivate, after the "Deactivate other charge?" Prompt is confirmed. */
  onDeactivate?: () => void | boolean | Promise<void | boolean>;
  /** Reactivate, from the Inactive footer. */
  onReactivate?: () => void | boolean | Promise<void | boolean>;
  /** Confirm a charge in Review — production's `confirmed = true`. */
  onConfirm?: () => void | boolean | Promise<void | boolean>;
  /** Delete, after the "Delete other charge?" Prompt is confirmed. Review only. */
  onDelete?: () => void | boolean | Promise<void | boolean>;
  /** A History row was clicked — open that job or invoice. */
  onOpenHistory?: (row: HistoryRow) => void;
}

export interface OtherChargePanelProps extends OtherChargePanelActions {
  /** Controls the open/close animation and mounting, like SidePanel. */
  open: boolean;
  /** Called on any dismissal: the close button, the scrim, or Escape. */
  onClose: () => void;

  /**
   * The other charge this panel shows. Every module reads it — the caller
   * stays the source of truth.
   */
  charge: ChargeItem;

  /** The workspace's other-charge labels, by name. A label can also be created. */
  labelPool?: string[];
  /**
   * Every other pricebook item's name, for the "General" form's duplicate
   * check. The charge's own name is ignored, so re-saving it unchanged is never
   * an error.
   */
  existingNames?: string[];
  /** The company requires a subtype (`require_subtypes`). Default false. */
  requireSubtypes?: boolean;
  /** The company uses taxes. False drops the Taxability row and field. Default true. */
  useTaxes?: boolean;
  /**
   * Whether the "Accounting" tab appears — true only when the company is on
   * QuickBooks Desktop AND uses the DETAILED line-item scheme. Default true.
   */
  hasQuickbooksAccounting?: boolean;
  /** The "History" tab's rows. Default: the demo database as seeded. */
  historyRows?: HistoryRow[];
  /** Which actions this user may take. See `OtherChargePermissions`. */
  permissions?: OtherChargePermissions;

  /** Shown as the header's back arrow, when this panel replaces another's content. */
  onBack?: () => void;

  // ---- state ----

  /** Loading: every module body renders skeletons and every action button is hidden. */
  isLoading?: boolean;
  /** Body state, passed straight to SidePanel. */
  state?: "content" | "error" | "offline";
  onRetry?: () => void;

  /** Presentation: "auto" (default) picks desktop ≥ 1024px, else mobile. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
