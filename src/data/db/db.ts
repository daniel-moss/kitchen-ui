import {
  Client,
  ClientContact,
  Equipment,
  Estimate,
  EstimateLabel,
  Invoice,
  Job,
  Branch,
  CompanySettings,
  JobForm,
  JobLabel,
  JobSource,
  Location,
  LocationContact,
  Service,
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

export const CLIENTS: Client[] = [
  {
    id: "wildwood",
    name: "Wildwood Kitchen",
    clientType: "Business",
    industryType: "Commercial",
    labels: ["Key account", "Preventive plan"],
    creditLimit: 25000,
    billingStreet: "418 Mission St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94105",
    notes: "Two sites. Airport site requires a security badge — allow 20 extra minutes.",
    primaryContactId: "cc-wildwood-1",
    isActive: true,
  },
  {
    id: "harbour",
    name: "Harbour Grill",
    clientType: "Business",
    industryType: "Commercial",
    labels: ["Preventive plan"],
    billingStreet: "1201 Beach St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94109",
    primaryContactId: "cc-harbour-1",
    isActive: true,
  },
  {
    id: "bayside",
    name: "Bayside Catering",
    clientType: "Business",
    industryType: "Industrial",
    labels: [],
    // Over its limit on purpose (see INV-3103/3107) — the "credit limit
    // reached" client issue in the "New Job" form.
    creditLimit: 10000,
    billingStreet: "77 Industrial Way",
    billingCity: "Oakland",
    billingState: "CA",
    billingPostalCode: "94601",
    notes: "Commissary kitchen — service windows before 6 AM only.",
    primaryContactId: "cc-bayside-1",
    isActive: true,
  },
  {
    id: "ferry",
    name: "Ferry Building Deli",
    clientType: "Individual",
    labels: [],
    billingStreet: "1 Ferry Building",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94111",
    primaryContactId: "cc-ferry-1",
    isActive: true,
  },
  {
    id: "mission",
    name: "Mission Taqueria",
    clientType: "Business",
    industryType: "Commercial",
    labels: ["New client"],
    // No billing address on purpose — the "billing address is missing"
    // client issue in the "New Job" form.
    isActive: true,
  },
  {
    id: "northpoint",
    name: "North Point Hotel",
    clientType: "Business",
    industryType: "Commercial",
    labels: ["Key account"],
    creditLimit: 50000,
    // The hotel pays centrally for both kitchens.
    defaultBillingIntention: "client",
    billingStreet: "555 North Point St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94133",
    primaryContactId: "cc-northpoint-1",
    isActive: true,
  },
  {
    id: "sunset",
    name: "Sunset Bakery",
    clientType: "Business",
    industryType: "Commercial",
    labels: [],
    billingStreet: "1750 Judah St",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPostalCode: "94122",
    isActive: true,
  },
  {
    // Deactivated — kept for history (production keeps them too).
    id: "presidio",
    name: "Presidio Canteen",
    clientType: "Business",
    industryType: "Government",
    labels: [],
    isActive: false,
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
  { id: "JOB-1077", locationId: "wildwood-downtown", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "onHoldInternal", priority: 2, scheduledFor: "2026-09-04T07:45:00", durationMinutes: 60, assigneeIds: [9], equipmentIds: [], labelIds: ["plumbing", "warranty", "recurring"], type: "recall", sourceId: "service-channel", sourceRef: "SC-3044", receivedAt: "2026-08-24T09:30:00", statusChangedAt: "2026-09-04T07:45:00", lastModifiedAt: "2026-09-03T11:00:00" },
  { id: "JOB-1059", locationId: "northpoint-hotel", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "active", priority: 4, scheduledFor: "2026-09-04T08:45:00", durationMinutes: 60, assigneeIds: [5, 7], equipmentIds: [], labelIds: ["warranty", "compliance"], type: "recall", sourceId: "direct", receivedAt: "2026-08-23T12:30:00", statusChangedAt: "2026-09-04T08:45:00", lastModifiedAt: "2026-09-02T09:00:00" },
  { id: "JOB-1072", locationId: "harbour-marina", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "quickPaused", priority: 2, scheduledFor: "2026-09-04T09:00:00", durationMinutes: 105, assigneeIds: [1, 8, 5], equipmentIds: [], labelIds: ["cooking", "refrigeration", "contract"], type: "new", sourceId: "service-channel", sourceRef: "SC-3829", receivedAt: "2026-08-27T15:15:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "JOB-1060", locationId: "harbour-pier", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "active", priority: 2, scheduledFor: "2026-09-04T09:30:00", durationMinutes: 180, assigneeIds: [7, 9, 5], equipmentIds: [], labelIds: ["recurring", "priority-client", "compliance"], type: "new", sourceId: "corrigo", sourceRef: "COR-3507", receivedAt: "2026-08-30T16:45:00", statusChangedAt: "2026-08-30T16:45:00", lastModifiedAt: "2026-09-02T17:00:00" },
  { id: "JOB-1099", locationId: "northpoint-banquet", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "active", priority: 3, scheduledFor: "2026-09-04T13:30:00", durationMinutes: 45, assigneeIds: [6, 1], equipmentIds: [], labelIds: ["refrigeration"], type: "recall", sourceId: "corrigo", sourceRef: "COR-2345", receivedAt: "2026-08-30T08:15:00", statusChangedAt: "2026-08-31T15:00:00", lastModifiedAt: "2026-09-01T11:00:00" },
  { id: "JOB-1096", locationId: "mission-24th", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "active", priority: 2, scheduledFor: "2026-09-04T14:00:00", durationMinutes: 240, assigneeIds: [6], equipmentIds: [], labelIds: [], type: "recall", sourceId: "ecotrak", sourceRef: "ECO-3419", receivedAt: "2026-08-24T16:15:00", statusChangedAt: "2026-08-24T16:15:00", lastModifiedAt: "2026-08-31T17:00:00" },
  { id: "JOB-1063", locationId: "wildwood-downtown", serviceId: "range-burner", serviceName: "Range burner repair", status: "active", priority: 3, scheduledFor: "2026-09-04T14:15:00", durationMinutes: 30, assigneeIds: [4], equipmentIds: [], labelIds: [], type: "recall", sourceId: "corrigo", sourceRef: "COR-6834", receivedAt: "2026-08-27T13:30:00", statusChangedAt: "2026-08-31T16:00:00", lastModifiedAt: "2026-09-04T14:00:00" },
  { id: "JOB-1062", locationId: "sunset-judah", serviceId: "grease-trap", serviceName: "Grease trap service", status: "active", scheduledFor: "2026-09-04T14:30:00", durationMinutes: 75, assigneeIds: [4], equipmentIds: [], labelIds: [], type: "new", sourceId: "ecotrak", sourceRef: "ECO-1100", receivedAt: "2026-08-27T09:00:00", statusChangedAt: "2026-08-28T09:00:00", lastModifiedAt: "2026-08-31T11:00:00" },
  { id: "JOB-1071", locationId: "presidio-canteen", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "quickPaused", priority: 4, scheduledFor: "2026-09-04T15:00:00", durationMinutes: 210, assigneeIds: [5, 2], equipmentIds: [], labelIds: [], type: "recall", sourceId: "direct", receivedAt: "2026-09-01T09:15:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T09:00:00" },
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
  { id: "JOB-1076", locationId: "northpoint-banquet", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "onHoldExternal", priority: 4, scheduledFor: "2026-09-12T09:00:00", durationMinutes: 30, assigneeIds: [7], equipmentIds: [], labelIds: [], type: "new", sourceId: "ecotrak", sourceRef: "ECO-1280", receivedAt: "2026-09-03T16:45:00", statusChangedAt: "2026-09-03T16:45:00", lastModifiedAt: "2026-09-03T09:00:00" },
  { id: "JOB-1086", locationId: "presidio-canteen", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "upcoming", scheduledFor: "2026-09-12T16:00:00", durationMinutes: 210, assigneeIds: [7, 2, 8], equipmentIds: [], labelIds: ["priority-client", "quarterly", "refrigeration"], type: "new", sourceId: "corrigo", sourceRef: "COR-7509", receivedAt: "2026-09-03T11:15:00", statusChangedAt: "2026-09-03T15:00:00", lastModifiedAt: "2026-09-04T14:00:00" },
  { id: "JOB-1080", locationId: "bayside-commissary", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "upcoming", priority: 3, scheduledFor: "2026-09-16T12:00:00", durationMinutes: 210, assigneeIds: [5, 3], equipmentIds: [], labelIds: ["plumbing", "cooking"], type: "new", sourceId: "corrigo", sourceRef: "COR-3638", receivedAt: "2026-09-03T16:15:00", statusChangedAt: "2026-09-03T16:15:00", lastModifiedAt: "2026-09-04T16:00:00" },
  { id: "JOB-1083", locationId: "mission-24th", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "upcoming", priority: 4, scheduledFor: "2026-09-17T15:15:00", durationMinutes: 45, assigneeIds: [7], equipmentIds: [], labelIds: ["contract", "refrigeration"], type: "recall", sourceId: "direct", receivedAt: "2026-09-03T12:45:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T12:00:00" },
  { id: "JOB-1049", locationId: "bayside-commissary", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "upcoming", priority: 3, scheduledFor: "2026-09-18T14:00:00", durationMinutes: 210, assigneeIds: [9, 7], equipmentIds: [], labelIds: ["compliance"], type: "new", sourceId: "ecotrak", sourceRef: "ECO-2977", receivedAt: "2026-09-03T08:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T10:00:00" },
  { id: "JOB-1048", locationId: "presidio-canteen", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "upcoming", priority: 2, scheduledFor: "2026-09-20T10:45:00", durationMinutes: 180, assigneeIds: [5, 9, 8], equipmentIds: [], labelIds: [], type: "new", sourceId: "direct", receivedAt: "2026-09-03T14:15:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "JOB-1045", locationId: "northpoint-hotel", serviceId: "steam-table", serviceName: "Steam table thermostat swap", status: "upcoming", scheduledFor: "2026-09-21T07:45:00", durationMinutes: 210, assigneeIds: [6], equipmentIds: [], labelIds: [], type: "new", sourceId: "service-channel", sourceRef: "SC-5488", receivedAt: "2026-09-03T14:30:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "JOB-1050", locationId: "harbour-marina", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "upcoming", scheduledFor: "2026-09-23T11:30:00", durationMinutes: 120, assigneeIds: [6, 2, 3], equipmentIds: [], labelIds: ["contract"], type: "new", sourceId: "corrigo", sourceRef: "COR-6709", receivedAt: "2026-09-03T08:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T09:00:00" },
  { id: "JOB-1046", locationId: "northpoint-hotel", serviceId: "hood-cleaning", serviceName: "Grill hood cleaning", status: "upcoming", priority: 3, scheduledFor: "2026-09-23T15:45:00", durationMinutes: 30, assigneeIds: [5, 6, 7], equipmentIds: [], labelIds: ["plumbing", "compliance", "cooking"], type: "new", sourceId: "ecotrak", sourceRef: "ECO-3162", receivedAt: "2026-09-03T08:15:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T14:00:00" },
  { id: "JOB-1044", locationId: "bayside-commissary", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "upcoming", priority: 3, scheduledFor: "2026-09-25T07:00:00", durationMinutes: 180, assigneeIds: [2], equipmentIds: [], labelIds: ["quarterly"], type: "new", sourceId: "ecotrak", sourceRef: "ECO-9087", receivedAt: "2026-09-03T15:45:00", statusChangedAt: "2026-09-04T09:00:00", lastModifiedAt: "2026-09-04T12:00:00" },
  { id: "JOB-1052", locationId: "ferry-main", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "unscheduled", priority: 4, assigneeIds: [], equipmentIds: [], labelIds: ["recurring"], type: "new", sourceId: "service-channel", sourceRef: "SC-1550", receivedAt: "2026-08-31T16:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T10:00:00" },
  { id: "JOB-1053", locationId: "sunset-judah", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "unscheduled", priority: 2, assigneeIds: [5], equipmentIds: [], labelIds: ["compliance", "recurring"], type: "new", sourceId: "corrigo", sourceRef: "COR-9962", receivedAt: "2026-09-03T09:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T08:00:00" },
  { id: "JOB-1054", locationId: "wildwood-airport", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unscheduled", priority: 4, assigneeIds: [7], equipmentIds: [], labelIds: ["priority-client", "refrigeration", "cooking"], type: "new", sourceId: "corrigo", sourceRef: "COR-4354", receivedAt: "2026-09-02T08:15:00", statusChangedAt: "2026-09-03T12:00:00", lastModifiedAt: "2026-09-03T14:00:00" },
  { id: "JOB-1055", locationId: "wildwood-downtown", serviceId: "freezer-seal", serviceName: "Freezer door seal replacement", status: "unscheduled", priority: 1, assigneeIds: [2], equipmentIds: [], labelIds: ["warranty", "quarterly", "recurring"], type: "new", sourceId: "corrigo", sourceRef: "COR-4490", receivedAt: "2026-09-03T13:30:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T15:00:00" },
  { id: "JOB-1056", locationId: "harbour-marina", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unscheduled", priority: 3, assigneeIds: [], equipmentIds: [], labelIds: ["warranty", "recurring", "refrigeration"], type: "new", sourceId: "direct", receivedAt: "2026-08-25T10:15:00", statusChangedAt: null, lastModifiedAt: "2026-08-31T10:00:00" },
  { id: "JOB-1057", locationId: "harbour-marina", serviceId: "grease-trap", serviceName: "Grease trap service", status: "unscheduled", assigneeIds: [], equipmentIds: [], labelIds: ["quarterly"], type: "new", sourceId: "corrigo", sourceRef: "COR-7407", receivedAt: "2026-08-27T10:30:00", statusChangedAt: "2026-09-03T14:00:00", lastModifiedAt: "2026-09-03T15:00:00" },
  { id: "JOB-1058", locationId: "northpoint-banquet", serviceId: "dishwasher", serviceName: "Dishwasher inspection", status: "unscheduled", priority: 3, assigneeIds: [8], equipmentIds: [], labelIds: ["compliance", "ventilation", "plumbing"], type: "new", sourceId: "service-channel", sourceRef: "SC-1695", receivedAt: "2026-08-30T09:30:00", statusChangedAt: null, lastModifiedAt: "2026-09-01T14:00:00" },
  { id: "JOB-1075", locationId: "harbour-pier", serviceId: "combi-oven", serviceName: "Combi oven quarterly maintenance", status: "draft", priority: 3, assigneeIds: [], equipmentIds: [], labelIds: ["refrigeration", "contract"], type: "new", sourceId: "service-channel", sourceRef: "SC-8659", receivedAt: "2026-09-03T16:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T12:00:00" },
  { id: "JOB-1088", locationId: "sunset-judah", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unscheduled", priority: 4, assigneeIds: [4], equipmentIds: [], labelIds: ["priority-client", "contract"], type: "recall", sourceId: "ecotrak", sourceRef: "ECO-7022", receivedAt: "2026-08-30T15:00:00", statusChangedAt: null, lastModifiedAt: "2026-08-30T17:00:00" },
  { id: "JOB-1089", locationId: "presidio-canteen", serviceId: "prep-fridge", serviceName: "Prep fridge compressor service", status: "unscheduled", priority: 2, assigneeIds: [], equipmentIds: [], labelIds: ["warranty", "priority-client"], type: "new", sourceId: "direct", receivedAt: "2026-08-27T15:15:00", statusChangedAt: null, lastModifiedAt: "2026-09-02T14:00:00" },
  { id: "JOB-1090", locationId: "harbour-pier", serviceId: "fryer-service", serviceName: "Fryer service and calibration", status: "unscheduled", priority: 4, assigneeIds: [6], equipmentIds: [], labelIds: ["refrigeration"], type: "new", sourceId: "service-channel", sourceRef: "SC-9771", receivedAt: "2026-08-27T13:00:00", statusChangedAt: "2026-09-01T15:00:00", lastModifiedAt: "2026-09-02T10:00:00" },
  { id: "JOB-1091", locationId: "presidio-canteen", serviceId: "espresso", serviceName: "Espresso machine descale", status: "unscheduled", priority: 1, assigneeIds: [5], equipmentIds: [], labelIds: ["ventilation", "warranty"], type: "new", sourceId: "service-channel", sourceRef: "SC-3785", receivedAt: "2026-08-27T11:45:00", statusChangedAt: null, lastModifiedAt: "2026-09-03T13:00:00" },
  { id: "JOB-1092", locationId: "harbour-marina", serviceId: "walk-in-cooler", serviceName: "Walk-in cooler repair", status: "unscheduled", priority: 3, assigneeIds: [], equipmentIds: [], labelIds: ["plumbing", "recurring", "quarterly"], type: "new", sourceId: "corrigo", sourceRef: "COR-6864", receivedAt: "2026-08-31T10:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-04T11:00:00" },
  { id: "JOB-1093", locationId: "bayside-commissary", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "unscheduled", assigneeIds: [], equipmentIds: [], labelIds: ["plumbing"], type: "new", sourceId: "service-channel", sourceRef: "SC-9431", receivedAt: "2026-08-25T16:00:00", statusChangedAt: "2026-08-29T14:00:00", lastModifiedAt: "2026-08-29T08:00:00" },
  { id: "JOB-1094", locationId: "wildwood-airport", serviceId: "ice-machine", serviceName: "Ice machine descale", status: "unscheduled", priority: 3, assigneeIds: [], equipmentIds: [], labelIds: ["refrigeration"], type: "new", sourceId: "service-channel", sourceRef: "SC-4001", receivedAt: "2026-08-27T13:00:00", statusChangedAt: null, lastModifiedAt: "2026-09-03T08:00:00" },
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
  { id: "walk-in-cooler", name: "Walk-in cooler repair", defaultPriority: 2, defaultDurationMinutes: 120 },
  { id: "fryer-service", name: "Fryer service and calibration", defaultPriority: 3, defaultDurationMinutes: 90 },
  { id: "ice-machine", name: "Ice machine descale", defaultPriority: 4 },
  { id: "dishwasher", name: "Dishwasher inspection", defaultPriority: null },
  { id: "combi-oven", name: "Combi oven quarterly maintenance", defaultPriority: 3 },
  { id: "hood-cleaning", name: "Grill hood cleaning", defaultPriority: 3, defaultDurationMinutes: 180 },
  { id: "freezer-seal", name: "Freezer door seal replacement", defaultPriority: 2 },
  { id: "range-burner", name: "Range burner repair", defaultPriority: 3 },
  { id: "steam-table", name: "Steam table thermostat swap", defaultPriority: 4 },
  { id: "prep-fridge", name: "Prep fridge compressor service", defaultPriority: 2 },
  { id: "grease-trap", name: "Grease trap service", defaultPriority: 3 },
  { id: "espresso", name: "Espresso machine descale", defaultPriority: null },
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

const INVOICES_AT_ANCHOR: Invoice[] = [
  { id: "INV-3101", locationId: "harbour-pier", jobId: "JOB-1204", status: "Paid", total: 320.0, issuedAt: "2026-08-21", netDays: 15 },
  { id: "INV-3102", locationId: "wildwood-downtown", jobId: "JOB-1209", status: "Sent", total: 185.0, issuedAt: "2026-08-01", netDays: 30 },
  { id: "INV-3103", locationId: "bayside-commissary", status: "Pending", total: 1350.0, issuedAt: "2026-08-29", netDays: 30 },
  { id: "INV-3104", locationId: "northpoint-hotel", status: "Sent", total: 2190.5, issuedAt: "2026-08-27", netDays: 45 },
  { id: "INV-3105", locationId: "ferry-main", jobId: "JOB-1210", status: "Voided", total: 95.0, issuedAt: "2026-08-16" },
  { id: "INV-3106", locationId: "wildwood-airport", status: "Paid", total: 760.0, issuedAt: "2026-07-22", netDays: 30 },
  // Pushes Bayside past its 10,000 credit limit (1,350 + 9,400 unpaid) —
  // the "credit limit reached" client issue in the "New Job" form.
  { id: "INV-3107", locationId: "bayside-commissary", status: "Sent", total: 9400.0, issuedAt: "2026-09-01", netDays: 30 },
];

// ---- the shifted exports ----------------------------------------------------

// The five tables that carry dates are written above against the ANCHOR and
// handed out on the REAL calendar — see `SHIFT_DAYS`. Everything else (clients,
// locations, services, labels, sources, branches, forms, company settings) has
// no date in it and is exported where it is declared.
export const EQUIPMENT: Equipment[] = shiftDates(EQUIPMENT_AT_ANCHOR);
export const WARRANTIES: Warranty[] = shiftDates(WARRANTIES_AT_ANCHOR);
export const JOBS: Job[] = shiftDates(JOBS_AT_ANCHOR);
export const ESTIMATES: Estimate[] = shiftDates(ESTIMATES_AT_ANCHOR);
export const INVOICES: Invoice[] = shiftDates(INVOICES_AT_ANCHOR);
