import { BadgeJobStatusStatus, STATUS } from "../components/Badge/BadgeJobStatus";
import {
  JOB_LABELS,
  JOB_SOURCES,
  JOBS as DB_JOBS,
  LOCATIONS as DB_LOCATIONS,
  JobLabel,
  JobSource,
  subStatusOf,
} from "../data/db";
import { users } from "../data/users";

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
// The row SHAPE moved to the shared tier on 2026-09-28 (the Job Details module
// needs it too) — re-exported so every import of this file keeps working.
export type { Job, JobType, PriorityLevel } from "../modules/shared/jobRow";
import type { Job } from "../modules/shared/jobRow";

/**
 * Every job as a row. The BUILDER moved to the shared tier on 2026-09-28 with
 * the shape — the Job Details module needs both — so this is a re-export.
 */
export { JOB_ROWS as JOBS, jobRow, jobRowById } from "../modules/shared/jobRow";
import { JOB_ROWS as JOBS } from "../modules/shared/jobRow";

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
