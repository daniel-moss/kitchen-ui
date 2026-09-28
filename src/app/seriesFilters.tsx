import { DateWindowPreset, FilterDef } from "./filterDefs";
import { FUTURE_WINDOWS, countFilter, dateFilter } from "./filterKinds";
import {
  clientTemplate,
  createdAtTemplate,
  locationAddressTemplate,
  locationTemplate,
  serviceTemplate,
} from "./filterTemplates";
import { SERIES_TYPES, SeriesRow, clientOf, locationOf } from "./seriesData";

// The SERIES list's filter registry — one entry per row of its Filters menu
// (node 14759-74313 on Daniel's Series page 14759-72314, read 2026-09-14),
// in the menu's alphabetical order: Client, Created at, Location, Location
// address, Open jobs, Recurrence, Series end, Series start, Service, Type.
// (The node still draws "Address" first — Daniel renamed that filter
// "Location address" on 2026-09-16, which moves it after Location; FLAGGED so
// the node can follow.)
//
// ALL TEN are built since later the same date — RECURRENCE arrived last
// (Daniel first: "Not sure how to build it and how it's supposed to work";
// then he took the frequency-multi-select proposal and drew its section,
// 14831-29459). SERIES START (14831-29788) and SERIES END (14831-30000)
// got their own sections in the same update.
//
// The standing Figma split:
//   - TYPE (14759-74546), OPEN JOBS (14767-79379), RECURRENCE
//     (14831-29459), SERIES START (14831-29788) and SERIES END
//     (14831-30000) are object-specific and written out below;
//   - Client, Created at (new on the shared page, 14767-79168), Location,
//     Location address and Service are shared TEMPLATES.
//
// PLACEHOLDER icons (`diamonds-4`) on Series start, Series end and Open jobs
// — Daniel has not picked them ("you'll [use] a placeholder icon there"),
// and their nodes draw the placeholder too. Created at's placeholder lives
// in its template. Suggestions are with him; swap them when he decides.
//
// A series has NO status filter — the phase (open / closed) is the branch,
// derived from the end date, and no view locks anything.

// ---- Series start / Series end (object-specific) ----------------------------

/**
 * Series start — when the recurrence begins (production `recurrence_start`).
 * DESIGNED 2026-09-14 (section 14831-29788): a TIMEFRAME filter, the shared
 * shape exactly — the seven past-anchored presets over "Custom...", after /
 * before chips, the shared Custom dialog. A FUTURE start (a plan that has
 * not begun) is reachable through "after" any preset, or the Custom dialog.
 *
 * The icon is `arrow-right-from-line` — Daniel's pick (2026-09-14) from the
 * suggested pair: leaving the line = the span begins. Its twin marks the
 * end. The nodes still draw the placeholder; Daniel is updating them.
 */
function seriesStartFilter(): FilterDef<SeriesRow> {
  return {
    id: "seriesStart",
    kind: "date",
    noun: { one: "date", many: "dates" },
    label: "Series start",
    icon: "arrow-right-from-line",
    dsHeader: true,
    ...dateFilter((series) => series.recurrenceStart),
  };
}

/**
 * Series end — when the recurrence stops (production `recurrence_end`),
 * which is also what makes a series CLOSED. DESIGNED 2026-09-14 (section
 * 14831-30000): a FORWARD-window Timeframe — the Scheduled for / Due date
 * shape, so the list has NO condition chips and a preset-valued chip
 * renders without its condition box (the section's own two annotations,
 * word for word the Due date ones).
 *
 * "NO END DATE" LEADS the list — the ABSENCE row, the one value that asks
 * for the open-ended (rolling) series; without it they were outside this
 * filter's answer entirely. Then the six future windows. NO past row
 * ("Ended") on purpose, and rightly so: a past end IS the closed phase —
 * the branch already carries that split, so the row would be dead on Open
 * and all-matching on Closed.
 */
const SERIES_END_WINDOWS: DateWindowPreset[] = [
  { id: "noEnd", label: "No end date", absent: true },
  ...FUTURE_WINDOWS,
];

// `arrow-right-to-line` — the pair's other half (Daniel, 2026-09-14):
// arriving at the line = the span ends.
function seriesEndFilter(): FilterDef<SeriesRow> {
  return {
    id: "seriesEnd",
    kind: "date",
    noun: { one: "date", many: "dates" },
    label: "Series end",
    icon: "arrow-right-to-line",
    dateWindows: SERIES_END_WINDOWS,
    ...dateFilter((series) => series.recurrenceEnd ?? null, SERIES_END_WINDOWS),
  };
}

// ---- Recurrence (object-specific) -------------------------------------------

/**
 * Recurrence — how often the series repeats. DESIGNED 2026-09-14 (section
 * 14831-29459, a Multi-Select Filter) after the frequency proposal: the
 * question a user really asks is "show me the weekly plans", so the rows
 * are the FOUR frequencies (production `RecurrenceFrequency`) — Daily ·
 * Weekly · Monthly · Yearly — as bare checkbox rows, chips-only is / is-not
 * header, no search, no counts. The interval and the weekday set stay out;
 * the chip's noun is the node's own — "N frequencies".
 *
 * The icon is `arrows-repeat` — the one Series icon Daniel picked from the
 * start, and the right one: two arrows cycling is a schedule that comes
 * back around, distinct from Status changed's `arrow-left-arrow-right` (a
 * one-time swap) and from `arrows-rotate` (refresh/sync).
 */
const RECURRENCE_OPTIONS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

function recurrenceFilter(): FilterDef<SeriesRow> {
  return {
    id: "recurrence",
    noun: { one: "frequency", many: "frequencies" },
    label: "Recurrence",
    icon: "arrows-repeat",
    hideCounts: true,
    dsHeader: true,
    options: RECURRENCE_OPTIONS,
    matches: (series, { ids }) => ids.includes(series.recurrenceFrequency),
  };
}

// ---- Open jobs (object-specific) --------------------------------------------

/**
 * Open jobs — how many of the series' jobs are currently in flight
 * (production's `open_jobs_count`: scheduled / active / paused / on hold /
 * completed). The first COUNT filter — the fourth amount kind (its section's
 * own annotation, 14767-79379, links the shared Amount documentation): the
 * number presets over "Custom...", the chips-only at least / at most / is
 * header, and a Custom dialog whose field is a bare number — no "$", no
 * hr + min. See `countFilter` / COUNT_PRESETS (the ladder is 1 → 50 since
 * later on 2026-09-14 — Daniel took the smaller-steps suggestion; his node
 * still draws 5 → 50).
 *
 * The icon is `wrench-simple` — the JOB icon (Daniel, 2026-09-14: "It makes
 * a lot of sense"): the filter counts jobs. The Service template moved to
 * `screwdriver-wrench` the same day, so the wrench is this row's alone.
 */
function openJobsFilter(): FilterDef<SeriesRow> {
  return {
    id: "openJobs",
    kind: "count",
    noun: { one: "amount", many: "amounts" },
    label: "Open jobs",
    icon: "wrench-simple",
    dsHeader: true,
    ...countFilter((series) => series.openJobsCount),
  };
}

// ---- Type (object-specific) -------------------------------------------------

/**
 * Type — Upfront or Rolling (production `JobSeriesType`; section
 * 14759-74546). SINGLE-select, the section's own annotation: "Single-select.
 * Only one selected option at a time" — a series is one or the other, so a
 * set of the two would only ever mean "any". Chips-only is / is-not header,
 * two bare rows, no search, no counts. The icon is `shapes` — the standing
 * Type icon, and what the menu node draws.
 */
function typeFilter(): FilterDef<SeriesRow> {
  return {
    id: "type",
    noun: { one: "type", many: "types" },
    label: "Type",
    icon: "shapes",
    hideCounts: true,
    dsHeader: true,
    singleSelect: true,
    options: SERIES_TYPES.map((type) => ({ id: type.id, label: type.label })),
    matches: (series, { ids }) => ids.includes(series.type),
  };
}

// ---- the registry ----------------------------------------------------------

/**
 * ONE registry, not one per phase — the first list where nothing differs
 * between the branches: there is no Status filter (the phase IS the derived
 * status), and every other filter reads fields both phases have.
 */
export const SERIES_FILTERS: FilterDef<SeriesRow>[] = [
  // A series has no client of its own: it belongs to a location, and the
  // location belongs to the client.
  clientTemplate((series) => clientOf(series).id),

  createdAtTemplate((series) => series.createdAt),
  locationTemplate((series) => series.locationId),

  // Location address — every filled field has to match the series' LOCATION,
  // the shared question. It follows Location in the alphabet since the
  // 2026-09-16 rename (it was "Address", the first row).
  locationAddressTemplate(locationOf),

  openJobsFilter(),
  recurrenceFilter(),
  seriesEndFilter(),
  seriesStartFilter(),
  serviceTemplate((series) => series.serviceId ?? null),
  typeFilter(),
];
