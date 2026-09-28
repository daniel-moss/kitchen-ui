import { BadgeJobStatusStatus } from "../../components/Badge/BadgeJobStatus";
import { completedAt, historyOf, jobById, locationById, locationContactsOf, startedAt } from "../../data/db";
import { users, usersById } from "../../data/users";
import type { ActivityEvent, JobStatusLog } from "./activityEvents";
import { Job } from "../shared/jobRow";

import { Equipment, equipmentPoolOf } from "./equipment";
import { JobLocation, LOCATIONS } from "./jobData";
import { JobState, JobStatus } from "./jobState";
import { Scheduling } from "./SchedulingForm";
import type { SignatureResult } from "./SignatureModule";

// SEEDING — the one place that turns a DATABASE job into the starting state of
// the Job Details page.
//
// The page was written for a single hardcoded job (`JOB_ID` in jobData.ts),
// because it was a prototype of ONE screen. In the app it has to serve all 78,
// so every piece of state the page starts with is derived here instead.
//
// Only the SEED lives here. Once the page is open the user's edits own the
// state, exactly as they did in the prototype — this file is never consulted
// again until another job is opened.

/**
 * Database status → the page's lifecycle status.
 *
 * The two vocabularies differ on purpose. The database records what a job IS
 * (including `draft` and `pastDue`, which are a phase and a clock reading);
 * the page records what the TECH can do next, so it has no draft, treats past
 * due as upcoming (the work has still not started) and splits "on hold" into
 * the reason it is held. `everStarted` is what unlocks the timesheet.
 */
export function seedJobState(job: Job): JobState {
  const status = job.status;
  const map: Record<BadgeJobStatusStatus, JobStatus> = {
    draft: "unscheduled",
    unscheduled: "unscheduled",
    upcoming: "upcoming",
    pastDue: "upcoming",
    active: "active",
    quickPaused: "quickPaused",
    onHoldExternal: "onHold",
    onHoldInternal: "onHold",
    completed: "completed",
    finalized: "finalized",
    cancelled: "cancelled",
  };
  const next = map[status];
  // A job that reached any of these has been started at least once, so the
  // timesheet has something to show.
  const everStarted = ["active", "quickPaused", "onHold", "completed", "finalized"].includes(next);

  // The Status module prints these; without them every job showed the
  // prototype's single hardcoded stamp.
  const dbJob = jobById(job.id);
  const started = dbJob == null ? null : startedAt(dbJob);
  const finished = dbJob == null ? null : completedAt(dbJob);
  const changed = job.statusChangedAt;

  return {
    status: next,
    everStarted,
    // The job's own reason, so a paused or held job opens NAMING why — the
    // page showed the generic status before (2026-09-28).
    subStatus: job.subStatusName ?? undefined,
    startedAt: stamp(started),
    activeAt: next === "active" ? stamp(changed) : undefined,
    pausedAt: next === "quickPaused" || next === "onHold" ? stamp(changed) : undefined,
    cancelledAt: next === "cancelled" ? stamp(changed) : undefined,
    unscheduledAt: next === "unscheduled" ? stamp(changed) : undefined,
    completedAt: next === "completed" ? stamp(finished) : undefined,
    finalizedAt: next === "finalized" ? stamp(finished) : undefined,
  };
}

/** "Mon, Jan 1 at 12:00 PM" — the Status module's stamp format. */
function stamp(iso: string | null | undefined): string | undefined {
  if (iso == null) return undefined;
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(/\u202f/g, " ");
  return `${date} at ${time}`;
}

/** The job's schedule, in the form's date + time-string + typed-duration shape. */
export function seedScheduling(job: Job): Scheduling {
  const date = job.scheduledFor == null ? null : new Date(job.scheduledFor);
  const total = job.durationMinutes ?? 0;
  return {
    date,
    time:
      date == null
        ? "9:00 AM"
        : // A narrow no-break space is what Intl puts before AM/PM; the form's
          // options use a plain space, so it would never match.
          date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(/ /g, " "),
    hours: String(Math.floor(total / 60)),
    minutes: String(total % 60).padStart(2, "0"),
  };
}

/**
 * The job's service location, as the page's own location record.
 *
 * The page's pool (`LOCATIONS`) is the database's locations re-keyed with pool
 * ids, so the match is by address — the one field both carry unchanged.
 */
export function seedLocation(job: Job): JobLocation {
  const dbLocation = locationById(job.locationId);
  if (dbLocation == null) return LOCATIONS[0];
  const found = LOCATIONS.find((row) => row.name === (dbLocation.name ?? "") && row.address.startsWith(dbLocation.street));
  return found ?? LOCATIONS.find((row) => row.address.startsWith(dbLocation.street)) ?? LOCATIONS[0];
}

/**
 * The equipment pool this job can pick from — its LOCATION's, because
 * equipment belongs to a place.
 */
export function seedEquipmentPool(job: Job): Equipment[] {
  return equipmentPoolOf(job.locationId);
}

/**
 * The equipment this job actually services. It comes off the DATABASE job
 * (the list's own `Job` shape does not carry it — a list has no column for
 * equipment), filtered to the pool so an unknown id is dropped rather than
 * rendered as a blank row.
 */
export function seedEquipmentIds(job: Job): string[] {
  const dbJob = jobById(job.id);
  if (dbJob == null) return [];
  const known = new Set(equipmentPoolOf(job.locationId).map((piece) => piece.id));
  return dbJob.equipmentIds.filter((id: string) => known.has(id));
}

// ---- the timesheet ---------------------------------------------------------

/** The shape the Timesheet panel stores a session in. */
export interface SeededSession {
  id: number;
  startLabel: string;
  month: string;
  day: string;
  dateLabel: string;
  weekdayLabel?: string;
  active: boolean;
  endLabel?: string;
  endDateLabel?: string;
  endWeekdayLabel?: string;
  durationSec: number;
  category?: string;
  userId: number;
}

const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(/\u202f/g, " ");
const longDate = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const weekday = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

/** What the Timesheet shows a category as. */
const CATEGORY_LABEL: Record<string, string> = { travel: "Travelling", labor: "Working", break: "Break" };

/**
 * The job's tracked time, from its generated history — so a completed job
 * opens with the work already on the timesheet instead of an empty tab.
 */
export function seedSessions(job: Job): SeededSession[] {
  const dbJob = jobById(job.id);
  if (dbJob == null) return [];
  return historyOf(dbJob).sessions.map((session, index) => {
    const start = new Date(session.start);
    const end = session.end == null ? null : new Date(session.end);
    const sameDay = end != null && end.toDateString() === start.toDateString();
    return {
      id: index + 1,
      userId: session.userId,
      startLabel: time(start),
      month: start.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: String(start.getDate()),
      dateLabel: longDate(start),
      weekdayLabel: weekday(start),
      active: end == null,
      endLabel: end == null ? undefined : time(end),
      endDateLabel: end == null || sameDay ? undefined : longDate(end),
      endWeekdayLabel: end == null || sameDay ? undefined : weekday(end),
      durationSec: end == null ? 0 : Math.round((end.getTime() - start.getTime()) / 1000),
      category: CATEGORY_LABEL[session.category],
    };
  });
}

/** Who tracked time on this job — the Timesheet groups by person. */
export const seedSessionUsers = (job: Job): number[] => {
  const ids = new Set(seedSessions(job).map((s) => s.userId));
  return [...ids].filter((id) => usersById.has(id));
};

// ---- the activity log ------------------------------------------------------

// Each job status owns its log glyph — solid, in its own color (Figma
// 24512-62842). Kept in step with JOB_GLYPH in JobDetails.tsx.
const GLYPH: Record<string, { icon: string; color: string }> = {
  draft: { icon: "circle-dashed", color: "var(--gray-a8)" },
  unscheduled: { icon: "circle-dashed", color: "var(--violet-9)" },
  upcoming: { icon: "circle-half-stroke", color: "var(--blue-9)" },
  pastDue: { icon: "circle-exclamation", color: "var(--tomato-9)" },
  active: { icon: "circle-play", color: "var(--jade-9)" },
  quickPaused: { icon: "circle-pause", color: "var(--amber-9)" },
  onHoldExternal: { icon: "circle-stop", color: "var(--crimson-9)" },
  onHoldInternal: { icon: "circle-stop", color: "var(--brown-9)" },
  completed: { icon: "circle-check", color: "var(--orange-9)" },
  finalized: { icon: "circle-check", color: "var(--jade-9)" },
  cancelled: { icon: "circle-xmark", color: "var(--gray-a8)" },
};

/** Nobody did it — the clock did (Past due), or the system (Finalized). */
const SYSTEM = { id: -1, firstName: "Roopairs", lastName: "", name: "Roopairs", avatar: "" };

const longAt = (d: Date) =>
  `${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ` +
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(/\u202f/g, " ");

/** The sentence each transition writes, in the log's alternating parts. */
function sentence(status: string, at: Date, note: string | undefined, visit: Date | null): Omit<JobStatusLog, "icon" | "color"> {
  switch (status) {
    case "draft":
      return { text: " created the job" };
    case "unscheduled":
      return { text: " left the job unscheduled" };
    case "upcoming":
      // The value is WHEN THE VISIT IS, not when the booking was made.
      return visit == null ? { text: " scheduled the job" } : { text: " scheduled the job for ", value: longAt(visit) };
    case "pastDue":
      return { text: " — the job passed its scheduled time" };
    case "active":
      return { text: " started the job" };
    case "quickPaused":
      return { text: " quick-paused the job", reason: note, reasonTitle: "Pause reason" };
    case "onHoldExternal":
    case "onHoldInternal":
      return { text: " put the job on hold", reason: note, reasonTitle: "Pause reason" };
    case "completed":
      return { text: " completed the job" };
    case "finalized":
      return { text: " finalized the job" };
    case "cancelled":
      return { text: " cancelled the job", reason: note, reasonTitle: "Cancel reason" };
    default:
      return { text: ` moved the job to ${status}` };
  }
}

/**
 * The job's activity log, from its generated history — so a job that was
 * worked weeks ago opens with that story instead of one "created the job"
 * stamped at mount.
 *
 * Only the LIFECYCLE is seeded. Module edits (scheduling, assignees, forms)
 * are logged live as the user makes them, exactly as before.
 */
export function seedActivity(job: Job): ActivityEvent[] {
  const dbJob = jobById(job.id);
  if (dbJob == null) return [];
  const visit = job.scheduledFor == null ? null : new Date(job.scheduledFor);
  return historyOf(dbJob).transitions.map((t, index) => {
    const at = new Date(t.at);
    const glyph = GLYPH[t.status] ?? GLYPH.draft;
    // Past due is the clock and Finalized is the system — neither is a person.
    const actor =
      t.byUserId == null || t.status === "finalized"
        ? SYSTEM
        : usersById.get(t.byUserId) ?? users[0];
    return {
      id: index + 1,
      kind: index === 0 ? "created" : "jobStatus",
      date: at,
      user: actor,
      ...(index === 0 ? {} : { jobStatus: { ...glyph, ...sentence(t.status, at, t.note, visit) } }),
    } as ActivityEvent;
  });
}

// ---- the lifecycle breakdown -----------------------------------------------

/** One status stretch on the "Time in statuses" chart. */
export interface SeededLifecycle {
  /** When the job was created — the denominator of "Lifecycle time". */
  createdAt: number;
  rows: { key: string; label: string; periods: { start: number; end: number | null }[] }[];
}

/** Transition status → the lifecycle chart's row key (LIFECYCLE_META). */
const ROW_KEY: Record<string, string | null> = {
  draft: null, // the chart starts once the job exists
  unscheduled: "unscheduled",
  upcoming: "upcoming",
  pastDue: "pastDue",
  active: "active",
  quickPaused: "quickPaused",
  onHoldExternal: "onHold",
  onHoldInternal: "onHoldInternal",
  completed: "completed",
  finalized: "finalized",
  cancelled: null, // cancelled ENDS the lifecycle rather than occupying it
};

const ROW_LABEL: Record<string, string> = {
  unscheduled: "Unscheduled",
  upcoming: "Upcoming",
  pastDue: "Past due",
  active: "Active",
  quickPaused: "Quick-paused",
  onHold: "On hold",
  onHoldInternal: "On hold",
  completed: "Completed",
  finalized: "Finalized",
};

/**
 * How long the job spent in each status, from its real transitions.
 *
 * Without this the chart starts counting when the PAGE opens, so a job worked
 * three weeks ago reported "0m" in every status.
 */
export function seedLifecycle(job: Job): SeededLifecycle | undefined {
  const dbJob = jobById(job.id);
  if (dbJob == null) return undefined;
  const transitions = historyOf(dbJob).transitions;
  if (transitions.length === 0) return undefined;

  const createdAt = new Date(transitions[0].at).getTime();
  const ended = job.status === "cancelled" || job.status === "finalized";
  const rows: SeededLifecycle["rows"] = [];

  transitions.forEach((t, index) => {
    const key = ROW_KEY[t.status];
    if (key == null) return;
    const start = new Date(t.at).getTime();
    const nextAt = transitions[index + 1]?.at;
    // The last stretch stays OPEN unless the job's life has ended.
    const end = nextAt != null ? new Date(nextAt).getTime() : ended ? new Date(job.lastModifiedAt).getTime() : null;
    const row = rows.find((r) => r.key === key);
    if (row != null) row.periods.push({ start, end });
    else rows.push({ key, label: ROW_LABEL[key] ?? key, periods: [{ start, end }] });
  });

  return { createdAt, rows };
}

// ---- the signature ---------------------------------------------------------

/**
 * The customer's sign-off, for a job that is already finished.
 *
 * A job completed weeks ago should have one on file — it is collected at the
 * end of the visit, so arriving at a finalized job with "Not collected" reads
 * as a gap in the record rather than as a job nobody signed for.
 *
 * Some are SKIPPED, because that is what happens: the manager is off shift and
 * the tech completes the job anyway. Deterministic per job, so a demo always
 * shows the same ones.
 *
 * Unfinished jobs get nothing. The signature belongs to the completion, and
 * the Complete-job flow collects it live.
 */
export function seedSignature(job: Job): SignatureResult | undefined {
  if (!["completed", "finalized"].includes(job.status)) return undefined;

  const dbJob = jobById(job.id);
  const done = dbJob == null ? null : completedAt(dbJob);
  if (done == null) return undefined;
  const date = new Date(done);

  // Roughly one job in six is completed without a signature.
  const hash = [...job.id].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  if (hash % 6 === 0) {
    return {
      state: "skipped",
      skipReason: ["Customer unavailable at sign-off.", "Manager off shift — signature to follow.", "Site closed on completion."][hash % 3],
      date,
    };
  }

  // The person on site: the location's own contact, which is who a tech
  // actually hands the tablet to.
  const contact = locationContactsOf(job.locationId)[hash % Math.max(1, locationContactsOf(job.locationId).length)];
  return { state: "collected", signedBy: contact?.name ?? "Site manager", date };
}
