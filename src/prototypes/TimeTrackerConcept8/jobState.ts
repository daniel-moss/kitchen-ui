import { BadgeJobStatusStatus } from "../../components/Badge/BadgeJobStatus";
import { isPastDue, Scheduling } from "./SchedulingForm";

// The job's lifecycle state for the prototype. `pastDue` is not stored — it is
// derived from an `upcoming` job whose scheduled time has passed.
export type JobStatus = "upcoming" | "active" | "cancelled" | "unscheduled" | "quickPaused" | "onHold";

export interface JobState {
  status: JobStatus;
  /** The selected sub-status for active / quick-paused / on-hold (its copy
   *  becomes the badge + the menu-header caption). */
  subStatus?: string;
  /** Active = the Start reason; Cancelled/paused = the corresponding reason. */
  statusMessage?: string;
  /** Has the job ever been started? Drives "Started on" in the cancelled module. */
  everStarted: boolean;
  /** When the job was FIRST started ("Started on") — set once, never changes. */
  startedAt?: string;
  /** When the job was LAST made active ("Active on") — updates on every start/resume. */
  activeAt?: string;
  /** When the job was quick-paused / put on hold ("Paused on" / "On hold on"). */
  pausedAt?: string;
  /** When the job was cancelled (Cancelled on). */
  cancelledAt?: string;
  /** When the job was unscheduled (Unscheduled on). */
  unscheduledAt?: string;
}

export const defaultJob: JobState = { status: "upcoming", everStarted: false };

// The upcoming job's fixed demo scheduled time ("Scheduled on"). The transition
// timestamps (Started/Active/Cancelled/Unscheduled on) are REAL — captured with
// formatStatusTimestamp when the user clicks the action.
export const STATUS_TS = "Mon, Jan 1 at 12:00 PM";

const TS_DATE = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const TS_DATE_YEAR = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const TS_TIME = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
/** "Mon, Jan 1 at 12:00 PM" — the real moment a status transition happened.
 * Weekday always; the YEAR only when it is not the current one (general rule). */
export const formatStatusTimestamp = (d: Date) =>
  `${(d.getFullYear() === new Date().getFullYear() ? TS_DATE : TS_DATE_YEAR).format(d)} at ${TS_TIME.format(d)}`;

/** The Badge/Avatar status to show — an upcoming job reads "pastDue" once late. */
export function displayStatus(job: JobState, scheduling: Scheduling): BadgeJobStatusStatus {
  if (job.status === "upcoming" && isPastDue(scheduling)) return "pastDue";
  // "On hold" maps to the external (crimson) badge/avatar variant.
  if (job.status === "onHold") return "onHoldExternal";
  return job.status;
}

const LABELS: Record<BadgeJobStatusStatus, string> = {
  draft: "Draft",
  unscheduled: "Unscheduled",
  upcoming: "Upcoming",
  pastDue: "Past due",
  active: "Active",
  quickPaused: "Quick-paused",
  onHoldExternal: "On hold",
  onHoldInternal: "On hold",
  completed: "Completed",
  finalized: "Finalized",
  cancelled: "Cancelled",
};

// The statuses that carry a sub-status (their caption shows it). Others
// (upcoming / cancelled / unscheduled) show the status label itself.
const SUBSTATUS_STATUSES: JobStatus[] = ["active", "quickPaused", "onHold"];

/** The status caption shown in the menu headers — the sub-status wins whenever
 *  the status supports one; otherwise the status label. */
export function statusLabel(job: JobState, scheduling: Scheduling): string {
  if (job.subStatus != null && SUBSTATUS_STATUSES.includes(job.status)) return job.subStatus;
  return LABELS[displayStatus(job, scheduling)];
}
