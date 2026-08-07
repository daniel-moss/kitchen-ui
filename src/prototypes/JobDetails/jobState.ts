import { useEffect, useRef, useState } from "react";

import { BadgeJobStatusStatus } from "../../components/Badge/BadgeJobStatus";
import { LIFECYCLE_META, LIFECYCLE_ORDER, LifecyclePeriod, LifecycleRow } from "./JobLifecycleModule/lifecycleData";
import { isPastDue, Scheduling } from "./SchedulingForm";

export type { LifecyclePeriod, LifecycleRow } from "./JobLifecycleModule/lifecycleData";

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

// ---- the job lifecycle (Figma "Job lifecycle" module 24560-134494) ----------
// Every status the job has ENTERED, with the stretches it spent in each. The
// module lists a status only when it has stretches, so a fresh job shows one
// row and the list grows as the job is driven (Daniel: honest live-only).
//
// The SHAPE and the per-status look live with the concepts, in
// ./JobLifecycleModule/lifecycleData.ts — five modules render this data and
// they must all read it the same way.

/** The statuses whose ROW is named by the sub-status ("Lunch", "Parts needed"). */
const SUBSTATUS_ROWS = ["quickPaused", "onHold"];

/**
 * Tracks how long the job spends in each status, live.
 *
 * `billableSec` is the time in "Active" — what the module's "Billable time"
 * highlight shows for now (Daniel, 2026-08-06). `lifecycleSec` runs from the
 * job's creation until it is cancelled (or finalized, once that status
 * exists); while the job is open it counts to now.
 */
export function useJobLifecycle(job: JobState, scheduling: Scheduling) {
  // The prototype's job is created when the shell mounts — the same instant as
  // the seeded "created the job" activity event.
  const createdAt = useRef(Date.now()).current;
  const [rows, setRows] = useState<{ key: string; label: string; periods: LifecyclePeriod[] }[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);

  const display = displayStatus(job, scheduling);
  const isCancelled = display === "cancelled";
  // A paused job's row is its sub-status; without one it falls back to the
  // status label, so the row is never nameless.
  const statusKind = SUBSTATUS_ROWS.includes(job.status) ? job.status : display;
  const label = SUBSTATUS_ROWS.includes(job.status) ? (job.subStatus ?? LABELS[display]) : LABELS[display];
  const key = SUBSTATUS_ROWS.includes(job.status) ? `${statusKind}:${label}` : statusKind;

  // A 1-second tick: the open stretch, the lifecycle total and the past-due
  // flip all move on their own.
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Close the running stretch and open one for the new status. Cancelled ends
  // the lifecycle: the last stretch closes and nothing new opens.
  useEffect(() => {
    const at = Date.now();
    setEndedAt(isCancelled ? at : null);
    setRows((prev) => {
      // Close whatever is still running (there is at most one).
      const closed = prev.map((row) =>
        row.periods.some((p) => p.end === null)
          ? { ...row, periods: row.periods.map((p) => (p.end === null ? { ...p, end: at } : p)) }
          : row,
      );
      if (isCancelled) return closed;
      const existing = closed.find((row) => row.key === key);
      if (existing != null) {
        return closed.map((row) => (row === existing ? { ...row, periods: [...row.periods, { start: at, end: null }] } : row));
      }
      return [...closed, { key, label, periods: [{ start: at, end: null }] }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isCancelled]);

  const secondsOf = (periods: LifecyclePeriod[]) =>
    periods.reduce((acc, p) => acc + Math.max(0, (p.end ?? now) - p.start), 0) / 1000;

  // Listed in the designed status order; several sub-statuses of one kind keep
  // the order they first appeared in.
  const breakdown: LifecycleRow[] = rows
    .map((row) => {
      const kind = row.key.split(":")[0];
      const meta = LIFECYCLE_META[kind] ?? { icon: "circle-dashed", color: "var(--gray-a9)" };
      return { ...row, ...meta, totalSec: secondsOf(row.periods) };
    })
    .sort((a, b) => LIFECYCLE_ORDER.indexOf(a.key.split(":")[0]) - LIFECYCLE_ORDER.indexOf(b.key.split(":")[0]));

  return {
    breakdown,
    billableSec: breakdown.find((r) => r.key === "active")?.totalSec ?? 0,
    lifecycleSec: Math.max(0, (endedAt ?? now) - createdAt) / 1000,
  };
}

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
  uninvoiced: "Uninvoiced",
  unestimated: "Unestimated",
  finalized: "Finalized",
  cancelled: "Cancelled",
};

// The statuses whose menu-header caption shows the SUB-status. Only the two
// paused kinds — an ACTIVE job just reads "Active" (Figma 24055-15282, Daniel
// 2026-07-27); upcoming / cancelled / unscheduled show the status label too.
const SUBSTATUS_STATUSES: JobStatus[] = ["quickPaused", "onHold"];

/** The status caption shown in the menu headers — the sub-status wins for
 *  paused jobs; every other status shows its own label. */
export function statusLabel(job: JobState, scheduling: Scheduling): string {
  if (job.subStatus != null && SUBSTATUS_STATUSES.includes(job.status)) return job.subStatus;
  return LABELS[displayStatus(job, scheduling)];
}
