import { BadgeJobStatusStatus } from "../../components/Badge/BadgeJobStatus";
import { JOBS as DB_JOBS, LOCATIONS as DB_LOCATIONS, subStatusOf } from "../../data/db";

// THE JOB ROW — the shape a job takes once it leaves the database: optionals
// resolved to explicit nulls (the list filters test against null) and the
// client denormalized off the location.
//
// It lives in the shared tier because BOTH sides need it: the Jobs LIST builds
// it (src/app/jobsData.ts) and the Job Details MODULE consumes it. It used to
// live only in jobsData, which made the page import from the app — the wrong
// way round for a module (2026-09-28).

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
  /**
   * The SUB-STATUS's name, when the job has one — "Waiting for parts". Only a
   * paused or on-hold job can, and it is what the badge and the Status filter
   * print INSTEAD of the generic status label (Daniel, 2026-09-14; production's
   * `getJobStatusOrSubStatusLabel` and the Figma Status section's annotation,
   * "Sub-statuses — If exist, they are shown instead of the generic status").
   * The colour and the icon stay the status's.
   */
  subStatusId: string | null;
  subStatusName: string | null;
  labelIds: string[];
  type: JobType;
  priority: PriorityLevel | null;
  /** The COMPANY BRANCH handling the job — chosen by the dispatcher at creation. */
  branchId: string;
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

/** One database job as a row. */
export const jobRow = (job: (typeof DB_JOBS)[number]): Job => ({
  id: job.id,
  serviceId: job.serviceId,
  serviceName: job.serviceName,
  status: job.status,
  subStatusId: job.subStatusId ?? null,
  subStatusName: subStatusOf(job)?.name ?? null,
  labelIds: job.labelIds,
  type: job.type,
  priority: job.priority ?? null,
  branchId: job.branchId,
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
});

/**
 * Every job in the database as a row, sorted the Jobs view's own way —
 * Scheduled For ascending, like the production "Jobs → All Open" view;
 * unscheduled jobs have no date, so they sort last.
 */
export const JOB_ROWS: Job[] = DB_JOBS.map(jobRow).sort((a, b) => {
  if (a.scheduledFor == null && b.scheduledFor == null) return a.id.localeCompare(b.id);
  if (a.scheduledFor == null) return 1;
  if (b.scheduledFor == null) return -1;
  return a.scheduledFor.localeCompare(b.scheduledFor);
});

/** The row for one job id — what a page that was handed an id needs. */
export const jobRowById = (id: string): Job | undefined => JOB_ROWS.find((row) => row.id === id);
