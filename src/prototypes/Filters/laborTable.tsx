import Badge from "../../components/Badge/Badge";
import BadgePricebookStatus from "../../components/Badge/BadgePricebookStatus";
import { CellBody } from "../../components/Table/CellBody/CellBody";

import { TableColumnDef } from "./listTable";
import { PRICEBOOK_STATUS_RANK, PricebookPhase, pricebookSorter } from "./pricebookList";
import { LaborRow, labelsOf, perUnitSuffix, subtypeNameOf } from "./laborData";
import { formatCurrency, formatDateTime, formatDuration } from "./listData";

// The LABOR list's TABLE — the tenth list's registry over the shared
// `listTable` (added 2026-09-16, with the Bills pattern: ONE registry per
// phase). The Figma page's content area is a placeholder, so the columns are
// PRODUCTION's Services view (PricebookTableView + defaultTableViewConfig's
// pricebook_items_services_table__*) with Daniel's rulings applied:
//
//   - the name column is PLAIN TEXT — no avatar (Daniel, 2026-09-16:
//     "Avatar is unnecessary");
//   - production heads it "Short Description"; here "Short description",
//     the sentence-case rule;
//   - the STATUS column shows on every ACTIVE view and none of the Inactive
//     ones (Daniel: "'Status' column is shown on all 'Active' views. It is
//     not being shown on the closed views") — production shows it on two of
//     the three active tabs, so this DIVERGES from production on purpose;
//   - production's columnOrder puts Cost before Rate (its JSX declares them
//     the other way round; columnOrder wins on screen) — kept;
//   - empty Subtype and Est. duration cells use the DS "No value" cell — an
//     empty string child makes CellBody draw its own "—" placeholder
//     (Daniel, 2026-09-16); an empty Summary falls back the same way.

// ---- sorting ---------------------------------------------------------------

// The sortable columns are production's own (PricebookTableView's
// enableSorting + views.py's ordering whitelist): Summary and Labels do not
// sort there and do not sort here. The comparator, the Review-first status
// rank and the per-view defaults are the SHARED pricebook ones since
// 2026-09-16 — only these per-column readers differ between the five lists.
export const sortLabor = pricebookSorter<LaborRow>(
  {
    name: (item) => item.name,
    status: (item) => PRICEBOOK_STATUS_RANK[item.status],
    subtype: (item) => subtypeNameOf(item),
    cost: (item) => item.cost,
    rate: (item) => item.rate,
    duration: (item) => item.estDurationMinutes,
    lastModified: (item) => item.lastModifiedAt,
  },
  (item) => item.name,
);

// ---- the column registry ---------------------------------------------------

// Widths: production's Services view (224/288/144 pattern), with two standing
// substitutions — Status 176 (production's 128; "the width the other lists'
// Status already uses", the POs ruling) and the two datetime rules (Last
// modified 192, date + time). Est. duration keeps the Jobs list's measured
// 144 (the header needs it; the cells never did).
const COLUMNS = {
  // 288, not production's 224 (Daniel, 2026-09-16: "Make 'Short description'
  // wider") — the catalog names ("Combi oven quarterly maintenance") clipped
  // at 224.
  name: 288,
  status: 176,
  subtype: 224,
  summary: 288,
  cost: 144,
  rate: 144,
  duration: 144,
  labels: 240,
  lastModified: 192,
};

type LaborColumnDef = TableColumnDef<LaborRow>;

const ALL_COLUMNS: LaborColumnDef[] = [
  // Production `description` — the item's name. PLAIN text, no avatar
  // (Daniel's ruling), pinned (production's own).
  {
    key: "name", label: "Short description", width: COLUMNS.name, dataType: "alphabetical", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.name} {...pin}>
        {item.name}
      </CellBody>
    ),
  },
  // ACTIVE phase only (see the module note): the two-state review model's
  // badge — the amber Review dot is the whole point of the "All" view's
  // default sort.
  {
    key: "status", label: "Status", width: COLUMNS.status, dataType: "other", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.status} content="badge" {...pin}>
        <BadgePricebookStatus status={item.status} />
      </CellBody>
    ),
  },
  // Production `subtype`. Null → "" → the cell's own "—" placeholder (the
  // DS "No value" cell, Daniel's ruling).
  {
    key: "subtype", label: "Subtype", width: COLUMNS.subtype, dataType: "alphabetical", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.subtype} {...pin}>
        {subtypeNameOf(item) ?? ""}
      </CellBody>
    ),
  },
  // Production `summary_template` — the default line-item summary. Not
  // sortable there either.
  {
    key: "summary", label: "Summary", width: COLUMNS.summary, dataType: "alphabetical", sortable: false,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.summary} {...pin}>
        {item.summary}
      </CellBody>
    ),
  },
  // Cost BEFORE Rate — production's on-screen order (its columnOrder wins
  // over its JSX). RIGHT-aligned, cells and header, the money-column rule;
  // "/hr" when the unit type is Hourly, production's value-hour cell.
  {
    key: "cost", label: "Cost", width: COLUMNS.cost, dataType: "numerical", sortable: true, align: "right",
    cell: (item, pin) => (
      <CellBody width={COLUMNS.cost} content="number" {...pin}>
        {formatCurrency(item.cost) + perUnitSuffix(item)}
      </CellBody>
    ),
  },
  {
    key: "rate", label: "Rate", width: COLUMNS.rate, dataType: "numerical", sortable: true, align: "right",
    cell: (item, pin) => (
      <CellBody width={COLUMNS.rate} content="number" {...pin}>
        {formatCurrency(item.rate) + perUnitSuffix(item)}
      </CellBody>
    ),
  },
  // Production `default_job_duration` — the same compact print the Jobs
  // list uses ("2h" / "1h 30m"). Null → the "No value" cell.
  {
    key: "duration", label: "Est. duration", width: COLUMNS.duration, dataType: "numerical", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.duration} {...pin}>
        {formatDuration(item.estDurationMinutes)}
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(item).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDateTime(item.lastModifiedAt)}
      </CellBody>
    ),
  },
];

/** The phase's own column set — the Status column exists on the Active
 *  phase alone (Daniel's ruling; see the module note). */
export const TABLE_COLUMNS: Record<PricebookPhase, LaborColumnDef[]> = {
  active: ALL_COLUMNS,
  inactive: ALL_COLUMNS.filter((def) => def.key !== "status"),
};
