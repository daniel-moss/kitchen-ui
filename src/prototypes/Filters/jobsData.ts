import { BadgeJobStatusStatus, STATUS } from "../../components/Badge/BadgeJobStatus";
import {
  CLIENTS as DB_CLIENTS,
  JOB_LABELS,
  JOB_SOURCES,
  JOBS as DB_JOBS,
  LOCATIONS as DB_LOCATIONS,
  SERVICES as DB_SERVICES,
  TODAY as DB_TODAY,
  Client,
  JobLabel,
  JobSource,
  Location,
  Service,
} from "../../data/db";
import { users } from "../../data/users";
import { joinWithSeparator } from "../../utils/textSeparator";

// Filters — the Jobs list's data door. Since 2026-09-11 it is a READER, not a
// generator: the whole jobs table lives in the shared demo database
// (src/data/db — Daniel: "I want each prototype and design in Storybook to
// take data from the db"), where the prototype's old seeded 64-job mass was
// MATERIALIZED next to the curated Wildwood-world jobs, all against the db's
// one demo clock (TODAY, 2026-09-04). This module maps the db rows onto the
// prototype's own Job shape (nullable fields instead of optionals), derives
// the display strings, and keeps the lookups — so the rest of the prototype
// (filterDefs, Filters.tsx) is untouched by where the rows live.
//
// The list therefore now shows EVERY job in the database — the 64 former
// generator rows AND the ~14 curated ones (JOB-12xx). One world, one table.

/** The demo's fixed NOW — the database's clock (see db.ts). */
export const TODAY = DB_TODAY;

const DAY_MS = 24 * 60 * 60 * 1000;

// ---- the related records ---------------------------------------------------
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
 * The address INCLUDING the unit — "418 Mission St, Suite 200, San Francisco,
 * CA 94105". The Location filter's object row draws this as its title (node
 * 14101-44923 writes "123 Main Street, Suite 45, San Francisco, CA 98765").
 *
 * FLAGGED: the table's "Location address" COLUMN still leaves the unit out, so
 * the same location reads slightly differently in the two places. That is what
 * each node draws; say the word and they can be made to agree.
 */
export function locationAddressWithUnit(location: LocationRecord): string {
  const region = [location.state, location.postalCode].filter((part) => part != null).join(" ");
  return [location.street, location.unit, location.city, region === "" ? null : region]
    .filter((part) => part != null && part !== "")
    .join(", ");
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

// The prototype's row shape: the db's Job with its optionals resolved to
// explicit nulls (the filters' predicates test against null) and the client
// denormalized off the location.
export interface Job {
  id: string;
  serviceId: string;
  /**
   * The job's OWN service name — production denormalizes it, and it may
   * drift from the pricebook name (JOB-1202 is "Fryer preventive
   * maintenance" on the "Fryer service and calibration" service). The table
   * and the search show THIS; the Service filter matches `serviceId`.
   */
  serviceName: string;
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

const LOCATION_CLIENT = new Map(DB_LOCATIONS.map((location) => [location.id, location.clientId]));

/**
 * Every job in the database, sorted the view's own way — Scheduled For
 * ascending, like the production "Jobs → All Open" view; unscheduled jobs
 * have no date, so they sort last.
 */
export const JOBS: Job[] = DB_JOBS.map(
  (job): Job => ({
    id: job.id,
    serviceId: job.serviceId,
    serviceName: job.serviceName,
    status: job.status,
    labelIds: job.labelIds,
    type: job.type,
    priority: job.priority ?? null,
    sourceId: job.sourceId,
    sourceRef: job.sourceRef ?? null,
    assigneeIds: job.assigneeIds,
    clientId: LOCATION_CLIENT.get(job.locationId)!,
    locationId: job.locationId,
    receivedAt: job.receivedAt,
    scheduledFor: job.scheduledFor ?? null,
    durationMinutes: job.durationMinutes ?? null,
    statusChangedAt: job.statusChangedAt,
    lastModifiedAt: job.lastModifiedAt,
  }),
).sort((a, b) => {
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
