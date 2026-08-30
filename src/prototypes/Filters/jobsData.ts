import { BadgeJobStatusStatus, STATUS } from "../../components/Badge/BadgeJobStatus";
import { users } from "../../data/users";

// Filters — Concept 5's own little database (Daniel, 2026-08-17).
//
// WHY it exists: the concept used to carry 6 hand-written display rows plus 20
// cycled copies of them, with every value already formatted for the screen
// ("12 Aug", "2h 30m"). Nothing could be filtered or counted from that. Here a
// job holds REAL values — dates as ISO strings, duration in minutes, related
// records as ids — and the strings the table shows are derived from them. That is
// what lets the filters both COUNT and FILTER the same list (see filters.tsx).
//
// Two deliberate choices:
//
// 1. **Anchored to a fixed date, not to "now".** `TODAY` is a constant. If the
//    data were generated from the real clock, every filter count and every
//    screenshot would drift day by day, and a job written as "past due" would
//    quietly stop being past due. FLAGGED to Daniel: the dates will read as
//    stale eventually — move `TODAY` forward (one line) when that matters.
//
// 2. **Deterministic generation.** The 64 jobs come from a seeded generator, so
//    the list, the counts and the screenshots are identical on every reload.
//    `Math.random()` would reshuffle the table each time and make any count
//    impossible to check.

/** The date everything is measured from. See note 1 above. */
export const TODAY = new Date("2026-08-17T09:00:00");

const DAY_MS = 24 * 60 * 60 * 1000;

/** `TODAY` shifted by whole days (negative = the past), at a given local time. */
function dayAt(offsetDays: number, hour = 9, minute = 0): string {
  const d = new Date(TODAY.getTime() + offsetDays * DAY_MS);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ---- the related records ---------------------------------------------------

export interface ServiceRecord {
  id: string;
  name: string;
}

/** The work being done. Also the "Service" filter's options. */
export const SERVICES: ServiceRecord[] = [
  { id: "walk-in-cooler", name: "Walk-in cooler repair" },
  { id: "fryer-service", name: "Fryer service and calibration" },
  { id: "ice-machine", name: "Ice machine descale" },
  { id: "dishwasher", name: "Dishwasher inspection" },
  { id: "combi-oven", name: "Combi oven quarterly maintenance" },
  { id: "hood-cleaning", name: "Grill hood cleaning" },
  { id: "freezer-seal", name: "Freezer door seal replacement" },
  { id: "range-burner", name: "Range burner repair" },
  { id: "steam-table", name: "Steam table thermostat swap" },
  { id: "prep-fridge", name: "Prep fridge compressor service" },
  { id: "grease-trap", name: "Grease trap service" },
  { id: "espresso", name: "Espresso machine descale" },
];

export interface ClientRecord {
  id: string;
  name: string;
}

export const CLIENTS: ClientRecord[] = [
  { id: "wildwood", name: "Wildwood Kitchen" },
  { id: "harbour", name: "Harbour Grill" },
  { id: "bayside", name: "Bayside Catering" },
  { id: "ferry", name: "Ferry Building Deli" },
  { id: "mission", name: "Mission Taqueria" },
  { id: "northpoint", name: "North Point Hotel" },
  { id: "sunset", name: "Sunset Bakery" },
  { id: "presidio", name: "Presidio Canteen" },
];

/**
 * A location — REBUILT 2026-08-24 for the Location filter (Figma section
 * 13986-51028). It used to hold a `name` that repeated the client's ("Wildwood
 * Kitchen — Downtown") and one pre-formatted `address` string. Neither works for
 * the designed list, which groups the rows BY CLIENT and prints
 * "Location name ・ Street address, city, state postal code":
 *
 *   - the group header already says the client, so the name here is the site's
 *     OWN name ("Downtown"), never the client's again;
 *   - EVERY part is optional, and the row shows only the parts that exist
 *     (Daniel, 2026-08-24). A pre-joined string cannot answer "does this
 *     location have a postal code", so the parts are stored apart and joined by
 *     `locationAddress` below.
 *
 * The data deliberately covers each gap: `ferry-main` and `presidio-canteen`
 * have no name, `presidio-canteen` no street, `bayside-commissary` no postal
 * code, and `northpoint-banquet` no address at all.
 */
export interface LocationRecord {
  id: string;
  clientId: string;
  /** The site's own name. Null for a client with one site — common in the app. */
  name: string | null;
  street: string | null;
  /**
   * Suite / unit. Added 2026-08-24 for the ADDRESS filter, whose second field is
   * "Suite, unit, etc." (Figma node 13995-16610).
   *
   * FLAGGED: it is filterable but never DISPLAYED — the Location filter's row
   * (13987-52348) and the table's Address column both draw "Street address,
   * city, state postal code" with no suite in it, so `locationAddress` leaves it
   * out. Say the word and it goes in after the street.
   */
  suite: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

/** Locations belong to a client — that is why the two filters are separate. */
export const LOCATIONS: LocationRecord[] = [
  { id: "wildwood-downtown", clientId: "wildwood", name: "Downtown", street: "418 Mission St", suite: "Suite 200", city: "San Francisco", state: "CA", postalCode: "94105" },
  { id: "wildwood-airport", clientId: "wildwood", name: "Airport", street: "780 McDonnell Rd", suite: "Terminal 2", city: "San Francisco", state: "CA", postalCode: "94128" },
  { id: "harbour-pier", clientId: "harbour", name: "Pier 39", street: "1201 Beach St", suite: null, city: "San Francisco", state: "CA", postalCode: "94109" },
  { id: "harbour-marina", clientId: "harbour", name: "Marina", street: "2100 Chestnut St", suite: "Unit B", city: "San Francisco", state: "CA", postalCode: "94123" },
  // No postal code.
  { id: "bayside-commissary", clientId: "bayside", name: "Commissary", street: "77 Industrial Way", suite: null, city: "Oakland", state: "CA", postalCode: null },
  // One site, so no name of its own — the address IS the name.
  { id: "ferry-main", clientId: "ferry", name: null, street: "1 Ferry Building", suite: "Shop 12", city: "San Francisco", state: "CA", postalCode: "94111" },
  { id: "mission-24th", clientId: "mission", name: "24th St", street: "2840 24th St", suite: null, city: "San Francisco", state: "CA", postalCode: "94110" },
  { id: "northpoint-hotel", clientId: "northpoint", name: "Main kitchen", street: "555 North Point St", suite: null, city: "San Francisco", state: "CA", postalCode: "94133" },
  // Shares the hotel's building, so the address was never filled in — name only.
  { id: "northpoint-banquet", clientId: "northpoint", name: "Banquet", street: null, suite: null, city: null, state: null, postalCode: null },
  { id: "sunset-judah", clientId: "sunset", name: "Judah St", street: "1750 Judah St", suite: null, city: "San Francisco", state: "CA", postalCode: "94122" },
  // No name and no street — city, state and code are all it has.
  { id: "presidio-canteen", clientId: "presidio", name: null, street: null, suite: null, city: "San Francisco", state: "CA", postalCode: "94129" },
];

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

/**
 * One location as the filter row writes it (Figma node 13987-52348):
 * "Location name ・ Street address, city, state postal code". Each half appears
 * only if it exists, so a nameless location is just its address and an
 * address-less one is just its name.
 *
 * The separator is U+30FB KATAKANA MIDDLE DOT with a space each side — the exact
 * character the node uses. It sits wider than a bullet (•) and appears nowhere
 * else in the DS, which draws its group-label dot in CSS instead. FLAGGED: if
 * this should be the ordinary • , this constant is the only place to change.
 */
export const LOCATION_SEPARATOR = " ・ ";

export function locationLabel(location: LocationRecord): string {
  return [location.name, locationAddress(location) || null].filter((part) => part != null).join(LOCATION_SEPARATOR);
}

export interface LabelRecord {
  id: string;
  name: string;
}

export const LABELS: LabelRecord[] = [
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

export interface SourceRecord {
  id: string;
  name: string;
  /** Prefix for the demo Source ID, or null for sources that provide none. */
  prefix: string | null;
}

export const SOURCES: SourceRecord[] = [
  { id: "phone", name: "Phone call", prefix: "CALL" },
  { id: "web", name: "Web form", prefix: "WEB" },
  { id: "email", name: "Email", prefix: "EM" },
  { id: "series", name: "Recurring series", prefix: "SER" },
  { id: "walk-in", name: "Walk-in", prefix: null },
  { id: "portal", name: "Client portal", prefix: "PRT" },
];

/** The techs a job can be assigned to — the "Assignees" filter's options. */
// Nine technicians — the nine the Assignee filter's node lists (Daniel,
// 2026-08-18); it was eight before.
export const TECHS = users.slice(0, 9);

// ---- the job itself ---------------------------------------------------------

/** 1 = Urgent … 4 = Low, matching the table's PRIORITY map. null = no priority. */
export type PriorityLevel = 1 | 2 | 3 | 4;

/** The Job Details page's Service "Type": a new call or a recall of an old job. */
export type JobType = "new" | "recall";

export interface Job {
  id: string;
  serviceId: string;
  status: BadgeJobStatusStatus;
  labelIds: string[];
  type: JobType;
  priority: PriorityLevel | null;
  sourceId: string;
  /** The source's own reference, when it has one. */
  sourceRef: string | null;
  assigneeIds: number[];
  clientId: string;
  locationId: string;
  /** ISO. When the request came in. */
  receivedAt: string;
  /** ISO, or null when the job is not scheduled yet. */
  scheduledFor: string | null;
  /** Minutes, or null when there is no scheduled visit. */
  durationMinutes: number | null;
  /** ISO. When the status last changed. */
  statusChangedAt: string;
  /** ISO. Any edit to the job. */
  lastModifiedAt: string;
}

// ---- generation ------------------------------------------------------------

// A tiny seeded generator (mulberry32). See note 2 at the top: the data must be
// the same on every reload, or no count can be checked against the list.
function makeRng(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = makeRng(20260817);
const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length)];
/** An integer in [min, max]. */
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

/**
 * Status mix. Weighted so the list reads like a real "Open jobs" view — mostly
 * upcoming and unscheduled work, a few in flight, a tail of closed jobs.
 */
const STATUS_MIX: BadgeJobStatusStatus[] = [
  ...(Array(9).fill("upcoming") as BadgeJobStatusStatus[]),
  ...(Array(7).fill("unscheduled") as BadgeJobStatusStatus[]),
  ...(Array(5).fill("active") as BadgeJobStatusStatus[]),
  ...(Array(4).fill("pastDue") as BadgeJobStatusStatus[]),
  ...(Array(3).fill("completed") as BadgeJobStatusStatus[]),
  ...(Array(2).fill("quickPaused") as BadgeJobStatusStatus[]),
  ...(Array(2).fill("finalized") as BadgeJobStatusStatus[]),
  "draft",
  "onHoldExternal",
  "onHoldInternal",
  "cancelled",
];

/** Priority mix — most jobs are Medium or Low, a few Urgent, some unset. */
const PRIORITY_MIX: (PriorityLevel | null)[] = [1, 2, 2, 3, 3, 3, 3, 4, 4, 4, null, null];

/** Duration options in minutes; null means "no visit scheduled". */
const DURATION_MIX = [30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300];

// When each status puts the scheduled visit, relative to TODAY (in days).
// `null` = the status has no scheduled visit at all.
function scheduleWindow(status: BadgeJobStatusStatus): [number, number] | null {
  switch (status) {
    case "unscheduled":
    case "draft":
      return null;
    case "pastDue":
      return [-9, -1];
    case "active":
    case "quickPaused":
      return [0, 0];
    case "completed":
    case "finalized":
      return [-21, -2];
    case "cancelled":
      return [-14, 5];
    case "onHoldExternal":
    case "onHoldInternal":
      return [-4, 12];
    default: // upcoming
      return [0, 21];
  }
}

function makeJob(index: number): Job {
  const status = STATUS_MIX[index % STATUS_MIX.length];
  const service = pick(SERVICES);
  const location = pick(LOCATIONS);
  const source = pick(SOURCES);

  const window = scheduleWindow(status);
  const scheduledOffset = window == null ? null : int(window[0], window[1]);
  const scheduledFor = scheduledOffset == null ? null : dayAt(scheduledOffset, int(7, 17), pick([0, 15, 30, 45]));
  const durationMinutes = scheduledFor == null ? null : pick(DURATION_MIX);

  // Received before the visit, and never in the future.
  const receivedOffset = Math.min(-1, (scheduledOffset ?? 0) - int(1, 12));
  // The status changed after it came in, and the last edit is the most recent.
  const statusChangedOffset = int(receivedOffset, 0);
  const lastModifiedOffset = int(statusChangedOffset, 0);

  // A recall points at an earlier job, so it is never a brand-new request.
  const type: JobType = rand() < 0.22 ? "recall" : "new";

  const labelCount = int(0, 3);
  const labelIds: string[] = [];
  while (labelIds.length < labelCount) {
    const label = pick(LABELS).id;
    if (!labelIds.includes(label)) labelIds.push(label);
  }

  // An unscheduled or draft job has nobody on it yet; the rest have 1–3 techs.
  const assigneeCount = scheduledFor == null ? int(0, 1) : int(1, 3);
  const assigneeIds: number[] = [];
  while (assigneeIds.length < assigneeCount) {
    const tech = pick(TECHS).id;
    if (!assigneeIds.includes(tech)) assigneeIds.push(tech);
  }

  return {
    id: `JOB-${1043 + index}`,
    serviceId: service.id,
    status,
    labelIds,
    type,
    priority: PRIORITY_MIX[(index * 5) % PRIORITY_MIX.length],
    sourceId: source.id,
    sourceRef: source.prefix == null ? null : `${source.prefix}-${int(1000, 9999)}`,
    assigneeIds,
    clientId: location.clientId,
    locationId: location.id,
    receivedAt: dayAt(receivedOffset, int(8, 16), pick([0, 15, 30, 45])),
    scheduledFor,
    durationMinutes,
    statusChangedAt: dayAt(statusChangedOffset, int(8, 17)),
    lastModifiedAt: dayAt(lastModifiedOffset, int(8, 17)),
  };
}

/** 64 jobs — enough for believable filter counts, few enough to render plainly. */
export const JOBS: Job[] = Array.from({ length: 64 }, (_, index) => makeJob(index)).sort((a, b) => {
  // The view is sorted by Scheduled For ascending, like the production
  // "Jobs → All Open" view. Unscheduled jobs have no date, so they sort last.
  if (a.scheduledFor == null && b.scheduledFor == null) return a.id.localeCompare(b.id);
  if (a.scheduledFor == null) return 1;
  if (b.scheduledFor == null) return -1;
  return a.scheduledFor.localeCompare(b.scheduledFor);
});

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const SERVICE_BY_ID = byId(SERVICES);
const CLIENT_BY_ID = byId(CLIENTS);
const LOCATION_BY_ID = byId(LOCATIONS);
const LABEL_BY_ID = byId(LABELS);
const SOURCE_BY_ID = byId(SOURCES);
const TECH_BY_ID = new Map(TECHS.map((tech) => [tech.id, tech]));

export const serviceOf = (job: Job) => SERVICE_BY_ID.get(job.serviceId)!;
export const clientOf = (job: Job) => CLIENT_BY_ID.get(job.clientId)!;
export const locationOf = (job: Job) => LOCATION_BY_ID.get(job.locationId)!;
export const sourceOf = (job: Job) => SOURCE_BY_ID.get(job.sourceId)!;
export const labelsOf = (job: Job) => job.labelIds.map((id) => LABEL_BY_ID.get(id)!);
export const assigneesOf = (job: Job) => job.assigneeIds.map((id) => TECH_BY_ID.get(id)!);

/** The status's own label, straight from BadgeJobStatus — never a second copy. */
export const statusLabel = (status: BadgeJobStatusStatus) => STATUS[status].label;

// ---- display formatting ----------------------------------------------------
// Everything the table prints is derived here, from the values above.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12 Aug" */
export function formatDay(iso: string | null): string {
  if (iso == null) return "";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "12 Aug • 09:00" */
export function formatDateTime(iso: string | null): string {
  if (iso == null) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDay(iso)} • ${hh}:${mm}`;
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
