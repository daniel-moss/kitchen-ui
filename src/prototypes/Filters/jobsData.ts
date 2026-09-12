import { BadgeJobStatusStatus, STATUS } from "../../components/Badge/BadgeJobStatus";
import { JOB_LABELS, JOB_SOURCES, JOBS as DB_JOBS, LOCATIONS as DB_LOCATIONS, JobLabel, JobSource } from "../../data/db";
import { users } from "../../data/users";

import { CLIENTS, LOCATIONS, SERVICES } from "./listData";

// Filters — the JOBS list's data door. Since 2026-09-11 it is a READER, not a
// generator: the whole jobs table lives in the shared demo database
// (src/data/db — Daniel: "I want each prototype and design in Storybook to
// take data from the db"), where the prototype's old seeded 64-job mass was
// MATERIALIZED next to the curated Wildwood-world jobs, all against the db's
// one demo clock (TODAY, 2026-09-04). This module maps the db rows onto the
// prototype's own Job shape (nullable fields instead of optionals) and keeps
// the lookups — so the filter registry and the page are untouched by where the
// rows live.
//
// The list therefore shows EVERY job in the database — the 64 former generator
// rows AND the ~14 curated ones (JOB-12xx). One world, one table.
//
// What is NOT here since the same day's split: the demo clock, the workspace
// tables both lists read (services, clients, locations), `locationAddress` and
// the date / duration formatters. None of them is jobs-specific, so they live
// in `listData.ts` — this module reads them from there like everyone else.

// ---- the tables only JOBS have ---------------------------------------------

export type LabelRecord = JobLabel;
export type SourceRecord = JobSource;

export const LABELS = JOB_LABELS;
export const SOURCES = JOB_SOURCES;

/** The techs a job can be assigned to — the "Assignee" filter's options. */
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
  /** ISO, or null when the status has never really changed (see the db type). */
  statusChangedAt: string | null;
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
