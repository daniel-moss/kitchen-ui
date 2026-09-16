import { STATUS } from "../../components/Badge/BadgePOStatus";
import {
  PO_LABELS,
  PURCHASE_ORDERS as DB_POS,
  POStatus,
  PurchaseOrder,
  SHIPPING_CARRIERS,
  SHIPPING_METHODS,
  ShippingOption,
  VENDORS,
  Vendor,
  shippingCarrierOf,
  shippingMethodOf,
} from "../../data/db";

// The Shipping COLUMN's combined string lives with the db (production's
// `get_shipping_details` shape) — re-exported so the table keeps one door.
export { shippingOf } from "../../data/db";

// The POs list's data door — a READER over the shared demo database, like the
// other six (Daniel, 2026-09-11: "each row gets the data from the db"). The
// purchase-order table lives in src/data/db (ten curated rows plus the
// materialized PO-71xx mass); this module derives the display values and
// keeps the lookups.
//
// POs hang off VENDORS, like bills — the buying side of the same
// relationship — so the lookups go to the VENDORS table and there is no
// client, location or service door.
//
// STATUS — the standing decision applied from day one (2026-09-15): the db
// row carries the status the badge shows, the nine relabeled display
// statuses (production stores eight and relabels four — see `POStatus` in
// the db's types). NOTHING is clock-derived — a PO has no due date — so this
// is the second list (after Credit notes) with no `displayStatus` derivation
// at all: the stored status IS the badge.

/** The db row itself — the list renders it directly. */
export type PORow = PurchaseOrder;

/**
 * Every purchase order in the database, sorted the view's own way — the
 * production "Purchase orders" default, date_issued ascending (on EVERY tab,
 * the closed ones included — production's own choice, kept on Daniel's
 * "follow production").
 */
export const PO_ROWS: PORow[] = [...DB_POS].sort((a, b) =>
  a.issuedAt === b.issuedAt ? a.id.localeCompare(b.id) : a.issuedAt.localeCompare(b.issuedAt),
);

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const VENDOR_BY_ID = byId(VENDORS);
const LABEL_BY_ID = byId(PO_LABELS);

/** The vendor is DIRECT — production `vendor`, the "Purchasing Vendor". Every PO has one. */
export function vendorOf(po: PORow): Vendor {
  return VENDOR_BY_ID.get(po.vendorId)!;
}
export const labelsOf = (po: PORow) => po.labelIds.map((id) => LABEL_BY_ID.get(id)!);

// ---- derivations -----------------------------------------------------------

/** The status's own label, straight from BadgePOStatus — never a second copy. */
export const poStatusLabel = (status: POStatus) => STATUS[status].label;

// "Same Day" / "Net 30" — MOVED to listData on 2026-09-15, when the Vendors
// list became its second reader (the formatCurrency precedent). Re-exported
// so this door's consumers (posTable, poFilters) did not have to move.
export { formatPaymentTerms } from "./listData";

/**
 * The payment terms a PO shows — read LIVE off its vendor, production's own
 * shape (`PurchaseOrderListSerializer.get_payment_terms` returns
 * `instance.vendor.payment_terms`; nothing is copied onto the PO). Change a
 * vendor's terms and every one of its POs follows.
 */
export const paymentTermsOf = (po: PORow): number | null => vendorOf(po).paymentTerms;

/**
 * The distinct payment-terms values IN USE on the list, ascending — the
 * Payment terms filter's options (the section's own annotation, 14944-4762:
 * "Only the actual values that exist on the list"; "The values are the
 * vendor's property"). Only vendors that HAVE purchase orders contribute.
 */
export const PAYMENT_TERMS_IN_USE: number[] = [
  ...new Set(DB_POS.map((po) => vendorOf(po).paymentTerms).filter((terms): terms is number => terms != null)),
].sort((a, b) => a - b);

// ---- shipping carrier / method (the split filters) -------------------------

/**
 * The filter KEY a PO answers a carrier/method list with: "none" when the
 * half is unset — an "Other" with a BLANK custom name included (nothing to
 * show, so it falls under the absence row — the settled empty-Other rule) —
 * the preset's id, or "custom:<name>" for a user-written value.
 */
const shippingKey = (id: string | null, name: string | null): string =>
  name == null ? "none" : id === "other" ? `custom:${name}` : id!;

export const carrierKeyOf = (po: PORow): string => shippingKey(po.shippingCarrierId, shippingCarrierOf(po));
export const methodKeyOf = (po: PORow): string => shippingKey(po.shippingMethodId, shippingMethodOf(po));

/**
 * One carrier/method option list: ALL the presets plus the distinct CUSTOM
 * names in use, merged A to Z — the sections' own annotation ("The list
 * contains all preset options + custom options added by the user"). Merged,
 * not grouped: the user picks a name they recognize and does not care which
 * kind it is. Two spellings of a custom name are two rows — free text can
 * only be reflected, not repaired. (Production's own pickers order the
 * presets by popularity, USPS first — the FILTER sorts A to Z like the
 * vendor list; FLAGGED.)
 */
function shippingFilterOptions(
  presets: ShippingOption[],
  idOf: (po: PORow) => string | null,
  nameOf: (po: PORow) => string | null,
): { id: string; label: string }[] {
  const customs = [
    ...new Set(
      DB_POS.filter((po) => idOf(po) === "other")
        .map(nameOf)
        .filter((name): name is string => name != null),
    ),
  ];
  return [
    ...presets.map((preset) => ({ id: preset.id, label: preset.name })),
    ...customs.map((name) => ({ id: `custom:${name}`, label: name })),
  ].sort((a, b) => a.label.localeCompare(b.label));
}

/** The Shipping carrier filter's rows (under its "No carrier" lead). */
export const CARRIER_OPTIONS = shippingFilterOptions(
  SHIPPING_CARRIERS,
  (po) => po.shippingCarrierId,
  shippingCarrierOf,
);

/** The Shipping method filter's rows (under its "No method" lead). */
export const METHOD_OPTIONS = shippingFilterOptions(
  SHIPPING_METHODS,
  (po) => po.shippingMethodId,
  shippingMethodOf,
);

