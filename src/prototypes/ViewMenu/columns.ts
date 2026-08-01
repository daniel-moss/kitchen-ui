// The demo table columns and the sort-order icon/label mapping per data type
// (from the Figma annotations on the "Sort Order Button" board).

export type ColumnType = "text" | "number" | "date" | "generic";

export interface Column {
  key: string;
  label: string;
  type: ColumnType;
}

export const COLUMNS: Column[] = [
  { key: "id", label: "ID", type: "number" },
  { key: "client", label: "Client", type: "text" },
  { key: "status", label: "Status", type: "text" },
  { key: "service", label: "Service", type: "text" },
  { key: "locationName", label: "Location name", type: "text" },
  { key: "labels", label: "Labels", type: "text" },
  { key: "terms", label: "Terms", type: "generic" },
  { key: "statusChanged", label: "Status changed", type: "date" },
  { key: "lastModified", label: "Last modified", type: "date" },
  { key: "expires", label: "Expires", type: "date" },
  { key: "seen", label: "Seen", type: "date" },
];

export const columnByKey = (key: string): Column => COLUMNS.find((c) => c.key === key) as Column;

interface SortMeta {
  icon: string;
  label: string;
}

/** Alphabetical / Numerical / Time / Other — ascending and descending. */
export const SORT_META: Record<ColumnType, { asc: SortMeta; desc: SortMeta }> = {
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

// The Cards view's attributes — chips toggle what each card shows.
export interface Attribute {
  key: string;
  label: string;
}

export const ATTRIBUTES: Attribute[] = [
  { key: "price", label: "Price" },
  { key: "inventory", label: "Inventory" },
  { key: "taxability", label: "Taxability" },
  { key: "duration", label: "Duration" },
  { key: "lastModified", label: "Last modified" },
  { key: "labels", label: "Labels" },
  { key: "inventoryLevel", label: "Inventory level" },
  { key: "inventoryValue", label: "Inventory value" },
  { key: "onOrder", label: "On order" },
];

/** Active by default in the design. */
export const DEFAULT_ACTIVE_ATTRIBUTES = ["price", "inventory", "duration", "inventoryLevel", "inventoryValue"];

// "Scheduled date" filter options (Table tab). Semantics from the Figma
// annotations: N = through the end of the day today+N, calendar-based; only
// future-scheduled jobs are hidden. The prototype just stores the selection.
export const SCHEDULED_OPTIONS = [
  { key: "all", label: "All dates" },
  { key: "1w", label: "Next 1 week" },
  { key: "2w", label: "Next 2 weeks" },
  { key: "3w", label: "Next 3 weeks" },
  { key: "1m", label: "Next 1 month" },
];

// Timeline view settings.
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
