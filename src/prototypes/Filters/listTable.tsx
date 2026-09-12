import { Fragment, ReactNode, memo } from "react";

import { CellHeader } from "../../components/Table/CellHeader/CellHeader";
import { CellDataType, CellSortOrder } from "../../components/Table/CellHeader/CellHeader.types";
import { Table } from "../../components/Table/Table/Table";
import { TableRow } from "../../components/Table/TableRow/TableRow";
import { ViewMenuAttribute, ViewMenuColumn, ViewMenuColumnType, ViewMenuColumnsState } from "../../modules/ViewMenu/ViewMenu.types";
import { noop } from "../../stories/helpers";

import styles from "./Filters.module.scss";

// The LIST TABLE — everything the Jobs table and the Estimates table do the
// same way, which is everything except which columns they have.
//
// Shared on 2026-09-11 (Daniel: "the third list will arrive, so let's share").
// Until then each page carried its own copy of this: the column-def shape, the
// pinned-offset maths, the sort-props helper, the View-menu column mapping and
// the memoised Table assembly — about thirty lines apiece, identical but for
// the row type. A third list would have made it three.
//
// What a per-object table module still owns is its REGISTRY: the columns, their
// widths, their order and what each cell draws. That is the part Daniel's Figma
// keeps per object, and it is the part that genuinely differs.

/**
 * What a pinned column's cells receive: the sticky flag with its offset (the
 * summed widths of the pinned columns before it), and the pinned-region
 * boundary on the LAST pinned column. Empty for an unpinned column.
 */
export interface CellPinProps {
  isPinned?: boolean;
  pinnedOffset?: number;
  isLastPinned?: boolean;
}

/** One column of a list's table, generic over the row it draws. */
export interface TableColumnDef<TRow> {
  key: string;
  label: string;
  width: number;
  /** The sort-icon pair — the header's, and (mapped) the menu's. */
  dataType: CellDataType;
  sortable: boolean;
  /** The body cell. `pin` freezes a pinned column's cells (see CellPinProps). */
  cell: (row: TRow, pin: CellPinProps) => ReactNode;
}

/** A list's sort: which column, and which way. */
export interface TableSort<TColumn extends string = string> {
  column: TColumn;
  order: CellSortOrder;
}

// ---- what the View menu is fed ---------------------------------------------

/** The header's sort-icon pairs, mapped onto the menu's column types. */
const MENU_TYPE: Record<CellDataType, ViewMenuColumnType> = {
  alphabetical: "text",
  numerical: "number",
  timing: "date",
  other: "generic",
};

/**
 * The shared View Menu module's Columns rows, derived from a table's own
 * registry — so the menu and the table can never disagree about what a column
 * is, on any list.
 */
export const viewMenuColumns = <TRow,>(columns: TableColumnDef<TRow>[]): ViewMenuColumn[] =>
  columns.map((def) => ({
    key: def.key,
    label: def.label,
    type: MENU_TYPE[def.dataType],
    sortable: def.sortable,
  }));

/**
 * The Cards view's attributes — the same registry minus the ID, which every
 * card shows anyway.
 *
 * FLAGGED on both lists: mapping Cards attributes onto the TABLE's columns is
 * my reading, not a node's (the module's own demo list is product-shaped). They
 * stay unreachable while the Cards view is disabled.
 */
export const viewMenuAttributes = <TRow,>(columns: TableColumnDef<TRow>[]): ViewMenuAttribute[] =>
  columns.filter((def) => def.key !== "id").map((def) => ({ key: def.key, label: def.label }));

// ---- the table --------------------------------------------------------------

interface ListTableProps<TRow> {
  rows: TRow[];
  /** React's key for a row — the object's id. A STABLE reference (see below). */
  rowKey: (row: TRow) => string;
  /** The list's whole column registry, in its default order. */
  columns: TableColumnDef<TRow>[];
  /** The view's arrangement — what the View menu edits. */
  columnsState: ViewMenuColumnsState;
  sort: TableSort;
  /** Clicking a sortable header. The page owns the toggle rule. */
  onSortChange: (column: string) => void;
  /**
   * MOBILE has no pin functionality (Daniel, 2026-09-09), so the desktop's
   * pinned columns do not freeze there — they render as ordinary leading
   * columns and scroll with the rest. The View menu's arrangement (pinned group
   * first) still decides the ORDER on both breakpoints.
   */
  mobile?: boolean;
}

// MEMOISED (2026-09-11). Re-rendering 78 rows × 17 columns costs 40-160ms, and
// without this the table rebuilt itself on EVERY render of the page — including
// the one that merely echoes a keystroke into the view bar's search field,
// where `rows` has not changed at all because the filtering is deferred. With
// the table skipped, that keystroke render is nothing but the input.
//
// This only works while every prop keeps its identity between renders: `rows`
// comes from the page's `useMemo`, `columnsState` and `sort` are per-view
// state, `columns` and `rowKey` are module constants, and `onSortChange` is a
// `useCallback`. Passing an inline `rowKey={(r) => r.id}` would silently undo
// the whole thing.
function ListTableInner<TRow>({
  rows,
  rowKey,
  columns,
  columnsState,
  sort,
  onSortChange,
  mobile = false,
}: ListTableProps<TRow>) {
  // The three sorting props of a sortable header, from one place: the active
  // column shows its direction, every other one the neutral pair.
  const sortable = (column: string) => ({
    isSortable: true,
    sortOrder: sort.column === column ? sort.order : undefined,
    onClick: () => onSortChange(column),
  });

  // The view's arrangement, resolved against the registry: the pinned group
  // first, then the unpinned one, hidden keys dropped from both. Every pinned
  // column's cells FREEZE at the table's left edge (sticky, offset by the
  // pinned widths before them — Daniel, 2026-09-04) and the last one carries
  // the pinned-region boundary — header and cells alike.
  const byKey = new Map(columns.map((def) => [def.key, def]));
  const visibleDefs = (keys: string[]) =>
    keys.filter((key) => !columnsState.hidden.includes(key)).flatMap((key) => byKey.get(key) ?? []);
  const pinnedDefs = visibleDefs(columnsState.pinned);
  const unpinnedDefs = visibleDefs(columnsState.unpinned);
  const ordered = [...pinnedDefs, ...unpinnedDefs];

  // On MOBILE the map stays empty — no pin functionality there (see the
  // `mobile` prop) — so every column gets the plain, scrolling cell.
  const pinPropsByKey = new Map<string, CellPinProps>();
  if (!mobile) {
    let pinnedOffset = 0;
    for (const [index, def] of pinnedDefs.entries()) {
      pinPropsByKey.set(def.key, {
        isPinned: true,
        pinnedOffset,
        isLastPinned: index === pinnedDefs.length - 1,
      });
      pinnedOffset += def.width;
    }
  }
  const pinProps = (key: string): CellPinProps => pinPropsByKey.get(key) ?? {};

  return (
    <Table
      // `.jobsTable` is the SHARED table sizing — Concept 1's taller rows and
      // heavier row divider. Every list's table uses it; the name is historical.
      className={styles.jobsTable}
      header={
        <TableRow variant="header">
          {ordered.map((def) => (
            <CellHeader
              key={def.key}
              label={def.label}
              width={def.width}
              dataType={def.dataType}
              {...pinProps(def.key)}
              {...(def.sortable ? sortable(def.key) : {})}
            />
          ))}
        </TableRow>
      }
    >
      {rows.map((row) => (
        <TableRow key={rowKey(row)} isClickable onClick={noop}>
          {ordered.map((def) => (
            <Fragment key={def.key}>{def.cell(row, pinProps(def.key))}</Fragment>
          ))}
        </TableRow>
      ))}
    </Table>
  );
}

// `memo` erases the generic, so the cast hands it back — the standard way to
// memoise a generic component.
export const ListTable = memo(ListTableInner) as typeof ListTableInner;

// (useSingleAxisScroll — the mobile table's one-direction-per-gesture lock —
// lives in appShell.tsx; both pages' tables share it.)
