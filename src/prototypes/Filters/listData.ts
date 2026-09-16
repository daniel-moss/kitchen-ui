import { semanticIcons } from "../../styles/semanticIcons";
import {
  CLIENTS as DB_CLIENTS,
  LOCATIONS as DB_LOCATIONS,
  SERVICES as DB_SERVICES,
  TODAY as DB_TODAY,
  Client,
  Location,
  Service,
} from "../../data/db";

// The prototype's SHARED data door — the demo clock, the workspace tables that
// belong to no single object, and the formatters every list prints with.
//
// Split out of `jobsData.ts` on 2026-09-11 (Daniel). Those pieces had lived
// there since the Jobs list was the only list, so the shared modules and the
// Estimates page all reached into a file named "jobs" for them: `filterDefs`
// imported `formatDuration`, `filterTemplates` imported `locationAddress`,
// `estimatesData` imported `dayOffset`. Nothing about any of them is
// jobs-specific — a location's address is a location's address — so they live
// here now and the arrows point at a neutral name.
//
// What STAYS in jobsData / estimatesData is each object's own door: its row
// shape, its rows, its lookups and its object-only tables (job labels, job
// sources, the tech pool).

// ---- what a list HOLDS, in words -------------------------------------------

/**
 * The object a list holds. Every string a shared component prints ABOUT the
 * object comes from here, so a new list type is one constant rather than a
 * copy of a component — the empty states, the Hidden Data Bar and a filter
 * option's count tag all take one.
 */
export interface ObjectNoun {
  /** "job" / "estimate". */
  one: string;
  /** "jobs" / "estimates". */
  many: string;
  /** The object's SidebarNav icon — the No Objects Exist state's own. */
  icon: string;
  /** The No Objects Exist action: "Create job" / "Create estimate". */
  createLabel: string;
}

export const JOB_NOUN: ObjectNoun = {
  one: "job",
  many: "jobs",
  icon: semanticIcons.job,
  createLabel: "Create job",
};

export const ESTIMATE_NOUN: ObjectNoun = {
  one: "estimate",
  many: "estimates",
  icon: semanticIcons.estimate,
  createLabel: "Create estimate",
};

export const INVOICE_NOUN: ObjectNoun = {
  one: "invoice",
  many: "invoices",
  icon: semanticIcons.invoice,
  createLabel: "Create invoice",
};

export const CREDIT_NOTE_NOUN: ObjectNoun = {
  one: "credit note",
  many: "credit notes",
  icon: semanticIcons.creditNote,
  createLabel: "Create credit note",
};

export const BILL_NOUN: ObjectNoun = {
  one: "bill",
  many: "bills",
  icon: semanticIcons.bill,
  createLabel: "Create bill",
};

// "PO" is the design's own word for the object (the page title and the view
// annotations both say "POs"); the create action spells it out, like the
// sidebar item and the Create menu do.
export const PO_NOUN: ObjectNoun = {
  one: "PO",
  many: "POs",
  icon: semanticIcons.purchaseOrder,
  createLabel: "Create purchase order",
};

// "series" is its own plural — "1 series" / "5 series" both read right.
export const SERIES_NOUN: ObjectNoun = {
  one: "series",
  many: "series",
  icon: semanticIcons.series,
  createLabel: "Create series",
};

export const VENDOR_NOUN: ObjectNoun = {
  one: "vendor",
  many: "vendors",
  icon: semanticIcons.vendor,
  createLabel: "Create vendor",
};

export const CLIENT_NOUN: ObjectNoun = {
  one: "client",
  many: "clients",
  icon: semanticIcons.clientGeneric,
  createLabel: "Create client",
};

// "Labor" is the page's name; one row of it is an ITEM (production
// `PriceBookItem`), which is what every count reads best as — "3 labor
// items", never "3 labors".
export const LABOR_NOUN: ObjectNoun = {
  one: "labor item",
  many: "labor items",
  icon: semanticIcons.labor,
  createLabel: "Create labor item",
};

// "Product" is the design's own word for a part (production calls the type
// "Parts & Materials"; the sidebar item, the page title and the Create menu
// all say Product / Products), and one row IS one product — so unlike Labor
// this noun needs no "item" suffix to count right.
export const PRODUCT_NOUN: ObjectNoun = {
  one: "product",
  many: "products",
  icon: semanticIcons.product,
  createLabel: "Create product",
};

// "Other" is the page's NAME, not a noun you can count — "3 others" says
// nothing. One row is an other CHARGE, which is what production calls the
// type ("Other Charge", and "Miscellaneous Charge" in its form's picker), so
// the counts read "3 other charges". The Labor arrangement.
export const OTHER_NOUN: ObjectNoun = {
  one: "other charge",
  many: "other charges",
  icon: semanticIcons.other,
  createLabel: "Create other charge",
};

export const DISCOUNT_NOUN: ObjectNoun = {
  one: "discount",
  many: "discounts",
  icon: semanticIcons.discount,
  createLabel: "Create discount",
};

export const TAX_RATE_NOUN: ObjectNoun = {
  one: "tax rate",
  many: "tax rates",
  icon: semanticIcons.taxRate,
  createLabel: "Create tax rate",
};

/** "1 job" / "13 jobs" — the node's count copy, for any noun. */
export const countOf = (noun: ObjectNoun, count: number) => `${count} ${count === 1 ? noun.one : noun.many}`;

// ---- the clock --------------------------------------------------------------

/** The demo's fixed NOW — the database's clock (see db.ts). NEVER the real one. */
export const TODAY = DB_TODAY;

const DAY_MS = 24 * 60 * 60 * 1000;

// ---- the shared records ----------------------------------------------------
// Re-exported so a prototype module has ONE door to the workspace tables, the
// same way `jobsData` is the door to jobs and `estimatesData` to estimates.
//
// Location gotcha: `unit` ("Suite 200") is filterable through the Address
// filter but never DISPLAYED in a table — the Address column draws "street,
// city, state postal" without it, so `locationAddress` leaves it out. The
// Location FILTER's rows do show it (see `filterTemplates`).

export type ServiceRecord = Service;
export type ClientRecord = Client;
export type LocationRecord = Location;

export const SERVICES = DB_SERVICES;
export const CLIENTS = DB_CLIENTS;
export const LOCATIONS = DB_LOCATIONS;

/**
 * The address in US order, with ONLY the parts that exist:
 * "418 Mission St, San Francisco, CA 94105".
 *
 * State and postal code are ONE unit joined by a space ("CA 94105"), so dropping
 * either leaves the other reading correctly instead of stranding a comma. Empty
 * when the location has no address at all.
 */
export function locationAddress(location: LocationRecord): string {
  const region = [location.state, location.postalCode].filter((part) => part != null).join(" ");
  return [location.street, location.city, region === "" ? null : region].filter((part) => part != null).join(", ");
}

// ---- display formatting ----------------------------------------------------
// Everything a list prints is derived here, so two lists cannot spell the same
// value two ways.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Aug 12, 2026" — month FIRST, the US order (Daniel, 2026-09-04; was
 *  "12 Aug"), and the year ALWAYS shown (Daniel, 2026-09-15: "the year
 *  should always be shown" — the old hide-the-current-year rule is removed
 *  product-wide; the DS DateField and DatePicker dropped it earlier, and
 *  before this the tables showed no year at all, even on last year's
 *  dates). */
export function formatDay(iso: string | null): string {
  if (iso == null) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "9:00 AM" — the time half of `formatDateTime`, US 12-hour. */
export function formatTime(iso: string | null): string {
  if (iso == null) return "";
  const d = new Date(iso);
  const hours = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  const period = d.getHours() < 12 ? "AM" : "PM";
  return `${hours}:${mm} ${period}`;
}

/**
 * "Aug 12, 2026, 9:00 AM" — US 12-hour time, date and time joined by a COMMA
 * (Daniel, 2026-09-04, after the separator research: a date with its time is
 * one compound value, which style guides join with a comma or "at", never a
 * symbol). The year rides along since 2026-09-15 (formatDay's rule). Was
 * "12 Aug • 9:00 AM", and 24-hour "12 Aug • 09:00" before that. FLAGGED: the
 * production DateTimeCell still prints the bullet — the two differ on
 * purpose, pending the product-wide separator decision.
 *
 * Since 2026-09-15 this is EVERY timestamp column's format (Daniel: "I like
 * Date+Time. Let's use it everywhere") — Last modified and Status changed on
 * every list, and any date column whose FIELD carries a time (production
 * draws those as DateTimeCells). A DATE-only field (the bills' three dates,
 * the POs' Issued and Est. arrival) keeps `formatDay` — there is no time to
 * show, and printing a fake midnight would be worse than none.
 */
export function formatDateTime(iso: string | null): string {
  if (iso == null) return "";
  return `${formatDay(iso)}, ${formatTime(iso)}`;
}

/**
 * "$1,250.00" — US currency with cents, like production's Total column
 * (NumericalDataCell type="currency"). Moved here from estimatesData on
 * 2026-09-14: the Invoices list prints money too. (The money FILTER's
 * `formatMoney` — "$1,000", no cents — stays in filterDefs on purpose: a
 * column of money is read down, a chip's value alone.)
 */
export function formatCurrency(dollars: number): string {
  // A NEGATIVE amount gets the true MINUS SIGN (U+2212), not the hyphen the
  // formatter emits (Daniel, 2026-09-16: "I actually wanted to use the minus
  // character. I think this is the most correct one"). Inter carries it, so
  // there is no font fallback, and it is the right glyph in a right-aligned
  // money column: 0.662em against the digit's 0.631em, where the hyphen is
  // only 0.460em and sits lower. The Discounts list is what shows it —
  // production stores a discount negative, and that column reports the stored
  // value. Its FILTER carries no minus at all, on purpose (see
  // DISCOUNT_PRESETS).
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD" }).replace(/^-/, "−");
}

/**
 * "Same Day" / "Net 30" — production's PaymentTermsCell formatting for a
 * vendor's net-days integer; empty for a vendor with no terms. The columns
 * and the filters' option labels all read this, so they can never disagree.
 * MOVED here from posData on 2026-09-15, when the Vendors list became its
 * second reader (the formatCurrency precedent).
 */
export function formatPaymentTerms(terms: number | null): string {
  if (terms == null) return "";
  return terms === 0 ? "Same Day" : `Net ${terms}`;
}

/** "2h 30m" / "45m" / "3h" */
export function formatDuration(minutes: number | null): string {
  if (minutes == null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Whole days from TODAY to the given date (negative = in the past). */
export function dayOffset(iso: string): number {
  const d = new Date(iso);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()).getTime();
  return Math.round((a - b) / DAY_MS);
}
