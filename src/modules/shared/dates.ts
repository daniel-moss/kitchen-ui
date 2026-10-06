// The two date formats the side panels use. Shared since 2026-09-28, when the
// Warranty panel needed the same LONG format the Equipment panel already had.
// Both take an ISO string (the db's date shape) and follow the US rule: month
// first, year always shown.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * "January 1, 2026" — the LONG format, used by the General details modules
 * (Daniel, 2026-09-28: "the general details carries full date").
 */
export function formatLongDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * "Jan 1, 2026" — the SHORT format with the year, used by the warranty ranges
 * and by every History / Files caption (Daniel, 2026-09-28: "the warranty
 * carries the short version with the year").
 */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * The app's weekday-date pair (Daniel, 2026-10-06). The Timesheet's rows — a
 * time session and a Work timeline legend row — carry a date next to a
 * duration, so the form changes with the breakpoint:
 *
 *   `weekdayDate`       "Monday, January 1, 2027"  — desktop
 *   `shortWeekdayDate`  "Mon, Jan 1, 2027"         — mobile
 *
 * BOTH keep the weekday and the YEAR; only the words shorten. The long one
 * also serves the Signature module's "Date" row. They take a display label
 * ("September 11, 2026") or a `Date`, and hand an unparsable label back.
 *
 * They live here rather than in TimesheetPanel because TimeCharts needs them
 * too, and TimesheetPanel already imports TimeCharts — the other direction
 * would be a cycle.
 */
const WEEKDAY_DATE = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const SHORT_WEEKDAY_DATE = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

// A caller holds either a display label or a real Date — the Signature module
// keeps a `Date`, the Timesheet rows keep their own pre-formatted strings.
const asDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

export function weekdayDate(value: string | Date): string {
  const date = asDate(value);
  return Number.isNaN(date.getTime()) ? String(value) : WEEKDAY_DATE.format(date);
}

export function shortWeekdayDate(value: string | Date): string {
  const date = asDate(value);
  return Number.isNaN(date.getTime()) ? String(value) : SHORT_WEEKDAY_DATE.format(date);
}

const TIME_FMT = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

/**
 * "Jan 1, 2026 at 12:00 PM" — a timestamp, used by the Tax rate panel's
 * Created at / Last modified / Sync status rows (Figma 1-7275 and 25-5031).
 *
 * The date and its time are ONE compound value, so they do not take the inline
 * separator. They join with "at" because the short date already carries a
 * comma — the same rule ActivityLog's exact timestamps follow.
 */
export function formatShortDateTime(iso: string): string {
  return `${formatShortDate(iso)} at ${TIME_FMT.format(new Date(iso))}`;
}
