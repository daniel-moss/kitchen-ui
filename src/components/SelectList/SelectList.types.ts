import { CSSProperties, ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

/** Copy for the empty state (no items exist at all). */
export interface SelectListEmptyState {
  /** Icon name for the top slot (e.g. the object's icon). */
  icon?: string;
  /** e.g. "No clients here yet". Omit for a caption-only state. */
  title?: string;
  /** e.g. "Add a client to see it here". */
  caption?: string;
  /** Optional "Add …" action — a subtle button with a plus icon. */
  actionLabel?: string;
  onAction?: () => void;
}

interface SelectListBaseProps {
  /**
   * The SelectListItemGroup elements — every SelectListItem must live inside
   * a group (at least one group). SelectList manages the groups' dividers
   * automatically: every group gets one except the last.
   */
  children: ReactNode;
  /** Controls the enter/exit animation, like Popover. Default true. */
  open?: boolean;
  /** Called when the list is dismissed (dialog close / scrim tap / swipe). */
  onClose?: () => void;
  /**
   * Header slot — a SelectListHeader in any of its three variants (search,
   * chips, or chips over search). Pinned above the scrolling body. Use this
   * for a header with chips; `searchable` below is the shortcut for the
   * search-only one.
   */
  header?: ReactNode;
  /**
   * Built-in search: SelectList renders its own search header, owns the query,
   * filters the SelectListItems by their `label`, shows the "no results" state
   * automatically, and RESETS the query whenever the list closes (there is no
   * reason to keep a stale search). Use this instead of passing `header` +
   * filtering the items yourself. `header` still works for custom headers.
   */
  searchable?: boolean;
  /** Placeholder for the built-in search (searchable). Default "Search…". */
  searchPlaceholder?: string;
  /** Caption under the title (dialog header / drawer header), e.g. a short instruction. */
  caption?: string;
  /**
   * The DRAWER header's bottom divider. Default true. Turn it off when what
   * follows the title already draws its own line — a search header, a chips
   * block — and two lines close together would read as a box.
   */
  drawerHeaderDivider?: boolean;
  /** Footer slot — a SelectListFooter. Pinned below the body. */
  footer?: ReactNode;
  /**
   * Single-select (default) closes the list automatically when an option is
   * clicked. Multi-select keeps it open.
   *
   * A multi-select list with ONE group stacks the options that were selected
   * when it opened at the top, above a divider (never reordering while it
   * stays open). With MORE THAN ONE group the groups carry meaning — where an
   * option comes from — so they are left exactly as written and nothing is
   * pinned on top (Daniel, 2026-08-07).
   */
  multiSelect?: boolean;
  /**
   * Body state. "empty" = no items exist (shows `emptyState`); "noResults" =
   * the search matched nothing (ban icon + "No results found"). The header
   * and footer still render in both.
   */
  state?: "default" | "empty" | "noResults";
  /** Copy for the "empty" state. */
  emptyState?: SelectListEmptyState;
  /** Caption override for the "noResults" state. Default "Try a different search". */
  noResultsCaption?: string;
  /**
   * An action button on the "noResults" state — the way out of a dead end
   * (e.g. the address autocomplete's "Enter manually"). Rendered as the
   * EmptyState's subtle primary button.
   */
  noResultsAction?: { label: string; icon?: string; onClick: () => void };
  /**
   * Force the search header to take focus when the list opens, even on a touch
   * device or in a drawer (both are excluded by default — see the auto-focus
   * comment in SelectList). Use it only where typing IS the task, like an
   * address autocomplete opened from its field.
   */
  autoFocusSearch?: boolean;
  /**
   * Turn the searchable "no results" state into a create action — a MenuItem
   * `<label> "query"` with a plus icon (Figma "Create new label"). Clicking
   * calls `onCreate` with the trimmed query and clears the search, returning
   * to the full list (the consumer adds the new option, usually selected).
   */
  createFromSearch?: { label: string; onCreate: (query: string) => void };
  /** Presentation: auto (viewport) / desktop / mobile. Default "auto". */
  breakpoint?: Breakpoint;
  className?: string;
  style?: CSSProperties;
}

/**
 * inline = a floating card (built on the Popover pattern) — e.g. under a
 * SelectField. dialog = built on Dialog (560px centered card, title + close).
 * drawer = the mobile bottom sheet. On mobile, inline and dialog fall back to
 * the drawer. The drawer shows `title` in its header when given (drag handle
 * only otherwise); the dialog variant requires a title.
 */
export type SelectListProps =
  | (SelectListBaseProps & { variant?: "inline"; title?: string })
  | (SelectListBaseProps & { variant: "dialog"; title: string })
  | (SelectListBaseProps & { variant: "drawer"; title?: string });
