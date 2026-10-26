import { CSSProperties, ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

/** Copy for the empty state (no items exist at all). */
export interface SelectListEmptyState {
  /** Icon name for the top slot (e.g. the object's icon). */
  icon?: string;
  /** e.g. "No clients here yet". Omit for a caption-only state. */
  title?: string;
  /** e.g. "Add a client to see it here". A node, so a two-line caption can break where the design breaks it. */
  caption?: ReactNode;
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
  /**
   * Return focus to where it was when the list closes. Default true — turn it
   * OFF for a list that opens and closes from POINTER HOVER (the Filters
   * menu's row lists): pulling focus back on a hover-close visibly re-lights
   * the field it came from, though the user only moved the mouse
   * (Daniel, 2026-09-04).
   */
  restoreFocus?: boolean;
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
   *
   * THE STANDARD MULTI-SELECT BEHAVIOUR (Daniel, 2026-10-26; Figma "Labels"
   * SelectList 12921-10208, "New Job" Equipment 17189-78623). Ticking only
   * changes a draft — the field behind the list does not move — and the draft
   * is APPLIED when the list closes:
   * - desktop card under a field: no apply button; any close applies (a
   *   click outside, Escape, the field, a footer action). A footer, when
   *   there is one, is a MenuItem (e.g. "Add equipment").
   * - mobile drawer: a visible solid "Select N" counting what will be
   *   selected (`SelectListSelectFooter` — full width, or with one ghost
   *   action on its left); swiping the drawer down applies too. No Cancel
   *   and no "Discard changes?" prompt.
   * Wire it with `useSelectionDraft` (./useSelectionDraft.ts), which watches
   * `open` so every way of closing applies. A list that IS its own edit form
   * on desktop (a dialog with Cancel / "Select N", e.g. the side panels'
   * Labels) keeps the Dialog rules instead — Cancel and × drop the picks,
   * after a prompt when anything changed.
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
   * Replaces the built-in "noResults" block entirely — for a surface whose
   * no-match state is designed differently. The Filters prototype's filter
   * lists and the View menu's Column list both pass a caption-only EmptyState
   * reading "No matches", which is what their nodes draw (14310-60254 /
   * 14310-60389 and 14767-81877 / 14767-81874), where the built-in state is an
   * icon over a title and a caption.
   *
   * It wins over `noResultsCaption` / `noResultsAction`, which describe the
   * built-in block.
   */
  noResultsState?: ReactNode;
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
   * Turn the searchable "no results" state into a create action (Figma
   * "Labels" SelectList, No Match, 12921-7071 — redesigned 2026-10-25): the
   * body shows a caption-only EmptyState (`noMatchCaption`) and the FOOTER is
   * replaced by a menuItem SelectListFooter whose MenuItem — plus icon, shown
   * hovered from the start — reads `<label> <query>`, updating as you type.
   * Clicking it (or Enter in the search) calls `onCreate` with the trimmed
   * query and clears the search, returning to the full list (the consumer
   * adds the new option, usually selected). The consumer's `footer` returns
   * with the list.
   */
  createFromSearch?: {
    /**
     * The row's text. A string reads `<label> <query>` ("Create new label:
     * Fryer"); a function writes the whole sentence itself, for copy where the
     * query sits mid-sentence (Job Details' `Add "query" to Pricebook`, Figma
     * 27083-31232).
     */
    label: string | ((query: string) => string);
    onCreate: (query: string) => void;
    /** The body caption above the create row, e.g. "No labels match". Default "No matches". */
    noMatchCaption?: string;
  };
  /**
   * Dismissing (close ×, scrim, Escape, a Cancel that uses `useDismiss`)
   * shows the "Discard changes?" Prompt instead of closing — pass it only
   * while there ARE unsaved picks, like Dialog's prop of the same name. In
   * the drawer a swipe down asks too: the sheet springs back and the Prompt
   * shows (Popover `swipeAsks`; Figma "Labels" SelectList, Daniel
   * 2026-10-25). Ignored by the inline card,
   * which applies its picks on close. Default false.
   *
   * NOT for the standard multi-select list (see `multiSelect`): that one
   * applies its picks on close and never asks. It is for a desktop list that
   * is itself the edit form, with Cancel / "Select N" (the side panels'
   * Labels dialog).
   */
  confirmOnDismiss?: boolean;
  /** Copy overrides for the dismiss Prompt. */
  dismissPrompt?: { title?: string; body?: string; cancelLabel?: string; actionLabel?: string };
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
 *
 * WIDTH (inline): the card hugs its content up to 384px and has NO minimum of
 * its own — so it opens at the width that shows every option without
 * truncation, however short that is. This is the deliberate difference from
 * `Menu`, which floors at 160 (Daniel, 2026-09-17, after comparing the two on
 * the Filters prototype: a list should be as wide as its rows and no wider).
 * A SEARCH never changes that width (Daniel, 2026-09-14): the measurement
 * taken with the full list is held as a floor for as long as something is
 * typed, so filtering rows out cannot make the card shrink under the cursor.
 * It works for the built-in `searchable` and for a consumer's own
 * SelectListHeader alike, and it combines with a floor a consumer sets in
 * `style.minWidth` rather than replacing it.
 *
 * HEIGHT (inline): capped at 1000px OR the screen, whichever is smaller, and
 * the body scrolls past it. The screen is part of the cap because a card
 * taller than the window cannot be placed anywhere — whatever anchors it can
 * only push it up until it hits the top margin, and the rest hangs off the
 * bottom out of reach.
 */
export type SelectListProps =
  | (SelectListBaseProps & { variant?: "inline"; title?: string })
  | (SelectListBaseProps & { variant: "dialog"; title: string })
  | (SelectListBaseProps & { variant: "drawer"; title?: string });
