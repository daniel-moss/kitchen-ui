import { CLIENTS, JOB_SERIES as DB_JOB_SERIES, JobSeries, JobSeriesType, LOCATIONS } from "../../data/db";
import { dayOffset } from "./listData";

// The Series list's data door — a READER over the shared demo database, like
// the other four. The series table lives in src/data/db (six curated rows
// plus the SER-51xx mass); this module derives the display values and keeps
// the lookups.
//
// A series has NO status: its open / closed PHASE is DERIVED from the end
// date — production `JobSeriesFilter.filter_is_closed`: closed =
// `recurrence_end <= now`; open = no end, or an end still ahead. Nothing
// else about a series changes with the clock.

/** The db row itself — the list renders it directly. */
export type SeriesRow = JobSeries;

/**
 * Every series in the database, sorted the view's own way — the production
 * "Job Series → All Open" default ordering, `recurrence_start,created_at`
 * ascending.
 */
export const SERIES_ROWS: SeriesRow[] = [...DB_JOB_SERIES].sort((a, b) =>
  a.recurrenceStart === b.recurrenceStart
    ? a.createdAt === b.createdAt
      ? a.id.localeCompare(b.id)
      : a.createdAt.localeCompare(b.createdAt)
    : a.recurrenceStart.localeCompare(b.recurrenceStart),
);

// ---- derivations -----------------------------------------------------------

/**
 * Production's `is_closed`: the end has passed. Measured in whole DAYS off
 * the demo clock — an end date landing today still counts as open until
 * tomorrow. A series with no end can never close.
 */
export const isClosed = (series: SeriesRow) => series.recurrenceEnd != null && dayOffset(series.recurrenceEnd) < 0;

/**
 * The two types, production's enum order and labels (`JobSeriesType`:
 * Upfront / Rolling). One table feeds the Type column and the Type filter.
 */
export const SERIES_TYPES: { id: JobSeriesType; label: string }[] = [
  { id: "upfront", label: "Upfront" },
  { id: "rolling", label: "Rolling" },
];

const TYPE_LABEL = new Map(SERIES_TYPES.map((type) => [type.id, type.label]));

export const seriesTypeLabel = (series: SeriesRow) => TYPE_LABEL.get(series.type) ?? "";

// ---- the recurrence, in words ----------------------------------------------

const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "1st" / "2nd" / "3rd" / "4th" — the ordinal of a small number. */
const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 10 > 3 || (n % 100 >= 11 && n % 100 <= 13) ? 0 : n % 10]}`;

/**
 * The Recurrence column's sentence — production's `formatRecurrence`
 * (pwa/src/utils/formatRecurrence.ts), one for one:
 *
 *   daily            "Every day" / "Every 2 days"
 *   weekly           "Every week on Mon, Wed" / "Every 2 weeks on Fri"
 *   monthly sameDate "Every month on day 15"
 *   monthly sameDay  "Every month on the 3rd Friday"
 *   yearly           "Every year on March 5"
 *
 * The date parts (the day of month, the weekday, the ordinal occurrence)
 * are read off `recurrenceStart`, exactly as production reads them. ONE
 * deviation, FLAGGED: production capitalizes the unit ("Every 2 Weeks") —
 * here it is sentence case, the prototype's copy style.
 */
export function formatRecurrence(series: SeriesRow): string {
  const { recurrenceInterval: interval, recurrenceFrequency: frequency } = series;
  const every = interval > 1 ? `${interval} ` : "";
  const start = new Date(series.recurrenceStart);
  if (frequency === "daily") return `Every ${every}${interval > 1 ? "days" : "day"}`;
  if (frequency === "weekly") {
    const days = (series.weeklyRecurrence ?? []).map((index) => WEEKDAYS_SHORT[index]).join(", ");
    return `Every ${every}${interval > 1 ? "weeks" : "week"} on ${days}`;
  }
  if (frequency === "monthly") {
    const unit = interval > 1 ? "months" : "month";
    if (series.monthlyRecurrence === "sameDay") {
      // The Nth <weekday> of the month the start date falls on — production's
      // own arithmetic (it never says "last"; the 5th occurrence prints "5th").
      const occurrence = Math.floor((start.getDate() - 1) / 7) + 1;
      const weekday = start.toLocaleDateString("en-US", { weekday: "long" });
      return `Every ${every}${unit} on the ${ordinal(occurrence)} ${weekday}`;
    }
    return `Every ${every}${unit} on day ${start.getDate()}`;
  }
  return `Every ${every}${interval > 1 ? "years" : "year"} on ${MONTHS_LONG[start.getMonth()]} ${start.getDate()}`;
}

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const CLIENT_BY_ID = byId(CLIENTS);
const LOCATION_BY_ID = byId(LOCATIONS);

export const locationOf = (series: SeriesRow) => LOCATION_BY_ID.get(series.locationId)!;
export const clientOf = (series: SeriesRow) => CLIENT_BY_ID.get(locationOf(series).clientId)!;
