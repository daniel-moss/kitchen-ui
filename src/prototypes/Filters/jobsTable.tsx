import AvatarGroup from "../../components/Avatar/AvatarGroup";
import Badge from "../../components/Badge/Badge";
import BadgeJobStatus, { BadgeJobStatusStatus, STATUS } from "../../components/Badge/BadgeJobStatus";
import { Icon } from "../../components/Icon/Icon";
import { CellBody } from "../../components/Table/CellBody/CellBody";
import { ViewMenuColumnsState } from "../../modules/ViewMenu/ViewMenu.types";

import {
  ListTable,
  TableColumnDef,
  TableSort as SharedTableSort,
  viewMenuAttributes,
  viewMenuColumns,
} from "./listTable";

import { Job, JobType, PriorityLevel, assigneesOf, clientOf, labelsOf, locationOf, sourceOf } from "./jobsData";
import { formatDateTime, formatDay, formatDuration, locationAddress } from "./listData";

import styles from "./Filters.module.scss";

// The JOBS list's TABLE — its columns, how they sort, and the component that
// draws them. Split out of the Jobs page on 2026-09-11 (the re-organisation),
// the way Daniel's Figma keeps a per-object page: this is jobs-only by nature,
// and the estimates twin is estimatesTable.tsx.
//
// ONE list (`TABLE_COLUMNS`) drives three things — the shared View Menu
// module's rows, the table's header cells and its body cells — so the menu and
// the table can never disagree about what a column is.

// ---- the Jobs table --------------------------------------------------------

// Concept 1's table: the columns, widths, sort and pinning of the production
// "Jobs → All Open" view, read off `jobs_table__open_all_open` in the app's
// defaultTableViewConfig plus the column definitions in JobTableView. 17
// columns, so the table scrolls sideways; ID and Service are pinned, sorted by
// Scheduled For. Concept 1's taller rows (44 header / 52 body) and heavier row
// divider come with it — see the scss.
//
// Every cell now READS the job record and formats it here (jobsData.ts owns the
// formatters), instead of storing pre-formatted strings. That is what lets the
// same values drive the filters.
//
// One deliberate difference, also Concept 1's: Duration is a LEFT-aligned text
// column. Production right-aligns its header while the cell renders left, which
// is the mismatch we agreed to fix — "2h 30m" is alphanumeric, so it never
// formed a numeric column. It still SORTS numerically, which is why its
// dataType stays "numerical".
const COLUMNS = {
  id: 144,
  service: 224,
  status: 240,
  labels: 288,
  type: 128,
  priority: 144,
  source: 184,
  sourceId: 144,
  // 112px (Daniel, 2026-08-17) — production ships 80, which leaves 48px after
  // the cell's padding and fits only ONE avatar slot, so any job with more than
  // one assignee showed a bare counter. 112 leaves 80px = three slots, i.e. two
  // faces plus the counter.
  techs: 112,
  received: 144,
  client: 224,
  locationName: 288,
  locationAddress: 288,
  scheduledFor: 224,
  duration: 112,
  statusChanged: 160,
  lastModified: 144,
};

// Priority 1–4 → icon + label, read off Figma node 8147-25260 in the "Table
// View — Next Update" file (Daniel, 2026-08-17). These are the REAL glyphs,
// not the approximations Concepts 1 and 2 still use: High / Medium / Low are
// Font Awesome KIT icons, and this playground does carry them (the two
// fa-kit-*.woff2 fonts + src/styles/icons-glyphs-kit.css). Medium and Low are
// DUOTONE — the second layer is what draws the pale bars next to the dark one.
// Urgent is plain FA Pro `fire`, and it is the only one with colour.
const PRIORITY = {
  1: { icon: "fire", pack: "solid", label: "Urgent", isUrgent: true },
  2: { icon: "solid-priority-high", pack: "custom", label: "High", isUrgent: false },
  3: { icon: "duotone-solid-priority-medium", pack: "custom-duotone", label: "Medium", isUrgent: false },
  4: { icon: "duotone-solid-priority-low", pack: "custom-duotone", label: "Low", isUrgent: false },
} as const;

// No priority is a TEXT cell like the rest, not an empty one (Figma node
// 13857-27895, Daniel 2026-08-17): the kit's `solid-priority-none` on the left
// and the copy "No priority" in the normal --text-strong. It reads as a value
// the job has, which is why it does not fall back to the cell's "—" placeholder.
const NO_PRIORITY = { icon: "solid-priority-none", pack: "custom", label: "No priority", isUrgent: false } as const;

const priorityOf = (priority: PriorityLevel | null) => (priority == null ? NO_PRIORITY : PRIORITY[priority]);

const priorityIcon = (priority: PriorityLevel | null) => {
  const { icon, pack, isUrgent } = priorityOf(priority);
  return <Icon icon={icon} pack={pack} size={14} className={isUrgent ? styles.priorityUrgent : undefined} />;
};

// Type — renamed from "Job Type" (Daniel, 2026-08-17) and showing the SAME value
// the Job Details page shows in its Service module's "Type" row: the copy
// New / Recall with a 14px regular icon in front of it, `sparkle` for New and
// `clock-rotate-left` for Recall. Both come straight from the JobDetails
// prototype (ServicePanel.tsx / CompleteJobForm.tsx), so the list and the
// details page cannot drift apart.
const typeIcon = (type: JobType) => (
  <Icon icon={type === "recall" ? "clock-rotate-left" : "sparkle"} pack="regular" size={14} container="square" />
);

// ---- sorting ---------------------------------------------------------------

// The header cells SORT since 2026-09-03 (Daniel: "clicking on a column header
// should apply the sorting. The second click changes the order"). Clicking a
// sortable column sorts by it ASCENDING; clicking the same column again flips
// the direction. The columns that sort are the ones that were already marked
// `isSortable`; the default is the view's own order, Scheduled for ascending.
//
// The sort belongs to its VIEW (Daniel, 2026-09-03: "Each view should have
// its own sorting parameters") — kept per view id, exactly like the view's
// filters, and never carried from one view to another.
export type SortColumn =
  | "id"
  | "service"
  | "status"
  | "priority"
  | "source"
  | "sourceId"
  | "received"
  | "client"
  | "locationName"
  | "locationAddress"
  | "scheduledFor"
  | "duration"
  | "lastModified";

export type TableSort = SharedTableSort<SortColumn>;

export const SORT_DEFAULT: TableSort = { column: "scheduledFor", order: "ascending" };

// STATUS sorts by the badge map's own order — the job's lifecycle — not the
// alphabet ("other" is its icon pair for the same reason). PRIORITY ascends
// from No priority through Low to Urgent, the filter list's own order.
const STATUS_RANK = new Map((Object.keys(STATUS) as BadgeJobStatusStatus[]).map((key, index) => [key, index]));

/**
 * What each column sorts BY — a string (localeCompare, numeric-aware so
 * "SRC-99" sorts before "SRC-100") or a number. `null` / "" means the cell is
 * empty; empty cells sort LAST in either direction (the rule the view's own
 * Scheduled-for order already followed: "Unscheduled jobs have no date, so
 * they sort last").
 */
const SORT_KEYS: Record<SortColumn, (job: Job) => string | number | null> = {
  id: (job) => job.id,
  service: (job) => job.serviceName,
  status: (job) => STATUS_RANK.get(job.status) ?? 0,
  priority: (job) => (job.priority == null ? 0 : 5 - job.priority),
  source: (job) => sourceOf(job).name,
  sourceId: (job) => job.sourceRef,
  received: (job) => job.receivedAt,
  client: (job) => clientOf(job).name,
  locationName: (job) => locationOf(job).name ?? null,
  locationAddress: (job) => locationAddress(locationOf(job)),
  scheduledFor: (job) => job.scheduledFor,
  duration: (job) => job.durationMinutes,
  lastModified: (job) => job.lastModifiedAt,
};

export function sortJobs(jobs: Job[], sort: TableSort): Job[] {
  const key = SORT_KEYS[sort.column];
  const direction = sort.order === "ascending" ? 1 : -1;
  return [...jobs].sort((a, b) => {
    const keyA = key(a);
    const keyB = key(b);
    const emptyA = keyA == null || keyA === "";
    const emptyB = keyB == null || keyB === "";
    // Ties and empties fall back to the ID, so the order is stable and two
    // equal rows can never swap as the sort changes around them.
    if (emptyA || emptyB) return emptyA && emptyB ? a.id.localeCompare(b.id) : emptyA ? 1 : -1;
    const compared =
      typeof keyA === "number" && typeof keyB === "number"
        ? keyA - keyB
        : String(keyA).localeCompare(String(keyB), "en", { numeric: true });
    return compared !== 0 ? compared * direction : a.id.localeCompare(b.id);
  });
}

// ---- the column registry ---------------------------------------------------

// ONE list drives the shared View Menu's rows, the table's header cells and
// its body cells, so the menu and the table can never disagree about what a
// column is. The order here is the DEFAULT view order (the production
// "Jobs → All Open" config); each view's own `columns` state reorders, hides
// and pins from it through the View menu.
// `TableColumnDef<Job>` and `CellPinProps` are the shared table's (listTable.tsx).
type JobColumnDef = TableColumnDef<Job>;

// ---- separator comparison (TEMPORARY — Daniel, 2026-09-04) -----------------
// Separator candidates side by side, so Daniel can compare them in place: the
// first 7 rows of the DEFAULT table (Open "All", Scheduled for ascending —
// JOBS' own order) each print "Scheduled for" with a different date–time
// separator, in the order below. Every other row keeps the ordinary bullet.
// Pinned to JOB IDS, so re-sorting or filtering moves a trial row with its
// job. Remove this block — and formatDateTime's `separator` parameter — once
// Daniel picks one.
//
export const TABLE_COLUMNS: JobColumnDef[] = [
  {
    key: "id", label: "ID", width: COLUMNS.id, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.id} {...pin}>
        {job.id}
      </CellBody>
    ),
  },
  // The job's OWN service name — the db denormalizes it (production-like),
  // and it may drift from the pricebook name the Service FILTER lists; the
  // filter still matches on `serviceId`.
  {
    key: "service", label: "Service", width: COLUMNS.service, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.service} {...pin}>
        {job.serviceName}
      </CellBody>
    ),
  },
  {
    key: "status", label: "Status", width: COLUMNS.status, dataType: "other", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.status} content="badge" {...pin}>
        <BadgeJobStatus status={job.status} />
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(job).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  {
    key: "type", label: "Type", width: COLUMNS.type, dataType: "other", sortable: false,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.type} slotLeft={typeIcon(job.type)} {...pin}>
        {job.type === "recall" ? "Recall" : "New"}
      </CellBody>
    ),
  },
  {
    key: "priority", label: "Priority", width: COLUMNS.priority, dataType: "other", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.priority} slotLeft={priorityIcon(job.priority)} {...pin}>
        {priorityOf(job.priority).label}
      </CellBody>
    ),
  },
  {
    key: "source", label: "Source", width: COLUMNS.source, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.source} {...pin}>
        {sourceOf(job).name}
      </CellBody>
    ),
  },
  {
    key: "sourceId", label: "Source ID", width: COLUMNS.sourceId, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.sourceId} {...pin}>
        {job.sourceRef ?? ""}
      </CellBody>
    ),
  },
  {
    key: "techs", label: "Assignees", width: COLUMNS.techs, dataType: "other", sortable: false,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.techs} content="assignee" {...pin}>
        {job.assigneeIds.length > 0 ? (
          <AvatarGroup
            size="md"
            items={assigneesOf(job).map((tech) => ({ content: "image", imageSrc: tech.avatar, name: tech.name }))}
          />
        ) : undefined}
      </CellBody>
    ),
  },
  {
    key: "received", label: "Date received", width: COLUMNS.received, dataType: "timing", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.received} {...pin}>
        {formatDay(job.receivedAt)}
      </CellBody>
    ),
  },
  {
    key: "client", label: "Client", width: COLUMNS.client, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.client} {...pin}>
        {clientOf(job).name}
      </CellBody>
    ),
  },
  // Both location halves are OPTIONAL (2026-08-24): a location may have no
  // name of its own, or no address. An empty string is what makes CellBody
  // draw its own "—" placeholder.
  {
    key: "locationName", label: "Location name", width: COLUMNS.locationName, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.locationName} {...pin}>
        {locationOf(job).name ?? ""}
      </CellBody>
    ),
  },
  {
    key: "locationAddress", label: "Location address", width: COLUMNS.locationAddress, dataType: "alphabetical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.locationAddress} {...pin}>
        {locationAddress(locationOf(job))}
      </CellBody>
    ),
  },
  {
    key: "scheduledFor", label: "Scheduled for", width: COLUMNS.scheduledFor, dataType: "timing", sortable: true,
    // A past-due job's scheduled time reads as an error.
    cell: (job, pin) => (
      <CellBody
        width={COLUMNS.scheduledFor}
        colorScheme={job.status === "pastDue" ? "error" : "default"}
        {...pin}
      >
        {formatDateTime(job.scheduledFor)}
      </CellBody>
    ),
  },
  {
    key: "duration", label: "Duration", width: COLUMNS.duration, dataType: "numerical", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.duration} {...pin}>
        {formatDuration(job.durationMinutes)}
      </CellBody>
    ),
  },
  {
    key: "statusChanged", label: "Status changed", width: COLUMNS.statusChanged, dataType: "timing", sortable: false,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.statusChanged} {...pin}>
        {formatDay(job.statusChangedAt)}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (job, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDay(job.lastModifiedAt)}
      </CellBody>
    ),
  },
];

// ---- what the View menu is fed ----------------------------------------------

// The shared View Menu module's two column lists, derived from the registry
// above so the menu and the table cannot disagree about what a column is. The
// page wires the module itself — see `FiltersViewMenu` in JobsPage.tsx.
export const VIEW_COLUMNS = viewMenuColumns(TABLE_COLUMNS);
export const VIEW_ATTRIBUTES = viewMenuAttributes(TABLE_COLUMNS);

interface JobsTableProps {
  jobs: Job[];
  /** The view's column arrangement — what the View menu edits. */
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  /** Clicking a sortable header — the toggle rule lives with the page's state. */
  onSortChange: (column: string) => void;
  /** MOBILE has no pin functionality — see the shared table. */
  mobile?: boolean;
}

// A STABLE reference, not an inline lambda: the shared table is memoised on
// its props, and a new function every render would defeat it.
const jobKey = (job: Job) => job.id;

// The shared `ListTable` over the registry above — the memoisation, the
// pinned-offset maths and the header's sort props are all its (see
// listTable.tsx). This page only says WHICH columns and WHICH rows.
export const JobsTable = ({ jobs, columnsState, sort, onSortChange, mobile }: JobsTableProps) => (
  <ListTable
    rows={jobs}
    rowKey={jobKey}
    columns={TABLE_COLUMNS}
    columnsState={columnsState}
    sort={sort}
    onSortChange={onSortChange}
    mobile={mobile}
  />
);