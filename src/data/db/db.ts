import {
  Bill,
  BillLabel,
  Client,
  ClientContact,
  ClientLabel,
  TaxRate,
  CreditNote,
  CreditNoteLabel,
  Equipment,
  Estimate,
  EstimateLabel,
  Invoice,
  InvoiceLabel,
  Job,
  JobSeries,
  Branch,
  CompanySettings,
  JobForm,
  JobLabel,
  JobSubStatusRecord,
  JobSource,
  ChargeItem,
  LaborItem,
  PricebookLabel,
  PricebookSubtype,
  ProductItem,
  TaxRateItem,
  Location,
  LocationContact,
  POLabel,
  PurchaseOrder,
  ShippingOption,
  Service,
  Vendor,
  VendorLabel,
  Warranty,
} from "./types";

// The demo database's DATA — one simulated service company's world. Started
// 2026-09-04; see types.ts for the schema and the rules.
//
// The WORLD is the Filters prototype's, extended: the same 8 clients and 11
// locations (same ids). Since 2026-09-11 the database is THE source for the
// list prototypes too (Daniel: "I want each prototype and design in Storybook
// to take data from the db") — the Filters pages' job and estimate tables
// live HERE now, not as per-prototype generated copies.
//
// Deliberate gaps (for empty states): ferry-main and presidio-canteen have no
// location name, northpoint-banquet no address, some equipment misses its
// manufacturer/model/serial, some has no warranty, Presidio Canteen is a
// deactivated client.

// ---- the clock -------------------------------------------------------------

/**
 * The moment every date in this file was WRITTEN against — the one the curated
 * stories imply (JOB-1201 is active on its 8:00 visit that morning).
 *
 * It is not "today" any more. Daniel, 2026-09-12: "'Today' should be the actual
 * today. Otherwise, it's confusing" — he opened a Custom dialog, saw the
 * calendar circling a date eight days behind the real one, and could not square
 * it with what the presets were listing.
 */
const ANCHOR = new Date("2026-09-04T09:00:00");

const DAY_MS = 24 * 60 * 60 * 1000;
const midnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Whole days from the anchor to the real today. The WHOLE demo slides by this
 * on load, so every row keeps its place in the story — a job scheduled "the day
 * after tomorrow" stays the day after tomorrow, for good — while "today" is
 * always the real today.
 *
 * Whole DAYS, not weeks: the shift moves weekdays around (a Friday visit can
 * land on a Sunday), which this data can take — its scheduled dates already
 * fall on every day of the week. If the demo ever needs working days, shift by
 * a multiple of 7 instead and accept that "today" drifts by up to three days.
 */
const SHIFT_DAYS = Math.round((midnight(new Date()) - midnight(ANCHOR)) / DAY_MS);

/** The demo's NOW: the real today, at the anchor's hour. */
export const TODAY = new Date(midnight(new Date()) + (ANCHOR.getTime() - midnight(ANCHOR)));

const LOCAL_ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/;
const pad = (n: number) => String(n).padStart(2, "0");

/** One stored date, moved onto the real calendar. Local time, never UTC. */
function shiftIso(iso: string): string {
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  date.setDate(date.getDate() + SHIFT_DAYS);
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return iso.length === 10 ? day : `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Every ISO string inside a record, shifted. Ids and names are untouched —
 * nothing else in this file has the shape of a date.
 */
function shiftDates<T>(value: T): T {
  if (typeof value === "string") return (LOCAL_ISO.test(value) ? shiftIso(value) : value) as T;
  if (Array.isArray(value)) return value.map(shiftDates) as T;
  if (value != null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shiftDates(item)])) as T;
  }
  return value;
}

// INVENTED like the other lists' label tables (production
// `ExternalClientLabel` is company-written, so there was nothing to copy) —
// FLAGGED. The legacy detail card marks them "(Only Visible to You)". The
// ids replace the free-form `labels` strings the clients carried until
// 2026-09-16.
export const CLIENT_LABELS: ClientLabel[] = [
  { id: "key-account", name: "Key account" },
  { id: "preventive-plan", name: "Preventive plan" },
  { id: "new-client", name: "New client" },
  { id: "tax-exempt", name: "Tax exempt" },
];

// The workspace's tax rates (production: PriceBook items of the tax type; a
// client's default tax rate points at one). INVENTED — the demo needed a
// small realistic set. "Tax exempt" is a real 0% rate, not an absence: the
// absence is a client with NO default at all.
export const TAX_RATES: TaxRate[] = [
  { id: "sf-sales", name: "SF sales tax", rate: 8.63 },
  { id: "oakland-sales", name: "Oakland sales tax", rate: 10.25 },
  { id: "ca-sales", name: "CA sales tax", rate: 7.25 },
  { id: "tax-exempt", name: "Tax exempt", rate: 0 },
];

// Extended 2026-09-16 for the Clients list: industry on every business, the
// money trio (creditLimit / creditBalance; the outstanding balance is DERIVED
// from invoices), the three defaults (estimate expiration, payment terms, tax
// rate), the billing routing, and the two dates — plus six NEW clients (four
// active, two inactive) so both phases and every filter have something to
// answer with. Dates are written against the ANCHOR and shifted on load.
const CLIENTS_AT_ANCHOR: Client[] = [
  {
    id: "wildwood",
    name: "Wildwood Kitchen",
    clientType: "Business",
    industryType: "Commercial",
    labelIds: ["key-account", "preventive-plan"],
    creditLimit: 25000,
    creditBalance: 0,
    billingStreet: "418 Mission St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94105",
    defaultEstimateNet: 30,
    defaultInvoiceNet: 30,
    defaultTaxRateId: "sf-sales",
    notes: "Three sites. Airport site requires a security badge — allow 20 extra minutes.",
    primaryContactId: "cc-wildwood-1",
    isActive: true,
    createdAt: "2023-02-08T10:00:00",
    lastModifiedAt: "2026-09-02T15:40:00",
  },
  {
    id: "harbour",
    name: "Harbour Grill",
    clientType: "Business",
    industryType: "Commercial",
    labelIds: ["preventive-plan"],
    creditBalance: 0,
    billingStreet: "1201 Beach St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94109",
    defaultEstimateNet: 14,
    defaultInvoiceNet: 15,
    defaultTaxRateId: "sf-sales",
    primaryContactId: "cc-harbour-1",
    isActive: true,
    createdAt: "2023-09-21T11:30:00",
    lastModifiedAt: "2026-08-30T10:15:00",
  },
  {
    id: "bayside",
    name: "Bayside Catering",
    clientType: "Business",
    industryType: "Industrial",
    labelIds: [],
    // Over its limit on purpose (see INV-3103/3107) — the "credit limit
    // reached" client issue in the "New Job" form, and the list's red
    // Outstanding balance row.
    creditLimit: 10000,
    creditBalance: 0,
    billingStreet: "77 Industrial Way",
    billingCity: "Oakland",
    billingState: "CA",
    billingPostalCode: "94601",
    defaultInvoiceNet: 45,
    defaultTaxRateId: "oakland-sales",
    notes: "Commissary kitchen — service windows before 6 AM only.",
    primaryContactId: "cc-bayside-1",
    isActive: true,
    createdAt: "2024-05-06T09:20:00",
    lastModifiedAt: "2026-09-01T14:00:00",
  },
  {
    id: "ferry",
    name: "Ferry Building Deli",
    clientType: "Individual",
    // No industry on purpose — the filter's "No industry" row (the field is
    // optional in production).
    labelIds: [],
    creditBalance: 0,
    billingStreet: "1 Ferry Building",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94111",
    // Bills to the client itself — the filter's "Same client" row.
    defaultBillingIntention: "client",
    defaultEstimateNet: 7,
    defaultInvoiceNet: 0,
    defaultTaxRateId: "sf-sales",
    primaryContactId: "cc-ferry-1",
    isActive: true,
    createdAt: "2025-03-17T13:45:00",
    lastModifiedAt: "2026-08-12T09:30:00",
  },
  {
    id: "mission",
    name: "Mission Taqueria",
    clientType: "Business",
    industryType: "Commercial",
    labelIds: ["new-client"],
    creditBalance: 0,
    // No billing address on purpose — the "billing address is missing"
    // client issue in the "New Job" form. And no defaults at all: every
    // "No default" row has this client to show.
    isActive: true,
    createdAt: "2026-08-20T16:10:00",
    lastModifiedAt: "2026-08-28T11:05:00",
  },
  {
    id: "northpoint",
    name: "North Point Hotel",
    clientType: "Business",
    industryType: "Commercial",
    labelIds: ["key-account"],
    creditLimit: 50000,
    // The one meaningful credit balance — roughly the hotel's issued,
    // unallocated credit notes (see CREDIT_NOTES).
    creditBalance: 1200,
    billingRecipient: "Accounts Payable",
    // The hotel pays centrally for both kitchens.
    defaultBillingIntention: "client",
    billingStreet: "555 North Point St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94133",
    defaultEstimateNet: 30,
    defaultInvoiceNet: 60,
    defaultTaxRateId: "sf-sales",
    primaryContactId: "cc-northpoint-1",
    isActive: true,
    createdAt: "2022-11-14T10:00:00",
    lastModifiedAt: "2026-09-03T16:20:00",
  },
  {
    id: "sunset",
    name: "Sunset Bakery",
    clientType: "Business",
    industryType: "Commercial",
    labelIds: [],
    creditBalance: 0,
    billingStreet: "1750 Judah St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94122",
    defaultEstimateNet: 14,
    defaultInvoiceNet: 30,
    defaultTaxRateId: "sf-sales",
    isActive: true,
    createdAt: "2024-10-02T09:00:00",
    lastModifiedAt: "2026-07-29T10:45:00",
  },
  // Run by North Point's owner and billed centrally through the hotel — the
  // "Bills to a DIFFERENT client" story.
  {
    id: "gateway",
    name: "Gateway Conference Center",
    clientType: "Business",
    industryType: "Commercial",
    labelIds: ["key-account"],
    creditLimit: 15000,
    creditBalance: 500,
    billingStreet: "88 Howard St",
    billingUnit: "Suite 210",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94105",
    defaultBillingIntention: "differentClient",
    defaultBillingClientId: "northpoint",
    defaultEstimateNet: 30,
    defaultInvoiceNet: 30,
    defaultTaxRateId: "sf-sales",
    isActive: true,
    createdAt: "2024-01-25T11:00:00",
    lastModifiedAt: "2026-08-25T15:30:00",
  },
  // City-operated — the GOVERNMENT industry with the tax-exempt rate.
  {
    id: "civic",
    name: "Civic Center Grill",
    clientType: "Business",
    industryType: "Government",
    labelIds: ["tax-exempt"],
    creditBalance: 0,
    billingStreet: "301 Van Ness Ave",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94102",
    defaultInvoiceNet: 45,
    defaultTaxRateId: "tax-exempt",
    isActive: true,
    createdAt: "2025-07-09T10:20:00",
    lastModifiedAt: "2026-08-18T14:40:00",
  },
  {
    id: "anchorline",
    name: "Anchor Line Seafood Co.",
    clientType: "Business",
    industryType: "Industrial",
    labelIds: ["preventive-plan"],
    creditLimit: 5000,
    creditBalance: 250,
    billingStreet: "955 Embarcadero West",
    billingCity: "Oakland",
    billingState: "CA",
    billingPostalCode: "94607",
    defaultEstimateNet: 14,
    defaultInvoiceNet: 15,
    defaultTaxRateId: "oakland-sales",
    isActive: true,
    createdAt: "2025-11-03T08:50:00",
    lastModifiedAt: "2026-09-04T08:30:00",
  },
  // An INDIVIDUAL with NO service location yet (a food truck) — the Locations
  // filter's "None" row, and the second "No industry" client. Created and
  // never edited, so the two dates agree.
  {
    id: "marisol",
    name: "Marisol's Kitchen Truck",
    clientType: "Individual",
    labelIds: ["new-client"],
    creditBalance: 0,
    billingStreet: "3350 20th St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94110",
    defaultEstimateNet: 7,
    defaultInvoiceNet: 0,
    defaultTaxRateId: "ca-sales",
    isActive: true,
    createdAt: "2026-08-30T12:00:00",
    lastModifiedAt: "2026-08-30T12:00:00",
  },
  {
    // Deactivated — kept for history (production keeps them too).
    id: "presidio",
    name: "Presidio Canteen",
    clientType: "Business",
    industryType: "Government",
    labelIds: ["tax-exempt"],
    creditBalance: 0,
    defaultInvoiceNet: 30,
    defaultTaxRateId: "tax-exempt",
    isActive: false,
    createdAt: "2022-06-08T10:30:00",
    lastModifiedAt: "2026-05-14T13:00:00",
  },
  // Closed in the spring; its unpaid history stays readable.
  {
    id: "redwood",
    name: "Redwood Room Steakhouse",
    clientType: "Business",
    industryType: "Commercial",
    labelIds: [],
    creditLimit: 7500,
    creditBalance: 0,
    billingStreet: "495 Geary St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94102",
    defaultEstimateNet: 14,
    defaultInvoiceNet: 30,
    defaultTaxRateId: "sf-sales",
    isActive: false,
    createdAt: "2023-05-16T10:00:00",
    lastModifiedAt: "2026-03-10T09:15:00",
  },
  // Deactivated with NOTHING configured — the all-empty row on every
  // "default" column.
  {
    id: "lighthouse",
    name: "Lighthouse Cannery Kitchen",
    clientType: "Business",
    industryType: "Industrial",
    labelIds: [],
    creditBalance: 0,
    billingStreet: "2801 Taylor St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94133",
    isActive: false,
    createdAt: "2022-08-19T14:00:00",
    lastModifiedAt: "2025-12-02T10:00:00",
  },
];

export const CLIENT_CONTACTS: ClientContact[] = [
  { id: "cc-wildwood-1", clientId: "wildwood", name: "Kate Sherman", position: "Operations Director", phone: "(415) 555-0198", email: "kate@wildwoodkitchen.com", avatar: "avatars/user-10.jpg" },
  // No phone — the Send-summary form needs a contact missing a channel.
  { id: "cc-wildwood-2", clientId: "wildwood", name: "Marcus Boyd", position: "Accounts Payable", email: "ap@wildwoodkitchen.com", avatar: "avatars/user-14.jpg" },
  { id: "cc-wildwood-3", clientId: "wildwood", name: "Dana Whitfield", position: "Office Manager", phone: "(415) 555-0156", email: "dana@wildwoodkitchen.com", avatar: "avatars/user-11.jpg" },
  { id: "cc-harbour-1", clientId: "harbour", name: "Elaine Fox", position: "Owner", phone: "(415) 555-0142", email: "elaine@harbourgrill.com", avatar: "avatars/user-13.jpg" },
  { id: "cc-bayside-1", clientId: "bayside", name: "Tom Okafor", position: "Facility Manager", phone: "(510) 555-0173", phoneExtension: "204", email: "t.okafor@baysidecatering.com", avatar: "avatars/user-18.jpg" },
  { id: "cc-ferry-1", clientId: "ferry", name: "Dana Liu", phone: "(415) 555-0117" },
  { id: "cc-northpoint-1", clientId: "northpoint", name: "Victor Ames", position: "Chief Engineer", phone: "(415) 555-0186", email: "vames@northpointhotel.com", avatar: "avatars/user-19.jpg" },
  { id: "cc-northpoint-2", clientId: "northpoint", name: "Priya Nair", position: "Purchasing", email: "purchasing@northpointhotel.com", avatar: "avatars/user-17.jpg" },
];

export const LOCATIONS: Location[] = [
  { id: "wildwood-downtown", clientId: "wildwood", name: "Downtown", street: "418 Mission St", unit: "Suite 200", city: "San Francisco", state: "CA", postalCode: "94105", primaryContactId: "lc-wildwood-downtown-1" },
  // The third Wildwood site (2026-09-16, with the Clients list) — no jobs of
  // its own yet; it exists so one client counts 3 locations.
  { id: "wildwood-marina", clientId: "wildwood", name: "Marina", street: "3300 Laguna St", city: "San Francisco", state: "CA", postalCode: "94123" },
  // The Airport site is run by Bayside Catering under contract — its billing
  // defaults to them ("New Job" auto-populates "Bill to different client",
  // and Bayside is over its credit limit, so the warning shows immediately).
  { id: "wildwood-airport", clientId: "wildwood", name: "Airport", street: "780 McDonnell Rd", unit: "Terminal 2", city: "San Francisco", state: "CA", postalCode: "94128", defaultBillingIntention: "differentClient", defaultBillingClientId: "bayside", notes: "Badge required. Check in at the T2 service dock.", primaryContactId: "lc-wildwood-airport-1" },
  { id: "harbour-pier", clientId: "harbour", name: "Pier 39", street: "1201 Beach St", city: "San Francisco", state: "CA", postalCode: "94109", primaryContactId: "lc-harbour-pier-1" },
  { id: "harbour-marina", clientId: "harbour", name: "Marina", street: "2100 Chestnut St", unit: "Unit B", city: "San Francisco", state: "CA", postalCode: "94123" },
  { id: "bayside-commissary", clientId: "bayside", name: "Commissary", street: "77 Industrial Way", city: "Oakland", state: "CA", postalCode: "94601", primaryContactId: "lc-bayside-commissary-1" },
  // One site, so no name of its own — the address IS the name.
  { id: "ferry-main", clientId: "ferry", street: "1 Ferry Building", unit: "Shop 12", city: "San Francisco", state: "CA", postalCode: "94111" },
  { id: "mission-24th", clientId: "mission", name: "24th St", street: "2840 24th St", city: "San Francisco", state: "CA", postalCode: "94110" },
  { id: "northpoint-hotel", clientId: "northpoint", name: "Main kitchen", street: "555 North Point St", city: "San Francisco", state: "CA", postalCode: "94133", primaryContactId: "lc-northpoint-hotel-1" },
  // Shares the hotel's building — same street, its own floor note in `unit`.
  { id: "northpoint-banquet", clientId: "northpoint", name: "Banquet", street: "555 North Point St", unit: "2nd floor", city: "San Francisco", state: "CA", postalCode: "94133" },
  { id: "sunset-judah", clientId: "sunset", name: "Judah St", street: "1750 Judah St", city: "San Francisco", state: "CA", postalCode: "94122" },
  // No name — the address stands for it (the deactivated client's old site).
  { id: "presidio-canteen", clientId: "presidio", street: "50 Moraga Ave", city: "San Francisco", state: "CA", postalCode: "94129" },
  // The 2026-09-16 clients' sites — one each; Marisol's Kitchen Truck has
  // NONE on purpose (the Locations filter's "None" row).
  { id: "gateway-center", clientId: "gateway", name: "Conference kitchen", street: "88 Howard St", city: "San Francisco", state: "CA", postalCode: "94105" },
  { id: "civic-grill", clientId: "civic", street: "301 Van Ness Ave", city: "San Francisco", state: "CA", postalCode: "94102" },
  { id: "anchorline-plant", clientId: "anchorline", name: "Processing plant", street: "955 Embarcadero West", city: "Oakland", state: "CA", postalCode: "94607" },
  { id: "redwood-geary", clientId: "redwood", street: "495 Geary St", city: "San Francisco", state: "CA", postalCode: "94102" },
  { id: "lighthouse-cannery", clientId: "lighthouse", street: "2801 Taylor St", city: "San Francisco", state: "CA", postalCode: "94133" },
];

export const LOCATION_CONTACTS: LocationContact[] = [
  { id: "lc-wildwood-downtown-1", locationId: "wildwood-downtown", name: "Ben Castillo", position: "Kitchen Manager", phone: "(415) 555-0121", email: "ben@wildwoodkitchen.com", avatar: "avatars/user-16.jpg" },
  // No e-mail — the Send-summary form needs a contact missing a channel.
  { id: "lc-wildwood-downtown-2", locationId: "wildwood-downtown", name: "Rosa Klein", position: "Sous Chef", phone: "(415) 555-0175", avatar: "avatars/user-12.jpg" },
  { id: "lc-wildwood-downtown-3", locationId: "wildwood-downtown", name: "Miguel Santos", position: "Line Cook", phone: "(415) 555-0187", email: "miguel.santos@wildwoodkitchen.com", avatar: "avatars/user-15.jpg" },
  { id: "lc-wildwood-airport-1", locationId: "wildwood-airport", name: "Omar Haddad", position: "Site Lead", phone: "(650) 555-0139", email: "omar@wildwoodkitchen.com" },
  { id: "lc-harbour-pier-1", locationId: "harbour-pier", name: "Jimmy Tran", position: "Head Chef", phone: "(415) 555-0163" },
  { id: "lc-bayside-commissary-1", locationId: "bayside-commissary", name: "Grace Palmer", position: "Night Supervisor", phone: "(510) 555-0128", phoneExtension: "12" },
  { id: "lc-northpoint-hotel-1", locationId: "northpoint-hotel", name: "Stefan Iversen", position: "Executive Chef", email: "s.iversen@northpointhotel.com" },
];

const EQUIPMENT_AT_ANCHOR: Equipment[] = [
  { id: "eq-wd-walkin", locationId: "wildwood-downtown", displayName: "Walk-in Cooler", category: "Refrigeration", manufacturer: "True Manufacturing", modelNumber: "TWT-48", serialNumber: "TM-88412", physicalLocation: "Back kitchen", installationDate: "2022-03-14", ownership: "Owned" },
  { id: "eq-wd-range", locationId: "wildwood-downtown", displayName: "6-Burner Range", category: "Ovens and Ranges", manufacturer: "Vulcan", modelNumber: "V60F", serialNumber: "VU-20441", physicalLocation: "Hot line", installationDate: "2021-08-02", ownership: "Owned" },
  // No manufacturer / model / serial — created in a hurry from the field.
  { id: "eq-wd-mixer", locationId: "wildwood-downtown", displayName: "Dough Mixer", category: "Food Preparation Equipment", ownership: "Unknown" },
  { id: "eq-wd-griddle", locationId: "wildwood-downtown", displayName: "Griddle", category: "Cooking Equipment", manufacturer: "American Range", modelNumber: "GR-2436", serialNumber: "AR-55102", physicalLocation: "Cook line", installationDate: "2024-03-12", ownership: "Owned" },
  { id: "eq-wd-reachin", locationId: "wildwood-downtown", displayName: "Reach-in Freezer", category: "Refrigeration", manufacturer: "True Manufacturing", modelNumber: "T-23F-2", serialNumber: "TM-88213", physicalLocation: "Storage room", installationDate: "2021-11-02", ownership: "Owned" },
  { id: "eq-wa-fryer1", locationId: "wildwood-airport", displayName: "Fryer #1", category: "Fryers", manufacturer: "Frymaster", modelNumber: "FPP345", serialNumber: "FM-90210", physicalLocation: "Fry station", installationDate: "2023-01-19", ownership: "Leased" },
  { id: "eq-wa-fryer2", locationId: "wildwood-airport", displayName: "Fryer #2", category: "Fryers", manufacturer: "Frymaster", modelNumber: "FPP345", serialNumber: "FM-90211", physicalLocation: "Fry station", installationDate: "2023-01-19", ownership: "Leased" },
  { id: "eq-hp-ice", locationId: "harbour-pier", displayName: "Ice Machine", category: "Ice Machines", manufacturer: "Hoshizaki", modelNumber: "KM-660", serialNumber: "HZ-33172", physicalLocation: "Bar", installationDate: "2020-06-30", ownership: "Owned" },
  { id: "eq-hp-dish", locationId: "harbour-pier", displayName: "Dishwasher", category: "Dishwashing Equipment", manufacturer: "Hobart", modelNumber: "AM16", serialNumber: "HB-55201", physicalLocation: "Dish pit", installationDate: "2019-11-12", ownership: "Owned" },
  { id: "eq-bc-oven", locationId: "bayside-commissary", displayName: "Combi Oven", category: "Ovens and Ranges", manufacturer: "Rational", modelNumber: "iCombi Pro 10", serialNumber: "RA-71034", physicalLocation: "Line 2", installationDate: "2024-02-27", ownership: "Rented" },
  { id: "eq-np-walkin", locationId: "northpoint-hotel", displayName: "Walk-in Freezer", category: "Refrigeration", manufacturer: "Kolpak", modelNumber: "QS7-0810-FT", serialNumber: "KP-10986", physicalLocation: "Basement", installationDate: "2018-04-09", ownership: "Owned", notes: "Door gasket replaced twice; check on every visit." },
  { id: "eq-np-espresso", locationId: "northpoint-hotel", displayName: "Espresso Machine", category: "Beverage Equipment", manufacturer: "La Marzocco", modelNumber: "Linea PB", serialNumber: "LM-44520", physicalLocation: "Lobby bar", installationDate: "2023-09-05", ownership: "Owned" },
  { id: "eq-sj-proofer", locationId: "sunset-judah", displayName: "Proofer Cabinet", category: "Holding and Warming Equipment", manufacturer: "Metro", serialNumber: "MT-61077", physicalLocation: "Bakery back room", ownership: "Owned" },
];

const WARRANTIES_AT_ANCHOR: Warranty[] = [
  // Two warranties on one piece — parts and labor run on different clocks.
  { id: "w-wd-walkin-parts", equipmentId: "eq-wd-walkin", name: "Manufacturer parts", startDate: "2022-03-14", endDate: "2027-03-14", details: "Compressor and evaporator covered. Claims via True dealer portal." },
  { id: "w-wd-walkin-labor", equipmentId: "eq-wd-walkin", name: "Installer labor", startDate: "2022-03-14", endDate: "2024-03-14" },
  { id: "w-wd-range", equipmentId: "eq-wd-range", name: "Manufacturer parts", startDate: "2021-08-02", endDate: "2023-08-02" },
  { id: "w-wa-fryer1", equipmentId: "eq-wa-fryer1", name: "Lease coverage", startDate: "2023-01-19", details: "Covered for the life of the lease." },
  { id: "w-wa-fryer2", equipmentId: "eq-wa-fryer2", name: "Lease coverage", startDate: "2023-01-19", details: "Covered for the life of the lease." },
  { id: "w-bc-oven", equipmentId: "eq-bc-oven", name: "Rental full coverage", startDate: "2024-02-27" },
  { id: "w-np-espresso", equipmentId: "eq-np-espresso", name: "Extended parts + labor", startDate: "2023-09-05", endDate: "2026-09-05", details: "Purchased extension; excludes grinder burrs." },
  { id: "w-wd-reachin", equipmentId: "eq-wd-reachin", name: "Manufacturer parts", startDate: "2021-11-02", endDate: "2026-11-02" },
];

const JOBS_AT_ANCHOR: Job[] = [
  {
    id: "JOB-1201",
    locationId: "wildwood-downtown",
    serviceId: "walk-in-cooler",
    serviceName: "Walk-in cooler repair",
    status: "active",
    priority: 1,
    scheduledFor: "2026-09-04T08:00:00",
    durationMinutes: 120,
    assigneeIds: [1],
    // Both refrigeration pieces — the Job Details prototype opens on this job
    // and its demo shows two equipment modules.
    equipmentIds: ["eq-wd-walkin", "eq-wd-reachin"],
    labelIds: ["refrigeration"],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-09-01T08:30:00",
    statusChangedAt: "2026-09-04T08:05:00",
    lastModifiedAt: "2026-09-04T08:05:00",
    // The reporter is a saved location contact's details, copied onto the job
    // (production denormalizes exactly like this).
    reporter: { name: "Ben Castillo", phone: "(415) 555-0121", email: "ben@wildwoodkitchen.com", isEphemeral: false },
    notes: "Not holding temperature overnight. Check the door gasket first.",
  },
  {
    id: "JOB-1202",
    locationId: "wildwood-airport",
    serviceId: "fryer-service",
    serviceName: "Fryer preventive maintenance",
    status: "upcoming",
    priority: 3,
    scheduledFor: "2026-09-09T06:30:00",
    durationMinutes: 180,
    assigneeIds: [4, 7],
    equipmentIds: ["eq-wa-fryer1", "eq-wa-fryer2"],
    labelIds: ["recurring"],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-08-28T10:15:00",
    statusChangedAt: "2026-08-29T09:00:00",
    lastModifiedAt: "2026-08-29T09:00:00",
  },
  {
    // The job's OWN contact: a night porter who is nobody's saved contact —
    // `isEphemeral` keeps him off the location's contact list.
    id: "JOB-1203",
    locationId: "northpoint-hotel",
    serviceId: "freezer-seal",
    serviceName: "Walk-in freezer door repair",
    status: "pastDue",
    priority: 2,
    scheduledFor: "2026-08-28T22:00:00",
    durationMinutes: 90,
    assigneeIds: [5],
    equipmentIds: ["eq-np-walkin"],
    labelIds: ["refrigeration", "priority-client"],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-08-26T23:30:00",
    statusChangedAt: null,
    lastModifiedAt: "2026-08-29T00:00:00",
    reporter: { name: "Night porter (Karl)", phone: "(415) 555-0111", isEphemeral: true },
    pointOfContact: { name: "Stefan Iversen", email: "s.iversen@northpointhotel.com", isEphemeral: false },
  },
  {
    id: "JOB-1204",
    locationId: "harbour-pier",
    serviceId: "ice-machine",
    serviceName: "Ice machine descale",
    status: "completed",
    priority: 4,
    scheduledFor: "2026-08-20T07:00:00",
    durationMinutes: 60,
    assigneeIds: [2],
    equipmentIds: ["eq-hp-ice"],
    labelIds: ["quarterly"],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-08-14T09:45:00",
    // Completed on the visit; invoiced the next day (INV-3101, Aug 21).
    statusChangedAt: "2026-08-20T08:10:00",
    lastModifiedAt: "2026-08-21T09:00:00",
  },
  {
    id: "JOB-1205",
    locationId: "harbour-pier",
    serviceId: "dishwasher",
    serviceName: "Dishwasher rinse-aid line replacement",
    status: "unscheduled",
    durationMinutes: 180,
    assigneeIds: [],
    equipmentIds: ["eq-hp-dish"],
    labelIds: [],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-08-31T12:00:00",
    statusChangedAt: null,
    lastModifiedAt: "2026-08-31T12:00:00",
  },
  {
    id: "JOB-1206",
    locationId: "bayside-commissary",
    serviceId: "combi-oven",
    serviceName: "Combi oven quarterly service",
    status: "upcoming",
    priority: 3,
    scheduledFor: "2026-09-12T05:00:00",
    durationMinutes: 150,
    assigneeIds: [3, 9],
    equipmentIds: ["eq-bc-oven"],
    labelIds: ["contract", "quarterly"],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-08-27T07:30:00",
    statusChangedAt: "2026-08-28T08:00:00",
    lastModifiedAt: "2026-08-28T08:00:00",
    notes: "Before 6 AM only (client rule).",
  },
  {
    id: "JOB-1207",
    locationId: "mission-24th",
    serviceId: "hood-cleaning",
    serviceName: "Hood cleaning estimate visit",
    status: "draft",
    assigneeIds: [],
    equipmentIds: [],
    labelIds: [],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-09-02T16:20:00",
    statusChangedAt: null,
    lastModifiedAt: "2026-09-03T10:00:00",
    // A brand-new client: the whole contact exists only on this job so far.
    reporter: { name: "Luz Herrera", phone: "(415) 555-0129", isEphemeral: true },
  },
  {
    id: "JOB-1208",
    locationId: "sunset-judah",
    serviceId: "steam-table",
    serviceName: "Proofer thermostat replacement",
    status: "onHoldExternal",
    subStatusId: "sub-parts",
    priority: 2,
    scheduledFor: "2026-08-26T09:00:00",
    durationMinutes: 60,
    assigneeIds: [8],
    equipmentIds: ["eq-sj-proofer"],
    labelIds: [],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-08-21T09:10:00",
    statusChangedAt: "2026-08-26T10:30:00",
    lastModifiedAt: "2026-08-26T10:30:00",
    notes: "Waiting on the part (Metro, ETA unknown).",
  },
  {
    id: "JOB-1209",
    locationId: "wildwood-downtown",
    serviceId: "range-burner",
    serviceName: "Range pilot relight",
    status: "finalized",
    scheduledFor: "2026-07-30T10:00:00",
    durationMinutes: 45,
    assigneeIds: [1],
    equipmentIds: ["eq-wd-range"],
    labelIds: [],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-07-28T11:00:00",
    // Finalized with its invoice (INV-3102, Aug 1).
    statusChangedAt: "2026-08-01T09:00:00",
    lastModifiedAt: "2026-08-01T09:00:00",
  },
  {
    id: "JOB-1210",
    locationId: "ferry-main",
    serviceId: "prep-fridge",
    serviceName: "Reach-in cooler diagnostic",
    status: "cancelled",
    scheduledFor: "2026-08-15T13:00:00",
    durationMinutes: 90,
    assigneeIds: [6],
    equipmentIds: [],
    labelIds: [],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-08-13T15:40:00",
    // Cancelled on the day; its invoice voided the next (INV-3105, Aug 16).
    statusChangedAt: "2026-08-15T09:00:00",
    lastModifiedAt: "2026-08-16T09:30:00",
    notes: "Client fixed it themselves.",
  },
  // Three more walk-in-cooler jobs at Wildwood Downtown (added 2026-09-08) —
  // with JOB-1201 they make the "New Job" form's Similar-jobs list four rows
  // deep: sorting (scheduled first, unscheduled last), the "by Someone"
  // unassigned caption, and the "Show 1 more" truncation all demonstrate.
  {
    id: "JOB-1211",
    locationId: "wildwood-downtown",
    serviceId: "walk-in-cooler",
    serviceName: "Walk-in cooler repair",
    status: "upcoming",
    priority: 2,
    scheduledFor: "2026-09-15T09:00:00",
    durationMinutes: 90,
    assigneeIds: [4],
    equipmentIds: ["eq-wd-walkin"],
    labelIds: ["refrigeration"],
    type: "recall",
    sourceId: "direct",
    receivedAt: "2026-09-01T11:30:00",
    statusChangedAt: "2026-09-02T09:00:00",
    lastModifiedAt: "2026-09-02T09:00:00",
  },
  {
    id: "JOB-1212",
    locationId: "wildwood-downtown",
    serviceId: "walk-in-cooler",
    serviceName: "Walk-in cooler repair",
    status: "onHoldExternal",
    subStatusId: "sub-parts",
    priority: 3,
    scheduledFor: "2026-09-22T13:00:00",
    durationMinutes: 60,
    assigneeIds: [7],
    equipmentIds: ["eq-wd-walkin"],
    labelIds: ["refrigeration", "warranty"],
    type: "recall",
    sourceId: "direct",
    receivedAt: "2026-08-30T14:00:00",
    statusChangedAt: "2026-09-03T15:00:00",
    lastModifiedAt: "2026-09-03T15:00:00",
    notes: "Waiting for the replacement gasket to arrive.",
  },
  {
    // Finalized walk-in-cooler job (added 2026-09-08) — the "New Job" form's
    // Possible-recalls SERVICE match (JOB-1209's range covers the equipment
    // match).
    id: "JOB-1214",
    locationId: "wildwood-downtown",
    serviceId: "walk-in-cooler",
    serviceName: "Walk-in cooler repair",
    status: "finalized",
    priority: 2,
    scheduledFor: "2026-08-20T08:00:00",
    durationMinutes: 150,
    assigneeIds: [3],
    equipmentIds: ["eq-wd-walkin"],
    labelIds: ["refrigeration"],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-08-15T10:00:00",
    statusChangedAt: "2026-08-22T09:00:00",
    lastModifiedAt: "2026-08-22T09:00:00",
  },
  {
    // Unassigned on purpose — the caption falls back to "by Someone".
    id: "JOB-1213",
    locationId: "wildwood-downtown",
    serviceId: "walk-in-cooler",
    serviceName: "Walk-in cooler repair",
    status: "unscheduled",
    priority: 4,
    durationMinutes: 240,
    assigneeIds: [],
    equipmentIds: [],
    labelIds: [],
    type: "new",
    sourceId: "direct",
    receivedAt: "2026-09-03T13:45:00",
    statusChangedAt: "2026-09-03T13:45:00",
    lastModifiedAt: "2026-09-03T13:45:00",
  },
  // ---- the mass of the jobs list (moved into the db 2026-09-11) ------------
  // The Filters prototype's 64-job table, formerly generated per prototype
  // (jobsData.ts, seeded mulberry32, seed 20260817) — MATERIALIZED here
  // against the demo clock (TODAY above; the old Aug-17 anchor moved to
  // Sep 4, so every date shifted +18 days while ids, statuses and relative
  // offsets stayed identical). Regenerate with a new anchor via
  // scripts/regenerate-db-rows.mjs if the clock ever moves again.
  { id: "JOB-1070", locationId: "northpoint-banquet", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "completed", priority: 3, scheduledFor: "2026-08-15T12:15:00", durationMinutes: 105, assigneeIds: [7, 6], equipmentIds: [], labelIds: ["priority-client", "quarterly", "warranty"], type: "recall", sourceId: "corrigo", sourceRef: "COR-6028", receivedAt: "2026-08-11T13:30:00", statusChangedAt: "2026-08-28T16:00:00", lastModifiedAt: "2026-08-30T09:00:00" },
  { id: "JOB-1105", locationId: "wildwood-downtown", serviceId: "range-burner", serviceName: "Range burner repair", status: "completed", scheduledFor: "2026-08-18T08:45:00", durationMinutes: 210, assigneeIds: [5, 1], equipmentIds: [], labelIds: [], type: "new", sourceId: "service-channel", sourceRef: "SC-8590", receivedAt: "2026-08-10T14:00:00", statusChangedAt: "2026-08-25T13:00:00", lastModifiedAt: "2026-09-02T15:00:00" },
  { id: "JOB-1068", locationId: "wildwood-airport", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "completed", priority: 3, scheduledFor: "2026-08-18T13:30:00", durationMinutes: 90, assigneeIds: [2], equipmentIds: [], labelIds: [], type: "recall", sourceId: "service-channel", sourceRef: "SC-7339", receivedAt: "2026-08-12T11:30:00", statusChangedAt: "2026-09-02T14:00:00", lastModifiedAt: "2026-09-03T14:00:00" },
  { id: "JOB-1073", locationId: "northpoint-banquet", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "finalized", priority: 3, scheduledFor: "2026-08-18T13:45:00", durationMinutes: 300, assigneeIds: [8, 4], equipmentIds: [], labelIds: ["contract"], type: "new", sourceId: "direct", receivedAt: "2026-08-12T10:15:00", statusChangedAt: "2026-09-03T14:00:00", lastModifiedAt: "2026-09-03T12:00:00" },
  { id: "JOB-1069", locationId: "wildwood-downtown", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "completed", scheduledFor: "2026-08-18T15:30:00", durationMinutes: 150, assigneeIds: [5, 6, 4], equipmentIds: [], labelIds: ["recurring", "ventilation"], type: "new", sourceId: "direct", receivedAt: "2026-08-15T13:30:00", statusChangedAt: "2026-08-29T08:00:00", lastModifiedAt: "2026-08-31T17:00:00" },
  { id: "JOB-1106", locationId: "wildwood-airport", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "completed", priority: 3, scheduledFor: "2026-08-19T13:30:00", durationMinutes: 240, assigneeIds: [2, 3, 4], equipmentIds: [], labelIds: [], type: "new", sourceId: "direct", receivedAt: "2026-08-09T14:45:00", statusChangedAt: "2026-08-25T11:00:00", lastModifiedAt: "2026-08-30T09:00:00" },
  { id: "JOB-1074", locationId: "ferry-main", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "finalized", scheduledFor: "2026-08-23T12:45:00", durationMinutes: 240, assigneeIds: [2], equipmentIds: [], labelIds: ["cooking", "recurring", "warranty"], type: "new", sourceId: "direct", receivedAt: "2026-08-15T12:30:00", statusChangedAt: "2026-08-23T12:45:00", lastModifiedAt: "2026-08-31T08:00:00" },
  { id: "JOB-1066", locationId: "northpoint-hotel", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "pastDue", priority: 4, scheduledFor: "2026-08-28T15:30:00", durationMinutes: 60, assigneeIds: [8, 9], equipmentIds: [], labelIds: ["quarterly", "recurring"], type: "recall", sourceId: "corrigo", sourceRef: "COR-5749", receivedAt: "2026-08-18T12:45:00", statusChangedAt: "2026-08-30T11:00:00", lastModifiedAt: "2026-09-02T09:00:00" },
  { id: "JOB-1100", locationId: "harbour-pier", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "pastDue", priority: 4, scheduledFor: "2026-08-29T08:15:00", durationMinutes: 90, assigneeIds: [9], equipmentIds: [], labelIds: ["contract"], type: "new", sourceId: "ecotrak", sourceRef: "ECO-6468", receivedAt: "2026-08-23T13:15:00", statusChangedAt: null, lastModifiedAt: "2026-08-31T15:00:00" },
  { id: "JOB-1064", locationId: "harbour-marina", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "pastDue", priority: 4, scheduledFor: "2026-08-30T12:45:00", durationMinutes: 150, assigneeIds: [6, 8], equipmentIds: [], labelIds: [], type: "recall", sourceId: "corrigo", sourceRef: "COR-5085", receivedAt: "2026-08-19T08:45:00", statusChangedAt: "2026-08-19T09:00:00", lastModifiedAt: "2026-08-26T16:00:00" },
  { id: "JOB-1067", locationId: "sunset-judah", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "pastDue", priority: 1, scheduledFor: "2026-08-31T09:15:00", durationMinutes: 30, assigneeIds: [3], equipmentIds: [], labelIds: ["warranty", "contract"], type: "recall", sourceId: "direct", receivedAt: "2026-08-25T09:45:00", statusChangedAt: null, lastModifiedAt: "2026-08-28T11:00:00" },
  { id: "JOB-1065", locationId: "wildwood-airport", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "pastDue", priority: 2, scheduledFor: "2026-08-31T15:45:00", durationMinutes: 120, assigneeIds: [5, 4], equipmentIds: [], labelIds: ["ventilation", "warranty", "recurring"], type: "recall", sourceId: "corrigo", sourceRef: "COR-8711", receivedAt: "2026-08-29T09:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-02T14:00:00" },
  { id: "JOB-1103", locationId: "harbour-pier", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "pastDue", priority: 1, scheduledFor: "2026-09-02T07:15:00", durationMinutes: 120, assigneeIds: [4], equipmentIds: [], labelIds: ["cooking", "priority-client", "warranty"], type: "new", sourceId: "direct", receivedAt: "2026-08-27T16:30:00", statusChangedAt: "2026-08-31T13:00:00", lastModifiedAt: "2026-09-03T16:00:00" },
  { id: "JOB-1104", locationId: "northpoint-hotel", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "completed", priority: 3, scheduledFor: "2026-09-02T08:00:00", durationMinutes: 240, assigneeIds: [6, 9, 8], equipmentIds: [], labelIds: [], type: "new", sourceId: "service-channel", sourceRef: "SC-7077", receivedAt: "2026-08-21T16:15:00", statusChangedAt: "2026-09-02T08:00:00", lastModifiedAt: "2026-09-03T14:00:00" },
  { id: "JOB-1102", locationId: "harbour-marina", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "pastDue", priority: 4, scheduledFor: "2026-09-03T14:30:00", durationMinutes: 180, assigneeIds: [6, 7], equipmentIds: [], labelIds: ["priority-client", "contract", "ventilation"], type: "recall", sourceId: "direct", receivedAt: "2026-08-22T13:45:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "JOB-1101", locationId: "sunset-judah", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "pastDue", priority: 2, scheduledFor: "2026-09-03T17:15:00", durationMinutes: 105, assigneeIds: [7, 8], equipmentIds: [], labelIds: [], type: "new", sourceId: "service-channel", sourceRef: "SC-3836", receivedAt: "2026-08-26T14:00:00", statusChangedAt: "2026-08-29T15:00:00", lastModifiedAt: "2026-09-03T13:00:00" },
  { id: "JOB-1077", locationId: "wildwood-downtown", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "onHoldInternal", subStatusId: "sub-tech", priority: 2, scheduledFor: "2026-09-04T07:45:00", durationMinutes: 60, assigneeIds: [9], equipmentIds: [], labelIds: ["plumbing", "warranty", "recurring"], type: "recall", sourceId: "service-channel", sourceRef: "SC-3044", receivedAt: "2026-08-24T09:30:00", statusChangedAt: "2026-09-04T07:45:00", lastModifiedAt: "2026-09-03T11:00:00" },
  { id: "JOB-1059", locationId: "northpoint-hotel", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "active", priority: 4, scheduledFor: "2026-09-04T08:45:00", durationMinutes: 60, assigneeIds: [5, 7], equipmentIds: [], labelIds: ["warranty", "compliance"], type: "recall", sourceId: "direct", receivedAt: "2026-08-23T12:30:00", statusChangedAt: "2026-09-04T08:45:00", lastModifiedAt: "2026-09-02T09:00:00" },
  { id: "JOB-1072", locationId: "harbour-marina", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "quickPaused", subStatusId: "sub-another-call", priority: 2, scheduledFor: "2026-09-04T09:00:00", durationMinutes: 105, assigneeIds: [1, 8, 5], equipmentIds: [], labelIds: ["cooking", "refrigeration", "contract"], type: "new", sourceId: "service-channel", sourceRef: "SC-3829", receivedAt: "2026-08-27T15:15:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "JOB-1060", locationId: "harbour-pier", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "active", priority: 2, scheduledFor: "2026-09-04T09:30:00", durationMinutes: 180, assigneeIds: [7, 9, 5], equipmentIds: [], labelIds: ["recurring", "priority-client", "compliance"], type: "new", sourceId: "corrigo", sourceRef: "COR-3507", receivedAt: "2026-08-30T16:45:00", statusChangedAt: "2026-08-30T16:45:00", lastModifiedAt: "2026-09-02T17:00:00" },
  { id: "JOB-1099", locationId: "northpoint-banquet", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "active", priority: 3, scheduledFor: "2026-09-04T13:30:00", durationMinutes: 45, assigneeIds: [6, 1], equipmentIds: [], labelIds: ["refrigeration"], type: "recall", sourceId: "corrigo", sourceRef: "COR-2345", receivedAt: "2026-08-30T08:15:00", statusChangedAt: "2026-08-31T15:00:00", lastModifiedAt: "2026-09-01T11:00:00" },
  { id: "JOB-1096", locationId: "mission-24th", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "active", priority: 2, scheduledFor: "2026-09-04T14:00:00", durationMinutes: 240, assigneeIds: [6], equipmentIds: [], labelIds: [], type: "recall", sourceId: "ecotrak", sourceRef: "ECO-3419", receivedAt: "2026-08-24T16:15:00", statusChangedAt: "2026-08-24T16:15:00", lastModifiedAt: "2026-08-31T17:00:00" },
  { id: "JOB-1063", locationId: "wildwood-downtown", serviceId: "range-burner", serviceName: "Range burner repair", status: "active", priority: 3, scheduledFor: "2026-09-04T14:15:00", durationMinutes: 30, assigneeIds: [4], equipmentIds: [], labelIds: [], type: "recall", sourceId: "corrigo", sourceRef: "COR-6834", receivedAt: "2026-08-27T13:30:00", statusChangedAt: "2026-08-31T16:00:00", lastModifiedAt: "2026-09-04T14:00:00" },
  { id: "JOB-1062", locationId: "sunset-judah", serviceId: "grease-trap", serviceName: "Grease trap service", status: "active", scheduledFor: "2026-09-04T14:30:00", durationMinutes: 75, assigneeIds: [4], equipmentIds: [], labelIds: [], type: "new", sourceId: "ecotrak", sourceRef: "ECO-1100", receivedAt: "2026-08-27T09:00:00", statusChangedAt: "2026-08-28T09:00:00", lastModifiedAt: "2026-08-31T11:00:00" },
  { id: "JOB-1071", locationId: "presidio-canteen", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "quickPaused", subStatusId: "sub-lunch", priority: 4, scheduledFor: "2026-09-04T15:00:00", durationMinutes: 210, assigneeIds: [5, 2], equipmentIds: [], labelIds: [], type: "recall", sourceId: "direct", receivedAt: "2026-09-01T09:15:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T09:00:00" },
  { id: "JOB-1095", locationId: "harbour-marina", serviceId: "grease-trap", serviceName: "Grease trap service", status: "active", priority: 4, scheduledFor: "2026-09-04T15:30:00", durationMinutes: 90, assigneeIds: [8], equipmentIds: [], labelIds: ["plumbing"], type: "recall", sourceId: "ecotrak", sourceRef: "ECO-4814", receivedAt: "2026-09-01T12:15:00", statusChangedAt: "2026-09-03T16:00:00", lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "JOB-1097", locationId: "ferry-main", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "active", priority: 3, scheduledFor: "2026-09-04T15:30:00", durationMinutes: 120, assigneeIds: [1, 4], equipmentIds: [], labelIds: [], type: "new", sourceId: "corrigo", sourceRef: "COR-2523", receivedAt: "2026-08-26T11:30:00", statusChangedAt: "2026-08-27T12:00:00", lastModifiedAt: "2026-08-30T13:00:00" },
  { id: "JOB-1098", locationId: "mission-24th", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "active", scheduledFor: "2026-09-04T16:30:00", durationMinutes: 45, assigneeIds: [6, 4], equipmentIds: [], labelIds: ["priority-client", "quarterly"], type: "new", sourceId: "direct", receivedAt: "2026-08-25T13:00:00", statusChangedAt: "2026-08-26T12:00:00", lastModifiedAt: "2026-08-27T11:00:00" },
  { id: "JOB-1061", locationId: "presidio-canteen", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "active", priority: 3, scheduledFor: "2026-09-04T17:45:00", durationMinutes: 120, assigneeIds: [3], equipmentIds: [], labelIds: ["plumbing", "quarterly", "contract"], type: "new", sourceId: "corrigo", sourceRef: "COR-1780", receivedAt: "2026-08-31T08:45:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T13:00:00" },
  { id: "JOB-1079", locationId: "ferry-main", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "upcoming", priority: 1, scheduledFor: "2026-09-05T10:45:00", durationMinutes: 75, assigneeIds: [4, 9], equipmentIds: [], labelIds: ["quarterly", "priority-client"], type: "new", sourceId: "corrigo", sourceRef: "COR-1395", receivedAt: "2026-08-27T12:45:00", statusChangedAt: "2026-09-02T10:00:00", lastModifiedAt: "2026-09-02T09:00:00" },
  { id: "JOB-1078", locationId: "northpoint-hotel", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "cancelled", priority: 4, scheduledFor: "2026-09-05T16:15:00", durationMinutes: 45, assigneeIds: [6], equipmentIds: [], labelIds: ["refrigeration", "recurring"], type: "new", sourceId: "corrigo", sourceRef: "COR-1403", receivedAt: "2026-08-26T09:30:00", statusChangedAt: "2026-08-31T12:00:00", lastModifiedAt: "2026-09-01T13:00:00" },
  { id: "JOB-1081", locationId: "sunset-judah", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "upcoming", scheduledFor: "2026-09-07T07:00:00", durationMinutes: 180, assigneeIds: [3, 7], equipmentIds: [], labelIds: ["contract"], type: "new", sourceId: "service-channel", sourceRef: "SC-4886", receivedAt: "2026-08-30T11:30:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T08:00:00" },
  { id: "JOB-1051", locationId: "northpoint-hotel", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "upcoming", priority: 3, scheduledFor: "2026-09-08T07:45:00", durationMinutes: 300, assigneeIds: [7], equipmentIds: [], labelIds: ["warranty", "recurring", "contract"], type: "new", sourceId: "service-channel", sourceRef: "SC-1049", receivedAt: "2026-09-03T09:00:00", statusChangedAt: "2026-09-03T09:00:00", lastModifiedAt: "2026-09-03T17:00:00" },
  { id: "JOB-1047", locationId: "northpoint-hotel", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "upcoming", priority: 4, scheduledFor: "2026-09-08T08:45:00", durationMinutes: 45, assigneeIds: [4, 6, 7], equipmentIds: [], labelIds: ["ventilation", "plumbing"], type: "new", sourceId: "ecotrak", sourceRef: "ECO-4744", receivedAt: "2026-09-01T13:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-03T16:00:00" },
  { id: "JOB-1087", locationId: "wildwood-airport", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "upcoming", priority: 3, scheduledFor: "2026-09-08T14:15:00", durationMinutes: 30, assigneeIds: [2, 9], equipmentIds: [], labelIds: ["cooking", "priority-client", "warranty"], type: "new", sourceId: "corrigo", sourceRef: "COR-1045", receivedAt: "2026-09-03T08:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T17:00:00" },
  { id: "JOB-1085", locationId: "ferry-main", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "upcoming", priority: 3, scheduledFor: "2026-09-09T09:15:00", durationMinutes: 75, assigneeIds: [7, 1, 9], equipmentIds: [], labelIds: ["plumbing", "compliance"], type: "new", sourceId: "ecotrak", sourceRef: "ECO-7572", receivedAt: "2026-09-03T12:30:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T13:00:00" },
  { id: "JOB-1043", locationId: "sunset-judah", serviceId: "espresso", serviceName: "Espresso machine descale", status: "upcoming", priority: 1, scheduledFor: "2026-09-09T15:45:00", durationMinutes: 60, assigneeIds: [5], equipmentIds: [], labelIds: ["warranty", "recurring"], type: "new", sourceId: "ecotrak", sourceRef: "ECO-9049", receivedAt: "2026-09-03T09:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-03T12:00:00" },
  { id: "JOB-1084", locationId: "bayside-commissary", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "upcoming", priority: 2, scheduledFor: "2026-09-10T12:30:00", durationMinutes: 60, assigneeIds: [9, 5, 2], equipmentIds: [], labelIds: ["refrigeration", "contract", "warranty"], type: "new", sourceId: "direct", receivedAt: "2026-09-01T12:00:00", statusChangedAt: "2026-09-01T12:00:00", lastModifiedAt: "2026-09-03T09:00:00" },
  { id: "JOB-1082", locationId: "wildwood-downtown", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "upcoming", priority: 3, scheduledFor: "2026-09-11T15:00:00", durationMinutes: 240, assigneeIds: [5, 8], equipmentIds: [], labelIds: ["refrigeration", "priority-client", "plumbing"], type: "new", sourceId: "corrigo", sourceRef: "COR-1986", receivedAt: "2026-09-03T16:15:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T09:00:00" },
  { id: "JOB-1076", locationId: "northpoint-banquet", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "onHoldExternal", subStatusId: "sub-client-approval", priority: 4, scheduledFor: "2026-09-12T09:00:00", durationMinutes: 30, assigneeIds: [7], equipmentIds: [], labelIds: [], type: "new", sourceId: "ecotrak", sourceRef: "ECO-1280", receivedAt: "2026-09-03T16:45:00", statusChangedAt: "2026-09-03T16:45:00", lastModifiedAt: "2026-09-03T09:00:00" },
  { id: "JOB-1086", locationId: "presidio-canteen", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "upcoming", scheduledFor: "2026-09-12T16:00:00", durationMinutes: 210, assigneeIds: [7, 2, 8], equipmentIds: [], labelIds: ["priority-client", "quarterly", "refrigeration"], type: "new", sourceId: "corrigo", sourceRef: "COR-7509", receivedAt: "2026-09-03T11:15:00", statusChangedAt: "2026-09-03T15:00:00", lastModifiedAt: "2026-09-04T14:00:00" },
  { id: "JOB-1080", locationId: "bayside-commissary", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "upcoming", priority: 3, scheduledFor: "2026-09-16T12:00:00", durationMinutes: 210, assigneeIds: [5, 3], equipmentIds: [], labelIds: ["plumbing", "cooking"], type: "new", sourceId: "corrigo", sourceRef: "COR-3638", receivedAt: "2026-09-03T16:15:00", statusChangedAt: "2026-09-03T16:15:00", lastModifiedAt: "2026-09-04T16:00:00" },
  { id: "JOB-1083", locationId: "mission-24th", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "upcoming", priority: 4, scheduledFor: "2026-09-17T15:15:00", durationMinutes: 45, assigneeIds: [7], equipmentIds: [], labelIds: ["contract", "refrigeration"], type: "recall", sourceId: "direct", receivedAt: "2026-09-03T12:45:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T12:00:00" },
  { id: "JOB-1049", locationId: "bayside-commissary", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "upcoming", priority: 3, scheduledFor: "2026-09-18T14:00:00", durationMinutes: 210, assigneeIds: [9, 7], equipmentIds: [], labelIds: ["compliance"], type: "new", sourceId: "ecotrak", sourceRef: "ECO-2977", receivedAt: "2026-09-03T08:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T10:00:00" },
  { id: "JOB-1048", locationId: "presidio-canteen", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "upcoming", priority: 2, scheduledFor: "2026-09-20T10:45:00", durationMinutes: 180, assigneeIds: [5, 9, 8], equipmentIds: [], labelIds: [], type: "new", sourceId: "direct", receivedAt: "2026-09-03T14:15:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "JOB-1045", locationId: "northpoint-hotel", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "upcoming", scheduledFor: "2026-09-21T07:45:00", durationMinutes: 210, assigneeIds: [6], equipmentIds: [], labelIds: [], type: "new", sourceId: "service-channel", sourceRef: "SC-5488", receivedAt: "2026-09-03T14:30:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "JOB-1050", locationId: "harbour-marina", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "upcoming", scheduledFor: "2026-09-23T11:30:00", durationMinutes: 120, assigneeIds: [6, 2, 3], equipmentIds: [], labelIds: ["contract"], type: "new", sourceId: "corrigo", sourceRef: "COR-6709", receivedAt: "2026-09-03T08:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T09:00:00" },
  { id: "JOB-1046", locationId: "northpoint-hotel", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "upcoming", priority: 3, scheduledFor: "2026-09-23T15:45:00", durationMinutes: 30, assigneeIds: [5, 6, 7], equipmentIds: [], labelIds: ["plumbing", "compliance", "cooking"], type: "new", sourceId: "ecotrak", sourceRef: "ECO-3162", receivedAt: "2026-09-03T08:15:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T14:00:00" },
  { id: "JOB-1044", locationId: "bayside-commissary", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "upcoming", priority: 3, scheduledFor: "2026-09-25T07:00:00", durationMinutes: 180, assigneeIds: [2], equipmentIds: [], labelIds: ["quarterly"], type: "new", sourceId: "ecotrak", sourceRef: "ECO-9087", receivedAt: "2026-09-03T15:45:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T12:00:00" },
  { id: "JOB-1052", locationId: "ferry-main", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "unscheduled", priority: 4, durationMinutes: 60, assigneeIds: [], equipmentIds: [], labelIds: ["recurring"], type: "new", sourceId: "service-channel", sourceRef: "SC-1550", receivedAt: "2026-08-31T16:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T10:00:00" },
  { id: "JOB-1053", locationId: "sunset-judah", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "unscheduled", priority: 2, durationMinutes: 120, assigneeIds: [5], equipmentIds: [], labelIds: ["compliance", "recurring"], type: "new", sourceId: "corrigo", sourceRef: "COR-9962", receivedAt: "2026-09-03T09:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T08:00:00" },
  { id: "JOB-1054", locationId: "wildwood-airport", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unscheduled", priority: 4, durationMinutes: 90, assigneeIds: [7], equipmentIds: [], labelIds: ["priority-client", "refrigeration", "cooking"], type: "new", sourceId: "corrigo", sourceRef: "COR-4354", receivedAt: "2026-09-02T08:15:00", statusChangedAt: "2026-09-03T12:00:00", lastModifiedAt: "2026-09-03T14:00:00" },
  { id: "JOB-1055", locationId: "wildwood-downtown", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "unscheduled", priority: 1, durationMinutes: 120, assigneeIds: [2], equipmentIds: [], labelIds: ["warranty", "quarterly", "recurring"], type: "new", sourceId: "corrigo", sourceRef: "COR-4490", receivedAt: "2026-09-03T13:30:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "JOB-1056", locationId: "harbour-marina", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unscheduled", priority: 3, durationMinutes: 150, assigneeIds: [], equipmentIds: [], labelIds: ["warranty", "recurring", "refrigeration"], type: "new", sourceId: "direct", receivedAt: "2026-08-25T10:15:00", statusChangedAt: null, lastModifiedAt: "2026-08-31T10:00:00" },
  { id: "JOB-1057", locationId: "harbour-marina", serviceId: "grease-trap", serviceName: "Grease trap service", status: "unscheduled", durationMinutes: 75, assigneeIds: [], equipmentIds: [], labelIds: ["quarterly"], type: "new", sourceId: "corrigo", sourceRef: "COR-7407", receivedAt: "2026-08-27T10:30:00", statusChangedAt: "2026-09-03T14:00:00", lastModifiedAt: "2026-09-03T15:00:00" },
  { id: "JOB-1058", locationId: "northpoint-banquet", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "unscheduled", priority: 3, durationMinutes: 45, assigneeIds: [8], equipmentIds: [], labelIds: ["compliance", "ventilation", "plumbing"], type: "new", sourceId: "service-channel", sourceRef: "SC-1695", receivedAt: "2026-08-30T09:30:00", statusChangedAt: null, lastModifiedAt: "2026-09-01T14:00:00" },
  { id: "JOB-1075", locationId: "harbour-pier", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "draft", priority: 3, assigneeIds: [], equipmentIds: [], labelIds: ["refrigeration", "contract"], type: "new", sourceId: "service-channel", sourceRef: "SC-8659", receivedAt: "2026-09-03T16:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T12:00:00" },
  { id: "JOB-1088", locationId: "sunset-judah", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unscheduled", priority: 4, durationMinutes: 120, assigneeIds: [4], equipmentIds: [], labelIds: ["priority-client", "contract"], type: "recall", sourceId: "ecotrak", sourceRef: "ECO-7022", receivedAt: "2026-08-30T15:00:00", statusChangedAt: null, lastModifiedAt: "2026-08-30T17:00:00" },
  { id: "JOB-1089", locationId: "presidio-canteen", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "unscheduled", priority: 2, durationMinutes: 240, assigneeIds: [], equipmentIds: [], labelIds: ["warranty", "priority-client"], type: "new", sourceId: "direct", receivedAt: "2026-08-27T15:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-02T14:00:00" },
  { id: "JOB-1090", locationId: "harbour-pier", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "unscheduled", priority: 4, durationMinutes: 180, assigneeIds: [6], equipmentIds: [], labelIds: ["refrigeration"], type: "new", sourceId: "service-channel", sourceRef: "SC-9771", receivedAt: "2026-08-27T13:00:00", statusChangedAt: "2026-09-01T15:00:00", lastModifiedAt: "2026-09-02T10:00:00" },
  { id: "JOB-1091", locationId: "presidio-canteen", serviceId: "espresso", serviceName: "Espresso machine descale", status: "unscheduled", priority: 1, durationMinutes: 60, assigneeIds: [5], equipmentIds: [], labelIds: ["ventilation", "warranty"], type: "new", sourceId: "service-channel", sourceRef: "SC-3785", receivedAt: "2026-08-27T11:45:00", statusChangedAt: null, lastModifiedAt: "2026-09-03T13:00:00" },
  { id: "JOB-1092", locationId: "harbour-marina", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unscheduled", priority: 3, durationMinutes: 300, assigneeIds: [], equipmentIds: [], labelIds: ["plumbing", "recurring", "quarterly"], type: "new", sourceId: "corrigo", sourceRef: "COR-6864", receivedAt: "2026-08-31T10:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "JOB-1093", locationId: "bayside-commissary", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "unscheduled", durationMinutes: 105, assigneeIds: [], equipmentIds: [], labelIds: ["plumbing"], type: "new", sourceId: "service-channel", sourceRef: "SC-9431", receivedAt: "2026-08-25T16:00:00", statusChangedAt: "2026-08-29T14:00:00", lastModifiedAt: "2026-08-29T08:00:00" },
  { id: "JOB-1094", locationId: "wildwood-airport", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "unscheduled", priority: 3, durationMinutes: 210, assigneeIds: [], equipmentIds: [], labelIds: ["refrigeration"], type: "new", sourceId: "service-channel", sourceRef: "SC-4001", receivedAt: "2026-08-27T13:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-03T08:00:00" },
];

const ESTIMATES_AT_ANCHOR: Estimate[] = [
  // The six original curated estimates (their ids, links and stories kept),
  // UPGRADED 2026-09-11 with the full production field set — see the
  // Estimate schema note in types.ts for the two status levels.
  { id: "EST-2201", locationId: "wildwood-downtown", jobId: "JOB-1201", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler compressor replacement", status: "awaitingApproval", labelIds: ["replacement"], total: 3480.0, issuedAt: "2026-09-02T11:20:00", dueAt: "2026-10-02T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-09-02T11:20:00", lastModifiedAt: "2026-09-02T11:20:00", lastViewedAt: "2026-09-03T08:40:00" },
  { id: "EST-2202", locationId: "mission-24th", jobId: "JOB-1207", serviceId: "hood-cleaning", serviceName: "Hood deep cleaning", status: "draft", labelIds: [], total: 1250.0, issuedAt: "2026-08-30T15:00:00", dueAt: "2026-09-29T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-09-01T09:30:00" },
  // Invoiced as INV-3104 (same 2,190.50 at North Point).
  { id: "EST-2203", locationId: "northpoint-hotel", serviceId: "freezer-seal", serviceName: "Walk-in freezer door assembly", status: "invoiced", labelIds: ["replacement"], total: 2190.5, issuedAt: "2026-08-25T10:00:00", dueAt: "2026-09-24T17:00:00", downPayment: "paid", statusChangedAt: "2026-08-27T14:10:00", lastModifiedAt: "2026-08-27T14:10:00", lastViewedAt: "2026-08-27T09:15:00" },
  // Won and turned into the quarterly service job (JOB-1206).
  { id: "EST-2204", locationId: "bayside-commissary", jobId: "JOB-1206", serviceId: "combi-oven", serviceName: "Combi oven annual contract", status: "jobbed", labelIds: ["contract-renewal", "preventive-plan"], total: 5400.0, issuedAt: "2026-07-18T09:00:00", dueAt: "2026-08-17T17:00:00", downPayment: "paid", statusChangedAt: "2026-08-05T11:00:00", lastModifiedAt: "2026-08-05T11:00:00", lastViewedAt: "2026-07-20T13:25:00" },
  { id: "EST-2205", locationId: "harbour-marina", serviceName: "Kitchen build-out consultation", status: "lost", labelIds: ["budgetary"], total: 8900.0, issuedAt: "2026-06-11T14:30:00", dueAt: "2026-07-11T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-07-02T10:00:00", lastModifiedAt: "2026-07-02T10:00:00", lastViewedAt: "2026-06-15T16:45:00" },
  // Sent but never opened (no lastViewedAt) — the "Seen" column's gap.
  { id: "EST-2206", locationId: "sunset-judah", jobId: "JOB-1208", serviceId: "steam-table", serviceName: "Proofer thermostat + calibration", status: "awaitingApproval", labelIds: ["repair"], total: 480.0, issuedAt: "2026-08-24T12:10:00", dueAt: "2026-09-23T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-24T12:10:00", lastModifiedAt: "2026-08-24T12:10:00" },
  // ---- the mass of the estimates list (moved into the db 2026-09-11) -------
  // 56 more, formerly generated inside the Filters prototype
  // (estimatesData.ts, seed 20260911) — materialized against the demo clock
  // like the jobs above. `jobId` is deliberately unset here: linking a
  // "jobbed" estimate to a random job would invent nonsense relations.
  //
  // Two SENT estimates (EST-2225, EST-2227) were moved from "unpaid" to
  // "partiallyPaid" on 2026-09-12: the generator only ever produced a partial
  // down payment on approved and won estimates, so the Down payment cell's
  // WARNING state — partially paid while the estimate is still out with the
  // client — had no row to render (see `downPaymentCell`).
  //
  // Three UNCONVERTED estimates (EST-2220, EST-2248, EST-2251) were moved to
  // "paid" later the same day, for the mirror reason: a paid deposit existed
  // only on two CLOSED rows, so the whole open branch had no green "Paid" cell
  // and the filter's "Paid" row matched nothing there (Daniel, after the
  // review: "give a few Unconverted estimates Paid status").
  { id: "EST-2252", locationId: "harbour-marina", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "unconverted", labelIds: [], total: 11900, issuedAt: "2026-06-14T08:30:00", dueAt: "2026-06-28T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-06-18T13:00:00", lastModifiedAt: "2026-07-11T12:00:00", lastViewedAt: "2026-07-25T17:15:00" },
  { id: "EST-2254", locationId: "presidio-canteen", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "cancelled", labelIds: [], total: 5526, issuedAt: "2026-06-16T09:30:00", dueAt: "2026-07-07T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-08-23T14:00:00", lastModifiedAt: "2026-08-27T10:00:00", lastViewedAt: "2026-07-10T16:15:00" },
  { id: "EST-2236", locationId: "wildwood-downtown", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "jobbed", labelIds: [], total: 9400, issuedAt: "2026-06-26T12:30:00", dueAt: "2026-07-10T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-06T16:00:00", lastModifiedAt: "2026-08-07T09:00:00", lastViewedAt: "2026-07-29T20:15:00" },
  { id: "EST-2251", locationId: "wildwood-airport", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "unconverted", labelIds: ["preventive-plan", "repair"], total: 4150, issuedAt: "2026-06-26T10:30:00", dueAt: "2026-07-10T17:00:00", downPayment: "paid", statusChangedAt: "2026-07-05T14:00:00", lastModifiedAt: "2026-07-24T09:00:00", lastViewedAt: "2026-08-28T12:30:00" },
  { id: "EST-2222", locationId: "wildwood-airport", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "cancelled", labelIds: [], total: 5800, issuedAt: "2026-06-16T14:30:00", dueAt: "2026-07-16T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-07-17T10:00:00", lastModifiedAt: "2026-08-03T10:00:00" },
  { id: "EST-2220", locationId: "northpoint-banquet", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "unconverted", labelIds: [], total: 9857, issuedAt: "2026-06-08T12:00:00", dueAt: "2026-07-23T17:00:00", downPayment: "paid", statusChangedAt: "2026-07-12T13:00:00", lastModifiedAt: "2026-08-04T12:00:00" },
  { id: "EST-2235", locationId: "northpoint-hotel", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "jobbed", labelIds: [], total: 3538, issuedAt: "2026-07-15T10:00:00", dueAt: "2026-07-29T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-31T13:00:00", lastModifiedAt: "2026-09-03T10:00:00", lastViewedAt: "2026-07-26T20:15:00" },
  { id: "EST-2219", locationId: "wildwood-airport", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "invoiced", labelIds: ["preventive-plan"], total: 8800, issuedAt: "2026-06-22T10:00:00", dueAt: "2026-08-06T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-07-18T16:00:00", lastModifiedAt: "2026-08-23T13:00:00", lastViewedAt: "2026-07-05T09:45:00" },
  { id: "EST-2238", locationId: "harbour-pier", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "cancelled", labelIds: ["replacement"], total: 6100, issuedAt: "2026-07-19T16:45:00", dueAt: "2026-08-09T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-13T08:00:00", lastModifiedAt: "2026-09-02T11:00:00" },
  { id: "EST-2227", locationId: "wildwood-downtown", serviceId: "range-burner", serviceName: "Range burner repair", status: "awaitingApproval", labelIds: [], total: 5500, issuedAt: "2026-07-30T15:45:00", dueAt: "2026-08-13T17:00:00", downPayment: "partiallyPaid", statusChangedAt: "2026-08-03T14:00:00", lastModifiedAt: "2026-08-13T17:00:00", lastViewedAt: "2026-08-16T16:30:00" },
  { id: "EST-2250", locationId: "mission-24th", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "unconverted", labelIds: [], total: 1250, issuedAt: "2026-07-24T11:30:00", dueAt: "2026-08-14T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-22T15:00:00", lastModifiedAt: "2026-08-31T13:00:00", lastViewedAt: "2026-08-14T16:30:00" },
  { id: "EST-2255", locationId: "wildwood-downtown", serviceId: "grease-trap", serviceName: "Grease trap service", status: "awaitingApproval", labelIds: [], total: 10301, issuedAt: "2026-08-02T10:45:00", dueAt: "2026-08-16T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-09-02T15:00:00", lastModifiedAt: "2026-09-02T12:00:00" },
  { id: "EST-2221", locationId: "northpoint-hotel", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "lost", labelIds: ["preventive-plan", "parts-only"], total: 11696, issuedAt: "2026-07-27T11:30:00", dueAt: "2026-08-17T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-09-03T12:00:00", lastModifiedAt: "2026-09-03T13:00:00", lastViewedAt: "2026-09-03T09:45:00" },
  { id: "EST-2242", locationId: "northpoint-hotel", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "awaitingApproval", labelIds: ["preventive-plan"], total: 10738, issuedAt: "2026-07-30T17:00:00", dueAt: "2026-08-20T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-01T17:00:00", lastModifiedAt: "2026-09-03T12:00:00", lastViewedAt: "2026-08-27T13:00:00" },
  { id: "EST-2225", locationId: "harbour-marina", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "awaitingApproval", labelIds: [], total: 6505, issuedAt: "2026-08-07T08:00:00", dueAt: "2026-08-21T17:00:00", downPayment: "partiallyPaid", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "EST-2234", locationId: "wildwood-downtown", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "jobbed", labelIds: ["parts-only", "contract-renewal"], total: 11900, issuedAt: "2026-08-10T08:15:00", dueAt: "2026-08-24T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-24T12:00:00", lastModifiedAt: "2026-08-26T15:00:00", lastViewedAt: "2026-08-26T13:30:00" },
  { id: "EST-2237", locationId: "mission-24th", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "lost", labelIds: ["warranty-claim"], total: 7650, issuedAt: "2026-08-10T14:30:00", dueAt: "2026-08-24T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-29T08:00:00", lastModifiedAt: "2026-09-02T10:00:00", lastViewedAt: "2026-08-30T15:15:00" },
  { id: "EST-2249", locationId: "wildwood-downtown", serviceId: "grease-trap", serviceName: "Grease trap service", status: "unconverted", labelIds: ["preventive-plan"], total: 8100, issuedAt: "2026-08-11T15:45:00", dueAt: "2026-08-25T17:00:00", downPayment: "partiallyPaid", statusChangedAt: "2026-08-11T17:00:00", lastModifiedAt: "2026-08-31T09:00:00", lastViewedAt: "2026-08-23T09:45:00" },
  { id: "EST-2241", locationId: "presidio-canteen", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "awaitingApproval", labelIds: ["labor-only"], total: 5976, issuedAt: "2026-08-12T16:45:00", dueAt: "2026-08-26T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-08-29T17:00:00", lastModifiedAt: "2026-09-01T13:00:00", lastViewedAt: "2026-08-22T08:15:00" },
  { id: "EST-2216", locationId: "northpoint-banquet", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "jobbed", labelIds: ["contract-renewal"], total: 3179, issuedAt: "2026-08-07T08:30:00", dueAt: "2026-08-28T17:00:00", downPayment: "partiallyPaid", statusChangedAt: "2026-08-17T12:00:00", lastModifiedAt: "2026-08-28T08:00:00", lastViewedAt: "2026-08-26T21:30:00" },
  { id: "EST-2207", locationId: "ferry-main", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "awaitingApproval", labelIds: ["parts-only"], total: 9300, issuedAt: "2026-08-15T11:30:00", dueAt: "2026-08-29T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-08-27T09:00:00", lastModifiedAt: "2026-08-31T15:00:00", lastViewedAt: "2026-09-02T14:00:00" },
  { id: "EST-2208", locationId: "harbour-marina", serviceId: "espresso", serviceName: "Espresso machine descale", status: "awaitingApproval", labelIds: ["warranty-claim"], total: 1300, issuedAt: "2026-07-30T09:45:00", dueAt: "2026-08-29T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-08-22T08:00:00", lastModifiedAt: "2026-08-25T08:00:00", lastViewedAt: "2026-08-05T12:45:00" },
  { id: "EST-2253", locationId: "wildwood-downtown", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "lost", labelIds: ["labor-only"], total: 6750, issuedAt: "2026-07-31T11:30:00", dueAt: "2026-08-30T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-08-08T15:00:00", lastModifiedAt: "2026-08-15T16:00:00", lastViewedAt: "2026-08-19T21:30:00" },
  { id: "EST-2239", locationId: "ferry-main", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "awaitingApproval", labelIds: [], total: 11350, issuedAt: "2026-08-07T17:00:00", dueAt: "2026-09-06T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-16T13:00:00", lastModifiedAt: "2026-08-29T09:00:00" },
  { id: "EST-2229", locationId: "northpoint-banquet", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "draft", labelIds: ["contract-renewal", "preventive-plan"], total: 11710, issuedAt: "2026-08-24T09:15:00", dueAt: "2026-09-07T17:00:00", downPayment: "unpaid", statusChangedAt: null, lastModifiedAt: "2026-09-02T08:00:00" },
  { id: "EST-2248", locationId: "harbour-marina", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "unconverted", labelIds: ["contract-renewal"], total: 2259, issuedAt: "2026-08-17T16:15:00", dueAt: "2026-09-07T17:00:00", downPayment: "paid", statusChangedAt: "2026-08-31T08:00:00", lastModifiedAt: "2026-09-04T10:00:00", lastViewedAt: "2026-08-27T08:30:00" },
  { id: "EST-2212", locationId: "sunset-judah", serviceId: "espresso", serviceName: "Espresso machine descale", status: "unsent", labelIds: ["replacement"], total: 2764, issuedAt: "2026-08-27T08:30:00", dueAt: "2026-09-10T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-09-03T17:00:00" },
  { id: "EST-2214", locationId: "wildwood-airport", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "draft", labelIds: ["repair"], total: 9257, issuedAt: "2026-08-24T11:15:00", dueAt: "2026-09-14T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-09-02T08:00:00" },
  { id: "EST-2226", locationId: "harbour-pier", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "awaitingApproval", labelIds: ["budgetary"], total: 550, issuedAt: "2026-07-31T16:30:00", dueAt: "2026-09-14T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-02T14:00:00", lastModifiedAt: "2026-08-28T09:00:00" },
  { id: "EST-2259", locationId: "harbour-pier", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "awaitingApproval", labelIds: ["labor-only", "warranty-claim"], total: 10076, issuedAt: "2026-08-24T12:30:00", dueAt: "2026-09-14T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T09:00:00" },
  { id: "EST-2233", locationId: "mission-24th", serviceId: "grease-trap", serviceName: "Grease trap service", status: "unconverted", labelIds: ["parts-only", "replacement"], total: 8000, issuedAt: "2026-08-25T08:15:00", dueAt: "2026-09-15T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-29T11:00:00", lastModifiedAt: "2026-09-04T15:00:00", lastViewedAt: "2026-08-30T10:15:00" },
  { id: "EST-2260", locationId: "harbour-marina", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "unsent", labelIds: ["parts-only", "preventive-plan"], total: 5350, issuedAt: "2026-08-25T08:15:00", dueAt: "2026-09-15T17:00:00", downPayment: "unpaid", statusChangedAt: null, lastModifiedAt: "2026-09-03T17:00:00" },
  { id: "EST-2240", locationId: "sunset-judah", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "awaitingApproval", labelIds: ["contract-renewal", "parts-only"], total: 1450, issuedAt: "2026-08-17T16:45:00", dueAt: "2026-09-16T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-08-30T09:00:00", lastModifiedAt: "2026-09-03T10:00:00", lastViewedAt: "2026-09-04T09:45:00" },
  { id: "EST-2245", locationId: "northpoint-hotel", serviceId: "range-burner", serviceName: "Range burner repair", status: "unsent", labelIds: ["replacement", "contract-renewal"], total: 9900, issuedAt: "2026-08-26T10:45:00", dueAt: "2026-09-16T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-09-02T10:00:00" },
  { id: "EST-2247", locationId: "ferry-main", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unsent", labelIds: ["budgetary"], total: 3150, issuedAt: "2026-08-27T16:15:00", dueAt: "2026-09-17T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-09-02T13:00:00" },
  { id: "EST-2261", locationId: "wildwood-airport", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "unsent", labelIds: [], total: 3950, issuedAt: "2026-08-27T11:30:00", dueAt: "2026-09-17T17:00:00", downPayment: "unpaid", statusChangedAt: null, lastModifiedAt: "2026-09-02T08:00:00" },
  { id: "EST-2217", locationId: "harbour-marina", serviceId: "range-burner", serviceName: "Range burner repair", status: "jobbed", labelIds: [], total: 10692, issuedAt: "2026-08-07T09:15:00", dueAt: "2026-09-21T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T14:00:00", lastViewedAt: "2026-08-13T08:15:00" },
  { id: "EST-2246", locationId: "ferry-main", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "unsent", labelIds: ["parts-only"], total: 5219, issuedAt: "2026-08-31T09:45:00", dueAt: "2026-09-21T17:00:00", downPayment: "unpaid", statusChangedAt: null, lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "EST-2262", locationId: "northpoint-hotel", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unsent", labelIds: ["contract-renewal"], total: 8650, issuedAt: "2026-08-23T11:00:00", dueAt: "2026-09-22T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-08-31T16:00:00" },
  { id: "EST-2257", locationId: "northpoint-banquet", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "awaitingApproval", labelIds: ["labor-only", "warranty-claim"], total: 3937, issuedAt: "2026-08-25T13:45:00", dueAt: "2026-09-24T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-25T13:45:00", lastModifiedAt: "2026-09-04T13:00:00", lastViewedAt: "2026-08-29T19:15:00" },
  { id: "EST-2211", locationId: "harbour-pier", serviceId: "grease-trap", serviceName: "Grease trap service", status: "awaitingApproval", labelIds: [], total: 6800, issuedAt: "2026-08-26T10:15:00", dueAt: "2026-09-25T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T11:00:00", lastViewedAt: "2026-08-28T20:00:00" },
  { id: "EST-2215", locationId: "mission-24th", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "unsent", labelIds: ["warranty-claim"], total: 1563, issuedAt: "2026-08-26T15:15:00", dueAt: "2026-09-25T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-09-04T09:00:00" },
  { id: "EST-2244", locationId: "presidio-canteen", serviceId: "espresso", serviceName: "Espresso machine descale", status: "draft", labelIds: ["replacement"], total: 7530, issuedAt: "2026-08-26T08:30:00", dueAt: "2026-09-25T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-08-28T16:00:00" },
  { id: "EST-2228", locationId: "northpoint-banquet", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "unsent", labelIds: [], total: 7000, issuedAt: "2026-08-28T17:15:00", dueAt: "2026-09-27T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-09-01T10:00:00" },
  { id: "EST-2224", locationId: "northpoint-hotel", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "awaitingApproval", labelIds: [], total: 1000, issuedAt: "2026-08-14T11:30:00", dueAt: "2026-09-28T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-16T13:00:00", lastModifiedAt: "2026-09-01T09:00:00" },
  { id: "EST-2232", locationId: "ferry-main", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "unconverted", labelIds: [], total: 3650, issuedAt: "2026-08-15T08:30:00", dueAt: "2026-09-29T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-15T08:30:00", lastModifiedAt: "2026-08-19T11:00:00", lastViewedAt: "2026-08-18T09:30:00" },
  { id: "EST-2256", locationId: "northpoint-hotel", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "awaitingApproval", labelIds: [], total: 5350, issuedAt: "2026-08-30T13:30:00", dueAt: "2026-09-29T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-08-30T15:00:00", lastModifiedAt: "2026-09-03T16:00:00", lastViewedAt: "2026-09-01T11:45:00" },
  { id: "EST-2223", locationId: "presidio-canteen", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "awaitingApproval", labelIds: ["parts-only"], total: 6810, issuedAt: "2026-09-01T08:00:00", dueAt: "2026-10-01T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T10:00:00" },
  { id: "EST-2209", locationId: "bayside-commissary", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "awaitingApproval", labelIds: [], total: 7750, issuedAt: "2026-08-20T10:15:00", dueAt: "2026-10-04T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-20T16:00:00", lastModifiedAt: "2026-09-02T17:00:00", lastViewedAt: "2026-08-22T12:30:00" },
  { id: "EST-2243", locationId: "sunset-judah", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "awaitingApproval", labelIds: ["warranty-claim", "replacement"], total: 6200, issuedAt: "2026-08-23T15:45:00", dueAt: "2026-10-07T17:00:00", downPayment: "notRequired", statusChangedAt: "2026-08-23T15:45:00", lastModifiedAt: "2026-08-28T16:00:00" },
  { id: "EST-2218", locationId: "northpoint-hotel", serviceId: "espresso", serviceName: "Espresso machine descale", status: "invoiced", labelIds: ["warranty-claim", "budgetary"], total: 8800, issuedAt: "2026-08-24T10:15:00", dueAt: "2026-10-08T17:00:00", downPayment: "partiallyPaid", statusChangedAt: "2026-08-31T17:00:00", lastModifiedAt: "2026-09-04T16:00:00", lastViewedAt: "2026-08-27T10:00:00" },
  { id: "EST-2230", locationId: "harbour-pier", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "unsent", labelIds: ["warranty-claim", "budgetary"], total: 1650, issuedAt: "2026-08-24T14:15:00", dueAt: "2026-10-08T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-08-30T12:00:00" },
  { id: "EST-2258", locationId: "wildwood-downtown", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "awaitingApproval", labelIds: ["parts-only", "budgetary"], total: 5269, issuedAt: "2026-08-24T08:45:00", dueAt: "2026-10-08T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-08-24T12:00:00", lastModifiedAt: "2026-09-01T16:00:00" },
  { id: "EST-2210", locationId: "ferry-main", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "awaitingApproval", labelIds: ["warranty-claim"], total: 1700, issuedAt: "2026-08-26T17:15:00", dueAt: "2026-10-10T17:00:00", downPayment: "unpaid", statusChangedAt: "2026-09-01T14:00:00", lastModifiedAt: "2026-09-01T17:00:00" },
  { id: "EST-2213", locationId: "harbour-pier", serviceId: "grease-trap", serviceName: "Grease trap service", status: "unsent", labelIds: [], total: 300, issuedAt: "2026-08-29T08:45:00", dueAt: "2026-10-13T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-09-01T17:00:00" },
  { id: "EST-2231", locationId: "presidio-canteen", serviceId: "range-burner", serviceName: "Range burner repair", status: "unsent", labelIds: ["repair"], total: 3750, issuedAt: "2026-08-31T14:30:00", dueAt: "2026-10-15T17:00:00", downPayment: "notRequired", statusChangedAt: null, lastModifiedAt: "2026-09-01T14:00:00" },
];

// The reference tables, MOVED VERBATIM from the Filters prototype on
// migration (2026-09-04). Their ORDER still matters to
// scripts/regenerate-db-rows.mjs (it inlines these arrays to re-derive the
// materialized job/estimate rows above) — keep the script's copies in step
// if a table is reordered or extended.

/** The work being done. Also the "Service" filter's options. */
export const SERVICES: Service[] = [
  // defaultPriority is REQUIRED (a service is always created with one);
  // dishwasher and espresso picked the explicit "No priority" option (null).
  // The durations joined the remaining rows on 2026-09-16, when the Labor
  // list arrived: `defaultDurationMinutes` IS production's
  // `default_job_duration`, which the Labor table shows as "Est. duration",
  // and one field cannot hold two values. (The regenerate script's inlined
  // copy carries only ids and names, so it needs no update.)
  { id: "walk-in-cooler", name: "Walk-in cooler repair", defaultPriority: 2, defaultDurationMinutes: 120 },
  { id: "fryer-service", name: "Fryer service and calibration", defaultPriority: 3, defaultDurationMinutes: 90 },
  { id: "ice-machine", name: "Ice machine descale", defaultPriority: 4, defaultDurationMinutes: 90 },
  { id: "dishwasher", name: "Dishwasher inspection", defaultPriority: null, defaultDurationMinutes: 45 },
  { id: "combi-oven", name: "Combi oven quarterly maintenance", defaultPriority: 3, defaultDurationMinutes: 120 },
  { id: "hood-cleaning", name: "Grill hood cleaning", defaultPriority: 3, defaultDurationMinutes: 180 },
  { id: "freezer-seal", name: "Freezer door seal replacement", defaultPriority: 2, defaultDurationMinutes: 60 },
  { id: "range-burner", name: "Range burner repair", defaultPriority: 3, defaultDurationMinutes: 90 },
  { id: "steam-table", name: "Steam table thermostat swap", defaultPriority: 4, defaultDurationMinutes: 60 },
  { id: "prep-fridge", name: "Prep fridge compressor service", defaultPriority: 2, defaultDurationMinutes: 120 },
  { id: "grease-trap", name: "Grease trap service", defaultPriority: 3, defaultDurationMinutes: 90 },
  { id: "espresso", name: "Espresso machine descale", defaultPriority: null, defaultDurationMinutes: 45 },
];

// ---- the LABOR pricebook (2026-09-16, the Labor list) -----------------------

/**
 * The workspace's labor SUBTYPES — production `PriceBookItemSubtype`, a table
 * the company writes itself. INVENTED like every list's own reference table
 * (flagged): what a commercial-kitchen service company would actually write.
 */
export const LABOR_SUBTYPES: PricebookSubtype[] = [
  { id: "repair", name: "Repair" },
  { id: "installation", name: "Installation" },
  { id: "preventive", name: "Preventive maintenance" },
  { id: "diagnostics", name: "Diagnostics" },
  { id: "cleaning", name: "Cleaning & sanitation" },
  { id: "emergency", name: "Emergency service" },
];

/** The LABOR labels — production `PriceBookItemLabel`, company-written and
 *  scoped to one pricebook type. INVENTED like every list's (flagged). */
export const LABOR_LABELS: PricebookLabel[] = [
  { id: "after-hours", name: "After hours" },
  { id: "contract", name: "Contract" },
  { id: "warranty-work", name: "Warranty work" },
  { id: "flat-fee", name: "Flat fee" },
  { id: "seasonal", name: "Seasonal" },
];

/**
 * The pricebook fields of the 12 items that are ALSO the `SERVICES` rows —
 * the same production record (`PriceBookItem`, type service) seen from two
 * sides, joined by id below so a name or a duration can never disagree
 * between the job world and the pricebook world. All 12 are Active +
 * confirmed: jobs reference them, and production pickers offer confirmed
 * items only.
 */
const SERVICE_LABOR_FIELDS: Record<
  string,
  Pick<LaborItem, "subtypeId" | "summary" | "cost" | "rate" | "unitType" | "taxable" | "labelIds" | "lastModifiedAt">
> = {
  "walk-in-cooler": { subtypeId: "repair", summary: "Diagnose and repair the walk-in cooler; includes leak check and temperature verification.", cost: 62, rate: 165, unitType: "hourly", taxable: false, labelIds: [], lastModifiedAt: "2026-08-21T14:30:00" },
  "fryer-service": { subtypeId: "preventive", summary: "Full fryer service: drain, boil-out, calibrate the thermostat and verify recovery time.", cost: 55, rate: 145, unitType: "hourly", taxable: false, labelIds: ["contract"], lastModifiedAt: "2026-07-30T10:15:00" },
  "ice-machine": { subtypeId: "cleaning", summary: "Descale and sanitize the ice machine per the manufacturer's schedule.", cost: 40, rate: 260, unitType: "flatRate", taxable: true, labelIds: ["flat-fee"], lastModifiedAt: "2026-08-04T09:00:00" },
  "dishwasher": { subtypeId: "diagnostics", summary: "Inspect the dish machine: wash and rinse temperatures, chemical feed, door switches.", cost: 30, rate: 120, unitType: "flatRate", taxable: true, labelIds: ["flat-fee"], lastModifiedAt: "2026-06-19T16:45:00" },
  "combi-oven": { subtypeId: "preventive", summary: "Quarterly combi oven maintenance: descale the boiler, clean the door gasket, run a test cycle.", cost: 85, rate: 340, unitType: "flatRate", taxable: true, labelIds: ["contract"], lastModifiedAt: "2026-08-27T11:20:00" },
  "hood-cleaning": { subtypeId: "cleaning", summary: "Degrease the grill hood and baffles; document before/after per fire code.", cost: 120, rate: 420, unitType: "flatRate", taxable: true, labelIds: ["seasonal"], lastModifiedAt: "2026-07-12T08:30:00" },
  "freezer-seal": { subtypeId: "repair", summary: "Replace the freezer door gasket and check the door alignment.", cost: 45, rate: 150, unitType: "hourly", taxable: false, labelIds: [], lastModifiedAt: "2026-08-15T13:00:00" },
  "range-burner": { subtypeId: "repair", summary: "Repair or replace range burner valves and orifices; test flame quality.", cost: 48, rate: 155, unitType: "hourly", taxable: false, labelIds: [], lastModifiedAt: "2026-09-01T15:40:00" },
  "steam-table": { subtypeId: "repair", summary: "Swap the steam table thermostat and verify holding temperatures.", cost: 35, rate: 190, unitType: "flatRate", taxable: true, labelIds: ["flat-fee"], lastModifiedAt: "2026-06-28T10:00:00" },
  "prep-fridge": { subtypeId: "repair", summary: "Service the prep fridge compressor: coils, charge and start components.", cost: 70, rate: 160, unitType: "hourly", taxable: false, labelIds: [], lastModifiedAt: "2026-08-09T09:45:00" },
  "grease-trap": { subtypeId: "cleaning", summary: "Pump and scrape the grease trap; haul-away included.", cost: 60, rate: 280, unitType: "flatRate", taxable: true, labelIds: ["contract"], lastModifiedAt: "2026-07-22T07:50:00" },
  "espresso": { subtypeId: "cleaning", summary: "Descale the espresso machine group heads and boiler.", cost: 25, rate: 175, unitType: "flatRate", taxable: true, labelIds: [], lastModifiedAt: "2026-08-30T12:10:00" },
};

/**
 * The LABOR pricebook — production `PriceBookItem` rows of type service
 * ("LABR"). Three stories in one table:
 *   - the 12 `SERVICES` rows, derived by id above (Active + confirmed);
 *   - 15 more curated catalog items a real company would write, three of
 *     them with the gaps the empty cells demonstrate (no subtype, no
 *     duration, no summary);
 *   - 8 REVIEW items — the names the SYSTEM mints when a tech types a
 *     free-text service onto a job/estimate/invoice line item (production
 *     `LineItemSerializerMixin.create`, confirmed=False): messy casing,
 *     near-duplicates of real items, cost 0 (production's auto-create
 *     default), no subtype, no duration, no summary — recent dates, because
 *     they appear as work happens;
 *   - 5 INACTIVE legacy items (all confirmed — the UI cannot deactivate an
 *     unconfirmed item, so no "review + inactive" row exists on purpose).
 */
const LABOR_ITEMS_AT_ANCHOR: LaborItem[] = [
  ...SERVICES.map((service) => ({
    id: service.id,
    name: service.name,
    status: "active" as const,
    isActive: true,
    estDurationMinutes: service.defaultDurationMinutes ?? null,
    ...SERVICE_LABOR_FIELDS[service.id]!,
  })),
  // The rest of the confirmed catalog.
  { id: "diagnostic-labor", name: "Diagnostic labor", status: "active", isActive: true, subtypeId: "diagnostics", summary: "First-hour diagnostic on any kitchen equipment; applied toward the repair if approved.", cost: 40, rate: 125, unitType: "hourly", taxable: false, estDurationMinutes: 60, labelIds: [], lastModifiedAt: "2026-08-18T09:30:00" },
  { id: "standard-labor", name: "Standard labor", status: "active", isActive: true, subtypeId: null, summary: "", cost: 45, rate: 135, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-06-05T14:00:00" },
  { id: "helper-labor", name: "Helper labor", status: "active", isActive: true, subtypeId: null, summary: "Second tech on site, billed alongside the lead's labor.", cost: 28, rate: 85, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-06-05T14:05:00" },
  { id: "after-hours-labor", name: "After-hours labor", status: "active", isActive: true, subtypeId: "emergency", summary: "Labor outside business hours (7pm-7am).", cost: 62, rate: 195, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: ["after-hours"], lastModifiedAt: "2026-07-08T18:20:00" },
  { id: "emergency-call-out", name: "Emergency call-out", status: "active", isActive: true, subtypeId: "emergency", summary: "Same-day dispatch fee; covers travel and the first 30 minutes on site.", cost: 70, rate: 250, unitType: "flatRate", taxable: true, estDurationMinutes: 60, labelIds: ["after-hours", "flat-fee"], lastModifiedAt: "2026-08-25T20:10:00" },
  { id: "holiday-labor", name: "Holiday labor", status: "active", isActive: true, subtypeId: "emergency", summary: "Labor on observed holidays, 2x list rate.", cost: 75, rate: 240, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: ["after-hours", "seasonal"], lastModifiedAt: "2026-07-01T09:00:00" },
  { id: "installation-labor", name: "Installation labor", status: "active", isActive: true, subtypeId: "installation", summary: "Set-in-place, connect and level new kitchen equipment.", cost: 50, rate: 150, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-08-11T11:00:00" },
  { id: "equipment-startup", name: "New equipment startup", status: "active", isActive: true, subtypeId: "installation", summary: "Commission a newly installed unit: startup checks, controls setup, owner walkthrough.", cost: 95, rate: 380, unitType: "flatRate", taxable: true, estDurationMinutes: 240, labelIds: ["flat-fee"], lastModifiedAt: "2026-08-13T16:30:00" },
  { id: "refrigerant-recovery", name: "Refrigerant recovery", status: "active", isActive: true, subtypeId: "repair", summary: "Recover and log refrigerant per EPA 608 before a sealed-system repair.", cost: 80, rate: 220, unitType: "flatRate", taxable: true, estDurationMinutes: 90, labelIds: [], lastModifiedAt: "2026-09-02T10:20:00" },
  { id: "compressor-replacement", name: "Compressor replacement", status: "active", isActive: true, subtypeId: "repair", summary: "Replace a failed compressor: recover, swap, braze, evacuate and recharge.", cost: 320, rate: 850, unitType: "flatRate", taxable: true, estDurationMinutes: 240, labelIds: [], lastModifiedAt: "2026-08-29T15:00:00" },
  { id: "pm-visit", name: "Preventive maintenance visit", status: "active", isActive: true, subtypeId: "preventive", summary: "Scheduled PM visit per the service agreement's checklist.", cost: 90, rate: 310, unitType: "flatRate", taxable: true, estDurationMinutes: 120, labelIds: ["contract"], lastModifiedAt: "2026-07-25T08:00:00" },
  { id: "filter-swap", name: "Hood filter exchange", status: "active", isActive: true, subtypeId: "cleaning", summary: "Swap the hood baffle filters for cleaned spares.", cost: 22, rate: 95, unitType: "flatRate", taxable: true, estDurationMinutes: 30, labelIds: ["contract"], lastModifiedAt: "2026-08-06T07:40:00" },
  { id: "water-treatment", name: "Water filtration service", status: "active", isActive: true, subtypeId: "preventive", summary: "Replace water filtration cartridges and test hardness.", cost: 38, rate: 165, unitType: "flatRate", taxable: true, estDurationMinutes: 60, labelIds: [], lastModifiedAt: "2026-08-02T13:15:00" },
  { id: "warranty-labor", name: "Warranty repair labor", status: "active", isActive: true, subtypeId: "repair", summary: "Labor on manufacturer-warranty repairs; billed to the manufacturer, not the client.", cost: 55, rate: 0, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: ["warranty-work"], lastModifiedAt: "2026-07-17T10:45:00" },
  { id: "recall-visit", name: "Recall visit", status: "active", isActive: true, subtypeId: "diagnostics", summary: "Return visit on a recent repair; no charge inside the workmanship window.", cost: 40, rate: 0, unitType: "flatRate", taxable: false, estDurationMinutes: 60, labelIds: ["warranty-work"], lastModifiedAt: "2026-09-03T09:10:00" },
  // The REVIEW inbox — system-minted from free-text line items.
  { id: "rev-compressor-swap", name: "Compressor swap - after hours", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, rate: 210, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-09-03T21:40:00" },
  { id: "rev-weekend-service", name: "Emergency weekend service", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, rate: 300, unitType: "flatRate", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-09-01T08:05:00" },
  { id: "rev-walk-in-call", name: "Walk in cooler service call", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, rate: 165, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-08-28T17:30:00" },
  { id: "rev-misc-labor", name: "Misc labor", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, rate: 95, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-08-26T12:00:00" },
  { id: "rev-trip-charge", name: "Trip charge - south bay", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, rate: 85, unitType: "flatRate", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-08-22T16:15:00" },
  { id: "rev-fryer-recal", name: "fryer recalibration", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, rate: 140, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-08-20T09:50:00" },
  { id: "rev-overtime", name: "Overtime labor 1.5x", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, rate: 205, unitType: "hourly", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-08-16T19:25:00" },
  // The one review row whose line item carried a subtype — production copies
  // it onto the minted item when present.
  { id: "rev-coil-cleaning", name: "Condenser coil cleaning", status: "review", isActive: true, subtypeId: "cleaning", summary: "", cost: 0, rate: 180, unitType: "flatRate", taxable: true, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-09-02T14:45:00" },
  // The INACTIVE legacy shelf.
  { id: "boiler-descale", name: "Boiler descaling", status: "active", isActive: false, subtypeId: "cleaning", summary: "Descale steam boilers (legacy offering).", cost: 60, rate: 240, unitType: "flatRate", taxable: true, estDurationMinutes: 120, labelIds: [], lastModifiedAt: "2026-06-10T10:00:00" },
  { id: "mercury-thermostat", name: "Mercury thermostat swap", status: "active", isActive: false, subtypeId: "repair", summary: "Retired: mercury controls are no longer serviced.", cost: 30, rate: 110, unitType: "flatRate", taxable: true, estDurationMinutes: 60, labelIds: [], lastModifiedAt: "2026-06-02T11:30:00" },
  { id: "fax-dispatch", name: "Fax dispatch fee", status: "active", isActive: false, subtypeId: null, summary: "", cost: 0, rate: 15, unitType: "flatRate", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-06-01T09:00:00" },
  { id: "cfc-handling", name: "CFC refrigerant handling", status: "active", isActive: false, subtypeId: "repair", summary: "Retired with the R-12 phase-out.", cost: 90, rate: 260, unitType: "flatRate", taxable: true, estDurationMinutes: 90, labelIds: [], lastModifiedAt: "2026-06-14T15:20:00" },
  { id: "pager-fee", name: "Pager on-call fee", status: "active", isActive: false, subtypeId: null, summary: "", cost: 0, rate: 25, unitType: "flatRate", taxable: false, estDurationMinutes: null, labelIds: [], lastModifiedAt: "2026-06-01T09:05:00" },
];

/**
 * The workspace's PRODUCT subtypes — production `PriceBookItemSubtype` rows
 * scoped to the part type (a company writes its own; the Labor ones are a
 * separate set, exactly as production scopes them by `pricebook_item_type`).
 * INVENTED like every list's reference table (flagged): the revenue
 * categories a commercial-kitchen service company would actually keep its
 * parts under.
 */
export const PRODUCT_SUBTYPES: PricebookSubtype[] = [
  { id: "refrigeration", name: "Refrigeration parts" },
  { id: "cooking", name: "Cooking equipment parts" },
  { id: "electrical", name: "Electrical" },
  { id: "plumbing", name: "Plumbing" },
  { id: "hardware", name: "Hardware & gaskets" },
  { id: "filtration", name: "Filters & media" },
  { id: "chemicals", name: "Chemicals & supplies" },
];

/** The PRODUCT labels — production `PriceBookItemLabel` scoped to the part
 *  type. INVENTED like every list's (flagged). */
export const PRODUCT_LABELS: PricebookLabel[] = [
  { id: "oem", name: "OEM" },
  { id: "aftermarket", name: "Aftermarket" },
  { id: "special-order", name: "Special order" },
  { id: "truck-stock", name: "Truck stock" },
  { id: "hazmat", name: "Hazmat" },
];

/**
 * The PRODUCTS pricebook — production `PriceBookItem` rows of the part type
 * ("PART"), production's "Parts & Materials". Four stories in one table, the
 * LABOR_ITEMS arrangement:
 *
 *   - 26 TRACKED catalog parts, the warehouse stock: every `StockStatus` is
 *     represented, and `quantity` against `quantityDesired` always agrees
 *     with the status (depleted = 0 on hand, full = at or above target);
 *   - 14 UNTRACKED catalog parts — special-order and bulk items the company
 *     buys per job and never counts (production's Non-Inventory part type);
 *   - 10 REVIEW parts, minted by the SYSTEM. Two production paths, both
 *     here: a free-text part typed onto a job/estimate/invoice line item
 *     (`LineItemSerializerMixin.create`, cost 0 — its default) and a part
 *     typed onto a purchase order (`get_or_create_pricebook_item`, which
 *     copies the PO's expected cost and vendor, so those carry a real cost
 *     and often a manufacturer). EVERY review row is UNTRACKED: production
 *     forces it ("Parts created ad-hoc … always default to non-inventory"),
 *     which is why the Review view's Stock column is all placeholders;
 *   - 8 INACTIVE legacy parts (all confirmed — the UI cannot deactivate an
 *     unconfirmed item, the LABOR_ITEMS rule).
 *
 * Deliberate gaps, for the empty cells: parts with no manufacturer, no part
 * number, no subtype and no summary.
 */
const PRODUCT_ITEMS_AT_ANCHOR: ProductItem[] = [
  // ---- TRACKED catalog: refrigeration ----
  { id: "prod-door-gasket-36", name: "Walk-in door gasket, 36 in", status: "active", isActive: true, subtypeId: "hardware", summary: "Magnetic door gasket for a 36 in walk-in door; cut and fitted on site.", cost: 48, price: 132, taxable: true, manufacturer: "Kason", partNumber: "1855-36-GKT", trackInventory: true, stock: "full", quantity: 14, quantityDesired: 12, labelIds: ["oem", "truck-stock"], lastModifiedAt: "2026-08-21T14:30:00" },
  { id: "prod-evap-fan-motor", name: "Evaporator fan motor, 9W", status: "active", isActive: true, subtypeId: "refrigeration", summary: "9 watt shaded-pole evaporator fan motor, 115V.", cost: 62, price: 168, taxable: true, manufacturer: "Fasco", partNumber: "D1126", trackInventory: true, stock: "limited", quantity: 5, quantityDesired: 10, labelIds: ["truck-stock"], lastModifiedAt: "2026-08-27T11:20:00" },
  { id: "prod-condenser-fan-blade", name: "Condenser fan blade, 10 in", status: "active", isActive: true, subtypeId: "refrigeration", summary: "", cost: 21, price: 58, taxable: true, manufacturer: "Supco", partNumber: "FB1015", trackInventory: true, stock: "full", quantity: 9, quantityDesired: 6, labelIds: ["aftermarket"], lastModifiedAt: "2026-07-30T10:15:00" },
  { id: "prod-start-relay", name: "Compressor start relay", status: "active", isActive: true, subtypeId: "refrigeration", summary: "Hard-start relay and capacitor kit for reach-in compressors.", cost: 18, price: 52, taxable: true, manufacturer: "Supco", partNumber: "RCO410", trackInventory: true, stock: "low", quantity: 2, quantityDesired: 12, labelIds: ["truck-stock"], lastModifiedAt: "2026-09-02T10:20:00" },
  { id: "prod-txv-valve", name: "Thermostatic expansion valve", status: "active", isActive: true, subtypeId: "refrigeration", summary: "TXV for medium-temp R-404A systems; includes the bulb strap.", cost: 96, price: 245, taxable: true, manufacturer: "Sporlan", partNumber: "EBSVE-1-CP100", trackInventory: true, stock: "limited", quantity: 3, quantityDesired: 6, labelIds: ["oem"], lastModifiedAt: "2026-08-15T13:00:00" },
  { id: "prod-defrost-timer", name: "Defrost timer", status: "active", isActive: true, subtypeId: "refrigeration", summary: "Mechanical defrost timer, 4-terminal.", cost: 44, price: 118, taxable: true, manufacturer: "Paragon", partNumber: "8145-20", trackInventory: true, stock: "full", quantity: 8, quantityDesired: 8, labelIds: [], lastModifiedAt: "2026-07-12T08:30:00" },
  { id: "prod-r404a", name: "Refrigerant R-404A, 24 lb cylinder", status: "active", isActive: true, subtypeId: "refrigeration", summary: "24 lb cylinder; recovered weight is logged per EPA 608.", cost: 280, price: 640, taxable: true, manufacturer: "Chemours", partNumber: "R404A-24", trackInventory: true, stock: "low", quantity: 1, quantityDesired: 6, labelIds: ["hazmat"], lastModifiedAt: "2026-09-03T09:10:00" },
  { id: "prod-liquid-line-drier", name: "Liquid line filter drier", status: "active", isActive: true, subtypeId: "refrigeration", summary: "", cost: 26, price: 72, taxable: true, manufacturer: "Sporlan", partNumber: "C-163-S", trackInventory: true, stock: "full", quantity: 18, quantityDesired: 12, labelIds: ["truck-stock"], lastModifiedAt: "2026-08-09T09:45:00" },
  { id: "prod-door-closer", name: "Walk-in door closer", status: "active", isActive: true, subtypeId: "hardware", summary: "Spring door closer for walk-in cooler and freezer doors.", cost: 39, price: 105, taxable: true, manufacturer: "Kason", partNumber: "1094", trackInventory: true, stock: "depleted", quantity: 0, quantityDesired: 4, labelIds: [], lastModifiedAt: "2026-08-04T09:00:00" },
  { id: "prod-door-hinge", name: "Walk-in door hinge, cam-lift", status: "active", isActive: true, subtypeId: "hardware", summary: "", cost: 34, price: 92, taxable: true, manufacturer: "Kason", partNumber: "1245-000010", trackInventory: true, stock: "limited", quantity: 4, quantityDesired: 8, labelIds: [], lastModifiedAt: "2026-06-19T16:45:00" },

  // ---- TRACKED catalog: ice, cooking, electrical, plumbing ----
  { id: "prod-ice-water-pump", name: "Ice machine water pump", status: "active", isActive: true, subtypeId: "refrigeration", summary: "Circulation pump for cube ice machines.", cost: 118, price: 295, taxable: true, manufacturer: "Manitowoc", partNumber: "7601773", trackInventory: true, stock: "limited", quantity: 2, quantityDesired: 5, labelIds: ["oem"], lastModifiedAt: "2026-08-30T12:10:00" },
  { id: "prod-ice-water-filter", name: "Ice machine water filter cartridge", status: "active", isActive: true, subtypeId: "filtration", summary: "Replacement cartridge; changed at every descale visit.", cost: 42, price: 110, taxable: true, manufacturer: "3M", partNumber: "HF20-MS", trackInventory: true, stock: "full", quantity: 22, quantityDesired: 16, labelIds: ["truck-stock"], lastModifiedAt: "2026-08-02T13:15:00" },
  { id: "prod-fryer-thermostat", name: "Fryer high-limit thermostat", status: "active", isActive: true, subtypeId: "cooking", summary: "High-limit safety thermostat for gas fryers.", cost: 74, price: 195, taxable: true, manufacturer: "Robertshaw", partNumber: "5300-472", trackInventory: true, stock: "low", quantity: 1, quantityDesired: 8, labelIds: ["oem"], lastModifiedAt: "2026-09-01T15:40:00" },
  { id: "prod-fryer-filter-paper", name: "Fryer filter paper, case of 100", status: "active", isActive: true, subtypeId: "filtration", summary: "Case of 100 sheets for oil filtration.", cost: 58, price: 142, taxable: true, manufacturer: "Frymaster", partNumber: "803-0170", trackInventory: true, stock: "full", quantity: 11, quantityDesired: 8, labelIds: [], lastModifiedAt: "2026-07-22T07:50:00" },
  { id: "prod-range-burner-valve", name: "Range burner valve", status: "active", isActive: true, subtypeId: "cooking", summary: "Manual gas valve for open-top range burners.", cost: 52, price: 138, taxable: true, manufacturer: "Vulcan", partNumber: "00-410585", trackInventory: true, stock: "limited", quantity: 3, quantityDesired: 6, labelIds: ["oem"], lastModifiedAt: "2026-09-01T15:45:00" },
  { id: "prod-pilot-assembly", name: "Pilot burner assembly", status: "active", isActive: true, subtypeId: "cooking", summary: "", cost: 29, price: 78, taxable: true, manufacturer: "Vulcan", partNumber: "00-846568", trackInventory: true, stock: "full", quantity: 7, quantityDesired: 6, labelIds: ["truck-stock"], lastModifiedAt: "2026-06-28T10:00:00" },
  { id: "prod-thermocouple", name: "Thermocouple, 36 in", status: "active", isActive: true, subtypeId: "cooking", summary: "Universal 36 in thermocouple.", cost: 9, price: 28, taxable: true, manufacturer: "Robertshaw", partNumber: "1980-036", trackInventory: true, stock: "full", quantity: 31, quantityDesired: 24, labelIds: ["truck-stock", "aftermarket"], lastModifiedAt: "2026-08-11T11:00:00" },
  { id: "prod-oven-door-spring", name: "Oven door spring", status: "active", isActive: true, subtypeId: "hardware", summary: "", cost: 16, price: 44, taxable: true, manufacturer: "", partNumber: "", trackInventory: true, stock: "depleted", quantity: 0, quantityDesired: 6, labelIds: [], lastModifiedAt: "2026-06-05T14:00:00" },
  { id: "prod-combi-door-gasket", name: "Combi oven door gasket", status: "active", isActive: true, subtypeId: "hardware", summary: "Door seal for combi ovens; replaced at the quarterly PM.", cost: 88, price: 225, taxable: true, manufacturer: "Rational", partNumber: "40.00.394", trackInventory: true, stock: "limited", quantity: 2, quantityDesired: 4, labelIds: ["oem"], lastModifiedAt: "2026-08-27T11:25:00" },
  { id: "prod-contactor-30a", name: "Contactor, 30A 2-pole", status: "active", isActive: true, subtypeId: "electrical", summary: "", cost: 24, price: 68, taxable: true, manufacturer: "Packard", partNumber: "C230B", trackInventory: true, stock: "full", quantity: 12, quantityDesired: 10, labelIds: ["truck-stock"], lastModifiedAt: "2026-08-18T09:30:00" },
  { id: "prod-run-capacitor", name: "Run capacitor, 370V", status: "active", isActive: true, subtypeId: "electrical", summary: "Dual run capacitor, 370 volt.", cost: 13, price: 38, taxable: true, manufacturer: "Titan", partNumber: "TRCFD455", trackInventory: true, stock: "low", quantity: 3, quantityDesired: 20, labelIds: ["truck-stock"], lastModifiedAt: "2026-08-25T20:10:00" },
  { id: "prod-door-switch", name: "Door switch, magnetic", status: "active", isActive: true, subtypeId: "electrical", summary: "", cost: 11, price: 32, taxable: true, manufacturer: "Supco", partNumber: "DS100", trackInventory: true, stock: "full", quantity: 15, quantityDesired: 12, labelIds: [], lastModifiedAt: "2026-07-08T18:20:00" },
  { id: "prod-dish-wash-pump", name: "Dish machine wash pump motor", status: "active", isActive: true, subtypeId: "plumbing", summary: "Wash pump motor for door-type dish machines.", cost: 245, price: 595, taxable: true, manufacturer: "Hobart", partNumber: "00-917676", trackInventory: true, stock: "depleted", quantity: 0, quantityDesired: 2, labelIds: ["oem", "special-order"], lastModifiedAt: "2026-08-29T15:00:00" },
  { id: "prod-drain-valve", name: "Steam table drain valve", status: "active", isActive: true, subtypeId: "plumbing", summary: "", cost: 27, price: 74, taxable: true, manufacturer: "T&S Brass", partNumber: "013391-40", trackInventory: true, stock: "full", quantity: 6, quantityDesired: 4, labelIds: [], lastModifiedAt: "2026-07-25T08:00:00" },
  { id: "prod-gas-hose", name: "Gas connector hose, 1 in x 48 in", status: "active", isActive: true, subtypeId: "plumbing", summary: "Quick-disconnect gas hose kit with restraining cable.", cost: 132, price: 320, taxable: true, manufacturer: "Dormont", partNumber: "1650KIT48", trackInventory: true, stock: "limited", quantity: 2, quantityDesired: 4, labelIds: ["oem"], lastModifiedAt: "2026-08-13T16:30:00" },
  { id: "prod-hood-baffle", name: "Hood baffle filter, 20 x 20", status: "active", isActive: true, subtypeId: "filtration", summary: "Stainless baffle filter, exchanged on the cleaning route.", cost: 34, price: 88, taxable: true, manufacturer: "Kleen-Gard", partNumber: "BF2020", trackInventory: true, stock: "full", quantity: 28, quantityDesired: 20, labelIds: ["truck-stock"], lastModifiedAt: "2026-08-06T07:40:00" },

  // ---- UNTRACKED catalog (production's Non-Inventory part type) ----
  { id: "prod-compressor-2hp", name: "Compressor, 2 HP R-404A", status: "active", isActive: true, subtypeId: "refrigeration", summary: "Ordered per job; quoted with the sealed-system repair.", cost: 720, price: 1680, taxable: true, manufacturer: "Copeland", partNumber: "RS64C1E-CAV-260", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["oem", "special-order"], lastModifiedAt: "2026-08-29T15:05:00" },
  { id: "prod-condensing-unit", name: "Condensing unit, 1.5 HP", status: "active", isActive: true, subtypeId: "refrigeration", summary: "Outdoor condensing unit; freight quoted separately.", cost: 1450, price: 3200, taxable: true, manufacturer: "Heatcraft", partNumber: "BZT015L6C", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["special-order"], lastModifiedAt: "2026-08-13T16:35:00" },
  { id: "prod-ice-machine-board", name: "Ice machine control board", status: "active", isActive: true, subtypeId: "refrigeration", summary: "Control board; returns are non-refundable once installed.", cost: 410, price: 950, taxable: true, manufacturer: "Hoshizaki", partNumber: "2A3372-01", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["oem", "special-order"], lastModifiedAt: "2026-08-30T12:15:00" },
  { id: "prod-fryer-tank", name: "Fryer tank weldment", status: "active", isActive: true, subtypeId: "cooking", summary: "", cost: 890, price: 2100, taxable: true, manufacturer: "Frymaster", partNumber: "8262276", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["special-order"], lastModifiedAt: "2026-07-30T10:20:00" },
  { id: "prod-griddle-plate", name: "Griddle plate, 36 in", status: "active", isActive: true, subtypeId: "cooking", summary: "Replacement griddle plate; two techs required to set.", cost: 640, price: 1480, taxable: true, manufacturer: "Vulcan", partNumber: "00-854321", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["special-order"], lastModifiedAt: "2026-08-11T11:05:00" },
  { id: "prod-prep-fridge-lid", name: "Prep fridge lid assembly", status: "active", isActive: true, subtypeId: "hardware", summary: "", cost: 265, price: 620, taxable: true, manufacturer: "True", partNumber: "883186", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["oem"], lastModifiedAt: "2026-08-09T09:50:00" },
  { id: "prod-shelf-kit", name: "Walk-in shelving kit, 4 tier", status: "active", isActive: true, subtypeId: null, summary: "Four-tier NSF shelving unit for walk-in coolers.", cost: 310, price: 690, taxable: true, manufacturer: "Metro", partNumber: "SUPER-4T-2448", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-07-01T09:00:00" },
  { id: "prod-descaler", name: "Descaling solution, 1 gal", status: "active", isActive: true, subtypeId: "chemicals", summary: "Nickel-safe descaler for ice machines and steamers.", cost: 36, price: 92, taxable: true, manufacturer: "Nu-Calgon", partNumber: "4287-08", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["hazmat"], lastModifiedAt: "2026-08-04T09:05:00" },
  { id: "prod-coil-cleaner", name: "Coil cleaner, 1 gal", status: "active", isActive: true, subtypeId: "chemicals", summary: "", cost: 28, price: 74, taxable: true, manufacturer: "Nu-Calgon", partNumber: "4171-75", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["hazmat"], lastModifiedAt: "2026-07-17T10:45:00" },
  { id: "prod-degreaser", name: "Hood degreaser, 5 gal pail", status: "active", isActive: true, subtypeId: "chemicals", summary: "Heavy-duty degreaser for the hood cleaning route.", cost: 84, price: 190, taxable: true, manufacturer: "Zep", partNumber: "1041489", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["hazmat"], lastModifiedAt: "2026-07-12T08:35:00" },
  { id: "prod-sanitizer-tabs", name: "Sanitizer tablets, 100 ct", status: "active", isActive: true, subtypeId: "chemicals", summary: "", cost: 22, price: 58, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-06-05T14:05:00" },
  { id: "prod-freight", name: "Freight & handling", status: "active", isActive: true, subtypeId: null, summary: "Pass-through freight on special-order parts.", cost: 0, price: 0, taxable: false, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-06-01T09:00:00" },
  { id: "prod-shop-supplies", name: "Shop supplies", status: "active", isActive: true, subtypeId: null, summary: "Solder, nitrogen, rags and other consumables on a repair.", cost: 0, price: 35, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-06-01T09:05:00" },
  { id: "prod-warranty-part", name: "Warranty part (no charge)", status: "active", isActive: true, subtypeId: null, summary: "Part covered by the manufacturer's warranty; billed to them, not the client.", cost: 0, price: 0, taxable: false, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["oem"], lastModifiedAt: "2026-07-17T10:50:00" },

  // ---- the REVIEW inbox — system-minted, always untracked ----
  // From a free-text LINE ITEM (cost 0, production's auto-create default).
  { id: "prod-rev-gasket", name: "door gasket walk in", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 140, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-09-03T21:40:00" },
  { id: "prod-rev-fan-motor", name: "Fan motor - evap", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 175, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-09-02T14:45:00" },
  { id: "prod-rev-capacitor", name: "capacitor 45/5", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 40, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-09-01T08:05:00" },
  { id: "prod-rev-misc-parts", name: "Misc parts", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 85, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-08-26T12:00:00" },
  { id: "prod-rev-thermostat", name: "thermostat (fryer)", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 200, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-08-20T09:50:00" },
  { id: "prod-rev-hinge-kit", name: "hinge kit", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 95, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-08-16T19:25:00" },
  // From a PURCHASE ORDER (the PO path copies the expected cost and the
  // vendor's part number, so these arrive with a real cost).
  { id: "prod-rev-water-valve", name: "Water inlet valve", status: "review", isActive: true, subtypeId: null, summary: "", cost: 64, price: 0, taxable: true, manufacturer: "Hoshizaki", partNumber: "4A4130-01", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-09-04T10:00:00" },
  { id: "prod-rev-blower-wheel", name: "Blower wheel 5in", status: "review", isActive: true, subtypeId: null, summary: "", cost: 38, price: 0, taxable: true, manufacturer: "Fasco", partNumber: "BW5-104", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-09-03T11:30:00" },
  { id: "prod-rev-heat-element", name: "heating element 208v", status: "review", isActive: true, subtypeId: null, summary: "", cost: 155, price: 0, taxable: true, manufacturer: "Hatco", partNumber: "02.12.030.00", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-08-28T17:30:00" },
  // The one review row whose line item carried a subtype — production copies
  // it onto the minted item when the line item has one.
  { id: "prod-rev-filter-cart", name: "water filter cartridge", status: "review", isActive: true, subtypeId: "filtration", summary: "", cost: 0, price: 115, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-08-22T16:15:00" },

  // ---- the INACTIVE legacy shelf (all confirmed) ----
  { id: "prod-r12", name: "Refrigerant R-12, 15 lb", status: "active", isActive: false, subtypeId: "refrigeration", summary: "Retired with the R-12 phase-out.", cost: 420, price: 0, taxable: true, manufacturer: "Chemours", partNumber: "R12-15", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["hazmat"], lastModifiedAt: "2026-06-14T15:20:00" },
  { id: "prod-mercury-bulb", name: "Mercury thermostat bulb", status: "active", isActive: false, subtypeId: "electrical", summary: "Retired: mercury controls are no longer serviced.", cost: 28, price: 82, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["hazmat"], lastModifiedAt: "2026-06-02T11:30:00" },
  { id: "prod-r22", name: "Refrigerant R-22, 30 lb", status: "active", isActive: false, subtypeId: "refrigeration", summary: "", cost: 890, price: 0, taxable: true, manufacturer: "Chemours", partNumber: "R22-30", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["hazmat"], lastModifiedAt: "2026-06-10T10:00:00" },
  { id: "prod-halogen-lamp", name: "Halogen display lamp, 50W", status: "active", isActive: false, subtypeId: "electrical", summary: "Superseded by the LED lamp.", cost: 6, price: 18, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-06-01T09:10:00" },
  { id: "prod-r134a-small", name: "Refrigerant R-134a, 12 oz can", status: "active", isActive: false, subtypeId: "refrigeration", summary: "Small cans discontinued; bulk cylinders only.", cost: 14, price: 42, taxable: true, manufacturer: "Chemours", partNumber: "R134A-12OZ", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: ["hazmat"], lastModifiedAt: "2026-06-03T10:30:00" },
  { id: "prod-fax-paper", name: "Fax roll", status: "active", isActive: false, subtypeId: null, summary: "", cost: 4, price: 12, taxable: true, manufacturer: "", partNumber: "", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-06-01T09:15:00" },
  { id: "prod-legacy-ballast", name: "Fluorescent ballast, T12", status: "active", isActive: false, subtypeId: "electrical", summary: "T12 lamps are no longer stocked.", cost: 32, price: 88, taxable: true, manufacturer: "Advance", partNumber: "REL-2P32-SC", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-06-07T14:00:00" },
  { id: "prod-legacy-belt", name: "Conveyor toaster belt (legacy)", status: "active", isActive: false, subtypeId: "cooking", summary: "", cost: 76, price: 190, taxable: true, manufacturer: "Prince Castle", partNumber: "88-136S", trackInventory: false, stock: null, quantity: null, quantityDesired: null, labelIds: [], lastModifiedAt: "2026-06-12T09:20:00" },
];

/**
 * The workspace's OTHER-charge subtypes and labels — production
 * `PriceBookItemSubtype` / `PriceBookItemLabel` rows scoped to the "other"
 * type. INVENTED like every list's reference tables (flagged): the
 * pass-through and fee categories a service company bills outside labor and
 * parts.
 */
export const OTHER_SUBTYPES: PricebookSubtype[] = [
  { id: "travel", name: "Travel & mileage" },
  { id: "permits", name: "Permits & fees" },
  { id: "rental", name: "Equipment rental" },
  { id: "disposal", name: "Disposal & recycling" },
  { id: "subcontract", name: "Subcontracted work" },
];

export const OTHER_LABELS: PricebookLabel[] = [
  { id: "pass-through", name: "Pass-through" },
  { id: "contract", name: "Contract" },
  { id: "after-hours", name: "After hours" },
  { id: "compliance", name: "Compliance" },
];

/** The DISCOUNT subtypes and labels — production's tables scoped to the
 *  discount type. INVENTED (flagged). */
export const DISCOUNT_SUBTYPES: PricebookSubtype[] = [
  { id: "agreement", name: "Service agreement" },
  { id: "promotional", name: "Promotional" },
  { id: "goodwill", name: "Goodwill" },
  { id: "volume", name: "Volume" },
];

export const DISCOUNT_LABELS: PricebookLabel[] = [
  { id: "contract", name: "Contract" },
  { id: "one-time", name: "One-time" },
  { id: "seasonal", name: "Seasonal" },
];

/** The TAX-RATE labels — production's table scoped to the tax type. INVENTED
 *  (flagged); a rate's label is how a company groups its jurisdictions. */
export const TAX_RATE_LABELS: PricebookLabel[] = [
  { id: "state", name: "State" },
  { id: "county", name: "County" },
  { id: "city", name: "City" },
  { id: "special", name: "Special district" },
];

/**
 * The OTHER pricebook — production `PriceBookItem` rows of the "other charge"
 * type ("MISC"). The charges a service company bills that are neither labor
 * nor a part: travel, permits, rentals, disposal, subcontractors.
 *
 * 22 rows, the LABOR_ITEMS arrangement: 14 confirmed catalog charges (three
 * with deliberate gaps — no subtype, no summary), 4 REVIEW rows minted by the
 * system from free-text line items (cost 0, its auto-create default, no
 * subtype and no summary) and 4 INACTIVE legacy charges (all confirmed).
 */
const OTHER_ITEMS_AT_ANCHOR: ChargeItem[] = [
  { id: "other-trip-charge", name: "Trip charge", status: "active", isActive: true, subtypeId: "travel", summary: "Standard travel to site within the service area.", cost: 18, price: 65, taxable: false, labelIds: [], lastModifiedAt: "2026-08-21T14:30:00" },
  { id: "other-mileage", name: "Mileage, per mile", status: "active", isActive: true, subtypeId: "travel", summary: "Billed per mile beyond the 25-mile service radius.", cost: 0.4, price: 1.25, taxable: false, labelIds: ["pass-through"], lastModifiedAt: "2026-07-30T10:15:00" },
  { id: "other-after-hours-trip", name: "After-hours trip charge", status: "active", isActive: true, subtypeId: "travel", summary: "Travel outside business hours.", cost: 30, price: 125, taxable: false, labelIds: ["after-hours"], lastModifiedAt: "2026-08-25T20:10:00" },
  { id: "other-permit", name: "Permit fee", status: "active", isActive: true, subtypeId: "permits", summary: "City permit pulled for the job; billed at cost.", cost: 145, price: 145, taxable: false, labelIds: ["pass-through", "compliance"], lastModifiedAt: "2026-08-11T11:00:00" },
  { id: "other-health-inspection", name: "Health department filing", status: "active", isActive: true, subtypeId: "permits", summary: "", cost: 75, price: 95, taxable: false, labelIds: ["compliance"], lastModifiedAt: "2026-07-12T08:30:00" },
  { id: "other-fire-cert", name: "Hood cleaning certificate", status: "active", isActive: true, subtypeId: "permits", summary: "Fire-code certificate issued after a hood cleaning.", cost: 0, price: 45, taxable: false, labelIds: ["compliance", "contract"], lastModifiedAt: "2026-07-22T07:50:00" },
  { id: "other-lift-rental", name: "Scissor lift rental, per day", status: "active", isActive: true, subtypeId: "rental", summary: "Daily rental for rooftop and high-ceiling work.", cost: 180, price: 340, taxable: true, labelIds: ["pass-through"], lastModifiedAt: "2026-08-13T16:30:00" },
  { id: "other-crane", name: "Crane service", status: "active", isActive: true, subtypeId: "rental", summary: "Crane and operator for a rooftop unit swap.", cost: 950, price: 1650, taxable: true, labelIds: ["pass-through"], lastModifiedAt: "2026-08-29T15:00:00" },
  { id: "other-temp-fridge", name: "Temporary refrigeration rental", status: "active", isActive: true, subtypeId: "rental", summary: "Loaner reach-in while the unit is down; billed weekly.", cost: 220, price: 480, taxable: true, labelIds: [], lastModifiedAt: "2026-09-02T10:20:00" },
  { id: "other-disposal", name: "Equipment disposal", status: "active", isActive: true, subtypeId: "disposal", summary: "Haul-away and certified disposal of a retired unit.", cost: 85, price: 220, taxable: true, labelIds: [], lastModifiedAt: "2026-08-06T07:40:00" },
  { id: "other-refrigerant-reclaim", name: "Refrigerant reclamation fee", status: "active", isActive: true, subtypeId: "disposal", summary: "EPA-compliant reclamation of recovered refrigerant.", cost: 40, price: 110, taxable: false, labelIds: ["compliance"], lastModifiedAt: "2026-09-03T09:10:00" },
  { id: "other-grease-haul", name: "Grease haul-away", status: "active", isActive: true, subtypeId: "disposal", summary: "", cost: 60, price: 165, taxable: true, labelIds: ["contract"], lastModifiedAt: "2026-07-25T08:00:00" },
  { id: "other-electrician", name: "Subcontracted electrician", status: "active", isActive: true, subtypeId: "subcontract", summary: "Licensed electrician brought in for panel work.", cost: 340, price: 620, taxable: false, labelIds: ["pass-through"], lastModifiedAt: "2026-08-18T09:30:00" },
  { id: "other-restocking", name: "Restocking fee", status: "active", isActive: true, subtypeId: null, summary: "", cost: 0, price: 85, taxable: true, labelIds: [], lastModifiedAt: "2026-06-05T14:00:00" },
  // The REVIEW inbox — system-minted from free-text line items.
  { id: "other-rev-parking", name: "parking downtown", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 40, taxable: false, labelIds: [], lastModifiedAt: "2026-09-03T21:40:00" },
  { id: "other-rev-expedite", name: "Expedite fee", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 150, taxable: false, labelIds: [], lastModifiedAt: "2026-09-01T08:05:00" },
  { id: "other-rev-storage", name: "storage fee - 2 weeks", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 120, taxable: true, labelIds: [], lastModifiedAt: "2026-08-26T12:00:00" },
  { id: "other-rev-misc-charge", name: "Misc charge", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 75, taxable: false, labelIds: [], lastModifiedAt: "2026-08-20T09:50:00" },
  // The INACTIVE legacy shelf.
  { id: "other-fuel-surcharge", name: "Fuel surcharge", status: "active", isActive: false, subtypeId: "travel", summary: "Retired when travel was folded into the trip charge.", cost: 0, price: 12, taxable: false, labelIds: [], lastModifiedAt: "2026-06-10T10:00:00" },
  { id: "other-fax-fee", name: "Document fax fee", status: "active", isActive: false, subtypeId: null, summary: "", cost: 0, price: 5, taxable: false, labelIds: [], lastModifiedAt: "2026-06-01T09:00:00" },
  { id: "other-pager-rental", name: "Pager rental", status: "active", isActive: false, subtypeId: "rental", summary: "", cost: 3, price: 15, taxable: true, labelIds: [], lastModifiedAt: "2026-06-01T09:05:00" },
  { id: "other-cfc-disposal", name: "CFC disposal surcharge", status: "active", isActive: false, subtypeId: "disposal", summary: "Retired with the R-12 phase-out.", cost: 55, price: 140, taxable: false, labelIds: ["compliance"], lastModifiedAt: "2026-06-14T15:20:00" },
];

/**
 * The DISCOUNTS pricebook — production `PriceBookItem` rows of the discount
 * type ("DISC"). EVERY price is zero or negative (production's sign rule),
 * every `cost` is 0 and every `taxable` is false, because production's form
 * offers neither field for a discount.
 *
 * 19 rows: 13 confirmed, 3 REVIEW (minted from free-text line items) and 3
 * INACTIVE. The confirmed set spans $15 to $2,500 off, so the node's own
 * ladder ($100 through $5,000) has something to answer at every step.
 */
const DISCOUNT_ITEMS_AT_ANCHOR: ChargeItem[] = [
  { id: "disc-contract-labor", name: "Service agreement labor discount", status: "active", isActive: true, subtypeId: "agreement", summary: "10% off labor for locations on a service agreement.", cost: 0, price: -25, taxable: false, labelIds: ["contract"], lastModifiedAt: "2026-08-21T14:30:00" },
  { id: "disc-contract-parts", name: "Service agreement parts discount", status: "active", isActive: true, subtypeId: "agreement", summary: "Contract rate on parts.", cost: 0, price: -15, taxable: false, labelIds: ["contract"], lastModifiedAt: "2026-08-21T14:35:00" },
  { id: "disc-pm-bundle", name: "PM bundle discount", status: "active", isActive: true, subtypeId: "agreement", summary: "Applied when four quarterly visits are booked together.", cost: 0, price: -300, taxable: false, labelIds: ["contract"], lastModifiedAt: "2026-07-25T08:00:00" },
  { id: "disc-first-visit", name: "New client first-visit discount", status: "active", isActive: true, subtypeId: "promotional", summary: "One-time welcome credit on a first job.", cost: 0, price: -50, taxable: false, labelIds: ["one-time"], lastModifiedAt: "2026-08-11T11:00:00" },
  { id: "disc-referral", name: "Referral credit", status: "active", isActive: true, subtypeId: "promotional", summary: "", cost: 0, price: -75, taxable: false, labelIds: ["one-time"], lastModifiedAt: "2026-08-18T09:30:00" },
  { id: "disc-offseason", name: "Off-season PM discount", status: "active", isActive: true, subtypeId: "promotional", summary: "Discount on preventive maintenance booked in the slow season.", cost: 0, price: -90, taxable: false, labelIds: ["seasonal"], lastModifiedAt: "2026-07-01T09:00:00" },
  { id: "disc-goodwill", name: "Goodwill adjustment", status: "active", isActive: true, subtypeId: "goodwill", summary: "Manager-approved credit after a service issue.", cost: 0, price: -100, taxable: false, labelIds: ["one-time"], lastModifiedAt: "2026-09-02T10:20:00" },
  { id: "disc-callback", name: "Callback credit", status: "active", isActive: true, subtypeId: "goodwill", summary: "No charge on a return visit inside the workmanship window.", cost: 0, price: -165, taxable: false, labelIds: [], lastModifiedAt: "2026-09-03T09:10:00" },
  { id: "disc-multi-unit", name: "Multi-unit discount", status: "active", isActive: true, subtypeId: "volume", summary: "Applied when three or more units are serviced on one visit.", cost: 0, price: -60, taxable: false, labelIds: ["contract"], lastModifiedAt: "2026-08-06T07:40:00" },
  { id: "disc-prepay", name: "Prepayment discount", status: "active", isActive: true, subtypeId: "volume", summary: "", cost: 0, price: -500, taxable: false, labelIds: [], lastModifiedAt: "2026-08-29T15:00:00" },
  { id: "disc-loyalty", name: "Loyalty discount", status: "active", isActive: true, subtypeId: "volume", summary: "Applied on the anniversary of a client's first job.", cost: 0, price: -350, taxable: false, labelIds: ["contract"], lastModifiedAt: "2026-08-14T10:30:00" },
  { id: "disc-annual-agreement", name: "Annual agreement credit", status: "active", isActive: true, subtypeId: "agreement", summary: "Credit applied when a year of coverage is paid up front.", cost: 0, price: -1200, taxable: false, labelIds: ["contract"], lastModifiedAt: "2026-09-01T11:15:00" },
  { id: "disc-equipment-promo", name: "Equipment replacement promotion", status: "active", isActive: true, subtypeId: "promotional", summary: "Manufacturer-funded credit toward a full unit replacement.", cost: 0, price: -2500, taxable: false, labelIds: ["seasonal", "one-time"], lastModifiedAt: "2026-08-26T09:40:00" },
  // The REVIEW inbox.
  { id: "disc-rev-manager", name: "manager discount", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: -50, taxable: false, labelIds: [], lastModifiedAt: "2026-09-03T21:40:00" },
  { id: "disc-rev-courtesy", name: "Courtesy discount", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: -25, taxable: false, labelIds: [], lastModifiedAt: "2026-08-28T17:30:00" },
  { id: "disc-rev-adjustment", name: "adjustment", status: "review", isActive: true, subtypeId: null, summary: "", cost: 0, price: 0, taxable: false, labelIds: [], lastModifiedAt: "2026-08-22T16:15:00" },
  // The INACTIVE legacy shelf.
  { id: "disc-grand-opening", name: "Grand opening promotion", status: "active", isActive: false, subtypeId: "promotional", summary: "Ran through the 2025 season.", cost: 0, price: -150, taxable: false, labelIds: ["seasonal"], lastModifiedAt: "2026-06-10T10:00:00" },
  { id: "disc-covid-relief", name: "Reopening relief discount", status: "active", isActive: false, subtypeId: "goodwill", summary: "", cost: 0, price: -250, taxable: false, labelIds: [], lastModifiedAt: "2026-06-02T11:30:00" },
  { id: "disc-paper-invoice", name: "Paperless billing credit", status: "active", isActive: false, subtypeId: null, summary: "", cost: 0, price: -5, taxable: false, labelIds: [], lastModifiedAt: "2026-06-01T09:00:00" },
];

/**
 * The pricebook fields of the four rates that are ALSO the `TAX_RATES` rows —
 * the same production record seen from two sides, joined by id below so a
 * rate can never disagree between the Clients list's "Default tax rate"
 * filter and this list. All four are Active + confirmed: clients point at
 * them, and production only offers CONFIRMED tax items as a default
 * (`pricebook_item_tax_limiter`).
 */
const TAX_RATE_PRICEBOOK_FIELDS: Record<string, Pick<TaxRateItem, "summary" | "labelIds" | "lastModifiedAt">> = {
  "sf-sales": { summary: "San Francisco combined sales tax.", labelIds: ["state", "county", "city"], lastModifiedAt: "2026-08-21T14:30:00" },
  "oakland-sales": { summary: "Oakland combined sales tax.", labelIds: ["state", "county", "city"], lastModifiedAt: "2026-08-04T09:00:00" },
  "ca-sales": { summary: "California statewide base rate.", labelIds: ["state"], lastModifiedAt: "2026-07-12T08:30:00" },
  "tax-exempt": { summary: "Applied to exempt clients; a real 0% rate, not a missing one.", labelIds: [], lastModifiedAt: "2026-06-19T16:45:00" },
};

/**
 * The TAX RATES pricebook — production `PriceBookItem` rows of the tax type.
 * The four `TAX_RATES` rows derived by id above, plus the rest of a real
 * jurisdiction set, 3 REVIEW rows and 3 inactive ones. 14 in all.
 *
 * Every rate is a PERCENT and none exceeds 100 (production validates that in
 * three places). NO subtype, NO cost and NO taxability exist for this type.
 */
const TAX_RATE_ITEMS_AT_ANCHOR: TaxRateItem[] = [
  ...TAX_RATES.map((rate) => ({
    id: rate.id,
    name: rate.name,
    status: "active" as const,
    isActive: true,
    rate: rate.rate,
    ...TAX_RATE_PRICEBOOK_FIELDS[rate.id]!,
  })),
  // The rest of the confirmed catalog.
  { id: "tax-san-mateo", name: "San Mateo County sales tax", status: "active", isActive: true, rate: 9.63, summary: "San Mateo County combined rate.", labelIds: ["state", "county"], lastModifiedAt: "2026-08-09T09:45:00" },
  { id: "tax-marin", name: "Marin County sales tax", status: "active", isActive: true, rate: 8.25, summary: "", labelIds: ["state", "county"], lastModifiedAt: "2026-07-30T10:15:00" },
  { id: "tax-berkeley", name: "Berkeley sales tax", status: "active", isActive: true, rate: 10.25, summary: "Berkeley combined rate.", labelIds: ["state", "county", "city"], lastModifiedAt: "2026-08-27T11:20:00" },
  { id: "tax-labor-exempt", name: "Labor (non-taxable)", status: "active", isActive: true, rate: 0, summary: "Labor is not taxable in California; applied to service lines.", labelIds: [], lastModifiedAt: "2026-06-05T14:00:00" },
  { id: "tax-sf-district", name: "SF special district tax", status: "active", isActive: true, rate: 1.38, summary: "The district portion of the San Francisco rate.", labelIds: ["special"], lastModifiedAt: "2026-08-30T12:10:00" },
  // The REVIEW inbox — a tax item the system minted from a line item, or one
  // imported from the accounting system before anyone vetted it.
  { id: "tax-rev-sales", name: "sales tax", status: "review", isActive: true, rate: 8.5, summary: "", labelIds: [], lastModifiedAt: "2026-09-03T21:40:00" },
  { id: "tax-rev-city", name: "City tax 1.5", status: "review", isActive: true, rate: 1.5, summary: "", labelIds: [], lastModifiedAt: "2026-09-01T08:05:00" },
  { id: "tax-rev-out-of-state", name: "Out of state - no tax", status: "review", isActive: true, rate: 0, summary: "", labelIds: [], lastModifiedAt: "2026-08-26T12:00:00" },
  // The INACTIVE shelf — rates that were superseded when a jurisdiction
  // changed its percentage.
  { id: "tax-sf-old", name: "SF sales tax (2024 rate)", status: "active", isActive: false, rate: 8.5, summary: "Superseded when the city rate rose.", labelIds: ["state", "county", "city"], lastModifiedAt: "2026-06-10T10:00:00" },
  { id: "tax-oakland-old", name: "Oakland sales tax (2023 rate)", status: "active", isActive: false, rate: 9.25, summary: "", labelIds: ["state", "county", "city"], lastModifiedAt: "2026-06-02T11:30:00" },
  { id: "tax-legacy-county", name: "County surcharge (retired)", status: "active", isActive: false, rate: 0.25, summary: "", labelIds: ["county"], lastModifiedAt: "2026-06-01T09:00:00" },
];

/**
 * The workspace's job SUB-STATUSES — production `JobSubStatus`, a table the
 * company writes itself (added 2026-09-14). Each one belongs to ONE status, and
 * only the paused / on-hold statuses can have them; production shows the
 * sub-status name instead of the generic status label wherever a job carries
 * one. See `JobSubStatusRecord`.
 *
 * These six are what a refrigeration-heavy service company would actually
 * write: two reasons a tech quick-pauses on site, two the office puts a job on
 * an external hold (waiting on someone else), two on an internal one (waiting
 * on itself).
 */
export const JOB_SUB_STATUSES: JobSubStatusRecord[] = [
  { id: "sub-lunch", name: "Lunch break", status: "quickPaused" },
  { id: "sub-another-call", name: "Pulled to another call", status: "quickPaused" },
  { id: "sub-parts", name: "Waiting for parts", status: "onHoldExternal" },
  { id: "sub-client-approval", name: "Waiting for client approval", status: "onHoldExternal" },
  { id: "sub-tech", name: "Waiting for a tech", status: "onHoldInternal" },
  { id: "sub-quote", name: "Quote in progress", status: "onHoldInternal" },
];

export const JOB_LABELS: JobLabel[] = [
  { id: "refrigeration", name: "Refrigeration" },
  { id: "cooking", name: "Cooking equipment" },
  { id: "ventilation", name: "Ventilation" },
  { id: "warranty", name: "Warranty" },
  { id: "recurring", name: "Recurring" },
  { id: "contract", name: "Contract" },
  { id: "compliance", name: "Compliance" },
  { id: "priority-client", name: "Priority client" },
  { id: "quarterly", name: "Quarterly" },
  { id: "plumbing", name: "Plumbing" },
];

/**
 * Estimate labels — production `EstimateLabel`, a table of its OWN, separate
 * from job labels (added 2026-09-11 with the estimates list).
 */
export const ESTIMATE_LABELS: EstimateLabel[] = [
  { id: "repair", name: "Repair" },
  { id: "replacement", name: "Replacement" },
  { id: "preventive-plan", name: "Preventive plan" },
  { id: "contract-renewal", name: "Contract renewal" },
  { id: "parts-only", name: "Parts only" },
  { id: "labor-only", name: "Labor only" },
  { id: "warranty-claim", name: "Warranty claim" },
  { id: "budgetary", name: "Budgetary" },
];

/**
 * Invoice labels — production `InvoiceLabel`, a table of its OWN, separate
 * from job and estimate labels (added 2026-09-14 with the invoices list).
 */
export const INVOICE_LABELS: InvoiceLabel[] = [
  { id: "progress-billing", name: "Progress billing" },
  { id: "final-bill", name: "Final bill" },
  { id: "deposit-applied", name: "Deposit applied" },
  { id: "contract-billing", name: "Contract billing" },
  { id: "quarterly", name: "Quarterly" },
  { id: "parts-only", name: "Parts only" },
  { id: "labor-only", name: "Labor only" },
  { id: "collections", name: "Collections" },
];

export const JOB_SOURCES: JobSource[] = [
  // Production `JobOriginTypes` with the production abbreviations (Daniel,
  // 2026-09-07 — this replaced an earlier invented set). `prefix` doubles as
  // the "(ABBR)" list suffix and the demo Source ID prefix; integrations
  // require an ID, Direct does not.
  { id: "direct", name: "Direct (Phone, email, etc.)", prefix: null, requiresId: false },
  { id: "service-channel", name: "ServiceChannel", prefix: "SC", requiresId: true },
  { id: "corrigo", name: "Corrigo", prefix: "COR", requiresId: true },
  { id: "ecotrak", name: "Ecotrak", prefix: "ECO", requiresId: true },
];

// ---- "New Job" form reference tables (added 2026-09-07) --------------------

// NEW concept — production has no Branch model; see types.ts.
export const BRANCHES: Branch[] = [
  { id: "sf-mission", name: "Mission District", street: "2201 Bryant Street", city: "San Francisco", state: "CA", postalCode: "94110" },
  { id: "oakland", name: "Oakland", street: "477 8th Avenue", city: "Oakland", state: "CA", postalCode: "94606" },
  { id: "san-jose", name: "San Jose", street: "1698 Monterey Road", city: "San Jose", state: "CA", postalCode: "95112" },
];

// NEW concept — production has no form-template model; see types.ts.
export const JOB_FORMS: JobForm[] = [
  { id: "service-report", name: "Service report" },
  { id: "refrigeration-checklist", name: "Refrigeration service checklist", requiredForServiceIds: ["walk-in-cooler", "prep-fridge", "freezer-seal"] },
  { id: "hood-cleaning-cert", name: "Hood cleaning certificate", requiredForServiceIds: ["hood-cleaning"] },
  { id: "fryer-safety", name: "Fryer safety inspection", requiredForEquipmentCategories: ["Fryers"] },
  { id: "customer-signoff", name: "Customer sign-off" },
  { id: "parts-used", name: "Parts used log" },
];

/** Production `ServiceCompany` defaults; "manual" keeps the Job ID field visible. */
export const COMPANY: CompanySettings = {
  maxFileUploads: 25,
  maxFileUploadSizeMb: 100,
  jobCustomIdGenerationMode: "manual",
};

// EXTENDED for the Invoices list, 2026-09-14: the badge-status model (see
// `InvoiceStatus` in types.ts), the list fields, and `netDays` written out as
// `dueAt` (issued + the old Net N; equal to `issuedAt` where it was due on
// receipt). The seven curated rows keep their ids and stories; the INV-31xx
// mass below them is materialized from `scripts/regenerate-db-rows.mjs
// invoices 2026-09-04` (seed 20260914), the estimates mass's pattern.
const INVOICES_AT_ANCHOR: Invoice[] = [
  // Paid two weeks into its Net 15 — JOB-1204's completed ice-machine call.
  { id: "INV-3101", locationId: "harbour-pier", jobId: "JOB-1204", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "paid", labelIds: [], total: 320.0, amountPaid: 320.0, issuedAt: "2026-08-21T10:00:00", dueAt: "2026-09-05T17:00:00", statusChangedAt: "2026-09-02T10:30:00", lastModifiedAt: "2026-09-02T10:30:00", lastViewedAt: "2026-08-30T14:00:00" },
  // Its Net 30 ran out on Aug 31, so the badge reads OVERDUE (derived — the
  // stored status stays "outstanding"). The invoice that finalized JOB-1209.
  { id: "INV-3102", locationId: "wildwood-downtown", jobId: "JOB-1209", serviceId: "range-burner", serviceName: "Range pilot relight", status: "outstanding", labelIds: ["final-bill"], total: 185.0, amountPaid: 0, issuedAt: "2026-08-01T09:00:00", dueAt: "2026-08-31T17:00:00", statusChangedAt: "2026-08-01T09:00:00", lastModifiedAt: "2026-08-01T09:00:00", lastViewedAt: "2026-08-05T11:15:00" },
  { id: "INV-3103", locationId: "bayside-commissary", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "unsent", labelIds: ["quarterly"], total: 1350.0, amountPaid: 0, issuedAt: "2026-08-29T16:20:00", dueAt: "2026-09-28T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-08-29T16:20:00" },
  { id: "INV-3104", locationId: "northpoint-hotel", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "outstanding", labelIds: [], total: 2190.5, amountPaid: 0, issuedAt: "2026-08-27T15:00:00", dueAt: "2026-10-11T17:00:00", statusChangedAt: "2026-08-27T15:00:00", lastModifiedAt: "2026-08-27T15:00:00", lastViewedAt: "2026-09-01T09:40:00" },
  // Voided the day after JOB-1210 was cancelled. Due on receipt, never paid.
  { id: "INV-3105", locationId: "ferry-main", jobId: "JOB-1210", serviceId: "prep-fridge", serviceName: "Reach-in cooler diagnostic", status: "voided", labelIds: [], total: 95.0, amountPaid: 0, issuedAt: "2026-08-16T09:30:00", dueAt: "2026-08-16T17:00:00", statusChangedAt: "2026-08-16T09:30:00", lastModifiedAt: "2026-08-16T09:30:00" },
  { id: "INV-3106", locationId: "wildwood-airport", serviceId: "grease-trap", serviceName: "Grease trap service", status: "paid", labelIds: ["contract-billing"], total: 760.0, amountPaid: 760.0, issuedAt: "2026-07-22T11:00:00", dueAt: "2026-08-21T17:00:00", statusChangedAt: "2026-08-19T13:45:00", lastModifiedAt: "2026-08-19T13:45:00", lastViewedAt: "2026-08-12T10:00:00" },
  // Pushes Bayside past its 10,000 credit limit (1,350 + 9,400 unpaid) —
  // the "credit limit reached" client issue in the "New Job" form. (The mass
  // below keeps LARGE unpaid invoices off Wildwood's locations on purpose, so
  // this story stays Bayside's — see the generator.)
  { id: "INV-3107", locationId: "bayside-commissary", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "outstanding", labelIds: [], total: 9400.0, amountPaid: 0, issuedAt: "2026-09-01T11:20:00", dueAt: "2026-10-01T17:00:00", statusChangedAt: "2026-09-01T11:20:00", lastModifiedAt: "2026-09-01T11:20:00", lastViewedAt: "2026-09-02T08:30:00" },
  { id: "INV-3137", locationId: "bayside-commissary", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "paid", labelIds: [], total: 11700, amountPaid: 11700, issuedAt: "2026-06-06T13:45:00", dueAt: "2026-06-06T17:00:00", statusChangedAt: "2026-06-08T13:00:00", lastModifiedAt: "2026-08-11T09:00:00", lastViewedAt: "2026-07-26T15:45:00" },
  { id: "INV-3163", locationId: "northpoint-banquet", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "forgiven", labelIds: ["labor-only", "contract-billing"], total: 8550, amountPaid: 0, issuedAt: "2026-06-17T16:45:00", dueAt: "2026-07-02T17:00:00", statusChangedAt: "2026-07-03T09:00:00", lastModifiedAt: "2026-07-16T08:00:00", lastViewedAt: "2026-06-28T18:00:00" },
  { id: "INV-3122", locationId: "mission-24th", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "paid", labelIds: ["contract-billing", "deposit-applied"], total: 1250, amountPaid: 1250, issuedAt: "2026-06-21T14:00:00", dueAt: "2026-07-06T17:00:00", statusChangedAt: "2026-07-05T16:00:00", lastModifiedAt: "2026-07-11T14:00:00", lastViewedAt: "2026-07-08T11:45:00" },
  { id: "INV-3139", locationId: "harbour-marina", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "paid", labelIds: ["deposit-applied"], total: 6206, amountPaid: 6206, issuedAt: "2026-07-07T10:30:00", dueAt: "2026-07-07T17:00:00", statusChangedAt: "2026-07-10T08:00:00", lastModifiedAt: "2026-08-19T11:00:00" },
  { id: "INV-3150", locationId: "wildwood-downtown", serviceId: "espresso", serviceName: "Espresso machine descale", status: "paid", labelIds: [], total: 9574, amountPaid: 9574, issuedAt: "2026-06-22T16:45:00", dueAt: "2026-07-07T17:00:00", statusChangedAt: "2026-07-07T15:00:00", lastModifiedAt: "2026-08-28T17:00:00", lastViewedAt: "2026-07-04T09:45:00" },
  { id: "INV-3108", locationId: "mission-24th", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "paid", labelIds: [], total: 4173, amountPaid: 4173, issuedAt: "2026-06-11T17:15:00", dueAt: "2026-07-11T17:00:00", statusChangedAt: "2026-06-24T11:00:00", lastModifiedAt: "2026-07-09T13:00:00", lastViewedAt: "2026-06-28T08:45:00" },
  { id: "INV-3124", locationId: "bayside-commissary", serviceId: "grease-trap", serviceName: "Grease trap service", status: "paid", labelIds: ["progress-billing"], total: 9050, amountPaid: 9050, issuedAt: "2026-06-11T09:15:00", dueAt: "2026-07-11T17:00:00", statusChangedAt: "2026-06-18T16:00:00", lastModifiedAt: "2026-08-07T17:00:00", lastViewedAt: "2026-08-14T12:30:00" },
  { id: "INV-3123", locationId: "harbour-marina", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "paid", labelIds: ["quarterly", "parts-only"], total: 562, amountPaid: 562, issuedAt: "2026-06-27T14:15:00", dueAt: "2026-07-12T17:00:00", statusChangedAt: "2026-07-16T14:00:00", lastModifiedAt: "2026-07-18T10:00:00", lastViewedAt: "2026-08-13T14:45:00" },
  { id: "INV-3136", locationId: "presidio-canteen", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "paid", labelIds: ["progress-billing", "deposit-applied"], total: 1668, amountPaid: 1668, issuedAt: "2026-06-19T14:00:00", dueAt: "2026-07-19T17:00:00", statusChangedAt: "2026-07-18T15:00:00", lastModifiedAt: "2026-08-11T17:00:00", lastViewedAt: "2026-08-09T11:45:00" },
  { id: "INV-3130", locationId: "harbour-marina", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "outstanding", labelIds: ["progress-billing", "collections"], total: 12496, amountPaid: 0, issuedAt: "2026-05-28T08:30:00", dueAt: "2026-07-27T17:00:00", statusChangedAt: "2026-05-28T09:00:00", lastModifiedAt: "2026-06-05T09:00:00", lastViewedAt: "2026-06-01T09:30:00" },
  { id: "INV-3157", locationId: "bayside-commissary", serviceId: "grease-trap", serviceName: "Grease trap service", status: "outstanding", labelIds: ["deposit-applied", "progress-billing"], total: 1450, amountPaid: 0, issuedAt: "2026-06-29T13:30:00", dueAt: "2026-07-29T17:00:00", statusChangedAt: "2026-06-30T13:00:00", lastModifiedAt: "2026-07-20T08:00:00" },
  { id: "INV-3121", locationId: "bayside-commissary", serviceId: "grease-trap", serviceName: "Grease trap service", status: "forgiven", labelIds: [], total: 2200, amountPaid: 0, issuedAt: "2026-08-01T08:30:00", dueAt: "2026-08-01T17:00:00", statusChangedAt: "2026-08-11T12:00:00", lastModifiedAt: "2026-08-17T10:00:00", lastViewedAt: "2026-09-03T19:45:00" },
  { id: "INV-3129", locationId: "harbour-pier", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "outstanding", labelIds: ["quarterly"], total: 10800, amountPaid: 0, issuedAt: "2026-07-02T13:00:00", dueAt: "2026-08-01T17:00:00", statusChangedAt: "2026-07-04T09:00:00", lastModifiedAt: "2026-09-02T16:00:00" },
  { id: "INV-3120", locationId: "harbour-marina", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "voided", labelIds: ["contract-billing", "parts-only"], total: 8700, amountPaid: 0, issuedAt: "2026-06-20T10:30:00", dueAt: "2026-08-04T17:00:00", statusChangedAt: "2026-07-02T12:00:00", lastModifiedAt: "2026-09-02T11:00:00" },
  { id: "INV-3158", locationId: "ferry-main", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "outstanding", labelIds: [], total: 4609, amountPaid: 0, issuedAt: "2026-06-05T16:00:00", dueAt: "2026-08-04T17:00:00", statusChangedAt: "2026-06-07T17:00:00", lastModifiedAt: "2026-07-06T15:00:00", lastViewedAt: "2026-07-11T21:45:00" },
  { id: "INV-3110", locationId: "harbour-marina", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "paid", labelIds: ["deposit-applied"], total: 9209, amountPaid: 9209, issuedAt: "2026-07-06T15:30:00", dueAt: "2026-08-05T17:00:00", statusChangedAt: "2026-08-13T17:00:00", lastModifiedAt: "2026-08-15T12:00:00", lastViewedAt: "2026-08-15T16:45:00" },
  { id: "INV-3125", locationId: "presidio-canteen", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "paid", labelIds: ["progress-billing"], total: 11950, amountPaid: 11950, issuedAt: "2026-06-07T16:45:00", dueAt: "2026-08-06T17:00:00", statusChangedAt: "2026-06-11T16:00:00", lastModifiedAt: "2026-08-30T08:00:00", lastViewedAt: "2026-08-03T14:45:00" },
  { id: "INV-3143", locationId: "harbour-marina", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "outstanding", labelIds: ["labor-only"], total: 7167, amountPaid: 0, issuedAt: "2026-07-07T15:45:00", dueAt: "2026-08-06T17:00:00", statusChangedAt: "2026-07-08T17:00:00", lastModifiedAt: "2026-08-13T10:00:00", lastViewedAt: "2026-07-23T19:15:00" },
  { id: "INV-3153", locationId: "harbour-pier", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "paid", labelIds: ["contract-billing"], total: 4965, amountPaid: 4965, issuedAt: "2026-07-26T15:30:00", dueAt: "2026-08-10T17:00:00", statusChangedAt: "2026-08-11T12:00:00", lastModifiedAt: "2026-09-02T08:00:00", lastViewedAt: "2026-07-31T21:00:00" },
  { id: "INV-3111", locationId: "sunset-judah", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "paid", labelIds: [], total: 7150, amountPaid: 7150, issuedAt: "2026-07-27T09:45:00", dueAt: "2026-08-11T17:00:00", statusChangedAt: "2026-08-07T09:00:00", lastModifiedAt: "2026-08-15T17:00:00", lastViewedAt: "2026-08-04T20:30:00" },
  { id: "INV-3115", locationId: "northpoint-hotel", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "outstanding", labelIds: ["labor-only"], total: 10600, amountPaid: 3180, issuedAt: "2026-07-12T11:00:00", dueAt: "2026-08-11T17:00:00", statusChangedAt: "2026-07-13T16:00:00", lastModifiedAt: "2026-07-21T16:00:00", lastViewedAt: "2026-07-27T12:30:00" },
  { id: "INV-3148", locationId: "wildwood-downtown", serviceId: "espresso", serviceName: "Espresso machine descale", status: "voided", labelIds: ["deposit-applied"], total: 5700, amountPaid: 0, issuedAt: "2026-06-28T17:45:00", dueAt: "2026-08-12T17:00:00", statusChangedAt: "2026-07-02T17:00:00", lastModifiedAt: "2026-07-23T11:00:00" },
  { id: "INV-3149", locationId: "presidio-canteen", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "forgiven", labelIds: ["labor-only"], total: 1350, amountPaid: 0, issuedAt: "2026-07-17T10:45:00", dueAt: "2026-08-16T17:00:00", statusChangedAt: "2026-08-05T14:00:00", lastModifiedAt: "2026-08-08T08:00:00" },
  { id: "INV-3116", locationId: "bayside-commissary", serviceId: "grease-trap", serviceName: "Grease trap service", status: "outstanding", labelIds: ["labor-only", "quarterly"], total: 2350, amountPaid: 0, issuedAt: "2026-07-19T10:15:00", dueAt: "2026-08-18T17:00:00", statusChangedAt: "2026-07-20T17:00:00", lastModifiedAt: "2026-07-22T17:00:00", lastViewedAt: "2026-08-17T08:00:00" },
  { id: "INV-3152", locationId: "sunset-judah", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "paid", labelIds: [], total: 250, amountPaid: 250, issuedAt: "2026-07-04T13:30:00", dueAt: "2026-08-18T17:00:00", statusChangedAt: "2026-07-15T10:00:00", lastModifiedAt: "2026-07-17T11:00:00", lastViewedAt: "2026-07-10T11:00:00" },
  { id: "INV-3109", locationId: "northpoint-banquet", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "paid", labelIds: ["final-bill", "quarterly"], total: 8000, amountPaid: 8000, issuedAt: "2026-07-05T14:45:00", dueAt: "2026-08-19T17:00:00", statusChangedAt: "2026-08-02T10:00:00", lastModifiedAt: "2026-08-14T13:00:00", lastViewedAt: "2026-08-04T20:15:00" },
  { id: "INV-3138", locationId: "wildwood-downtown", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "paid", labelIds: ["progress-billing", "deposit-applied"], total: 300, amountPaid: 300, issuedAt: "2026-08-04T09:00:00", dueAt: "2026-08-19T17:00:00", statusChangedAt: "2026-08-19T12:00:00", lastModifiedAt: "2026-08-24T11:00:00", lastViewedAt: "2026-08-24T19:30:00" },
  { id: "INV-3135", locationId: "mission-24th", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "forgiven", labelIds: ["progress-billing", "parts-only"], total: 11100, amountPaid: 0, issuedAt: "2026-07-23T14:30:00", dueAt: "2026-08-22T17:00:00", statusChangedAt: "2026-08-20T12:00:00", lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "INV-3134", locationId: "bayside-commissary", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "voided", labelIds: ["deposit-applied"], total: 3072, amountPaid: 0, issuedAt: "2026-07-11T12:00:00", dueAt: "2026-08-25T17:00:00", statusChangedAt: "2026-08-10T15:00:00", lastModifiedAt: "2026-08-25T11:00:00" },
  { id: "INV-3144", locationId: "wildwood-airport", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "outstanding", labelIds: ["deposit-applied"], total: 635, amountPaid: 0, issuedAt: "2026-07-31T11:00:00", dueAt: "2026-08-30T17:00:00", statusChangedAt: "2026-08-01T15:00:00", lastModifiedAt: "2026-08-19T11:00:00", lastViewedAt: "2026-08-23T08:45:00" },
  { id: "INV-3161", locationId: "harbour-pier", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "draft", labelIds: [], total: 7300, amountPaid: 0, issuedAt: "2026-08-31T08:00:00", dueAt: "2026-08-31T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-02T09:00:00" },
  { id: "INV-3156", locationId: "ferry-main", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "outstanding", labelIds: [], total: 250, amountPaid: 75, issuedAt: "2026-09-04T16:45:00", dueAt: "2026-09-04T17:00:00", statusChangedAt: "2026-09-04T15:00:00", lastModifiedAt: "2026-09-04T10:00:00", lastViewedAt: "2026-09-04T14:00:00" },
  { id: "INV-3131", locationId: "northpoint-hotel", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unsent", labelIds: [], total: 8350, amountPaid: 0, issuedAt: "2026-08-22T15:30:00", dueAt: "2026-09-06T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-08-24T16:00:00" },
  { id: "INV-3141", locationId: "harbour-pier", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "outstanding", labelIds: ["deposit-applied", "final-bill"], total: 8742, amountPaid: 0, issuedAt: "2026-08-22T15:45:00", dueAt: "2026-09-06T17:00:00", statusChangedAt: "2026-08-22T09:00:00", lastModifiedAt: "2026-08-31T10:00:00" },
  { id: "INV-3145", locationId: "harbour-marina", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "unsent", labelIds: ["labor-only", "parts-only"], total: 3750, amountPaid: 0, issuedAt: "2026-08-22T16:15:00", dueAt: "2026-09-06T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-01T15:00:00" },
  { id: "INV-3140", locationId: "bayside-commissary", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "outstanding", labelIds: ["deposit-applied"], total: 6439, amountPaid: 3220, issuedAt: "2026-07-25T10:30:00", dueAt: "2026-09-08T17:00:00", statusChangedAt: "2026-07-26T10:00:00", lastModifiedAt: "2026-09-04T08:00:00", lastViewedAt: "2026-09-04T18:45:00" },
  { id: "INV-3126", locationId: "harbour-marina", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "outstanding", labelIds: [], total: 10350, amountPaid: 0, issuedAt: "2026-08-25T13:45:00", dueAt: "2026-09-09T17:00:00", statusChangedAt: "2026-08-25T17:00:00", lastModifiedAt: "2026-08-31T17:00:00", lastViewedAt: "2026-09-02T10:45:00" },
  { id: "INV-3113", locationId: "mission-24th", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "outstanding", labelIds: ["final-bill"], total: 11104, amountPaid: 0, issuedAt: "2026-07-13T12:15:00", dueAt: "2026-09-11T17:00:00", statusChangedAt: "2026-07-15T16:00:00", lastModifiedAt: "2026-07-17T17:00:00", lastViewedAt: "2026-07-26T18:45:00" },
  { id: "INV-3142", locationId: "harbour-pier", serviceId: "range-burner", serviceName: "Range burner repair", status: "outstanding", labelIds: [], total: 3550, amountPaid: 0, issuedAt: "2026-08-27T12:45:00", dueAt: "2026-09-11T17:00:00", statusChangedAt: "2026-08-28T16:00:00", lastModifiedAt: "2026-09-01T15:00:00", lastViewedAt: "2026-08-31T16:45:00" },
  { id: "INV-3162", locationId: "mission-24th", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "voided", labelIds: [], total: 9350, amountPaid: 0, issuedAt: "2026-07-28T14:45:00", dueAt: "2026-09-11T17:00:00", statusChangedAt: "2026-08-18T10:00:00", lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "INV-3127", locationId: "presidio-canteen", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "outstanding", labelIds: [], total: 9550, amountPaid: 2388, issuedAt: "2026-08-28T16:30:00", dueAt: "2026-09-12T17:00:00", statusChangedAt: "2026-08-29T17:00:00", lastModifiedAt: "2026-09-04T14:00:00", lastViewedAt: "2026-08-31T21:15:00" },
  { id: "INV-3112", locationId: "harbour-marina", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "outstanding", labelIds: [], total: 5300, amountPaid: 0, issuedAt: "2026-08-29T09:45:00", dueAt: "2026-09-13T17:00:00", statusChangedAt: "2026-08-30T13:00:00", lastModifiedAt: "2026-08-30T13:00:00", lastViewedAt: "2026-08-31T13:30:00" },
  { id: "INV-3147", locationId: "harbour-marina", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "draft", labelIds: [], total: 10150, amountPaid: 0, issuedAt: "2026-08-29T09:45:00", dueAt: "2026-09-13T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-08-31T17:00:00" },
  { id: "INV-3132", locationId: "harbour-pier", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "unsent", labelIds: ["final-bill", "collections"], total: 409, amountPaid: 0, issuedAt: "2026-08-30T10:45:00", dueAt: "2026-09-14T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-03T14:00:00" },
  { id: "INV-3146", locationId: "sunset-judah", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "unsent", labelIds: [], total: 300, amountPaid: 0, issuedAt: "2026-08-30T08:45:00", dueAt: "2026-09-14T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-08-31T08:00:00" },
  { id: "INV-3154", locationId: "sunset-judah", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "outstanding", labelIds: [], total: 2421, amountPaid: 0, issuedAt: "2026-08-31T17:30:00", dueAt: "2026-09-15T17:00:00", statusChangedAt: "2026-09-01T15:00:00", lastModifiedAt: "2026-09-03T11:00:00", lastViewedAt: "2026-09-02T09:30:00" },
  { id: "INV-3128", locationId: "harbour-marina", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "outstanding", labelIds: [], total: 8200, amountPaid: 2050, issuedAt: "2026-08-19T14:30:00", dueAt: "2026-09-18T17:00:00", statusChangedAt: "2026-08-20T08:00:00", lastModifiedAt: "2026-08-23T12:00:00", lastViewedAt: "2026-08-23T18:15:00" },
  { id: "INV-3117", locationId: "northpoint-banquet", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "unsent", labelIds: ["final-bill"], total: 1795, amountPaid: 0, issuedAt: "2026-08-21T08:30:00", dueAt: "2026-09-20T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-08-24T14:00:00" },
  { id: "INV-3133", locationId: "ferry-main", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "draft", labelIds: [], total: 3194, amountPaid: 0, issuedAt: "2026-08-25T10:45:00", dueAt: "2026-09-24T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-02T17:00:00" },
  { id: "INV-3114", locationId: "harbour-marina", serviceId: "espresso", serviceName: "Espresso machine descale", status: "outstanding", labelIds: ["progress-billing", "final-bill"], total: 1600, amountPaid: 480, issuedAt: "2026-08-28T12:15:00", dueAt: "2026-09-27T17:00:00", statusChangedAt: "2026-08-29T08:00:00", lastModifiedAt: "2026-09-03T12:00:00", lastViewedAt: "2026-09-02T12:30:00" },
  { id: "INV-3151", locationId: "mission-24th", serviceId: "grease-trap", serviceName: "Grease trap service", status: "paid", labelIds: ["collections", "quarterly"], total: 1700, amountPaid: 1700, issuedAt: "2026-07-30T10:30:00", dueAt: "2026-09-28T17:00:00", statusChangedAt: "2026-08-31T11:00:00", lastModifiedAt: "2026-08-31T09:00:00", lastViewedAt: "2026-08-15T21:45:00" },
  { id: "INV-3160", locationId: "ferry-main", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "unsent", labelIds: ["final-bill"], total: 3956, amountPaid: 0, issuedAt: "2026-08-26T11:15:00", dueAt: "2026-10-10T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-01T11:00:00" },
  { id: "INV-3159", locationId: "mission-24th", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "unsent", labelIds: ["parts-only", "labor-only"], total: 12500, amountPaid: 0, issuedAt: "2026-09-01T14:30:00", dueAt: "2026-10-16T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-01T11:00:00" },
  { id: "INV-3118", locationId: "northpoint-hotel", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "unsent", labelIds: ["final-bill", "progress-billing"], total: 9550, amountPaid: 0, issuedAt: "2026-09-02T14:45:00", dueAt: "2026-10-17T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-02T08:00:00" },
  { id: "INV-3155", locationId: "mission-24th", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "outstanding", labelIds: ["deposit-applied", "labor-only"], total: 7850, amountPaid: 0, issuedAt: "2026-08-22T12:45:00", dueAt: "2026-10-21T17:00:00", statusChangedAt: "2026-08-24T15:00:00", lastModifiedAt: "2026-09-02T16:00:00" },
  { id: "INV-3119", locationId: "northpoint-banquet", serviceId: "grease-trap", serviceName: "Grease trap service", status: "draft", labelIds: [], total: 850, amountPaid: 0, issuedAt: "2026-08-24T10:45:00", dueAt: "2026-10-23T17:00:00", statusChangedAt: null, lastModifiedAt: "2026-08-28T13:00:00" },
];

// INVENTED like the invoice labels (production `CreditNoteLabel` is
// company-written, so there was nothing to copy) — FLAGGED.
export const CREDIT_NOTE_LABELS: CreditNoteLabel[] = [
  { id: "billing-error", name: "Billing error" },
  { id: "goodwill", name: "Goodwill" },
  { id: "parts-return", name: "Parts return" },
  { id: "warranty", name: "Warranty" },
  { id: "service-issue", name: "Service issue" },
  { id: "contract-adjustment", name: "Contract adjustment" },
];

// ADDED for the Credit notes list, 2026-09-14. A credit note belongs to a
// CLIENT directly (production `external_client`), its invoice link is
// optional, and its TYPE exists only from "issued" on — production computes it
// at issue time from how much of the credit was allocated to the invoice
// (fully = prePayment, none = postPayment, part = mixed; no invoice =
// postPayment), so every draft / unsent row here carries none. Six curated
// rows tell stories against the invoices above; the CN-41xx mass below them
// is materialized from `scripts/regenerate-db-rows.mjs creditnotes 2026-09-04`
// (seed 20260915), the other masses' pattern.
const CREDIT_NOTES_AT_ANCHOR: CreditNote[] = [
  // A refund AFTER INV-3110 was paid (post-payment): the marina walk-in
  // repair's labor was billed twice.
  { id: "CN-4101", clientId: "harbour", invoiceId: "INV-3110", status: "issued", type: "postPayment", labelIds: ["billing-error"], reason: "Walk-in repair labor billed twice on the marina invoice.", total: 640, issuedAt: "2026-08-18T10:30:00", lastModifiedAt: "2026-08-18T10:30:00" },
  // Fully applied to the still-open INV-3157 at issue (pre-payment).
  { id: "CN-4102", clientId: "bayside", invoiceId: "INV-3157", status: "issued", type: "prePayment", labelIds: ["contract-adjustment"], reason: "Quarterly plan discount missed on the grease trap billing.", total: 290, issuedAt: "2026-08-26T09:15:00", lastModifiedAt: "2026-08-26T09:15:00" },
  // Still being written — a draft has NO type yet.
  { id: "CN-4103", clientId: "wildwood", invoiceId: "INV-3138", status: "draft", labelIds: ["parts-return"], reason: "Returned unused thermostat from the walk-in repair.", total: 120, issuedAt: "2026-09-02T14:00:00", lastModifiedAt: "2026-09-03T09:30:00" },
  // No invoice behind it — a goodwill credit against the client's balance.
  { id: "CN-4104", clientId: "northpoint", status: "unsent", labelIds: ["goodwill"], reason: "Goodwill credit for the missed Aug 28 appointment window.", total: 450, issuedAt: "2026-08-30T16:20:00", lastModifiedAt: "2026-09-01T11:00:00" },
  { id: "CN-4105", clientId: "ferry", status: "voided", type: "postPayment", labelIds: [], reason: "Entered against the wrong client.", total: 95, issuedAt: "2026-08-12T09:45:00", lastModifiedAt: "2026-08-14T10:00:00" },
  // Partially applied to the open INV-3113 at issue (mixed).
  { id: "CN-4106", clientId: "mission", invoiceId: "INV-3113", status: "issued", type: "mixed", labelIds: ["warranty"], reason: "Compressor part covered by warranty; labor stays on the invoice.", total: 1500, issuedAt: "2026-08-29T15:30:00", lastModifiedAt: "2026-08-29T15:30:00" },
  { id: "CN-4110", clientId: "wildwood", invoiceId: "INV-3106", status: "issued", type: "prePayment", labelIds: ["service-issue", "billing-error"], total: 2526, issuedAt: "2026-06-23T15:00:00", lastModifiedAt: "2026-08-07T10:00:00" },
  { id: "CN-4111", clientId: "harbour", invoiceId: "INV-3123", status: "issued", type: "postPayment", labelIds: [], total: 1085, issuedAt: "2026-06-27T16:30:00", lastModifiedAt: "2026-07-27T08:00:00" },
  { id: "CN-4127", clientId: "harbour", invoiceId: "INV-3101", status: "voided", type: "postPayment", labelIds: ["contract-adjustment"], total: 1493, issuedAt: "2026-06-30T14:30:00", lastModifiedAt: "2026-08-10T14:00:00" },
  { id: "CN-4121", clientId: "sunset", invoiceId: "INV-3111", status: "issued", type: "prePayment", labelIds: [], total: 2139, issuedAt: "2026-07-02T13:00:00", lastModifiedAt: "2026-08-17T13:00:00" },
  { id: "CN-4120", clientId: "mission", invoiceId: "INV-3151", status: "issued", type: "postPayment", labelIds: ["parts-return"], total: 1600, issuedAt: "2026-07-13T15:15:00", lastModifiedAt: "2026-07-28T10:00:00" },
  { id: "CN-4107", clientId: "harbour", invoiceId: "INV-3123", status: "issued", type: "prePayment", labelIds: [], total: 625, issuedAt: "2026-07-16T10:15:00", lastModifiedAt: "2026-07-17T15:00:00" },
  { id: "CN-4119", clientId: "sunset", invoiceId: "INV-3152", status: "issued", type: "prePayment", labelIds: [], total: 3061, issuedAt: "2026-07-19T13:30:00", lastModifiedAt: "2026-08-27T15:00:00" },
  { id: "CN-4118", clientId: "bayside", invoiceId: "INV-3124", status: "issued", type: "prePayment", labelIds: ["contract-adjustment", "parts-return"], total: 3089, issuedAt: "2026-07-20T09:45:00", lastModifiedAt: "2026-09-02T09:00:00" },
  { id: "CN-4115", clientId: "ferry", status: "voided", type: "postPayment", labelIds: ["contract-adjustment", "service-issue"], total: 2680, issuedAt: "2026-07-20T11:30:00", lastModifiedAt: "2026-08-29T08:00:00" },
  { id: "CN-4109", clientId: "harbour", invoiceId: "INV-3101", status: "issued", type: "mixed", labelIds: ["warranty"], total: 1225, issuedAt: "2026-07-20T17:15:00", lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "CN-4123", clientId: "presidio", invoiceId: "INV-3136", status: "issued", type: "postPayment", labelIds: ["service-issue", "parts-return"], total: 2457, issuedAt: "2026-07-24T12:00:00", lastModifiedAt: "2026-07-28T11:00:00" },
  { id: "CN-4126", clientId: "wildwood", status: "voided", type: "postPayment", labelIds: [], total: 2095, issuedAt: "2026-07-28T10:45:00", lastModifiedAt: "2026-08-23T15:00:00" },
  { id: "CN-4112", clientId: "ferry", invoiceId: "INV-3158", status: "issued", type: "prePayment", labelIds: ["service-issue"], total: 1486, issuedAt: "2026-08-10T12:00:00", lastModifiedAt: "2026-08-28T08:00:00" },
  { id: "CN-4122", clientId: "bayside", status: "issued", type: "postPayment", labelIds: ["billing-error", "warranty"], total: 1000, issuedAt: "2026-08-17T11:45:00", lastModifiedAt: "2026-08-18T10:00:00" },
  { id: "CN-4108", clientId: "sunset", invoiceId: "INV-3111", status: "issued", type: "prePayment", labelIds: [], total: 1075, issuedAt: "2026-08-18T13:15:00", lastModifiedAt: "2026-08-18T15:00:00" },
  { id: "CN-4116", clientId: "sunset", invoiceId: "INV-3111", status: "voided", type: "prePayment", labelIds: ["goodwill"], total: 2973, issuedAt: "2026-08-23T10:45:00", lastModifiedAt: "2026-08-28T09:00:00" },
  { id: "CN-4124", clientId: "mission", invoiceId: "INV-3113", status: "unsent", labelIds: [], total: 450, issuedAt: "2026-08-23T11:45:00", lastModifiedAt: "2026-09-01T08:00:00" },
  { id: "CN-4125", clientId: "wildwood", status: "unsent", labelIds: [], total: 650, issuedAt: "2026-08-23T15:45:00", lastModifiedAt: "2026-08-25T14:00:00" },
  { id: "CN-4114", clientId: "sunset", status: "unsent", labelIds: ["parts-return"], total: 850, issuedAt: "2026-08-25T16:30:00", lastModifiedAt: "2026-09-04T13:00:00" },
  { id: "CN-4113", clientId: "bayside", status: "unsent", labelIds: [], total: 775, issuedAt: "2026-08-29T11:15:00", lastModifiedAt: "2026-09-04T08:00:00" },
  { id: "CN-4117", clientId: "harbour", invoiceId: "INV-3130", status: "draft", labelIds: [], total: 1525, issuedAt: "2026-08-31T11:15:00", lastModifiedAt: "2026-08-31T09:00:00" },
  { id: "CN-4128", clientId: "harbour", invoiceId: "INV-3123", status: "draft", labelIds: ["billing-error"], total: 1500, issuedAt: "2026-09-03T16:45:00", lastModifiedAt: "2026-09-03T13:00:00" },
];

// ADDED for the Series list, 2026-09-14. A series is a recurrence rule that
// stamps out jobs — it belongs to a LOCATION, has no labels and no status of
// its own: its open / closed phase is DERIVED from `recurrenceEnd`
// (production's is_closed — closed = the end has passed). The TYPE rule: an
// UPFRONT series always has an end (every job is created at once), only a
// ROLLING one may run open-ended. `openJobsCount` is production's annotation
// stored directly — the demo does not link jobs to series. Six curated rows +
// the SER-51xx mass from `scripts/regenerate-db-rows.mjs jobseries
// 2026-09-04` (seed 20260916).
const JOB_SERIES_AT_ANCHOR: JobSeries[] = [
  // The quarterly combi-oven plan at Wildwood Downtown — every 3 months on
  // the same weekday, the whole year created upfront.
  { id: "SER-5101", locationId: "wildwood-downtown", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", type: "upfront", recurrenceStart: "2026-01-05T08:00:00", recurrenceEnd: "2026-12-28T17:00:00", recurrenceInterval: 3, recurrenceFrequency: "monthly", monthlyRecurrence: "sameDay", openJobsCount: 2, createdAt: "2025-12-18T10:30:00", lastModifiedAt: "2026-07-06T09:00:00" },
  // Open-ended monthly grease-trap service — rolling, so no end date.
  { id: "SER-5102", locationId: "harbour-marina", serviceId: "grease-trap", serviceName: "Grease trap service", type: "rolling", recurrenceStart: "2026-03-10T07:30:00", recurrenceInterval: 1, recurrenceFrequency: "monthly", monthlyRecurrence: "sameDate", openJobsCount: 1, createdAt: "2026-03-02T14:15:00", lastModifiedAt: "2026-08-11T08:00:00" },
  // Twice-a-week hood cleaning through the season, created upfront — the
  // biggest open-jobs tail in the demo.
  { id: "SER-5103", locationId: "bayside-commissary", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", type: "upfront", recurrenceStart: "2026-06-01T07:00:00", recurrenceEnd: "2026-11-30T17:00:00", recurrenceInterval: 2, recurrenceFrequency: "weekly", weeklyRecurrence: [0, 3], openJobsCount: 5, createdAt: "2026-05-20T11:45:00", lastModifiedAt: "2026-09-01T15:00:00" },
  // A daily rolling inspection — only ever one open visit at a time.
  { id: "SER-5104", locationId: "ferry-main", serviceId: "dishwasher", serviceName: "Dishwasher inspection", type: "rolling", recurrenceStart: "2026-08-20T07:30:00", recurrenceInterval: 1, recurrenceFrequency: "daily", openJobsCount: 1, createdAt: "2026-08-18T09:15:00", lastModifiedAt: "2026-08-20T08:00:00" },
  // CLOSED — its end has passed, so the derived phase flips.
  { id: "SER-5105", locationId: "northpoint-hotel", serviceId: "fryer-service", serviceName: "Fryer service and calibration", type: "upfront", recurrenceStart: "2025-11-04T08:00:00", recurrenceEnd: "2026-05-26T17:00:00", recurrenceInterval: 1, recurrenceFrequency: "weekly", weeklyRecurrence: [1], openJobsCount: 0, createdAt: "2025-10-28T13:00:00", lastModifiedAt: "2026-05-27T09:00:00" },
  // A yearly deep descale — rolling keeps next year's visit coming.
  { id: "SER-5106", locationId: "mission-24th", serviceId: "espresso", serviceName: "Espresso machine descale", type: "rolling", recurrenceStart: "2026-02-14T09:00:00", recurrenceInterval: 1, recurrenceFrequency: "yearly", openJobsCount: 1, createdAt: "2026-02-01T10:45:00", lastModifiedAt: "2026-02-14T11:00:00" },
  { id: "SER-5120", locationId: "wildwood-downtown", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", type: "rolling", recurrenceStart: "2025-07-28T09:00:00", recurrenceEnd: "2026-05-27T17:00:00", recurrenceInterval: 2, recurrenceFrequency: "monthly", monthlyRecurrence: "sameDate", openJobsCount: 0, createdAt: "2025-06-30T15:45:00", lastModifiedAt: "2025-10-15T17:00:00" },
  { id: "SER-5123", locationId: "northpoint-hotel", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", type: "upfront", recurrenceStart: "2025-10-07T07:00:00", recurrenceEnd: "2026-07-02T17:00:00", recurrenceInterval: 1, recurrenceFrequency: "daily", openJobsCount: 1, createdAt: "2025-09-12T16:00:00", lastModifiedAt: "2026-05-03T08:00:00" },
  { id: "SER-5118", locationId: "bayside-commissary", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", type: "upfront", recurrenceStart: "2025-11-28T08:30:00", recurrenceEnd: "2026-04-29T17:00:00", recurrenceInterval: 2, recurrenceFrequency: "weekly", weeklyRecurrence: [1, 6], openJobsCount: 0, createdAt: "2025-11-12T13:15:00", lastModifiedAt: "2026-03-16T11:00:00" },
  { id: "SER-5114", locationId: "ferry-main", serviceId: "espresso", serviceName: "Espresso machine descale", type: "rolling", recurrenceStart: "2025-12-22T10:30:00", recurrenceEnd: "2026-08-24T17:00:00", recurrenceInterval: 1, recurrenceFrequency: "daily", openJobsCount: 0, createdAt: "2025-12-07T14:45:00", lastModifiedAt: "2026-03-05T09:00:00" },
  { id: "SER-5108", locationId: "harbour-marina", serviceId: "ice-machine", serviceName: "Ice machine descale", type: "upfront", recurrenceStart: "2026-01-13T08:30:00", recurrenceEnd: "2026-04-29T17:00:00", recurrenceInterval: 1, recurrenceFrequency: "weekly", weeklyRecurrence: [1, 3, 5], openJobsCount: 0, createdAt: "2026-01-09T12:30:00", lastModifiedAt: "2026-07-26T09:00:00" },
  { id: "SER-5113", locationId: "ferry-main", serviceId: "dishwasher", serviceName: "Dishwasher inspection", type: "rolling", recurrenceStart: "2026-02-18T09:30:00", recurrenceInterval: 1, recurrenceFrequency: "monthly", monthlyRecurrence: "sameDate", openJobsCount: 0, createdAt: "2026-01-25T08:15:00", lastModifiedAt: "2026-07-21T17:00:00" },
  { id: "SER-5119", locationId: "wildwood-downtown", serviceId: "grease-trap", serviceName: "Grease trap service", type: "rolling", recurrenceStart: "2026-02-20T07:30:00", recurrenceInterval: 2, recurrenceFrequency: "weekly", weeklyRecurrence: [0, 1, 6], openJobsCount: 1, createdAt: "2026-01-26T09:00:00", lastModifiedAt: "2026-04-18T17:00:00" },
  { id: "SER-5110", locationId: "sunset-judah", serviceId: "grease-trap", serviceName: "Grease trap service", type: "rolling", recurrenceStart: "2026-03-09T09:30:00", recurrenceInterval: 2, recurrenceFrequency: "weekly", weeklyRecurrence: [4], openJobsCount: 2, createdAt: "2026-03-03T11:15:00", lastModifiedAt: "2026-08-12T10:00:00" },
  { id: "SER-5107", locationId: "mission-24th", serviceId: "range-burner", serviceName: "Range burner repair", type: "rolling", recurrenceStart: "2026-03-12T08:00:00", recurrenceEnd: "2027-01-21T17:00:00", recurrenceInterval: 1, recurrenceFrequency: "weekly", weeklyRecurrence: [1, 3, 4], openJobsCount: 2, createdAt: "2026-02-25T12:30:00", lastModifiedAt: "2026-06-21T08:00:00" },
  { id: "SER-5115", locationId: "northpoint-hotel", serviceId: "dishwasher", serviceName: "Dishwasher inspection", type: "rolling", recurrenceStart: "2026-03-15T07:00:00", recurrenceInterval: 1, recurrenceFrequency: "yearly", openJobsCount: 2, createdAt: "2026-03-01T08:15:00", lastModifiedAt: "2026-04-23T10:00:00" },
  { id: "SER-5117", locationId: "mission-24th", serviceId: "steam-table", serviceName: "Steam table thermostat swap", type: "rolling", recurrenceStart: "2026-04-03T07:30:00", recurrenceInterval: 1, recurrenceFrequency: "weekly", weeklyRecurrence: [4], openJobsCount: 0, createdAt: "2026-03-28T11:45:00", lastModifiedAt: "2026-04-01T12:00:00" },
  { id: "SER-5112", locationId: "harbour-pier", serviceId: "espresso", serviceName: "Espresso machine descale", type: "rolling", recurrenceStart: "2026-04-12T10:30:00", recurrenceEnd: "2027-03-24T17:00:00", recurrenceInterval: 1, recurrenceFrequency: "monthly", monthlyRecurrence: "sameDate", openJobsCount: 2, createdAt: "2026-04-02T09:15:00", lastModifiedAt: "2026-05-12T10:00:00" },
  { id: "SER-5111", locationId: "sunset-judah", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", type: "rolling", recurrenceStart: "2026-05-04T07:00:00", recurrenceInterval: 1, recurrenceFrequency: "monthly", monthlyRecurrence: "sameDate", openJobsCount: 0, createdAt: "2026-04-27T10:15:00", lastModifiedAt: "2026-04-28T09:00:00" },
  { id: "SER-5116", locationId: "harbour-pier", serviceId: "grease-trap", serviceName: "Grease trap service", type: "upfront", recurrenceStart: "2026-07-20T09:00:00", recurrenceEnd: "2027-01-01T17:00:00", recurrenceInterval: 2, recurrenceFrequency: "weekly", weeklyRecurrence: [0, 1, 6], openJobsCount: 11, createdAt: "2026-07-05T11:45:00", lastModifiedAt: "2026-08-16T12:00:00" },
  { id: "SER-5122", locationId: "presidio-canteen", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", type: "rolling", recurrenceStart: "2026-07-30T07:00:00", recurrenceEnd: "2027-03-24T17:00:00", recurrenceInterval: 1, recurrenceFrequency: "monthly", monthlyRecurrence: "sameDate", openJobsCount: 0, createdAt: "2026-07-09T16:30:00", lastModifiedAt: "2026-09-01T10:00:00" },
  { id: "SER-5109", locationId: "northpoint-hotel", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", type: "rolling", recurrenceStart: "2026-07-30T10:00:00", recurrenceInterval: 2, recurrenceFrequency: "weekly", weeklyRecurrence: [5, 6], openJobsCount: 2, createdAt: "2026-07-12T11:45:00", lastModifiedAt: "2026-07-18T13:00:00" },
  { id: "SER-5121", locationId: "sunset-judah", serviceId: "fryer-service", serviceName: "Fryer service and calibration", type: "upfront", recurrenceStart: "2026-08-25T10:00:00", recurrenceEnd: "2026-12-23T17:00:00", recurrenceInterval: 2, recurrenceFrequency: "monthly", monthlyRecurrence: "sameDate", openJobsCount: 1, createdAt: "2026-08-16T13:45:00", lastModifiedAt: "2026-08-29T12:00:00" },
  { id: "SER-5124", locationId: "northpoint-banquet", serviceId: "espresso", serviceName: "Espresso machine descale", type: "rolling", recurrenceStart: "2026-09-14T08:00:00", recurrenceInterval: 1, recurrenceFrequency: "yearly", openJobsCount: 1, createdAt: "2026-08-28T12:15:00", lastModifiedAt: "2026-08-28T10:00:00" },
];

// ---- the vendor side (added 2026-09-15 for the Bills list) ------------------

// The SUPPLIER world — production `Vendor` (pricebook app): who the company
// buys parts and consumables from, and who bills it. NOT the clients above;
// the demo keeps the same Bay-Area flavor on purpose. (The Figma page's
// vendor list reuses the client names — demonstration content only, Daniel
// 2026-09-15.)
// `paymentTerms` ADDED for the POs list (2026-09-15) — production
// `Vendor.payment_terms`, a nullable net-days integer the PO list reads LIVE
// off the vendor (0 = "Same Day", null = no terms). Mission Electric and the
// deactivated Presidio Fire carry none — the filter's "No payment terms" rows.
//
// EXTENDED later on 2026-09-15 for the VENDORS list itself (Daniel: "Build"):
// account ids, billing addresses, labels (VENDOR_LABELS below), websites,
// "bills via" links and last-modified stamps — production's own list fields,
// with deliberate gaps for the empty cells (Marin and Mission Electric have
// no account id, Embarcadero and Mission Electric no website). Current POs,
// Commitments and Payables are NOT stored — they derive from the
// PURCHASE_ORDERS and BILLS tables (vendorsData in the Filters prototype),
// the way production annotates them onto the queryset. Two BILLS-VIA
// stories: Peninsula Appliance Parts bills through Marin Kitchen Equipment
// (a parts brand billed by its distributor) and Bayview Hood through Golden
// Gate Restaurant Supply; everyone else bills directly. TWO more INACTIVE
// vendors joined so that phase holds more than one row — both without POs or
// bills, so their number columns are the zero case.
const VENDORS_AT_ANCHOR: Vendor[] = [
  { id: "pacific-refrigeration", name: "Pacific Refrigeration Parts", isActive: true, paymentTerms: 30, accountId: "ACCT-20114", billingStreet: "1215 Illinois St", billingCity: "San Francisco", billingState: "CA", billingPostalCode: "94107", labelIds: ["preferred", "oem-parts"], website: "pacificrefparts.com", createdAt: "2023-03-14T10:00:00", lastModifiedAt: "2026-09-02T14:30:00" },
  // One of the two RECIPIENT stories (production `billing_address_recipient`,
  // added 2026-09-15): a department addressee on the billing address.
  { id: "golden-gate-supply", name: "Golden Gate Restaurant Supply", isActive: true, paymentTerms: 30, accountId: "RS-88210", billingRecipient: "Accounts Receivable", billingStreet: "355 Bayshore Blvd", billingCity: "San Francisco", billingState: "CA", billingPostalCode: "94124", labelIds: ["preferred", "local"], website: "ggrsupply.com", createdAt: "2023-06-02T11:30:00", lastModifiedAt: "2026-08-30T09:15:00" },
  // The one billing address with a UNIT — the Billing address filter's
  // "Suite, unit, etc." field has something to match.
  { id: "bayview-hood", name: "Bayview Hood & Filter Co.", isActive: true, paymentTerms: 15, accountId: "BH-0042", billingStreet: "2298 Jerrold Ave", billingUnit: "Unit B", billingCity: "San Francisco", billingState: "CA", billingPostalCode: "94124", labelIds: ["local"], billsViaId: "golden-gate-supply", website: "bayviewhood.com", createdAt: "2024-02-20T09:45:00", lastModifiedAt: "2026-09-03T16:20:00" },
  // The second recipient story: a PERSON as the addressee.
  { id: "marin-equipment", name: "Marin Kitchen Equipment", isActive: true, paymentTerms: 45, billingRecipient: "Ted Alvarez", billingStreet: "1450 Grant Ave", billingCity: "Novato", billingState: "CA", billingPostalCode: "94945", labelIds: ["oem-parts"], website: "marinkitchenequip.com", createdAt: "2023-11-08T14:15:00", lastModifiedAt: "2026-08-21T11:00:00" },
  { id: "embarcadero-plumbing", name: "Embarcadero Plumbing Supply", isActive: true, paymentTerms: 30, accountId: "EPS-7731", billingStreet: "300 King St", billingCity: "San Francisco", billingState: "CA", billingPostalCode: "94107", labelIds: ["local"], createdAt: "2024-07-16T10:30:00", lastModifiedAt: "2026-07-29T10:45:00" },
  { id: "fogline-chemical", name: "Fogline Chemical & Sanitation", isActive: true, paymentTerms: 0, accountId: "FCS-115", billingStreet: "899 Tennessee St", billingCity: "San Francisco", billingState: "CA", billingPostalCode: "94107", labelIds: ["preferred", "local"], website: "foglinechem.com", createdAt: "2025-03-27T08:50:00", lastModifiedAt: "2026-09-04T08:10:00" },
  // Bills through its distributor — the production help text's own story.
  { id: "peninsula-parts", name: "Peninsula Appliance Parts", isActive: true, paymentTerms: 60, accountId: "PAP-5512", billingStreet: "2901 Spring St", billingCity: "Redwood City", billingState: "CA", billingPostalCode: "94063", labelIds: ["national-account"], billsViaId: "marin-equipment", website: "peninsulaparts.com", createdAt: "2024-10-03T13:20:00", lastModifiedAt: "2026-08-17T15:30:00" },
  { id: "sequoia-hvac", name: "Sequoia HVAC Distributors", isActive: true, paymentTerms: 15, accountId: "SEQ-30988", billingStreet: "1050 Whipple Rd", billingCity: "Union City", billingState: "CA", billingPostalCode: "94587", labelIds: ["national-account", "oem-parts"], website: "sequoiahvac.com", createdAt: "2025-06-11T15:10:00", lastModifiedAt: "2026-08-25T13:40:00" },
  // The NEW account: created and never edited since, so createdAt equals
  // lastModifiedAt — the Created at filter's one recent row.
  { id: "mission-electric", name: "Mission Electric Supply", isActive: true, paymentTerms: null, billingStreet: "2200 Palou Ave", billingCity: "San Francisco", billingState: "CA", billingPostalCode: "94124", labelIds: ["new-account"], createdAt: "2026-08-05T09:30:00", lastModifiedAt: "2026-08-05T09:30:00" },
  // Deactivated — the safety-inspection account moved to Fogline in the
  // spring; its old bills stay.
  { id: "presidio-fire", name: "Presidio Fire & Safety", isActive: false, paymentTerms: null, accountId: "PFS-2210", billingStreet: "6 Funston Ave", billingCity: "San Francisco", billingState: "CA", billingPostalCode: "94129", labelIds: [], website: "presidiofire.com", createdAt: "2022-09-19T10:00:00", lastModifiedAt: "2026-05-28T13:00:00" },
  // Deactivated with NO bills and NO purchase orders — the zero case on
  // every number column, added with the Vendors list.
  { id: "alameda-welding", name: "Alameda Welding & Fabrication", isActive: false, paymentTerms: 30, billingStreet: "2412 Clement Ave", billingCity: "Alameda", billingState: "CA", billingPostalCode: "94501", labelIds: ["local"], createdAt: "2023-01-25T09:00:00", lastModifiedAt: "2026-04-14T10:00:00" },
  { id: "bay-city-paper", name: "Bay City Paper & Packaging", isActive: false, paymentTerms: 30, accountId: "BCP-0930", billingStreet: "850 7th St", billingCity: "Oakland", billingState: "CA", billingPostalCode: "94607", labelIds: [], website: "baycitypaper.com", createdAt: "2022-11-30T14:00:00", lastModifiedAt: "2026-06-09T15:00:00" },
];

// INVENTED like the bill labels (production `VendorLabel` is company-written,
// so there was nothing to copy) — FLAGGED. The legacy detail card marks
// vendor labels "(Only Visible to You)".
export const VENDOR_LABELS: VendorLabel[] = [
  { id: "preferred", name: "Preferred" },
  { id: "local", name: "Local" },
  { id: "national-account", name: "National account" },
  { id: "oem-parts", name: "OEM parts" },
  { id: "new-account", name: "New account" },
];

// INVENTED like the invoice labels (production `BillLabel` is
// company-written, so there was nothing to copy) — FLAGGED.
export const BILL_LABELS: BillLabel[] = [
  { id: "parts-order", name: "Parts order" },
  { id: "consumables", name: "Consumables" },
  { id: "equipment-purchase", name: "Equipment purchase" },
  { id: "rush-order", name: "Rush order" },
  { id: "warranty-replacement", name: "Warranty replacement" },
  { id: "monthly-account", name: "Monthly account" },
  { id: "disputed", name: "Disputed" },
];

// ADDED for the Bills list, 2026-09-15 — ACCOUNTS PAYABLE: what the VENDORS
// above bill the company, so the rows hang off vendors, not clients. Statuses
// follow `BillStatus` (no Unsent — Daniel: a bill cannot be sent), OVERDUE
// stays derived from `dueAt`, and the three date fields are DATE-only,
// production's own shape. Six curated rows + the BILL-61xx mass from
// `scripts/regenerate-db-rows.mjs bills 2026-09-04` (seed 20260917).
const BILLS_AT_ANCHOR: Bill[] = [
  // The compressor for JOB-1201's walk-in cooler repair — Net 30, still open.
  { id: "BILL-6101", vendorId: "pacific-refrigeration", vendorInvoiceId: "PRP-88412", status: "outstanding", labelIds: ["parts-order", "rush-order"], total: 1240.0, receivedAt: "2026-08-28", issuedAt: "2026-08-27", dueAt: "2026-09-26", statusChangedAt: null, lastModifiedAt: "2026-08-28T11:30:00" },
  // Its Net 30 ran out Aug 30, so the badge reads OVERDUE (derived — the
  // stored status stays "outstanding"). The July chemicals account.
  { id: "BILL-6102", vendorId: "fogline-chemical", vendorInvoiceId: "FCS-2026-0731", status: "outstanding", labelIds: ["consumables", "monthly-account"], total: 486.4, receivedAt: "2026-08-02", issuedAt: "2026-07-31", dueAt: "2026-08-30", statusChangedAt: null, lastModifiedAt: "2026-08-02T09:15:00" },
  // Still being entered — a draft.
  { id: "BILL-6103", vendorId: "golden-gate-supply", vendorInvoiceId: "GGS-51873", status: "draft", labelIds: [], total: 312.75, receivedAt: "2026-09-03", issuedAt: "2026-09-01", dueAt: "2026-10-01", statusChangedAt: null, lastModifiedAt: "2026-09-03T16:40:00" },
  // Paid four days after it arrived — the quarterly hood-filter order.
  { id: "BILL-6104", vendorId: "bayview-hood", vendorInvoiceId: "BH-7754", status: "paid", labelIds: ["consumables"], total: 918.0, receivedAt: "2026-08-11", issuedAt: "2026-08-10", dueAt: "2026-09-09", statusChangedAt: "2026-08-15T10:20:00", lastModifiedAt: "2026-08-15T10:20:00" },
  // The SAME vendor invoice entered twice — the duplicate was voided when it
  // surfaced. Same vendorInvoiceId as BILL-6104 on purpose.
  { id: "BILL-6105", vendorId: "bayview-hood", vendorInvoiceId: "BH-7754", status: "voided", labelIds: [], total: 918.0, receivedAt: "2026-08-11", issuedAt: "2026-08-10", dueAt: "2026-09-09", statusChangedAt: "2026-08-18T14:05:00", lastModifiedAt: "2026-08-18T14:05:00" },
  // The old fire-suppression inspection from the DEACTIVATED vendor — paid
  // long before the account moved to Fogline.
  { id: "BILL-6106", vendorId: "presidio-fire", vendorInvoiceId: "PFS-3310", status: "paid", labelIds: [], total: 640.0, receivedAt: "2026-05-06", issuedAt: "2026-05-05", dueAt: "2026-06-04", statusChangedAt: "2026-05-28T13:00:00", lastModifiedAt: "2026-05-28T13:00:00" },
  { id: "BILL-6133", vendorId: "fogline-chemical", vendorInvoiceId: "FCS-48489", status: "paid", labelIds: [], total: 1300, receivedAt: "2026-06-12", issuedAt: "2026-06-12", dueAt: "2026-06-12", statusChangedAt: "2026-06-15T13:00:00", lastModifiedAt: "2026-06-23T08:00:00" },
  { id: "BILL-6131", vendorId: "mission-electric", vendorInvoiceId: "MES-84060", status: "paid", labelIds: [], total: 125, receivedAt: "2026-06-17", issuedAt: "2026-06-16", dueAt: "2026-07-01", statusChangedAt: "2026-06-20T16:00:00", lastModifiedAt: "2026-08-13T17:00:00" },
  { id: "BILL-6110", vendorId: "pacific-refrigeration", vendorInvoiceId: "PRP-74459", status: "paid", labelIds: ["consumables"], total: 575, receivedAt: "2026-07-10", issuedAt: "2026-07-08", dueAt: "2026-07-08", statusChangedAt: "2026-07-14T14:00:00", lastModifiedAt: "2026-08-10T10:00:00" },
  { id: "BILL-6109", vendorId: "pacific-refrigeration", vendorInvoiceId: "PRP-30074", status: "paid", labelIds: ["rush-order", "warranty-replacement"], total: 1275, receivedAt: "2026-06-15", issuedAt: "2026-06-15", dueAt: "2026-07-15", statusChangedAt: "2026-06-23T10:00:00", lastModifiedAt: "2026-09-02T08:00:00" },
  { id: "BILL-6118", vendorId: "golden-gate-supply", vendorInvoiceId: "GGS-56613", status: "voided", labelIds: [], total: 675, receivedAt: "2026-06-24", issuedAt: "2026-06-24", dueAt: "2026-07-24", statusChangedAt: "2026-06-27T10:00:00", lastModifiedAt: "2026-08-07T13:00:00" },
  { id: "BILL-6132", vendorId: "golden-gate-supply", vendorInvoiceId: "GGS-92258", status: "paid", labelIds: [], total: 2125, receivedAt: "2026-07-12", issuedAt: "2026-07-11", dueAt: "2026-07-26", statusChangedAt: "2026-07-28T09:00:00", lastModifiedAt: "2026-08-03T11:00:00" },
  { id: "BILL-6119", vendorId: "bayview-hood", vendorInvoiceId: "BH-43716", status: "paid", labelIds: ["equipment-purchase"], total: 125, receivedAt: "2026-06-29", issuedAt: "2026-06-29", dueAt: "2026-07-29", statusChangedAt: "2026-08-05T12:00:00", lastModifiedAt: "2026-08-22T12:00:00" },
  { id: "BILL-6123", vendorId: "sequoia-hvac", vendorInvoiceId: "SEQ-15202", status: "paid", labelIds: ["warranty-replacement"], total: 500, receivedAt: "2026-06-30", issuedAt: "2026-06-29", dueAt: "2026-07-29", statusChangedAt: "2026-07-21T09:00:00", lastModifiedAt: "2026-08-02T17:00:00" },
  { id: "BILL-6139", vendorId: "sequoia-hvac", vendorInvoiceId: "SEQ-42983", status: "outstanding", labelIds: ["parts-order"], total: 1500, receivedAt: "2026-07-25", issuedAt: "2026-07-24", dueAt: "2026-08-08", statusChangedAt: null, lastModifiedAt: "2026-07-27T12:00:00" },
  { id: "BILL-6127", vendorId: "peninsula-parts", vendorInvoiceId: "PAP-19647", status: "outstanding", labelIds: [], total: 2075, receivedAt: "2026-06-25", issuedAt: "2026-06-25", dueAt: "2026-08-09", statusChangedAt: null, lastModifiedAt: "2026-08-22T15:00:00" },
  { id: "BILL-6111", vendorId: "embarcadero-plumbing", vendorInvoiceId: "EPS-85007", status: "paid", labelIds: ["parts-order", "monthly-account"], total: 1475, receivedAt: "2026-06-27", issuedAt: "2026-06-27", dueAt: "2026-08-11", statusChangedAt: "2026-07-22T17:00:00", lastModifiedAt: "2026-07-22T13:00:00" },
  { id: "BILL-6115", vendorId: "marin-equipment", vendorInvoiceId: "MKE-81779", status: "outstanding", labelIds: ["warranty-replacement"], total: 2100, receivedAt: "2026-07-27", issuedAt: "2026-07-27", dueAt: "2026-08-11", statusChangedAt: null, lastModifiedAt: "2026-09-02T12:00:00" },
  { id: "BILL-6134", vendorId: "peninsula-parts", vendorInvoiceId: "PAP-68784", status: "paid", labelIds: ["parts-order"], total: 2340, receivedAt: "2026-07-14", issuedAt: "2026-07-13", dueAt: "2026-08-12", statusChangedAt: "2026-07-31T12:00:00", lastModifiedAt: "2026-08-22T17:00:00" },
  { id: "BILL-6144", vendorId: "marin-equipment", vendorInvoiceId: "MKE-56283", status: "paid", labelIds: [], total: 1275, receivedAt: "2026-07-17", issuedAt: "2026-07-13", dueAt: "2026-08-12", statusChangedAt: "2026-08-03T15:00:00", lastModifiedAt: "2026-08-29T12:00:00" },
  { id: "BILL-6121", vendorId: "fogline-chemical", vendorInvoiceId: "FCS-14769", status: "paid", labelIds: ["monthly-account"], total: 1250, receivedAt: "2026-07-14", issuedAt: "2026-07-14", dueAt: "2026-08-13", statusChangedAt: "2026-07-19T12:00:00", lastModifiedAt: "2026-08-17T16:00:00" },
  { id: "BILL-6130", vendorId: "bayview-hood", vendorInvoiceId: "BH-59306", status: "voided", labelIds: [], total: 1800, receivedAt: "2026-07-20", issuedAt: "2026-07-16", dueAt: "2026-08-15", statusChangedAt: "2026-07-30T12:00:00", lastModifiedAt: "2026-08-27T15:00:00" },
  { id: "BILL-6128", vendorId: "bayview-hood", vendorInvoiceId: "BH-99681", status: "outstanding", labelIds: ["equipment-purchase"], total: 2350, receivedAt: "2026-07-25", issuedAt: "2026-07-23", dueAt: "2026-08-22", statusChangedAt: null, lastModifiedAt: "2026-08-14T14:00:00" },
  { id: "BILL-6116", vendorId: "bayview-hood", vendorInvoiceId: "BH-57026", status: "outstanding", labelIds: ["warranty-replacement"], total: 650, receivedAt: "2026-08-12", issuedAt: "2026-08-09", dueAt: "2026-08-24", statusChangedAt: null, lastModifiedAt: "2026-08-25T10:00:00" },
  { id: "BILL-6120", vendorId: "fogline-chemical", vendorInvoiceId: "FCS-35641", status: "paid", labelIds: [], total: 1750, receivedAt: "2026-08-18", issuedAt: "2026-08-17", dueAt: "2026-09-01", statusChangedAt: "2026-08-24T09:00:00", lastModifiedAt: "2026-09-04T13:00:00" },
  { id: "BILL-6140", vendorId: "mission-electric", vendorInvoiceId: "MES-57278", status: "outstanding", labelIds: ["monthly-account"], total: 1250, receivedAt: "2026-08-02", issuedAt: "2026-08-02", dueAt: "2026-09-01", statusChangedAt: null, lastModifiedAt: "2026-08-05T10:00:00" },
  { id: "BILL-6142", vendorId: "marin-equipment", vendorInvoiceId: "MKE-74418", status: "voided", labelIds: ["parts-order", "warranty-replacement"], total: 1800, receivedAt: "2026-08-03", issuedAt: "2026-08-02", dueAt: "2026-09-01", statusChangedAt: "2026-08-25T12:00:00", lastModifiedAt: "2026-09-03T09:00:00" },
  { id: "BILL-6107", vendorId: "peninsula-parts", vendorInvoiceId: "PAP-70534", status: "paid", labelIds: ["monthly-account"], total: 2603, receivedAt: "2026-08-19", issuedAt: "2026-08-18", dueAt: "2026-09-02", statusChangedAt: "2026-09-02T11:00:00", lastModifiedAt: "2026-09-04T10:00:00" },
  { id: "BILL-6135", vendorId: "golden-gate-supply", vendorInvoiceId: "GGS-81195", status: "paid", labelIds: ["monthly-account"], total: 1400, receivedAt: "2026-08-23", issuedAt: "2026-08-19", dueAt: "2026-09-03", statusChangedAt: "2026-08-28T09:00:00", lastModifiedAt: "2026-08-30T11:00:00" },
  { id: "BILL-6136", vendorId: "pacific-refrigeration", vendorInvoiceId: "PRP-42264", status: "outstanding", labelIds: ["rush-order"], total: 125, receivedAt: "2026-09-04", issuedAt: "2026-09-04", dueAt: "2026-09-04", statusChangedAt: null, lastModifiedAt: "2026-09-04T14:00:00" },
  { id: "BILL-6124", vendorId: "bayview-hood", vendorInvoiceId: "BH-48876", status: "outstanding", labelIds: ["consumables", "parts-order"], total: 1200, receivedAt: "2026-08-10", issuedAt: "2026-08-08", dueAt: "2026-09-07", statusChangedAt: null, lastModifiedAt: "2026-08-20T08:00:00" },
  { id: "BILL-6141", vendorId: "pacific-refrigeration", vendorInvoiceId: "PRP-16231", status: "draft", labelIds: [], total: 2240, receivedAt: "2026-08-28", issuedAt: "2026-08-25", dueAt: "2026-09-09", statusChangedAt: null, lastModifiedAt: "2026-09-04T09:00:00" },
  { id: "BILL-6108", vendorId: "fogline-chemical", vendorInvoiceId: "FCS-71807", status: "paid", labelIds: ["warranty-replacement", "monthly-account"], total: 400, receivedAt: "2026-07-17", issuedAt: "2026-07-13", dueAt: "2026-09-11", statusChangedAt: "2026-08-11T17:00:00", lastModifiedAt: "2026-08-11T17:00:00" },
  { id: "BILL-6114", vendorId: "fogline-chemical", vendorInvoiceId: "FCS-25706", status: "outstanding", labelIds: [], total: 978, receivedAt: "2026-08-29", issuedAt: "2026-08-29", dueAt: "2026-09-13", statusChangedAt: null, lastModifiedAt: "2026-09-02T17:00:00" },
  { id: "BILL-6117", vendorId: "golden-gate-supply", vendorInvoiceId: "GGS-40735", status: "draft", labelIds: [], total: 1025, receivedAt: "2026-09-01", issuedAt: "2026-08-30", dueAt: "2026-09-14", statusChangedAt: null, lastModifiedAt: "2026-09-01T14:00:00" },
  { id: "BILL-6137", vendorId: "bayview-hood", vendorInvoiceId: "BH-94511", status: "outstanding", labelIds: [], total: 2699, receivedAt: "2026-09-04", issuedAt: "2026-09-03", dueAt: "2026-09-18", statusChangedAt: null, lastModifiedAt: "2026-09-04T14:00:00" },
  { id: "BILL-6122", vendorId: "peninsula-parts", vendorInvoiceId: "PAP-15747", status: "paid", labelIds: ["disputed"], total: 1775, receivedAt: "2026-08-11", issuedAt: "2026-08-11", dueAt: "2026-09-25", statusChangedAt: "2026-08-19T13:00:00", lastModifiedAt: "2026-08-25T14:00:00" },
  { id: "BILL-6138", vendorId: "fogline-chemical", vendorInvoiceId: "FCS-73080", status: "outstanding", labelIds: ["equipment-purchase"], total: 275, receivedAt: "2026-08-02", issuedAt: "2026-07-29", dueAt: "2026-09-27", statusChangedAt: null, lastModifiedAt: "2026-08-24T16:00:00" },
  { id: "BILL-6112", vendorId: "bayview-hood", vendorInvoiceId: "BH-87789", status: "outstanding", labelIds: ["rush-order", "monthly-account"], total: 750, receivedAt: "2026-08-18", issuedAt: "2026-08-15", dueAt: "2026-09-29", statusChangedAt: null, lastModifiedAt: "2026-08-26T14:00:00" },
  { id: "BILL-6113", vendorId: "embarcadero-plumbing", vendorInvoiceId: "EPS-31916", status: "outstanding", labelIds: ["monthly-account", "rush-order"], total: 125, receivedAt: "2026-08-31", issuedAt: "2026-08-31", dueAt: "2026-09-30", statusChangedAt: null, lastModifiedAt: "2026-08-31T14:00:00" },
  { id: "BILL-6125", vendorId: "fogline-chemical", vendorInvoiceId: "FCS-24310", status: "outstanding", labelIds: ["disputed"], total: 425, receivedAt: "2026-09-03", issuedAt: "2026-08-31", dueAt: "2026-09-30", statusChangedAt: null, lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "BILL-6143", vendorId: "embarcadero-plumbing", vendorInvoiceId: "EPS-49590", status: "paid", labelIds: [], total: 1100, receivedAt: "2026-08-08", issuedAt: "2026-08-04", dueAt: "2026-10-03", statusChangedAt: "2026-08-29T10:00:00", lastModifiedAt: "2026-09-02T17:00:00" },
  { id: "BILL-6126", vendorId: "marin-equipment", vendorInvoiceId: "MKE-78011", status: "outstanding", labelIds: [], total: 1975, receivedAt: "2026-08-13", issuedAt: "2026-08-12", dueAt: "2026-10-11", statusChangedAt: null, lastModifiedAt: "2026-08-31T10:00:00" },
  { id: "BILL-6129", vendorId: "sequoia-hvac", vendorInvoiceId: "SEQ-96539", status: "draft", labelIds: ["warranty-replacement", "monthly-account"], total: 1147, receivedAt: "2026-08-31", issuedAt: "2026-08-30", dueAt: "2026-10-14", statusChangedAt: null, lastModifiedAt: "2026-08-31T15:00:00" },
];

// The PRESET carrier / method lists — production's fixed `ShippingCarriers`
// and `ShippingMethods` choices (core/models.py), labels verbatim; "Other"
// is not a row (it is the custom-name mechanism on the PO itself). The
// carrier/method FILTERS list all of these plus the custom names in use —
// the design's own annotation ("all preset options + custom options added
// by the user").
export const SHIPPING_CARRIERS: ShippingOption[] = [
  { id: "usps", name: "U.S. Postal Service" },
  { id: "stamps-com", name: "Stamps.com" },
  { id: "fedex", name: "FedEx" },
  { id: "ups", name: "UPS" },
  { id: "dhl-express", name: "DHL Express" },
  { id: "dhl-ecommerce", name: "DHL ECommerce" },
  { id: "canada-post", name: "Canada Post" },
  { id: "australia-post", name: "Australia Post" },
  { id: "first-mile", name: "First Mile" },
  { id: "asendia", name: "Asendia" },
  { id: "ontrac", name: "OnTrac" },
  { id: "apc", name: "APC" },
  { id: "newgistics", name: "Newgistics" },
  { id: "globegistics", name: "Globegistics" },
  { id: "rr-donnelley", name: "RR Donnelley" },
  { id: "imex", name: "IMEX" },
  { id: "access-worldwide", name: "Access Worldwide" },
  { id: "purolator-ca", name: "Purolator Canada" },
  { id: "sendle", name: "Sendle" },
];

export const SHIPPING_METHODS: ShippingOption[] = [
  { id: "ground", name: "Ground" },
  { id: "next-day-early-am", name: "Next Day Early AM" },
  { id: "next-day-air", name: "Next Day Air" },
  { id: "two-day-air", name: "2 Day Air" },
];

// INVENTED like the bill labels (production `PurchaseOrderLabel` is
// company-written, so there was nothing to copy) — FLAGGED.
export const PO_LABELS: POLabel[] = [
  { id: "job-parts", name: "Job parts" },
  { id: "stock-replenishment", name: "Stock replenishment" },
  { id: "emergency", name: "Emergency" },
  { id: "backordered", name: "Backordered" },
  { id: "standing-order", name: "Standing order" },
  { id: "warranty-claim", name: "Warranty claim" },
];

// ADDED for the POs list, 2026-09-15 — what the company ORDERS from the
// VENDORS above: parts for jobs, and stock. Statuses are the nine display
// statuses (`POStatus` — production relabels pending/delivered/stocked for
// display; nothing here is clock-derived). `shipping` is ONE combined
// "Carrier Method" string under the one name (Daniel's ruling — production
// keeps preferred vs actual in two field sets and shows one per view).
// Associated ids point at REAL rows of the jobs/estimates/invoices tables.
// Ten curated rows + the PO-71xx mass from
// `scripts/regenerate-db-rows.mjs purchaseorders 2026-09-04` (seed 20260918).
const PURCHASE_ORDERS_AT_ANCHOR: PurchaseOrder[] = [
  // The compressor for JOB-1201's walk-in cooler repair — stocked, so the
  // badge reads Unpaid; BILL-6101 is the bill that followed it.
  { id: "PO-7101", vendorId: "pacific-refrigeration", status: "unpaid", labelIds: ["job-parts", "emergency"], itemCount: 3, amount: 1240.0, shippingCarrierId: "fedex", shippingMethodId: "two-day-air", trackingNumber: "1Z999AA10123456784", estimatedArrivalAt: "2026-08-27", issuedAt: "2026-08-24", associatedEstimateIds: [], associatedJobIds: ["JOB-1201"], associatedInvoiceIds: [], statusChangedAt: "2026-08-28T09:30:00", lastModifiedAt: "2026-08-28T11:30:00", lastViewedAt: "2026-08-24T15:00:00" },
  // Just created — a DRAFT with nothing on it yet: no items, no shipping, no
  // links (the Items filter's "None" and the Associated filters' "None").
  { id: "PO-7102", vendorId: "golden-gate-supply", status: "draft", labelIds: [], itemCount: 0, amount: 0, shippingCarrierId: null, shippingMethodId: null, trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-09-03", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: null, lastModifiedAt: "2026-09-03T16:00:00" },
  // A stock order still to go out — no shipping method picked yet.
  { id: "PO-7103", vendorId: "marin-equipment", status: "unsent", labelIds: ["stock-replenishment", "standing-order"], itemCount: 8, amount: 2150.0, shippingCarrierId: null, shippingMethodId: null, trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-09-01", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: null, lastModifiedAt: "2026-09-02T10:15:00" },
  // The monthly chemicals order, SENT and already opened by the vendor — the
  // "Seen" story on an open PO.
  { id: "PO-7104", vendorId: "fogline-chemical", status: "sent", labelIds: ["standing-order"], itemCount: 6, amount: 512.8, shippingCarrierId: "usps", shippingMethodId: "ground", trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-09-02", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-09-02T14:00:00", lastModifiedAt: "2026-09-02T14:00:00", lastViewedAt: "2026-09-03T08:40:00" },
  // Condenser fan motors for two jobs — acknowledged with a promised ETA.
  { id: "PO-7105", vendorId: "sequoia-hvac", status: "acknowledged", labelIds: ["job-parts"], itemCount: 2, amount: 887.5, shippingCarrierId: "ups", shippingMethodId: "ground", trackingNumber: null, estimatedArrivalAt: "2026-09-11", issuedAt: "2026-08-31", associatedEstimateIds: [], associatedJobIds: ["JOB-1204", "JOB-1210"], associatedInvoiceIds: [], statusChangedAt: "2026-09-01T11:20:00", lastModifiedAt: "2026-09-01T11:20:00", lastViewedAt: "2026-09-01T09:00:00" },
  // IN TRANSIT with the ETA already three days gone — the red Est. arrival
  // cell (production's isDangerous rule).
  { id: "PO-7106", vendorId: "pacific-refrigeration", status: "inTransit", labelIds: ["backordered", "job-parts"], itemCount: 4, amount: 1615.0, shippingCarrierId: "fedex", shippingMethodId: "ground", trackingNumber: "1Z504398761", estimatedArrivalAt: "2026-09-01", issuedAt: "2026-08-25", associatedEstimateIds: ["EST-2203"], associatedJobIds: ["JOB-1203"], associatedInvoiceIds: [], statusChangedAt: "2026-08-28T13:45:00", lastModifiedAt: "2026-09-02T09:00:00", lastViewedAt: "2026-08-26T10:00:00" },
  // In transit, on time — due tomorrow.
  { id: "PO-7107", vendorId: "peninsula-parts", status: "inTransit", labelIds: ["stock-replenishment"], itemCount: 10, amount: 2350.0, shippingCarrierId: "ups", shippingMethodId: "next-day-air", trackingNumber: "1Z221870335", estimatedArrivalAt: "2026-09-05", issuedAt: "2026-08-29", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-09-02T16:30:00", lastModifiedAt: "2026-09-02T16:30:00" },
  // Delivered yesterday, not yet put away — the badge reads Unstocked.
  { id: "PO-7108", vendorId: "embarcadero-plumbing", status: "unstocked", labelIds: ["job-parts"], itemCount: 5, amount: 745.0, shippingCarrierId: "ontrac", shippingMethodId: "ground", trackingNumber: "1Z781145098", estimatedArrivalAt: "2026-09-03", issuedAt: "2026-08-27", associatedEstimateIds: ["EST-2206"], associatedJobIds: ["JOB-1206"], associatedInvoiceIds: [], statusChangedAt: "2026-09-03T15:10:00", lastModifiedAt: "2026-09-03T15:10:00", lastViewedAt: "2026-08-28T09:00:00" },
  // The DEACTIVATED vendor's old spring order, long paid — delivered by
  // their own installer, so no shipping method; the vendor carries no
  // payment terms either.
  { id: "PO-7109", vendorId: "presidio-fire", status: "paid", labelIds: [], itemCount: 4, amount: 640.0, shippingCarrierId: "other", shippingCarrierOtherName: "Presidio van", shippingMethodId: null, trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-04-28", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-05-27T13:00:00", lastModifiedAt: "2026-05-27T13:00:00", lastViewedAt: "2026-04-29T10:00:00" },
  // The hood package ordered against an estimate the client turned down —
  // cancelled when EST-2221 was lost.
  { id: "PO-7110", vendorId: "bayview-hood", status: "cancelled", labelIds: ["job-parts"], itemCount: 5, amount: 3125.0, shippingCarrierId: "fedex", shippingMethodId: "ground", trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-08-18", associatedEstimateIds: ["EST-2221"], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-08-26T10:40:00", lastModifiedAt: "2026-08-26T10:40:00", lastViewedAt: "2026-08-19T11:00:00" },
  { id: "PO-7113", vendorId: "sequoia-hvac", status: "paid", labelIds: ["standing-order", "backordered"], itemCount: 4, amount: 1200, shippingCarrierId: "fedex", shippingMethodId: "ground", trackingNumber: "1Z761257005", estimatedArrivalAt: "2026-06-08", issuedAt: "2026-05-29", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-06-12T17:00:00", lastModifiedAt: "2026-08-04T11:00:00" },
  { id: "PO-7111", vendorId: "bayview-hood", status: "paid", labelIds: ["warranty-claim"], itemCount: 12, amount: 2700, shippingCarrierId: "fedex", shippingMethodId: "ground", trackingNumber: "1Z861682232", estimatedArrivalAt: null, issuedAt: "2026-06-04", associatedEstimateIds: [], associatedJobIds: ["JOB-1083", "JOB-1211", "JOB-1214"], associatedInvoiceIds: [], statusChangedAt: "2026-07-01T10:00:00", lastModifiedAt: "2026-08-15T12:00:00", lastViewedAt: "2026-06-04T16:00:00" },
  { id: "PO-7133", vendorId: "embarcadero-plumbing", status: "paid", labelIds: ["emergency", "standing-order"], itemCount: 9, amount: 1575, shippingCarrierId: "fedex", shippingMethodId: "two-day-air", trackingNumber: "1Z163968131", estimatedArrivalAt: null, issuedAt: "2026-06-04", associatedEstimateIds: ["EST-2230"], associatedJobIds: ["JOB-1097"], associatedInvoiceIds: [], statusChangedAt: "2026-06-26T17:00:00", lastModifiedAt: "2026-08-21T12:00:00" },
  { id: "PO-7115", vendorId: "sequoia-hvac", status: "paid", labelIds: [], itemCount: 9, amount: 1350, shippingCarrierId: null, shippingMethodId: null, trackingNumber: null, estimatedArrivalAt: "2026-06-13", issuedAt: "2026-06-05", associatedEstimateIds: ["EST-2214", "EST-2224"], associatedJobIds: ["JOB-1050", "JOB-1075", "JOB-1090"], associatedInvoiceIds: ["INV-3112"], statusChangedAt: "2026-06-22T12:00:00", lastModifiedAt: "2026-08-26T11:00:00", lastViewedAt: "2026-06-07T13:00:00" },
  { id: "PO-7136", vendorId: "bayview-hood", status: "paid", labelIds: [], itemCount: 2, amount: 450, shippingCarrierId: "ups", shippingMethodId: "next-day-air", trackingNumber: "1Z551327518", estimatedArrivalAt: "2026-06-14", issuedAt: "2026-06-05", associatedEstimateIds: [], associatedJobIds: ["JOB-1088", "JOB-1204"], associatedInvoiceIds: ["INV-3157"], statusChangedAt: "2026-06-19T16:00:00", lastModifiedAt: "2026-08-23T08:00:00", lastViewedAt: "2026-06-06T16:00:00" },
  { id: "PO-7114", vendorId: "embarcadero-plumbing", status: "paid", labelIds: [], itemCount: 5, amount: 750, shippingCarrierId: "fedex", shippingMethodId: "two-day-air", trackingNumber: "1Z298534643", estimatedArrivalAt: null, issuedAt: "2026-06-18", associatedEstimateIds: [], associatedJobIds: ["JOB-1069", "JOB-1102"], associatedInvoiceIds: [], statusChangedAt: "2026-06-30T10:00:00", lastModifiedAt: "2026-07-01T13:00:00", lastViewedAt: "2026-06-19T10:00:00" },
  { id: "PO-7130", vendorId: "peninsula-parts", status: "cancelled", labelIds: ["job-parts", "standing-order"], itemCount: 11, amount: 3300, shippingCarrierId: "other", shippingCarrierOtherName: "Local courier", shippingMethodId: "other", shippingMethodOtherName: "Same day", trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-06-23", associatedEstimateIds: ["EST-2204"], associatedJobIds: ["JOB-1057", "JOB-1062", "JOB-1071"], associatedInvoiceIds: [], statusChangedAt: "2026-07-08T11:00:00", lastModifiedAt: "2026-07-21T14:00:00" },
  { id: "PO-7112", vendorId: "bayview-hood", status: "paid", labelIds: [], itemCount: 4, amount: 800, shippingCarrierId: null, shippingMethodId: null, trackingNumber: null, estimatedArrivalAt: "2026-08-01", issuedAt: "2026-07-21", associatedEstimateIds: [], associatedJobIds: ["JOB-1065", "JOB-1066"], associatedInvoiceIds: ["INV-3157"], statusChangedAt: "2026-08-07T15:00:00", lastModifiedAt: "2026-08-11T11:00:00", lastViewedAt: "2026-07-22T17:00:00" },
  { id: "PO-7135", vendorId: "golden-gate-supply", status: "paid", labelIds: [], itemCount: 5, amount: 500, shippingCarrierId: null, shippingMethodId: null, trackingNumber: null, estimatedArrivalAt: "2026-07-30", issuedAt: "2026-07-25", associatedEstimateIds: [], associatedJobIds: ["JOB-1202"], associatedInvoiceIds: [], statusChangedAt: "2026-08-22T10:00:00", lastModifiedAt: "2026-08-27T13:00:00", lastViewedAt: "2026-07-26T16:00:00" },
  { id: "PO-7131", vendorId: "peninsula-parts", status: "paid", labelIds: [], itemCount: 2, amount: 850, shippingCarrierId: "fedex", shippingMethodId: "two-day-air", trackingNumber: "1Z601469667", estimatedArrivalAt: "2026-08-03", issuedAt: "2026-07-29", associatedEstimateIds: ["EST-2220", "EST-2259"], associatedJobIds: ["JOB-1095"], associatedInvoiceIds: [], statusChangedAt: "2026-08-15T14:00:00", lastModifiedAt: "2026-09-03T16:00:00", lastViewedAt: "2026-08-01T12:00:00" },
  { id: "PO-7132", vendorId: "peninsula-parts", status: "paid", labelIds: [], itemCount: 5, amount: 750, shippingCarrierId: "dhl-express", shippingMethodId: "next-day-early-am", trackingNumber: "1Z648104624", estimatedArrivalAt: "2026-08-06", issuedAt: "2026-08-01", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-08-15T14:00:00", lastModifiedAt: "2026-08-21T15:00:00" },
  { id: "PO-7138", vendorId: "peninsula-parts", status: "unpaid", labelIds: ["stock-replenishment", "warranty-claim"], itemCount: 2, amount: 850, shippingCarrierId: "fedex", shippingMethodId: "ground", trackingNumber: "1Z615611137", estimatedArrivalAt: "2026-08-09", issuedAt: "2026-08-04", associatedEstimateIds: [], associatedJobIds: ["JOB-1208"], associatedInvoiceIds: [], statusChangedAt: "2026-08-08T11:00:00", lastModifiedAt: "2026-08-10T14:00:00", lastViewedAt: "2026-08-05T11:00:00" },
  { id: "PO-7116", vendorId: "bayview-hood", status: "paid", labelIds: ["emergency"], itemCount: 2, amount: 600, shippingCarrierId: "ups", shippingMethodId: "ground", trackingNumber: "1Z329134148", estimatedArrivalAt: "2026-08-16", issuedAt: "2026-08-09", associatedEstimateIds: ["EST-2228"], associatedJobIds: ["JOB-1085"], associatedInvoiceIds: [], statusChangedAt: "2026-09-04T15:00:00", lastModifiedAt: "2026-09-04T09:00:00", lastViewedAt: "2026-08-09T09:00:00" },
  { id: "PO-7134", vendorId: "peninsula-parts", status: "paid", labelIds: ["emergency", "backordered"], itemCount: 12, amount: 4200, shippingCarrierId: "ontrac", shippingMethodId: "ground", trackingNumber: "1Z787770419", estimatedArrivalAt: "2026-08-17", issuedAt: "2026-08-09", associatedEstimateIds: [], associatedJobIds: ["JOB-1047", "JOB-1063", "JOB-1212"], associatedInvoiceIds: [], statusChangedAt: "2026-09-04T10:00:00", lastModifiedAt: "2026-09-04T09:00:00", lastViewedAt: "2026-08-10T10:00:00" },
  { id: "PO-7119", vendorId: "golden-gate-supply", status: "unstocked", labelIds: [], itemCount: 2, amount: 450, shippingCarrierId: "ontrac", shippingMethodId: "ground", trackingNumber: "1Z861430860", estimatedArrivalAt: "2026-08-19", issuedAt: "2026-08-15", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-08-22T10:00:00", lastModifiedAt: "2026-09-01T16:00:00" },
  { id: "PO-7137", vendorId: "embarcadero-plumbing", status: "unpaid", labelIds: [], itemCount: 2, amount: 600, shippingCarrierId: "ontrac", shippingMethodId: "ground", trackingNumber: "1Z213982293", estimatedArrivalAt: "2026-08-22", issuedAt: "2026-08-16", associatedEstimateIds: [], associatedJobIds: ["JOB-1098"], associatedInvoiceIds: ["INV-3132"], statusChangedAt: "2026-08-21T15:00:00", lastModifiedAt: "2026-09-02T10:00:00", lastViewedAt: "2026-08-18T11:00:00" },
  { id: "PO-7120", vendorId: "pacific-refrigeration", status: "unstocked", labelIds: ["emergency"], itemCount: 1, amount: 425, shippingCarrierId: "usps", shippingMethodId: "ground", trackingNumber: "1Z428989598", estimatedArrivalAt: "2026-08-25", issuedAt: "2026-08-17", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-08-23T09:00:00", lastModifiedAt: "2026-09-01T11:00:00", lastViewedAt: "2026-08-20T10:00:00" },
  { id: "PO-7142", vendorId: "sequoia-hvac", status: "inTransit", labelIds: ["stock-replenishment"], itemCount: 1, amount: 200, shippingCarrierId: "ups", shippingMethodId: "ground", trackingNumber: "1Z405713807", estimatedArrivalAt: "2026-09-14", issuedAt: "2026-08-18", associatedEstimateIds: ["EST-2219"], associatedJobIds: ["JOB-1087"], associatedInvoiceIds: [], statusChangedAt: "2026-08-21T09:00:00", lastModifiedAt: "2026-08-25T12:00:00", lastViewedAt: "2026-08-20T16:00:00" },
  { id: "PO-7118", vendorId: "golden-gate-supply", status: "unpaid", labelIds: ["job-parts"], itemCount: 4, amount: 200, shippingCarrierId: "fedex", shippingMethodId: "two-day-air", trackingNumber: "1Z837869921", estimatedArrivalAt: null, issuedAt: "2026-08-20", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-08-29T08:00:00", lastModifiedAt: "2026-09-02T13:00:00", lastViewedAt: "2026-08-22T11:00:00" },
  { id: "PO-7129", vendorId: "sequoia-hvac", status: "cancelled", labelIds: ["warranty-claim"], itemCount: 12, amount: 2400, shippingCarrierId: "dhl-express", shippingMethodId: "next-day-early-am", trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-08-20", associatedEstimateIds: [], associatedJobIds: ["JOB-1102", "JOB-1203"], associatedInvoiceIds: [], statusChangedAt: "2026-08-26T12:00:00", lastModifiedAt: "2026-08-30T17:00:00", lastViewedAt: "2026-08-23T14:00:00" },
  { id: "PO-7139", vendorId: "bayview-hood", status: "unstocked", labelIds: [], itemCount: 9, amount: 3150, shippingCarrierId: "usps", shippingMethodId: "ground", trackingNumber: "1Z253028397", estimatedArrivalAt: null, issuedAt: "2026-08-20", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-08-28T13:00:00", lastModifiedAt: "2026-08-28T11:00:00" },
  { id: "PO-7121", vendorId: "bayview-hood", status: "inTransit", labelIds: [], itemCount: 7, amount: 1750, shippingCarrierId: "ups", shippingMethodId: "next-day-air", trackingNumber: "1Z122526346", estimatedArrivalAt: "2026-09-02", issuedAt: "2026-08-21", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-08-24T17:00:00", lastModifiedAt: "2026-09-01T15:00:00" },
  { id: "PO-7126", vendorId: "sequoia-hvac", status: "acknowledged", labelIds: [], itemCount: 11, amount: 550, shippingCarrierId: "usps", shippingMethodId: "ground", trackingNumber: null, estimatedArrivalAt: "2026-09-15", issuedAt: "2026-08-23", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-08-25T08:00:00", lastModifiedAt: "2026-08-29T09:00:00" },
  { id: "PO-7117", vendorId: "fogline-chemical", status: "unpaid", labelIds: ["emergency", "warranty-claim"], itemCount: 8, amount: 800, shippingCarrierId: "dhl-express", shippingMethodId: "next-day-early-am", trackingNumber: "1Z901438629", estimatedArrivalAt: null, issuedAt: "2026-08-25", associatedEstimateIds: [], associatedJobIds: ["JOB-1056", "JOB-1064", "JOB-1212"], associatedInvoiceIds: ["INV-3141"], statusChangedAt: "2026-09-04T13:00:00", lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "PO-7125", vendorId: "peninsula-parts", status: "acknowledged", labelIds: [], itemCount: 10, amount: 4250, shippingCarrierId: "dhl-express", shippingMethodId: "next-day-early-am", trackingNumber: null, estimatedArrivalAt: "2026-09-14", issuedAt: "2026-08-26", associatedEstimateIds: [], associatedJobIds: ["JOB-1084", "JOB-1088"], associatedInvoiceIds: ["INV-3123"], statusChangedAt: "2026-08-29T14:00:00", lastModifiedAt: "2026-08-31T13:00:00", lastViewedAt: "2026-08-27T11:00:00" },
  { id: "PO-7140", vendorId: "fogline-chemical", status: "unstocked", labelIds: ["warranty-claim", "emergency"], itemCount: 1, amount: 225, shippingCarrierId: "usps", shippingMethodId: "ground", trackingNumber: null, estimatedArrivalAt: "2026-09-04", issuedAt: "2026-08-27", associatedEstimateIds: [], associatedJobIds: ["JOB-1204"], associatedInvoiceIds: [], statusChangedAt: "2026-09-02T10:00:00", lastModifiedAt: "2026-09-02T16:00:00" },
  { id: "PO-7146", vendorId: "sequoia-hvac", status: "acknowledged", labelIds: [], itemCount: 6, amount: 1650, shippingCarrierId: null, shippingMethodId: null, trackingNumber: null, estimatedArrivalAt: "2026-09-07", issuedAt: "2026-08-27", associatedEstimateIds: [], associatedJobIds: ["JOB-1105"], associatedInvoiceIds: [], statusChangedAt: "2026-08-29T11:00:00", lastModifiedAt: "2026-08-29T14:00:00", lastViewedAt: "2026-08-27T13:00:00" },
  { id: "PO-7122", vendorId: "golden-gate-supply", status: "inTransit", labelIds: [], itemCount: 6, amount: 300, shippingCarrierId: "dhl-express", shippingMethodId: "next-day-early-am", trackingNumber: "1Z428400423", estimatedArrivalAt: "2026-09-06", issuedAt: "2026-08-28", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-08-31T10:00:00", lastModifiedAt: "2026-08-31T10:00:00", lastViewedAt: "2026-08-29T13:00:00" },
  { id: "PO-7141", vendorId: "mission-electric", status: "inTransit", labelIds: [], itemCount: 2, amount: 300, shippingCarrierId: "ups", shippingMethodId: "next-day-air", trackingNumber: "1Z835609798", estimatedArrivalAt: "2026-09-04", issuedAt: "2026-08-28", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-09-02T15:00:00", lastModifiedAt: "2026-09-04T10:00:00" },
  { id: "PO-7123", vendorId: "mission-electric", status: "sent", labelIds: [], itemCount: 7, amount: 2100, shippingCarrierId: "ups", shippingMethodId: "ground", trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-08-29", associatedEstimateIds: [], associatedJobIds: ["JOB-1077"], associatedInvoiceIds: [], statusChangedAt: "2026-08-29T15:00:00", lastModifiedAt: "2026-09-03T09:00:00", lastViewedAt: "2026-08-31T15:00:00" },
  { id: "PO-7143", vendorId: "marin-equipment", status: "sent", labelIds: ["backordered"], itemCount: 4, amount: 700, shippingCarrierId: null, shippingMethodId: null, trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-08-31", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-08-31T15:00:00", lastModifiedAt: "2026-08-31T17:00:00" },
  { id: "PO-7128", vendorId: "golden-gate-supply", status: "draft", labelIds: [], itemCount: 0, amount: 0, shippingCarrierId: null, shippingMethodId: null, trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-09-02", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: null, lastModifiedAt: "2026-09-03T09:00:00" },
  { id: "PO-7144", vendorId: "sequoia-hvac", status: "sent", labelIds: ["standing-order"], itemCount: 7, amount: 875, shippingCarrierId: "ups", shippingMethodId: "next-day-air", trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-09-02", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-09-03T15:00:00", lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "PO-7145", vendorId: "bayview-hood", status: "acknowledged", labelIds: ["backordered"], itemCount: 11, amount: 4125, shippingCarrierId: "dhl-express", shippingMethodId: "next-day-early-am", trackingNumber: null, estimatedArrivalAt: "2026-09-12", issuedAt: "2026-09-02", associatedEstimateIds: ["EST-2251"], associatedJobIds: ["JOB-1050", "JOB-1088"], associatedInvoiceIds: [], statusChangedAt: "2026-09-03T17:00:00", lastModifiedAt: "2026-09-04T11:00:00", lastViewedAt: "2026-09-02T15:00:00" },
  { id: "PO-7124", vendorId: "fogline-chemical", status: "sent", labelIds: ["warranty-claim", "job-parts"], itemCount: 12, amount: 2400, shippingCarrierId: "fedex", shippingMethodId: "two-day-air", trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-09-03", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: "2026-09-04T17:00:00", lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "PO-7127", vendorId: "mission-electric", status: "unsent", labelIds: ["standing-order", "emergency"], itemCount: 11, amount: 2475, shippingCarrierId: null, shippingMethodId: null, trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-09-04", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: null, lastModifiedAt: "2026-09-04T10:00:00" },
  { id: "PO-7147", vendorId: "sequoia-hvac", status: "unsent", labelIds: [], itemCount: 5, amount: 250, shippingCarrierId: "fedex", shippingMethodId: "two-day-air", trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-09-04", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: null, lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "PO-7148", vendorId: "sequoia-hvac", status: "draft", labelIds: ["backordered", "standing-order"], itemCount: 8, amount: 2400, shippingCarrierId: "fedex", shippingMethodId: "ground", trackingNumber: null, estimatedArrivalAt: null, issuedAt: "2026-09-04", associatedEstimateIds: [], associatedJobIds: [], associatedInvoiceIds: [], statusChangedAt: null, lastModifiedAt: "2026-09-04T09:00:00" },
];

// ---- the shifted exports ----------------------------------------------------

// The tables that carry dates are written above against the ANCHOR and
// handed out on the REAL calendar — see `SHIFT_DAYS`. Everything else
// (locations, services, labels, sources, branches, forms, company settings)
// has no date in it and is exported where it is declared. VENDORS joined the
// shifted set on 2026-09-15, when the Vendors list gave them a
// `lastModifiedAt`; CLIENTS on 2026-09-16, when the Clients list gave them
// their two dates.
export const CLIENTS: Client[] = shiftDates(CLIENTS_AT_ANCHOR);
export const VENDORS: Vendor[] = shiftDates(VENDORS_AT_ANCHOR);
export const EQUIPMENT: Equipment[] = shiftDates(EQUIPMENT_AT_ANCHOR);
export const WARRANTIES: Warranty[] = shiftDates(WARRANTIES_AT_ANCHOR);
export const JOBS: Job[] = shiftDates(JOBS_AT_ANCHOR);
export const ESTIMATES: Estimate[] = shiftDates(ESTIMATES_AT_ANCHOR);
export const INVOICES: Invoice[] = shiftDates(INVOICES_AT_ANCHOR);
export const CREDIT_NOTES: CreditNote[] = shiftDates(CREDIT_NOTES_AT_ANCHOR);
export const BILLS: Bill[] = shiftDates(BILLS_AT_ANCHOR);
export const PURCHASE_ORDERS: PurchaseOrder[] = shiftDates(PURCHASE_ORDERS_AT_ANCHOR);
export const JOB_SERIES: JobSeries[] = shiftDates(JOB_SERIES_AT_ANCHOR);
// LABOR_ITEMS joined 2026-09-16, when the Labor list gave them a
// lastModifiedAt; PRODUCT_ITEMS the same day, with the Products list.
export const LABOR_ITEMS: LaborItem[] = shiftDates(LABOR_ITEMS_AT_ANCHOR);
export const PRODUCT_ITEMS: ProductItem[] = shiftDates(PRODUCT_ITEMS_AT_ANCHOR);
// The remaining three pricebook types joined later on 2026-09-16, with the
// Other, Discounts and Tax rates lists.
export const OTHER_ITEMS: ChargeItem[] = shiftDates(OTHER_ITEMS_AT_ANCHOR);
export const DISCOUNT_ITEMS: ChargeItem[] = shiftDates(DISCOUNT_ITEMS_AT_ANCHOR);
export const TAX_RATE_ITEMS: TaxRateItem[] = shiftDates(TAX_RATE_ITEMS_AT_ANCHOR);
