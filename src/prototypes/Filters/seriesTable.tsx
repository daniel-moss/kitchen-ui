import { CellBody } from "../../components/Table/CellBody/CellBody";
import { ViewMenuColumnsState } from "../../modules/ViewMenu/ViewMenu.types";

import {
  ListTable,
  TableColumnDef,
  TableSort as SharedTableSort,
  viewMenuAttributes,
  viewMenuColumns,
} from "./listTable";

import { formatDateTime, locationAddress } from "./listData";
import {
  SeriesRow,
  clientOf,
  formatRecurrence,
  locationOf,
  seriesTypeLabel,
} from "./seriesData";

// The SERIES list's TABLE — the fifth list's registry over the shared
// `listTable` (added 2026-09-14, the Invoices pattern: the Figma views'
// content areas are placeholders, so the columns come from PRODUCTION —
// JobSeriesTableView + defaultTableViewConfig's job_series_table__*).
//
// ONE list (`TABLE_COLUMNS`) drives the shared View Menu module's rows, the
// table's header cells and its body cells — the other tables' rule.

// ---- sorting ---------------------------------------------------------------

// The sortable columns are production's own (JobSeriesTableView's
// enableSorting flags): everything sorts but Recurrence — the rule's
// sentence has no order.
export type SortColumn =
  | "service"
  | "client"
  | "locationName"
  | "locationAddress"
  | "type"
  | "seriesStart"
  | "seriesEnd"
  | "openJobs"
  | "createdAt";

export type TableSort = SharedTableSort<SortColumn>;

// The production default ordering is TWO keys — `recurrence_start,created_at`
// (ascending open, descending closed). One sort column here; `sortSeries`
// bakes the created-at tie-break in, so the order matches production's.
export const sortDefault = (branch: "open" | "closed"): TableSort => ({
  column: "seriesStart",
  order: branch === "open" ? "ascending" : "descending",
});

const SORT_KEYS: Record<SortColumn, (series: SeriesRow) => string | number | null> = {
  service: (series) => series.serviceName,
  client: (series) => clientOf(series).name,
  locationName: (series) => locationOf(series).name ?? null,
  locationAddress: (series) => locationAddress(locationOf(series)),
  type: (series) => seriesTypeLabel(series),
  seriesStart: (series) => series.recurrenceStart,
  seriesEnd: (series) => series.recurrenceEnd ?? null,
  openJobs: (series) => series.openJobsCount,
  createdAt: (series) => series.createdAt,
};

export function sortSeries(seriesRows: SeriesRow[], sort: TableSort): SeriesRow[] {
  const key = SORT_KEYS[sort.column];
  const direction = sort.order === "ascending" ? 1 : -1;
  // Production's second ordering key, then the id, so the order is stable.
  const tieBreak = (a: SeriesRow, b: SeriesRow) =>
    a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : a.createdAt.localeCompare(b.createdAt) * direction;
  return [...seriesRows].sort((a, b) => {
    const keyA = key(a);
    const keyB = key(b);
    const emptyA = keyA == null || keyA === "";
    const emptyB = keyB == null || keyB === "";
    if (emptyA || emptyB) return emptyA && emptyB ? tieBreak(a, b) : emptyA ? 1 : -1;
    const compared =
      typeof keyA === "number" && typeof keyB === "number"
        ? keyA - keyB
        : String(keyA).localeCompare(String(keyB), "en", { numeric: true });
    return compared !== 0 ? compared * direction : tieBreak(a, b);
  });
}

// ---- the column registry ---------------------------------------------------

// Production's set, order and widths (JobSeriesTableView): Service 224 ·
// Client 224 · Location name 288 · Location address 288 · Type 96 · Series
// start 176 · Series end 176 · Recurrence 288 · Open jobs 160 · Created at
// 176. NO id column and NOTHING pinned — production's own arrangement.
//
// Production heads the three date-ish columns "Recurrence Start" /
// "Recurrence End" / "Created At"; here they are "Series start" / "Series
// end" / "Created at" — the FILTER names Daniel gave, and a filter and its
// column say one word (the Est. duration / Received precedent). FLAGGED.
const COLUMNS = {
  service: 224,
  client: 224,
  locationName: 288,
  locationAddress: 288,
  type: 96,
  seriesStart: 192,
  seriesEnd: 192,
  recurrence: 288,
  openJobs: 160,
  createdAt: 192,
};

type SeriesColumnDef = TableColumnDef<SeriesRow>;

export const TABLE_COLUMNS: SeriesColumnDef[] = [
  {
    key: "service", label: "Service", width: COLUMNS.service, dataType: "alphabetical", sortable: true,
    cell: (series, pin) => (
      <CellBody width={COLUMNS.service} {...pin}>
        {series.serviceName}
      </CellBody>
    ),
  },
  {
    key: "client", label: "Client", width: COLUMNS.client, dataType: "alphabetical", sortable: true,
    cell: (series, pin) => (
      <CellBody width={COLUMNS.client} {...pin}>
        {clientOf(series).name}
      </CellBody>
    ),
  },
  {
    key: "locationName", label: "Location name", width: COLUMNS.locationName, dataType: "alphabetical", sortable: true,
    cell: (series, pin) => (
      <CellBody width={COLUMNS.locationName} {...pin}>
        {locationOf(series).name ?? ""}
      </CellBody>
    ),
  },
  {
    key: "locationAddress", label: "Location address", width: COLUMNS.locationAddress, dataType: "alphabetical", sortable: true,
    cell: (series, pin) => (
      <CellBody width={COLUMNS.locationAddress} {...pin}>
        {locationAddress(locationOf(series))}
      </CellBody>
    ),
  },
  {
    key: "type", label: "Type", width: COLUMNS.type, dataType: "alphabetical", sortable: true,
    cell: (series, pin) => (
      <CellBody width={COLUMNS.type} {...pin}>
        {seriesTypeLabel(series)}
      </CellBody>
    ),
  },
  // Production shows date AND time on all three (DateTimeCell) — a series
  // starts at a time of day.
  {
    key: "seriesStart", label: "Series start", width: COLUMNS.seriesStart, dataType: "timing", sortable: true,
    cell: (series, pin) => (
      <CellBody width={COLUMNS.seriesStart} {...pin}>
        {formatDateTime(series.recurrenceStart)}
      </CellBody>
    ),
  },
  // Open-ended (rolling) series have none — the cell's own "—" placeholder.
  {
    key: "seriesEnd", label: "Series end", width: COLUMNS.seriesEnd, dataType: "timing", sortable: true,
    cell: (series, pin) => (
      <CellBody width={COLUMNS.seriesEnd} {...pin}>
        {formatDateTime(series.recurrenceEnd ?? null)}
      </CellBody>
    ),
  },
  {
    key: "recurrence", label: "Recurrence", width: COLUMNS.recurrence, dataType: "alphabetical", sortable: false,
    cell: (series, pin) => (
      <CellBody width={COLUMNS.recurrence} {...pin}>
        {formatRecurrence(series)}
      </CellBody>
    ),
  },
  // RIGHT-aligned, cells and header both — the number-column rule.
  {
    key: "openJobs", label: "Open jobs", width: COLUMNS.openJobs, dataType: "numerical", sortable: true, align: "right",
    cell: (series, pin) => (
      <CellBody width={COLUMNS.openJobs} content="number" {...pin}>
        {String(series.openJobsCount)}
      </CellBody>
    ),
  },
  {
    key: "createdAt", label: "Created at", width: COLUMNS.createdAt, dataType: "timing", sortable: true,
    cell: (series, pin) => (
      <CellBody width={COLUMNS.createdAt} {...pin}>
        {formatDateTime(series.createdAt)}
      </CellBody>
    ),
  },
];

// ---- what the View menu is fed ----------------------------------------------

export const VIEW_COLUMNS = viewMenuColumns(TABLE_COLUMNS);
// The Cards attributes drop the id on the other lists; this one HAS no id
// column, so the registry passes through whole minus nothing — the shared
// helper's filter simply finds no "id" key.
export const VIEW_ATTRIBUTES = viewMenuAttributes(TABLE_COLUMNS);

// ---- the table -------------------------------------------------------------

interface SeriesTableProps {
  seriesRows: SeriesRow[];
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  onSortChange: (column: string) => void;
  /** MOBILE has no pin functionality — see the shared table. */
  mobile?: boolean;
}

// A STABLE reference, not an inline lambda: the shared table is memoised on
// its props, and a new function every render would defeat it.
const seriesKey = (series: SeriesRow) => series.id;

export const SeriesTable = ({ seriesRows, columnsState, sort, onSortChange, mobile }: SeriesTableProps) => (
  <ListTable
    rows={seriesRows}
    rowKey={seriesKey}
    columns={TABLE_COLUMNS}
    columnsState={columnsState}
    sort={sort}
    onSortChange={onSortChange}
    mobile={mobile}
  />
);
