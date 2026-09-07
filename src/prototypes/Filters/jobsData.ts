import { BadgeJobStatusStatus, STATUS } from "../../components/Badge/BadgeJobStatus";
import {
  CLIENTS as DB_CLIENTS,
  JOB_LABELS,
  JOB_SOURCES,
  LOCATIONS as DB_LOCATIONS,
  SERVICES as DB_SERVICES,
  Client,
  JobLabel,
  JobSource,
  Location,
  Service,
} from "../../data/db";
import { users } from "../../data/users";
import { joinWithSeparator } from "../../utils/textSeparator";

// Filters — Concept 5's own little database (Daniel, 2026-08-17).
//
// WHY it exists: the concept used to carry 6 hand-written display rows plus 20
// cycled copies of them, with every value already formatted for the screen
// ("Aug 12", "2h 30m"). Nothing could be filtered or counted from that. Here a
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
// MIGRATED to the shared demo database on 2026-09-04 (src/data/db): clients,
// locations, services, labels and sources are the DATABASE's rows now, so
// every prototype shares one world — browse it under Data → Database. The
// generator below still builds this prototype's OWN 64-job table from them: a
// filterable mass of jobs is Filters' subject matter, and the database's
// small curated job list is not it. The database arrays keep the exact order
// the local records had, so the seeded generation is unchanged.
//
// The re-exports keep this module the prototype's single data door — the
// rest of the prototype imports from jobsData, never from the db directly.
//
// Location gotcha carried over: `unit` ("Suite 200") is filterable through
// the Address filter but never DISPLAYED — the Location row and the Address
// column draw "street, city, state postal" without it, so `locationAddress`
// leaves it out. (The field was called `suite` before the migration.)

export type ServiceRecord = Service;
export type ClientRecord = Client;
export type LocationRecord = Location;
export type LabelRecord = JobLabel;
export type SourceRecord = JobSource;

export const SERVICES = DB_SERVICES;
export const CLIENTS = DB_CLIENTS;
export const LOCATIONS = DB_LOCATIONS;
export const LABELS = JOB_LABELS;
export const SOURCES = JOB_SOURCES;

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
 * "Location name  ·  Street address, city, state postal code". Each half
 * appears only if it exists, so a nameless location is just its address and an
 * address-less one is just its name.
 *
 * The separator is the shared `TEXT_SEPARATOR` (Daniel, 2026-09-04) — the
 * node's own U+30FB katakana dot is retired: Inter does not contain it, so it
 * rendered from a different fallback font in every app. FLAGGED: the Figma
 * node still draws " ・ ".
 */
export function locationLabel(location: LocationRecord): string {
  return joinWithSeparator(location.name, locationAddress(location) || null);
}

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

/** "Aug 12" — month FIRST, the US order (Daniel, 2026-09-04; was "12 Aug").
 *  Matches the production formatDate ("MMM D") and every other formatter in
 *  the DS (they use Intl en-US, which is month-first already). */
export function formatDay(iso: string | null): string {
  if (iso == null) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
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
 * "Aug 12, 9:00 AM" — US 12-hour time, date and time joined by a COMMA
 * (Daniel, 2026-09-04, after the separator research: a date with its time is
 * one compound value, which style guides join with a comma or "at", never a
 * symbol). Was "12 Aug • 9:00 AM", and 24-hour "12 Aug • 09:00" before that.
 * FLAGGED: the production DateTimeCell still prints the bullet — the two now
 * differ on purpose, pending the product-wide separator decision.
 */
export function formatDateTime(iso: string | null): string {
  if (iso == null) return "";
  return `${formatDay(iso)}, ${formatTime(iso)}`;
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
