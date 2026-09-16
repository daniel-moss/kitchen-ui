import {
  BILLS,
  POStatus,
  PURCHASE_ORDERS,
  VENDOR_LABELS,
  VENDORS as DB_VENDORS,
  Vendor,
} from "../../data/db";
import { joinWithSeparator } from "../../utils/textSeparator";

// The Vendors list's data door — a READER over the shared demo database, like
// the other seven (Daniel, 2026-09-11: "each row gets the data from the db").
// The vendors live in src/data/db (twelve rows, three deactivated); this
// module derives the display values and keeps the lookups.
//
// VENDORS ARE THE SUPPLIER DIRECTORY — the first list whose rows are not
// documents at all: no status, no phase machinery, nothing clock-derived. The
// two phases are the one `isActive` flag (production's own), and the page
// filters on it directly.
//
// THE THREE NUMBER COLUMNS are not fields — production annotates them onto
// the queryset (pricebook/managers.py) and this module derives them from the
// PURCHASE_ORDERS and BILLS tables the same way, once at module load:
//
//   CURRENT POS — production's `current_purchase_order_count`: the POs
//   issued and not yet paid or cancelled (Sent → Unpaid in the badge names).
//   Pending (draft / unsent) orders are outside — nothing is on order until
//   it is sent.
//
//   COMMITMENTS — the money of THE SAME SET (Daniel, 2026-09-15: "let's use
//   five statuses"), diverging from production ON PURPOSE: production's
//   `outstanding_commitments` sums only sent / delivered / stocked POs,
//   skipping acknowledged and in_transit — so its number DROPS when the
//   vendor acknowledges an order and comes back at delivery, while its own
//   Current POs counts all five. A production gap, flagged there. Here the
//   count and the money describe the same orders.
//
//   PAYABLES — production's `outstanding_payables` one for one: the bills
//   where THIS vendor is the billing vendor (`Bill.vendor`) and the status
//   is Received — the stored "outstanding" here, which includes the derived
//   Overdue by construction. Draft, paid and voided bills are outside.

/** The db row itself — the list renders it directly. */
export type VendorRow = Vendor;

/**
 * Every vendor in the database, sorted the view's own way — the production
 * "Vendors" default, `name` ascending (on BOTH phases; the tabs' configs are
 * identical there).
 */
export const VENDOR_ROWS: VendorRow[] = [...DB_VENDORS].sort((a, b) => a.name.localeCompare(b.name));

// ---- the derived number columns --------------------------------------------

/** Issued and not yet settled — the five statuses Current POs AND
 *  Commitments read (see the module note). */
const CURRENT_PO_STATUSES = new Set<POStatus>(["sent", "acknowledged", "inTransit", "unstocked", "unpaid"]);

const CURRENT_PO_COUNT = new Map<string, number>();
const COMMITMENTS_TOTAL = new Map<string, number>();
for (const po of PURCHASE_ORDERS) {
  if (!CURRENT_PO_STATUSES.has(po.status)) continue;
  CURRENT_PO_COUNT.set(po.vendorId, (CURRENT_PO_COUNT.get(po.vendorId) ?? 0) + 1);
  COMMITMENTS_TOTAL.set(po.vendorId, (COMMITMENTS_TOTAL.get(po.vendorId) ?? 0) + po.amount);
}

const PAYABLES_TOTAL = new Map<string, number>();
for (const bill of BILLS) {
  if (bill.status !== "outstanding") continue;
  PAYABLES_TOTAL.set(bill.vendorId, (PAYABLES_TOTAL.get(bill.vendorId) ?? 0) + bill.total);
}

/** How many current POs the vendor has. ZERO is a real value and PRINTS —
 *  production's number cell has no `ignoreZero`. */
export const currentPOsOf = (vendor: VendorRow): number => CURRENT_PO_COUNT.get(vendor.id) ?? 0;

/** Dollars committed to the vendor on its current POs. Zero renders EMPTY in
 *  the column (production's `ignoreZero`); the filters still see the number. */
export const commitmentsOf = (vendor: VendorRow): number => COMMITMENTS_TOTAL.get(vendor.id) ?? 0;

/** Dollars owed to the vendor on its outstanding bills. Zero renders EMPTY in
 *  the column (production's `ignoreZero`); the filters still see the number. */
export const payablesOf = (vendor: VendorRow): number => PAYABLES_TOTAL.get(vendor.id) ?? 0;

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const VENDOR_BY_ID = byId(DB_VENDORS);
const LABEL_BY_ID = byId(VENDOR_LABELS);

/** The vendor the bills arrive from, or null = the vendor itself ("Same
 *  vendor" — see the db's `billsViaId`). */
export const billsViaOf = (vendor: VendorRow): Vendor | null =>
  vendor.billsViaId == null ? null : VENDOR_BY_ID.get(vendor.billsViaId)!;

export const labelsOf = (vendor: VendorRow) => vendor.labelIds.map((id) => LABEL_BY_ID.get(id)!);

// ---- the billing address ----------------------------------------------------

/**
 * The column's one-line string — production's generated
 * `billing_address_formatted`, printed the prototype's own way: state and
 * postal code join as ONE region part ("CA 94107", the `locationAddress`
 * rule), and the UNIT is kept ("2298 Jerrold Ave, Unit B, San Francisco, CA
 * 94124") because production's formatted string keeps it too — unlike the
 * tables' "Location address" columns, which drop it on purpose. Empty for a
 * vendor with no address on file.
 *
 * The optional RECIPIENT (production `billing_address_recipient` — a person
 * or a department) leads, joined with the shared TEXT SEPARATOR, not the
 * address's commas: "Accounts Receivable · 355 Bayshore Blvd, ..." (Daniel,
 * 2026-09-15 — the addressee is its own value, not an address part, which
 * is also why the filter's five fields do not match it).
 */
export function billingAddressOf(vendor: VendorRow): string {
  const region = [vendor.billingState, vendor.billingPostalCode].filter((part) => part != null).join(" ");
  const address = [vendor.billingStreet, vendor.billingUnit, vendor.billingCity, region === "" ? null : region]
    .filter((part) => part != null && part !== "")
    .join(", ");
  return joinWithSeparator(vendor.billingRecipient ?? null, address === "" ? null : address);
}

/** The same fields for the Billing address FILTER — matched field against
 *  field by the shared address kind (its `AddressParts` shape, satisfied
 *  structurally so this door keeps importing nothing but the db). */
export const billingAddressParts = (vendor: VendorRow) => ({
  street: vendor.billingStreet ?? null,
  unit: vendor.billingUnit ?? null,
  city: vendor.billingCity ?? null,
  state: vendor.billingState ?? null,
  postalCode: vendor.billingPostalCode ?? null,
});

// ---- payment terms ----------------------------------------------------------

/**
 * The distinct payment-terms values IN USE, ascending — the Payment terms
 * filter's options (the POs section's own annotation, 14944-4762: "Only the
 * actual values that exist on the list"; "The values are the vendor's
 * property"). On THIS list the vendors themselves are the rows, so every
 * vendor contributes — both phases.
 */
export const PAYMENT_TERMS_IN_USE: number[] = [
  ...new Set(DB_VENDORS.map((vendor) => vendor.paymentTerms).filter((terms): terms is number => terms != null)),
].sort((a, b) => a - b);
