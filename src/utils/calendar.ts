// Small, dependency-free date helpers for the DatePicker calendar grid.
// (chrono-node parses typed text; this file only does calendar math.)

/** Midnight of the given date, in local time. */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Same calendar day (ignores time). Null-safe. */
export const isSameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  a != null &&
  b != null &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Same month + year. */
export const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/** The first of a month `n` months from `d` (n may be negative). */
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

/** Add `n` days (n may be negative). Keeps local time at midnight. */
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/**
 * Build the calendar grid for the month containing `month`: ALWAYS 42 cells
 * (6 week rows), Monday-first. The 1st of the month always lands in the first
 * row; leading/trailing cells belong to the adjacent months. (Figma: the
 * DatePicker always shows 6 rows so its height never changes month to month.)
 */
export function buildMonthGrid(month: Date): Date[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  // JS getDay(): 0=Sun … 6=Sat. Monday-first offset: Mon→0 … Sun→6.
  const offset = (first.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(year, m, 1 - offset + i));
  }
  return days;
}

/** true when `d` is before `min` (day granularity) or after `max`. */
export function isOutOfRange(d: Date, min?: Date | null, max?: Date | null) {
  const day = startOfDay(d).getTime();
  if (min != null && day < startOfDay(min).getTime()) return true;
  if (max != null && day > startOfDay(max).getTime()) return true;
  return false;
}

/** Monday-first weekday headers. */
export const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const TITLE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
/** "January 2027" — the header title for a visible month. */
export const formatMonthTitle = (month: Date) => TITLE_FORMAT.format(month);

const FULL_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
/** "Friday, January 15, 2027" — a day button's accessible label. */
export const formatFullDate = (d: Date) => FULL_FORMAT.format(d);
