import { CellAlign } from "../CellBody/CellBody.types";

/**
 * What kind of data the column holds. It only picks the pair of sort icons —
 * it is independent of which cell type the column renders. A duration column,
 * for example, shows TEXT but sorts NUMERICALLY.
 */
export type CellDataType = "alphabetical" | "numerical" | "timing" | "other";

/** Direction the table is currently sorted by, on this column. */
export type CellSortOrder = "ascending" | "descending";

export interface CellHeaderProps {
  /** Column name. Truncates with a tooltip when it does not fit. */
  label: string;
  /**
   * Horizontal alignment. Default "left". Must match the CellBody cells in
   * the same column.
   */
  align?: CellAlign;
  /** Column width in px. Omit to let the header size itself. */
  width?: number;
  /**
   * Whether the column can be sorted. A non-sortable header is inert: no
   * hover, no pressed, and not keyboard-focusable. Default false.
   */
  isSortable?: boolean;
  /** Picks the sort-icon pair. Only used when `isSortable`. Default "other". */
  dataType?: CellDataType;
  /**
   * Set when the table is currently sorted by THIS column. Leave undefined for
   * a sortable column that is not the active sort — it then shows the neutral
   * up/down icon. One prop, so "sorted with no direction" cannot happen.
   */
  sortOrder?: CellSortOrder;
  /** Shows the thumbtack, marking the column as pinned. Default false. */
  isPinned?: boolean;
  /**
   * The pinned cell's sticky offset — the summed widths of the pinned columns
   * BEFORE it, in px. Set together with `isPinned`: the cell then freezes at
   * the table's left edge while the rest scroll under it.
   */
  pinnedOffset?: number;
  /**
   * Draws the pinned-region boundary on the right edge. Set it on the LAST
   * pinned column only — the same flag its CellBody cells carry.
   */
  isLastPinned?: boolean;
  /** Replaces the label with a skeleton while the table loads. */
  isLoading?: boolean;
  /** Called when a sortable header is clicked or activated by keyboard. */
  onClick?: () => void;
  className?: string;
}
