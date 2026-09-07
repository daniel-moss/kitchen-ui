// The View Menu's own fixed lists. SORT_META is generic — every object type
// sorts. The other three are JOBS ONLY (Daniel, 2026-09-03: "'Timeline' view
// is only applicable to jobs. 'Scheduled date' is for jobs only too.") and are
// rendered only when the consumer passes the matching prop.

import { ViewMenuColumnType } from "./ViewMenu.types";

interface SortMeta {
  icon: string;
  label: string;
}

/**
 * Alphabetical / Numerical / Time / Other — ascending and descending. From the
 * Figma annotations on the "Sort Order Button" board.
 */
export const SORT_META: Record<ViewMenuColumnType, { asc: SortMeta; desc: SortMeta }> = {
  text: {
    asc: { icon: "arrow-down-a-z", label: "A to Z" },
    desc: { icon: "arrow-up-z-a", label: "Z to A" },
  },
  number: {
    asc: { icon: "arrow-down-1-9", label: "1 to 9" },
    desc: { icon: "arrow-up-9-1", label: "9 to 1" },
  },
  date: {
    asc: { icon: "arrow-down-short-wide", label: "Least recent" },
    desc: { icon: "arrow-up-wide-short", label: "Most recent" },
  },
  generic: {
    asc: { icon: "arrow-down-short-wide", label: "Ascending" },
    desc: { icon: "arrow-up-wide-short", label: "Descending" },
  },
};

// "Scheduled date" options (Table + Cards tabs; jobs only). Semantics from the
// Figma annotations: N = through the end of the day today+N, calendar-based;
// only future-scheduled jobs are hidden.
export const SCHEDULED_OPTIONS = [
  { key: "all", label: "All dates" },
  { key: "1w", label: "Next 1 week" },
  { key: "2w", label: "Next 2 weeks" },
  { key: "3w", label: "Next 3 weeks" },
  { key: "1m", label: "Next 1 month" },
];

/** The window in DAYS behind a SCHEDULED_OPTIONS key; null = no window. */
export const SCHEDULED_WINDOW_DAYS: Record<string, number | null> = {
  all: null,
  "1w": 7,
  "2w": 14,
  "3w": 21,
  "1m": 30,
};

// Timeline view settings (jobs only).
export const TIMELINE_TOGGLES = [
  { key: "compact", label: "Compact view" },
  { key: "finalized", label: "Show finalized jobs" },
  { key: "cancelled", label: "Show cancelled jobs" },
  { key: "weekends", label: "Show weekends" },
];

export const TIME_FRAMES = [
  { key: "day", label: "Day" },
  { key: "3days", label: "3 days" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

/** A fresh Timeline settings value — every toggle on, the design's default. */
export const defaultTimelineState = () => ({
  orientation: "horizontal" as const,
  timeFrame: "day",
  flags: Object.fromEntries(TIMELINE_TOGGLES.map((o) => [o.key, true])),
});
