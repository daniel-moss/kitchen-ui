// ActivityLog timestamp formatting. Both formats are DESIGN SYSTEM behaviour
// (documented on the Figma ActivityLog documentation page), not product copy —
// they live here so every activity log reads the same.

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

/**
 * The label shown next to a log:
 * `Just now` 0–59 s · `Nmin ago` 1–59 min · `Nh ago` 1–23 h · `Nd ago` 1–6 d ·
 * then the DATE (`May 12`) from 7 days on.
 *
 * Relative time is only easier to read than a date while the event is recent.
 * Past a week it makes the reader do arithmetic, and it repeats what the month
 * group header already says — so the log switches to the date instead. No year
 * on it: the group header is always `Month YYYY` (Daniel, 2026-08-01).
 */
export function shortTimestamp(date: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return SHORT_DATE.format(date);
}

const DATE_FORMAT_WITH_YEAR = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/**
 * The exact date + time shown in the timestamp tooltip:
 * `Mon, Jan 1, 2026 ・ 12:00 PM`. The year is ALWAYS written (Figma
 * 24230-50534, Daniel 2026-08-05) — this tooltip is the one place that says
 * exactly when an event happened, so it never leaves the year to be inferred.
 * That is a deliberate exception to the app-wide "year only when not current"
 * rule, which the LABEL next to the log still follows.
 */
export function exactTimestamp(date: Date): string {
  return `${DATE_FORMAT_WITH_YEAR.format(date)} ・ ${TIME_FORMAT.format(date)}`;
}
