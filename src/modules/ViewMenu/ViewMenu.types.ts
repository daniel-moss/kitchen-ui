/**
 * What kind of data a column holds — it picks the sort-order icon/label pair
 * (see SORT_META in viewMenuData.ts, from the Figma annotations on the
 * "Sort Order Button" board).
 */
export type ViewMenuColumnType = "text" | "number" | "date" | "generic";

/** One table column, as the menu sees it. */
export interface ViewMenuColumn {
  key: string;
  label: string;
  type: ViewMenuColumnType;
  /**
   * Offered in the "Sort by" select. Default true — set false for a column
   * the table cannot sort by (its header cell is inert too).
   */
  sortable?: boolean;
}

/**
 * The columns' arrangement: two ordered groups and the hidden set. A column's
 * key appears in exactly ONE of `pinned` / `unpinned` — hiding does not move
 * it, EXCEPT that a hidden column cannot stay pinned (the menu unpins it).
 */
export interface ViewMenuColumnsState {
  pinned: string[];
  unpinned: string[];
  hidden: string[];
}

/** The table's sort, as the menu edits it. */
export interface ViewMenuSort {
  key: string;
  ascending: boolean;
}

/** The menu's view switcher. "timeline" exists only when `timeline` is passed. */
export type ViewMenuView = "table" | "cards" | "timeline";

/** One Cards-view attribute chip. */
export interface ViewMenuAttribute {
  key: string;
  label: string;
}

/** The Timeline tab's settings — jobs only. */
export interface ViewMenuTimelineState {
  orientation: "horizontal" | "vertical";
  timeFrame: string;
  /** TIMELINE_TOGGLES keys → on/off. */
  flags: Record<string, boolean>;
}

export interface ViewMenuProps {
  /** The consumer owns the trigger and the outside-click close. */
  open: boolean;
  onClose: () => void;
  /**
   * Presentation: desktop = the popover card, rendered where the consumer
   * positions it; mobile = a drawer (and pinning disappears — the mobile
   * design has none). Default "desktop".
   */
  breakpoint?: "desktop" | "mobile";

  /** The consumer's columns — each prototype passes its own set. */
  columns: ViewMenuColumn[];
  columnsState: ViewMenuColumnsState;
  onColumnsStateChange: (next: ViewMenuColumnsState) => void;

  sort: ViewMenuSort;
  onSortChange: (next: ViewMenuSort) => void;

  view: ViewMenuView;
  onViewChange: (next: ViewMenuView) => void;

  /** The Cards view's attribute chips. */
  attributes: ViewMenuAttribute[];
  activeAttributes: string[];
  onActiveAttributesChange: (next: string[]) => void;

  /**
   * Views the consumer has not built — still drawn, but disabled and
   * unclickable (Daniel, 2026-09-04: "It doesn't make sense to switch to
   * them if the content doesn't change").
   */
  disabledViews?: ViewMenuView[];

  /**
   * JOBS ONLY (Daniel, 2026-09-03): the "Schedule horizon" row — how far
   * ahead the scheduled jobs are listed. Other object types have no schedule,
   * so they leave this undefined and the row is not there.
   */
  scheduled?: {
    /** A SCHEDULED_OPTIONS key. */
    value: string;
    onChange: (next: string) => void;
  };
  /**
   * JOBS ONLY: the Timeline view — a schedule over time, which only jobs
   * have. Leave undefined and the switcher offers Table / Cards alone.
   */
  timeline?: {
    value: ViewMenuTimelineState;
    onChange: (next: ViewMenuTimelineState) => void;
  };

  /** Extra class for the desktop card (width overrides etc.). */
  className?: string;
}
