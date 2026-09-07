import {
  Client,
  ClientContact,
  Equipment,
  Estimate,
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
// locations (same ids), so migrating Filters onto this database later is a
// data swap, not a rewrite. Equipment, warranties, contacts, jobs, estimates
// and invoices are new here.
//
// Deliberate gaps (for empty states): ferry-main and presidio-canteen have no
// location name, northpoint-banquet no address, some equipment misses its
// manufacturer/model/serial, some has no warranty, Presidio Canteen is a
// deactivated client.

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

export const EQUIPMENT: Equipment[] = [
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

export const WARRANTIES: Warranty[] = [
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

export const JOBS: Job[] = [
  {
    id: "JOB-1201",
    locationId: "wildwood-downtown",
    serviceName: "Walk-in cooler repair",
    status: "active",
    priority: 1,
    scheduledFor: "2026-09-04T08:00:00",
    durationMinutes: 120,
    assigneeIds: [1],
    // Both refrigeration pieces — the Job Details prototype opens on this job
    // and its demo shows two equipment modules.
    equipmentIds: ["eq-wd-walkin", "eq-wd-reachin"],
    // The reporter is a saved location contact's details, copied onto the job
    // (production denormalizes exactly like this).
    reporter: { name: "Ben Castillo", phone: "(415) 555-0121", email: "ben@wildwoodkitchen.com", isEphemeral: false },
    notes: "Not holding temperature overnight. Check the door gasket first.",
  },
  {
    id: "JOB-1202",
    locationId: "wildwood-airport",
    serviceName: "Fryer preventive maintenance",
    status: "upcoming",
    priority: 3,
    scheduledFor: "2026-09-09T06:30:00",
    durationMinutes: 180,
    assigneeIds: [4, 7],
    equipmentIds: ["eq-wa-fryer1", "eq-wa-fryer2"],
  },
  {
    // The job's OWN contact: a night porter who is nobody's saved contact —
    // `isEphemeral` keeps him off the location's contact list.
    id: "JOB-1203",
    locationId: "northpoint-hotel",
    serviceName: "Walk-in freezer door repair",
    status: "pastDue",
    priority: 2,
    scheduledFor: "2026-08-28T22:00:00",
    durationMinutes: 90,
    assigneeIds: [5],
    equipmentIds: ["eq-np-walkin"],
    reporter: { name: "Night porter (Karl)", phone: "(415) 555-0111", isEphemeral: true },
    pointOfContact: { name: "Stefan Iversen", email: "s.iversen@northpointhotel.com", isEphemeral: false },
  },
  {
    id: "JOB-1204",
    locationId: "harbour-pier",
    serviceName: "Ice machine descale",
    status: "completed",
    priority: 4,
    scheduledFor: "2026-08-20T07:00:00",
    durationMinutes: 60,
    assigneeIds: [2],
    equipmentIds: ["eq-hp-ice"],
  },
  {
    id: "JOB-1205",
    locationId: "harbour-pier",
    serviceName: "Dishwasher rinse-aid line replacement",
    status: "unscheduled",
    assigneeIds: [],
    equipmentIds: ["eq-hp-dish"],
  },
  {
    id: "JOB-1206",
    locationId: "bayside-commissary",
    serviceName: "Combi oven quarterly service",
    status: "upcoming",
    priority: 3,
    scheduledFor: "2026-09-12T05:00:00",
    durationMinutes: 150,
    assigneeIds: [3, 9],
    equipmentIds: ["eq-bc-oven"],
    notes: "Before 6 AM only (client rule).",
  },
  {
    id: "JOB-1207",
    locationId: "mission-24th",
    serviceName: "Hood cleaning estimate visit",
    status: "draft",
    assigneeIds: [],
    equipmentIds: [],
    // A brand-new client: the whole contact exists only on this job so far.
    reporter: { name: "Luz Herrera", phone: "(415) 555-0129", isEphemeral: true },
  },
  {
    id: "JOB-1208",
    locationId: "sunset-judah",
    serviceName: "Proofer thermostat replacement",
    status: "onHoldExternal",
    priority: 2,
    scheduledFor: "2026-08-26T09:00:00",
    durationMinutes: 60,
    assigneeIds: [8],
    equipmentIds: ["eq-sj-proofer"],
    notes: "Waiting on the part (Metro, ETA unknown).",
  },
  {
    id: "JOB-1209",
    locationId: "wildwood-downtown",
    serviceName: "Range pilot relight",
    status: "finalized",
    scheduledFor: "2026-07-30T10:00:00",
    durationMinutes: 45,
    assigneeIds: [1],
    equipmentIds: ["eq-wd-range"],
  },
  {
    id: "JOB-1210",
    locationId: "ferry-main",
    serviceName: "Reach-in cooler diagnostic",
    status: "cancelled",
    scheduledFor: "2026-08-15T13:00:00",
    assigneeIds: [6],
    equipmentIds: [],
    notes: "Client fixed it themselves.",
  },
  // Three more walk-in-cooler jobs at Wildwood Downtown (added 2026-09-08) —
  // with JOB-1201 they make the "New Job" form's Similar-jobs list four rows
  // deep: sorting (scheduled first, unscheduled last), the "by Someone"
  // unassigned caption, and the "Show 1 more" truncation all demonstrate.
  {
    id: "JOB-1211",
    locationId: "wildwood-downtown",
    serviceName: "Walk-in cooler repair",
    status: "upcoming",
    priority: 2,
    scheduledFor: "2026-09-15T09:00:00",
    durationMinutes: 90,
    assigneeIds: [4],
    equipmentIds: ["eq-wd-walkin"],
  },
  {
    id: "JOB-1212",
    locationId: "wildwood-downtown",
    serviceName: "Walk-in cooler repair",
    status: "onHoldExternal",
    priority: 3,
    scheduledFor: "2026-09-22T13:00:00",
    durationMinutes: 60,
    assigneeIds: [7],
    equipmentIds: ["eq-wd-walkin"],
    notes: "Waiting for the replacement gasket to arrive.",
  },
  {
    // Finalized walk-in-cooler job (added 2026-09-08) — the "New Job" form's
    // Possible-recalls SERVICE match (JOB-1209's range covers the equipment
    // match).
    id: "JOB-1214",
    locationId: "wildwood-downtown",
    serviceName: "Walk-in cooler repair",
    status: "finalized",
    priority: 2,
    scheduledFor: "2026-08-20T08:00:00",
    durationMinutes: 150,
    assigneeIds: [3],
    equipmentIds: ["eq-wd-walkin"],
  },
  {
    // Unassigned on purpose — the caption falls back to "by Someone".
    id: "JOB-1213",
    locationId: "wildwood-downtown",
    serviceName: "Walk-in cooler repair",
    status: "unscheduled",
    priority: 4,
    assigneeIds: [],
    equipmentIds: [],
  },
];

export const ESTIMATES: Estimate[] = [
  { id: "EST-2201", locationId: "wildwood-downtown", jobId: "JOB-1201", serviceName: "Walk-in cooler compressor replacement", status: "Sent", total: 3480.0, createdAt: "2026-09-02" },
  { id: "EST-2202", locationId: "mission-24th", jobId: "JOB-1207", serviceName: "Hood deep cleaning", status: "Pending", total: 1250.0, createdAt: "2026-08-30" },
  { id: "EST-2203", locationId: "northpoint-hotel", serviceName: "Walk-in freezer door assembly", status: "Approved", total: 2190.5, createdAt: "2026-08-25" },
  { id: "EST-2204", locationId: "bayside-commissary", serviceName: "Combi oven annual contract", status: "Won", total: 5400.0, createdAt: "2026-07-18" },
  { id: "EST-2205", locationId: "harbour-marina", serviceName: "Kitchen build-out consultation", status: "Lost", total: 8900.0, createdAt: "2026-06-11" },
  { id: "EST-2206", locationId: "sunset-judah", jobId: "JOB-1208", serviceName: "Proofer thermostat + calibration", status: "Sent", total: 480.0, createdAt: "2026-08-24" },
];

// The reference tables, MOVED VERBATIM from the Filters prototype on
// migration (2026-09-04). Their ORDER is load-bearing: Filters' seeded job
// generator draws from these arrays, and a reorder would reshuffle its 64
// demo jobs.

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

export const INVOICES: Invoice[] = [
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
