// THE demo database — one simulated service company, shared by the demo app,
// every module and every prototype. Schema in types.ts (mirrors production
// models), data in db.ts, browsable in Storybook under Data → Database.
// Import from here:
//
//   import { CLIENTS, locationsOf, warrantiesOf } from "../../data/db";
//
// ONE EXCEPTION (2026-09-28, Daniel): the Filters prototype keeps its own
// frozen copy in src/prototypes/Filters/db while customers test it. Nothing
// else may read that copy, and both it and the prototype are deleted when the
// test is over.

import { BILLS, CLIENT_CONTACTS, CLIENTS, CREDIT_NOTES, EQUIPMENT, EQUIPMENT_FILES, EQUIPMENT_LABELS, ESTIMATES, INVOICES, JOB_LABELS, JOB_SERIES, JOBS, JOB_SUB_STATUSES, LOCATION_CONTACTS, LOCATIONS, PURCHASE_ORDERS, SHIPPING_CARRIERS, SHIPPING_METHODS, TODAY, VENDORS, WARRANTIES } from "./db";
import { Bill, Client, CreditNote, Equipment, EquipmentLabel, Estimate, Invoice, Job, JobLabel, JobSeries, JobSubStatusRecord, Location, PurchaseOrder, Vendor, Warranty } from "./types";

export * from "./types";
export {
  TODAY,
  CLIENTS,
  CLIENT_LABELS,
  TAX_RATES,
  CLIENT_CONTACTS,
  LOCATIONS,
  LOCATION_CONTACTS,
  EQUIPMENT,
  EQUIPMENT_FILES,
  EQUIPMENT_LABELS,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_TYPES,
  OWNERSHIP_TYPES,
  WARRANTIES,
  JOBS,
  JOB_SERIES,
  ESTIMATES,
  ESTIMATE_LABELS,
  INVOICES,
  INVOICE_LABELS,
  CREDIT_NOTES,
  CREDIT_NOTE_LABELS,
  VENDORS,
  VENDOR_LABELS,
  BILLS,
  BILL_LABELS,
  PURCHASE_ORDERS,
  PO_LABELS,
  SHIPPING_CARRIERS,
  SHIPPING_METHODS,
  SERVICES,
  LABOR_ITEMS,
  LABOR_LABELS,
  LABOR_SUBTYPES,
  PRODUCT_ITEMS,
  PRODUCT_LABELS,
  PRODUCT_SUBTYPES,
  OTHER_ITEMS,
  OTHER_LABELS,
  OTHER_SUBTYPES,
  DISCOUNT_ITEMS,
  DISCOUNT_LABELS,
  DISCOUNT_SUBTYPES,
  TAX_RATE_ITEMS,
  TAX_RATE_LABELS,
  JOB_LABELS,
  JOB_SOURCES,
  branchOf,
  subStatusesFor,
  isInternalHold,
  JOB_SUB_STATUSES,
  BRANCHES,
  JOB_FORMS,
  COMPANY,
} from "./db";

const index = <T extends { id: string }>(rows: T[]) => new Map(rows.map((row) => [row.id, row]));

/**
 * Unpaid invoice dollars across the client's locations — compared against
 * `creditLimit` for the "credit limit reached" client issue. Production sums
 * the Pending + Sent statuses; in the badge-status model (2026-09-14) those
 * are draft + unsent + outstanding (a derived-Overdue invoice is stored
 * "outstanding", so it counts by construction).
 */
export const outstandingBalanceOf = (clientId: string): number =>
  LOCATIONS.filter((location) => location.clientId === clientId)
    .flatMap((location) => INVOICES.filter((invoice) => invoice.locationId === location.id))
    .filter((invoice) => invoice.status === "draft" || invoice.status === "unsent" || invoice.status === "outstanding")
    .reduce((sum, invoice) => sum + invoice.total, 0);

const CLIENT_BY_ID = index(CLIENTS);
const LOCATION_BY_ID = index(LOCATIONS);
const EQUIPMENT_BY_ID = index(EQUIPMENT);
const JOB_BY_ID = index(JOBS);
const SUB_STATUS_BY_ID = index(JOB_SUB_STATUSES);
const VENDOR_BY_ID = index(VENDORS);

export const clientById = (id: string): Client | undefined => CLIENT_BY_ID.get(id);
export const locationById = (id: string): Location | undefined => LOCATION_BY_ID.get(id);
export const equipmentById = (id: string): Equipment | undefined => EQUIPMENT_BY_ID.get(id);
export const jobById = (id: string): Job | undefined => JOB_BY_ID.get(id);
export const vendorById = (id: string): Vendor | undefined => VENDOR_BY_ID.get(id);

/**
 * A job's SUB-STATUS record, or undefined when it has none — which is the
 * normal case: only a paused or on-hold job can carry one. Production shows
 * this name INSTEAD of the generic status label wherever it exists
 * (`getJobStatusOrSubStatusLabel`).
 */
export const subStatusOf = (job: Job): JobSubStatusRecord | undefined =>
  job.subStatusId == null ? undefined : SUB_STATUS_BY_ID.get(job.subStatusId);

// ---- down the hierarchy ----------------------------------------------------

export const locationsOf = (clientId: string) => LOCATIONS.filter((row) => row.clientId === clientId);
export const clientContactsOf = (clientId: string) => CLIENT_CONTACTS.filter((row) => row.clientId === clientId);
export const locationContactsOf = (locationId: string) => LOCATION_CONTACTS.filter((row) => row.locationId === locationId);
export const equipmentOf = (locationId: string) => EQUIPMENT.filter((row) => row.locationId === locationId);
export const warrantiesOf = (equipmentId: string) => WARRANTIES.filter((row) => row.equipmentId === equipmentId);
/** One warranty by id — what the "Warranty" side panel is opened with. */
export const warrantyById = (id: string): Warranty | undefined => WARRANTIES.find((row) => row.id === id);
export const equipmentFilesOf = (equipmentId: string) => EQUIPMENT_FILES.filter((row) => row.equipmentId === equipmentId);
export const jobsOf = (locationId: string) => JOBS.filter((row) => row.locationId === locationId);
export const estimatesOf = (locationId: string) => ESTIMATES.filter((row) => row.locationId === locationId);
export const invoicesOf = (locationId: string) => INVOICES.filter((row) => row.locationId === locationId);
/** A CLIENT's credit notes — the one table that hangs off the client directly. */
export const creditNotesOf = (clientId: string) => CREDIT_NOTES.filter((row) => row.clientId === clientId);
export const jobSeriesOf = (locationId: string) => JOB_SERIES.filter((row) => row.locationId === locationId);
/** A VENDOR's bills — the accounts-payable side, off the client hierarchy entirely. */
export const billsOf = (vendorId: string) => BILLS.filter((row) => row.vendorId === vendorId);
/** A VENDOR's purchase orders — the buying side of the same relationship. */
export const purchaseOrdersOf = (vendorId: string) => PURCHASE_ORDERS.filter((row) => row.vendorId === vendorId);

// ---- up the hierarchy ------------------------------------------------------

/** The client a location belongs to. Every location has one. */
export const clientOfLocation = (location: Location): Client => CLIENT_BY_ID.get(location.clientId)!;

/** A job's location, and through it its client. */
export const locationOfJob = (job: Job): Location => LOCATION_BY_ID.get(job.locationId)!;
export const clientOfJob = (job: Job): Client => clientOfLocation(locationOfJob(job));
export const locationOfEstimate = (estimate: Estimate): Location => LOCATION_BY_ID.get(estimate.locationId)!;
export const locationOfInvoice = (invoice: Invoice): Location => LOCATION_BY_ID.get(invoice.locationId)!;
/** A credit note's client — direct, no location in between. */
export const clientOfCreditNote = (creditNote: CreditNote): Client => CLIENT_BY_ID.get(creditNote.clientId)!;
export const locationOfSeries = (series: JobSeries): Location => LOCATION_BY_ID.get(series.locationId)!;
/** A bill's vendor — its "Billing Vendor". Every bill has one. */
export const vendorOfBill = (bill: Bill): Vendor => VENDOR_BY_ID.get(bill.vendorId)!;
/** A purchase order's vendor — its "Purchasing Vendor". Every PO has one. */
export const vendorOfPurchaseOrder = (po: PurchaseOrder): Vendor => VENDOR_BY_ID.get(po.vendorId)!;

// ---- shipping (purchase orders) --------------------------------------------

const CARRIER_NAME = new Map(SHIPPING_CARRIERS.map((option) => [option.id, option.name]));
const METHOD_NAME = new Map(SHIPPING_METHODS.map((option) => [option.id, option.name]));

/**
 * A PO's carrier NAME — the preset's label, or the user's custom name when
 * the carrier is "other". Null when unset, and also when an "other" carrier
 * has a blank name (nothing to show — such a row falls under the filter's
 * "No carrier", the settled empty-Other rule).
 */
export const shippingCarrierOf = (po: PurchaseOrder): string | null =>
  po.shippingCarrierId == null
    ? null
    : po.shippingCarrierId === "other"
      ? po.shippingCarrierOtherName?.trim() || null
      : (CARRIER_NAME.get(po.shippingCarrierId) ?? null);

/** A PO's method NAME — the same rules as `shippingCarrierOf`. */
export const shippingMethodOf = (po: PurchaseOrder): string | null =>
  po.shippingMethodId == null
    ? null
    : po.shippingMethodId === "other"
      ? po.shippingMethodOtherName?.trim() || null
      : (METHOD_NAME.get(po.shippingMethodId) ?? null);

/**
 * The combined display string the Shipping COLUMN prints — "FedEx Ground",
 * with either half standing alone when the other is unset — production's
 * `get_shipping_details` ("{carrier} {method}", custom names substituted).
 * Null when neither half is set.
 */
export function shippingOf(po: PurchaseOrder): string | null {
  const parts = [shippingCarrierOf(po), shippingMethodOf(po)].filter((part) => part != null);
  return parts.length === 0 ? null : parts.join(" ");
}

// The Job Details page's per-job prose and timeline (added 2026-09-26).
export { reasonForCall, techInstructions, workSummary, draftSummary, startedAt, completedAt } from "./jobNarrative";

// How each job got to its status, and the time tracked on it (2026-09-26).
export { historyOf, JOB_HISTORY, trackedSecondsByUser } from "./jobHistory";
export type { JobHistory, JobSession, JobTransition } from "./jobHistory";

// What a job cost — labour, parts and fees, derived from the job (2026-09-28).
export { chargesOf, chargesTotal } from "./jobCharges";
export type { Charge, ChargeGroup } from "./jobCharges";

// The files a visit produced (2026-09-28).
export { filesOf } from "./jobFiles";
export type { JobFile, JobFileKind } from "./jobFiles";

// ---- equipment -------------------------------------------------------------

const EQUIPMENT_LABEL_BY_ID = index(EQUIPMENT_LABELS);
const JOB_LABEL_BY_ID = index(JOB_LABELS);

/** An equipment's label records, in the order the equipment stores them. */
/** A job's labels, in the order the job stores them (production `JobLabel`). */
export const jobLabelsOf = (job: Job): JobLabel[] =>
  job.labelIds.map((id) => JOB_LABEL_BY_ID.get(id)).filter((row): row is JobLabel => row != null);

export const equipmentLabelsOf = (equipment: Equipment): EquipmentLabel[] =>
  equipment.labelIds.map((id) => EQUIPMENT_LABEL_BY_ID.get(id)).filter((row): row is EquipmentLabel => row != null);

/**
 * One warranty's state against the demo clock. "upcoming" is a warranty whose
 * start date has not arrived yet; a warranty with NO end date never expires
 * (production leaves `date_end` blank for lease-length coverage).
 */
export type WarrantyState = "active" | "upcoming" | "expired";

export function warrantyStateOf(warranty: Warranty): WarrantyState {
  const today = TODAY.getTime();
  if (new Date(warranty.startDate).getTime() > today) return "upcoming";
  if (warranty.endDate == null) return "active";
  return new Date(warranty.endDate).getTime() < today ? "expired" : "active";
}

/**
 * An equipment's overall warranty coverage — the value the side panel's
 * "Warranty" row shows (Figma 21958-10447):
 *   covered   — every warranty is active or upcoming,
 *   partial   — active/upcoming AND expired ones side by side,
 *   expired   — every warranty has expired,
 *   none      — no warranties logged at all.
 */
export type WarrantyCoverage = "covered" | "partial" | "expired" | "none";

export function warrantyCoverageOf(equipmentId: string): WarrantyCoverage {
  const states = warrantiesOf(equipmentId).map(warrantyStateOf);
  if (states.length === 0) return "none";
  const expired = states.filter((state) => state === "expired").length;
  if (expired === 0) return "covered";
  return expired === states.length ? "expired" : "partial";
}

/**
 * The three object tables that reference an equipment — the History tab's
 * groups, always in this order. Rows still sitting in their FIRST status are
 * left out ("Pending state objects are not shown here"): the db marks exactly
 * those with a null `statusChangedAt`, which is also what the tab sorts on.
 */
export const jobsForEquipment = (equipmentId: string): Job[] => JOBS.filter((row) => row.equipmentIds.includes(equipmentId));

export const estimatesForEquipment = (equipmentId: string): Estimate[] =>
  ESTIMATES.filter((row) => row.equipmentIds?.includes(equipmentId) === true && row.statusChangedAt != null);

export const invoicesForEquipment = (equipmentId: string): Invoice[] =>
  INVOICES.filter((row) => row.equipmentIds?.includes(equipmentId) === true && row.statusChangedAt != null);
