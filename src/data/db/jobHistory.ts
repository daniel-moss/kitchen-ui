import { users } from "../users";
import { JOBS } from "./db";
import { Job } from "./types";

// THE LIFE OF A JOB — how it got to the status it is in, who did what, and the
// time they tracked.
//
// Added 2026-09-26. Before this a job carried ONE `statusChangedAt`, so a
// Completed job could not show how it was completed — which is exactly what
// Daniel spotted: "a job cannot have one Completed status only". A status is
// the END of a story, and the story was missing.
//
// DERIVED, not stored. The history is generated from the job's own facts — when
// it was received, when it was scheduled, how long it was meant to take, who it
// was assigned to — by the rules below. That is deliberate:
//   - it can never contradict the job, because it is made of the job;
//   - 78 jobs' worth of transitions and sessions would be thousands of lines of
//     literals nobody could review;
//   - changing a rule fixes every job at once.
// It is DETERMINISTIC: the same job always produces the same history, so a demo
// looks identical every time it is opened.

/** One step in a job's life. */
export interface JobTransition {
  /** The status the job entered. */
  status: Job["status"];
  /** ISO. */
  at: string;
  /** Who did it — a users id. Absent when the clock did it (Past due). */
  byUserId?: number;
  /** The reason typed into the form, where one is asked for. */
  note?: string;
}

/** A stretch of tracked time by one tech. */
export interface JobSession {
  userId: number;
  /** ISO. */
  start: string;
  /** ISO. Null while the session is still running. */
  end: string | null;
  /** What the time was spent on — production's time categories. */
  category: "travel" | "labor" | "break";
}

export interface JobHistory {
  transitions: JobTransition[];
  sessions: JobSession[];
}

// ---- deterministic jitter --------------------------------------------------
// A hash of the job id, so every job gets its own shape and always the same one.
function seedOf(id: string): () => number {
  let h = 2166136261;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = (Math.imul(h, 1103515245) + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

const iso = (d: Date) => d.toISOString();
const plus = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60000);

const STARTED: Job["status"][] = ["active", "quickPaused", "onHoldExternal", "onHoldInternal", "completed", "finalized"];

/**
 * The office coordinator who takes calls and schedules work, and the techs who
 * do it. The dispatcher is a stable choice per job so one job reads as one
 * person's work rather than a committee.
 */
const dispatcherFor = (rnd: () => number) => users[Math.floor(rnd() * 3)].id;

export function historyOf(job: Job): JobHistory {
  const rnd = seedOf(job.id);
  const transitions: JobTransition[] = [];
  const sessions: JobSession[] = [];

  const received = new Date(job.receivedAt);
  const scheduled = job.scheduledFor == null ? null : new Date(job.scheduledFor);
  const dispatcher = dispatcherFor(rnd);
  const techs = job.assigneeIds.length > 0 ? job.assigneeIds : [users[3].id];

  // 1. Every job begins as a draft the moment the call is taken.
  transitions.push({ status: "draft", at: iso(received), byUserId: dispatcher });
  if (job.status === "draft") return { transitions, sessions };

  // 2. Created. A job with no date waits in Unscheduled; a dated one goes
  //    straight to Upcoming, which is how a coordinator books work on the call.
  const createdAt = plus(received, 5 + Math.floor(rnd() * 40));
  if (scheduled == null) {
    transitions.push({ status: "unscheduled", at: iso(createdAt), byUserId: dispatcher });
    return { transitions, sessions };
  }

  // A job that came BACK from a schedule shows the round trip.
  const wasUnscheduled = job.status === "unscheduled" || rnd() < 0.25;
  if (wasUnscheduled) transitions.push({ status: "unscheduled", at: iso(createdAt), byUserId: dispatcher });

  const scheduledAt = wasUnscheduled ? plus(createdAt, 60 + Math.floor(rnd() * 600)) : createdAt;
  transitions.push({ status: "upcoming", at: iso(scheduledAt), byUserId: dispatcher });

  if (job.status === "unscheduled" || job.status === "upcoming") return { transitions, sessions };

  // 3. Past due is the CLOCK, not an action — nobody did it, so it carries no
  //    user (see the db's own note on statusChangedAt).
  if (job.status === "pastDue") {
    transitions.push({ status: "pastDue", at: iso(plus(scheduled, 60)) });
    return { transitions, sessions };
  }

  if (job.status === "cancelled") {
    transitions.push({
      status: "cancelled",
      at: iso(plus(scheduled, -60 - Math.floor(rnd() * 2880))),
      byUserId: dispatcher,
      note: ["Client cancelled — equipment replaced instead.", "Duplicate request.", "Client postponed indefinitely."][
        Math.floor(rnd() * 3)
      ],
    });
    return { transitions, sessions };
  }

  if (!STARTED.includes(job.status)) return { transitions, sessions };

  // 4. The visit. The tech travels, then works. A second tech joins a little
  //    after the first, which is what actually happens on a two-person job.
  const startedAt = plus(scheduled, Math.floor(rnd() * 20) - 5);
  transitions.push({ status: "active", at: iso(startedAt), byUserId: techs[0] });

  const planned = job.durationMinutes ?? 90;
  techs.forEach((userId, index) => {
    const arrive = plus(startedAt, index * (10 + Math.floor(rnd() * 25)));
    const travel = 15 + Math.floor(rnd() * 25);
    sessions.push({ userId, start: iso(plus(arrive, -travel)), end: iso(arrive), category: "travel" });
    // The work itself, split by a break on anything long enough to need one.
    const work = Math.max(30, Math.round(planned * (0.75 + rnd() * 0.5)) - index * 10);
    if (work > 150) {
      const first = Math.round(work * 0.55);
      sessions.push({ userId, start: iso(arrive), end: iso(plus(arrive, first)), category: "labor" });
      sessions.push({ userId, start: iso(plus(arrive, first)), end: iso(plus(arrive, first + 20)), category: "break" });
      sessions.push({ userId, start: iso(plus(arrive, first + 20)), end: iso(plus(arrive, work + 20)), category: "labor" });
    } else {
      sessions.push({ userId, start: iso(arrive), end: iso(plus(arrive, work)), category: "labor" });
    }
  });

  const lastEnd = sessions.reduce((max, s) => (s.end != null && s.end > max ? s.end : max), sessions[0]?.end ?? iso(startedAt));

  if (job.status === "active") {
    // The job is open and the tech has logged the time so far, but nothing is
    // RUNNING: the live check-in owns that, and a seeded "→ now" session would
    // contradict the action bar's "Not tracking your time".
    return { transitions, sessions };
  }

  if (job.status === "quickPaused") {
    transitions.push({ status: "quickPaused", at: lastEnd, byUserId: techs[0], note: "Waiting for the kitchen to clear the line." });
    return { transitions, sessions };
  }

  if (job.status === "onHoldExternal" || job.status === "onHoldInternal") {
    transitions.push({
      status: job.status,
      at: lastEnd,
      byUserId: job.status === "onHoldExternal" ? dispatcher : techs[0],
      note:
        job.status === "onHoldExternal"
          ? "Waiting for the client to approve the part."
          : "Part on order — back when it lands.",
    });
    return { transitions, sessions };
  }

  // 5. Completed, and sometimes invoiced afterwards.
  const completedAt = job.statusChangedAt ?? lastEnd;
  transitions.push({ status: "completed", at: job.status === "finalized" ? lastEnd : completedAt, byUserId: techs[0] });
  if (job.status === "finalized") {
    transitions.push({ status: "finalized", at: completedAt, byUserId: dispatcher });
  }
  return { transitions, sessions };
}

/** Every job's history, built once. */
export const JOB_HISTORY: Map<string, JobHistory> = new Map(JOBS.map((job) => [job.id, historyOf(job)]));

/** Total tracked seconds per tech on one job — what the Timesheet counts. */
export function trackedSecondsByUser(job: Job): Record<number, number> {
  const out: Record<number, number> = {};
  for (const s of JOB_HISTORY.get(job.id)?.sessions ?? []) {
    if (s.category === "break" || s.end == null) continue;
    out[s.userId] = (out[s.userId] ?? 0) + (new Date(s.end).getTime() - new Date(s.start).getTime()) / 1000;
  }
  return out;
}
