// The data shape, status look and demo fixtures shared by every "Job
// lifecycle" concept. The LIVE data comes from `useJobLifecycle` in
// JobDetails/jobState.ts, which builds the same `LifecycleRow[]`; the fixtures
// below exist so the filled states can be seen without driving a real job.

/** One stretch in one status. `end` is null while it still runs. */
export interface LifecyclePeriod {
  start: number;
  end: number | null;
}

/** One row of the break-down: a status (or a pause SUB-status) and its time. */
export interface LifecycleRow {
  /** Row identity — the status, or `${status}:${subStatus}` for a paused one. */
  key: string;
  label: string;
  /** The 14px solid timeline glyph. */
  icon: string;
  /** The glyph's colour token. */
  color: string;
  /** The Upcoming glyph is drawn rotated so its fill sits on the right. */
  rotate?: boolean;
  totalSec: number;
  periods: LifecyclePeriod[];
  /**
   * A terminal event ("Finalized"): a MOMENT, not a span. It shows a single
   * timestamp and no duration. Only the chronological concept renders these.
   */
  terminal?: boolean;
}

/**
 * Row look per status, and the ORDER the aggregating concepts list them in
 * (Figma 24560-133878). "uninvoiced" / "unestimated" come after a job is
 * finalized — neither exists in the prototype yet, so they simply never get
 * stretches from the live hook.
 *
 * Every glyph is the SOLID pack (Daniel, 2026-08-07): the concept nodes mix
 * solid and alpha tokens inconsistently, and solid matches the Badge / Avatar
 * job statuses.
 *
 * NOTE: "cancelled" has NO designed row, so a cancelled job records no stretch
 * for it — the lifecycle just stops. Flagged to Daniel.
 */
export const LIFECYCLE_META: Record<string, { icon: string; color: string; rotate?: boolean }> = {
  unscheduled: { icon: "circle-dashed", color: "var(--violet-9)" },
  upcoming: { icon: "circle-half-stroke", color: "var(--blue-9)", rotate: true },
  pastDue: { icon: "circle-exclamation", color: "var(--tomato-9)" },
  active: { icon: "circle-play", color: "var(--jade-9)" },
  quickPaused: { icon: "circle-pause", color: "var(--amber-9)" },
  onHold: { icon: "circle-stop", color: "var(--crimson-9)" },
  uninvoiced: { icon: "circle-check", color: "var(--orange-9)" },
  // Only the chronological concept reaches these two (Figma 24556-122708).
  finalized: { icon: "circle-check", color: "var(--jade-9)" },
};
export const LIFECYCLE_ORDER = Object.keys(LIFECYCLE_META);

// ---- formatting -------------------------------------------------------------

/**
 * "3d 16h 32m" / "2h 4m" / "5d 23m" / "42m" — EVERY zero part is dropped, not
 * just the leading ones: the Figma sample writes "5d 23m", never "5d 0h 23m".
 * A span under a minute (a status just entered) reads "0m".
 *
 * The trailing case ("2d 4h", exactly zero minutes) has no Figma sample —
 * dropping it follows the same rule the sampled "5d 23m" implies. Flagged.
 *
 * Daniel picked this COMPACT format for every concept (2026-08-07); the
 * chronological node mixed it with a spaced "11 d 10 hr 34 min" form.
 */
export const formatSpan = (sec: number) => {
  const total = Math.max(0, Math.floor(sec));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.length > 0 ? parts.join(" ") : "0m";
};

/** "19 days" — the Lifecycle highlight. Whole days, never negative. */
export const formatDays = (sec: number) => {
  const days = Math.floor(Math.max(0, sec) / 86400);
  return `${days} ${days === 1 ? "day" : "days"}`;
};

/** "Jan 1, 12:00 PM" — a stretch's start / end. */
const STRETCH_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "Jan 1, 12:00 PM" — one moment. */
export const momentLabel = (at: number) => STRETCH_FMT.format(at);

/** "Jan 1, 12:00 PM → Jan 4, 2:30 PM". An open stretch reads "→ now". */
export const stretchLabel = (p: LifecyclePeriod) =>
  `${STRETCH_FMT.format(p.start)} → ${p.end == null ? "now" : STRETCH_FMT.format(p.end)}`;

/** A stretch's own length in seconds (an open one measures to now). */
export const periodSec = (p: LifecyclePeriod) => Math.max(0, (p.end ?? Date.now()) - p.start) / 1000;

// ---- chronological view (the Break-down concept) -----------------------------

/** One stretch pulled out of its row — the chronological concept's unit. */
export interface LifecycleEvent {
  id: string;
  label: string;
  icon: string;
  color: string;
  rotate?: boolean;
  period: LifecyclePeriod;
  /** A moment, not a span — shows one timestamp and no duration. */
  terminal?: boolean;
}

/**
 * Flattens the per-status rows into every stretch, oldest first. The
 * aggregating concepts group by status; this one keeps the real order the job
 * moved through them.
 */
export const toEvents = (rows: LifecycleRow[]): LifecycleEvent[] =>
  rows
    .flatMap((row) =>
      row.periods.map((period, i) => ({
        id: `${row.key}-${i}`,
        label: row.label,
        icon: row.icon,
        color: row.color,
        rotate: row.rotate,
        terminal: row.terminal,
        period,
      })),
    )
    .sort((a, b) => a.period.start - b.period.start);

// ---- demo fixtures ----------------------------------------------------------

const hours = (h: number) => h * 3600;
const days = (d: number) => d * 86400;

/** A fixed base moment so the stories never shift: Jan 1, 12:00 PM. */
const BASE = new Date(2026, 0, 1, 12, 0).getTime();
/** A closed stretch, `fromSec` after the base and `lenSec` long. */
const stretch = (fromSec: number, lenSec: number): LifecyclePeriod => ({
  start: BASE + fromSec * 1000,
  end: BASE + (fromSec + lenSec) * 1000,
});
/** An OPEN stretch — the one a live job always has. */
const openStretch = (fromSec: number): LifecyclePeriod => ({ start: Date.now() - fromSec * 1000, end: null });

const meta = (kind: string) => LIFECYCLE_META[kind];

/** Builds a row; the total is always the sum of its stretches. */
const row = (kind: string, key: string, label: string, periods: LifecyclePeriod[], terminal = false): LifecycleRow => ({
  key,
  label,
  ...meta(kind),
  periods,
  terminal,
  totalSec: periods.reduce((acc, p) => acc + periodSec(p), 0),
});

/** A fresh job: only "Upcoming" has time, so it is the only row. */
export const FRESH_ROWS: LifecycleRow[] = [row("upcoming", "upcoming", "Upcoming", [openStretch(8 * 60)])];

/** Mid-job: scheduled, started, paused for lunch, active again. */
export const IN_PROGRESS_ROWS: LifecycleRow[] = [
  row("upcoming", "upcoming", "Upcoming", [stretch(0, days(2) + hours(4))]),
  row("active", "active", "Active", [
    stretch(days(2) + hours(4), hours(1) + 20 * 60),
    stretch(days(2) + hours(6), hours(2) + 5 * 60),
  ]),
  row("quickPaused", "quickPaused:Lunch", "Lunch", [stretch(days(2) + hours(5) + 20 * 60, 40 * 60)]),
];

/**
 * The seven statuses of the aggregating Figma sample (24560-133878), with the
 * node's own durations: 2h 4m / 3d 16h 32m / 1h 1m / 3h 14m / 42m / 5d 23m /
 * 1h 15m. "Upcoming" is split into TWO stretches so an expanded row can be
 * seen.
 *
 * NOTE: the node's sub-log numbers do not match their own date ranges (it
 * writes "1d 8h 7m" over "Jan 1, 12:00 PM → Jan 4, 2:30 PM"). Every concept
 * DERIVES a stretch's duration from its dates, so here the two always agree.
 */
export const FULL_ROWS: LifecycleRow[] = [
  row("unscheduled", "unscheduled", "Unscheduled", [stretch(0, hours(2) + 4 * 60)]),
  row("upcoming", "upcoming", "Upcoming", [
    stretch(hours(3), days(1) + hours(8) + 7 * 60),
    stretch(days(2), days(2) + hours(8) + 25 * 60),
  ]),
  row("pastDue", "pastDue", "Past due", [stretch(days(5), hours(1) + 60)]),
  row("active", "active", "Active", [stretch(days(5) + hours(2), hours(3) + 14 * 60)]),
  row("quickPaused", "quickPaused:Lunch", "Lunch", [stretch(days(5) + hours(6), 42 * 60)]),
  row("onHold", "onHold:Parts needed", "Parts needed", [stretch(days(6), days(5) + 23 * 60)]),
  row("uninvoiced", "uninvoiced", "Uninvoiced", [stretch(days(12), hours(1) + 15 * 60)]),
];

/**
 * The chronological sample (Figma 24556-122708). It carries TWO statuses the
 * aggregating rows do not: "Working" (an ACTIVE sub-status) and "Finalized"
 * (a terminal moment with no duration) — Daniel asked for both, 2026-08-07.
 * The job bounces between statuses, which is the whole point of this concept.
 */
export const FULL_CHRONO_ROWS: LifecycleRow[] = [
  row("upcoming", "upcoming", "Upcoming", [
    stretch(0, days(3) + hours(2) + 30 * 60),
    stretch(days(3) + hours(2) + 50 * 60, days(11) + hours(1) + 10 * 60),
  ]),
  row("unscheduled", "unscheduled", "Unscheduled", [stretch(days(3) + hours(2) + 30 * 60, 20 * 60)]),
  row("active", "active:Working", "Working", [
    stretch(days(14) + hours(4), hours(2) + 15 * 60),
    stretch(days(17) + hours(7), hours(1) + 30 * 60),
  ]),
  row("onHold", "onHold:Parts needed", "Parts needed", [stretch(days(14) + hours(6) + 15 * 60, days(3) + 45 * 60)]),
  row("uninvoiced", "uninvoiced", "Uninvoiced", [stretch(days(17) + hours(8) + 30 * 60, hours(15))]),
  // A moment, not a span: zero length, and `terminal` drops the duration.
  row("finalized", "finalized", "Finalized", [stretch(days(17) + hours(23) + 30 * 60, 0)], true),
];

/** A fresh job in the chronological view. */
export const FRESH_CHRONO_ROWS: LifecycleRow[] = FRESH_ROWS;
/** Mid-job in the chronological view. */
export const IN_PROGRESS_CHRONO_ROWS: LifecycleRow[] = IN_PROGRESS_ROWS;
