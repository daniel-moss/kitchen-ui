import { useEffect, useState } from "react";

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

// ---- time spent in the "Active" status --------------------------------------
// The Activity tab's two widgets measure the JOB's own active time — not the
// technicians' tracked time (that is the Timesheet tab). A job can go active →
// paused → active many times, so the total is the sum of every stretch.

/** One stretch the job spent in "active". `end` is null while it still runs. */
export interface ActivePeriod {
  start: number;
  end: number | null;
}

const DAY_LABEL = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

/**
 * Accumulates the job's time in the "active" status across every
 * start / pause / resume cycle. While the job is active the total ticks once a
 * second, so the widgets update in real time.
 *
 * Returns the running total in seconds and the distinct calendar days any
 * active stretch touched (e.g. ["Jan 1", "Jan 3"]).
 */
export function useJobActiveTime(job: JobState) {
  const [periods, setPeriods] = useState<ActivePeriod[]>([]);
  const [now, setNow] = useState(() => Date.now());

  // Open a stretch when the job becomes active; close it when it leaves.
  // The guard makes this safe against React's double-invoked effects.
  useEffect(() => {
    setPeriods((p) => {
      const open = p.length > 0 && p[p.length - 1].end === null;
      if (job.status === "active") return open ? p : [...p, { start: Date.now(), end: null }];
      return open ? [...p.slice(0, -1), { ...p[p.length - 1], end: Date.now() }] : p;
    });
  }, [job.status]);

  // A job reset back to "never started" starts its history over.
  useEffect(() => {
    if (!job.everStarted) setPeriods([]);
  }, [job.everStarted]);

  // Tick while active. `now` is refreshed immediately so the open stretch never
  // measures against a stale clock in the second before the first tick.
  useEffect(() => {
    if (job.status !== "active") return undefined;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [job.status]);

  const totalSec = periods.reduce((acc, p) => acc + Math.max(0, (p.end ?? now) - p.start), 0) / 1000;

  // Every calendar day a stretch touched, in order. A stretch that crosses
  // midnight counts both days.
  const days: string[] = [];
  for (const p of periods) {
    const d = new Date(p.start);
    d.setHours(0, 0, 0, 0);
    const last = p.end ?? now;
    while (d.getTime() <= last) {
      const label = DAY_LABEL.format(d);
      if (!days.includes(label)) days.push(label);
      d.setDate(d.getDate() + 1);
    }
  }

  return { totalSec, days };
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
