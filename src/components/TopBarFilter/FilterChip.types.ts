import { CSSProperties, MouseEvent, ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

/**
 * How the chip is laid out — the FilterChipGroup's own `orientation`, which
 * the chips inside inherit (2026-09-18: the chip's `breakpoint` is gone; it
 * has ONE size now, and only the layout differs).
 *
 * - "horizontal" — the chip hugs its content, every box is capped at 240px and
 *   truncates.
 * - "vertical" — the chip fills the row, the "value" box takes the slack, and
 *   no box has a max width.
 */
export type FilterChipOrientation = "horizontal" | "vertical";

export interface FilterChipProps {
  /**
   * The "name" box text — what the filter is about (e.g. "Assignee"). The box
   * is always non-interactive. (Named `property` until 2026-09-17, when the
   * Figma component renamed the box.)
   */
  name: string;
  /**
   * Left slot in the "name" box: an Icon (14px; every icon parameter is the
   * caller's) or ANY avatar at the fixed **xs (20px)** size. Sits `--size-2`
   * (8px) before the text.
   */
  slotLeft?: ReactNode;
  /**
   * The "operator" box text (e.g. "is"). OPTIONAL: a chip whose filter has no
   * operator — a preset timeframe value like "Next 3 days" — renders WITHOUT
   * the box (and without its divider). The Figma component's boolean
   * `operator` prop is this prop's presence. (Named `condition` until
   * 2026-09-17.)
   */
  operator?: string;
  /**
   * Makes the "operator" box interactive (usually opens a SelectList with the
   * operator options). Without a handler the box renders non-interactive.
   * Ignored on a locked chip (`isLocked`) — its operator box always renders
   * non-interactive.
   */
  onOperatorClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables the "operator" box: 30% opacity, not-allowed cursor. */
  operatorDisabled?: boolean;
  /**
   * Holds the "operator" box's fill while the list it opened is on screen —
   * set it to that list's open state. Ignored on a locked chip.
   */
  operatorPressed?: boolean;
  /** The "value" box text (e.g. "John Doe"). */
  value: string;
  /**
   * Left slot in the "value" box — an Icon (14px; every icon parameter is
   * the caller's) or ANY avatar at the fixed **xs (20px)** size, like the
   * name box's `slotLeft` (the boxes are the same part). Sits `--size-2`
   * (8px) before the text.
   */
  valueSlotLeft?: ReactNode;
  /**
   * Makes the "value" box interactive (usually opens a SelectList with value
   * options, or a Dialog). Without a handler the box renders non-interactive.
   * In a locked chip (`isLocked`), wire it whenever the value comes from the
   * filter's option list — one selected option or several — and it opens the
   * selection with the rest of the options as a read-only list. Leave it
   * unset only for a CUSTOM value (one a Dialog would edit): that box is not
   * clickable.
   */
  onValueClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables the "value" box: 30% opacity, not-allowed cursor. */
  valueDisabled?: boolean;
  /**
   * Holds the "value" box's fill while the list it opened is on screen — set
   * it to that list's open state.
   */
  valuePressed?: boolean;
  /**
   * Whether the chip is locked (not adjustable). A locked chip has no "remove"
   * box (nor its divider) and its "operator" box renders non-interactive.
   * Default false.
   */
  isLocked?: boolean;
  /** Click on the "remove" box — remove the filter chip from the list. */
  onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables the "remove" box: 30% opacity, not-allowed cursor. */
  removeDisabled?: boolean;
  /**
   * The WARNING state (doc's "Warning" section; first usage: the
   * schedule-horizon conflict, Filters file 14101-46526). The whole chip
   * changes: the body becomes `--amber-a2` inside an `--amber-a11` ring, the
   * "name", "operator" and "value" boxes render `--text-warning`, and the name
   * slot swaps to the SOLID `warning` icon (the chip owns the swap — the Figma
   * master's behavior — so `slotLeft` is set aside while warning). The
   * dividers, the chevrons and the "remove" box keep their colors, and the
   * interaction fills are the same greys as on a neutral chip.
   * A default-colored `valueSlotLeft` icon inherits the warning color; an
   * icon with a customized color keeps its own color. The explaining bubble
   * goes in `nameHint`.
   */
  isWarning?: boolean;
  /**
   * Free-slot Hint content anchored to the "name" box (the doc's rule:
   * hovering over — desktop — or tapping on — mobile — the box triggers the
   * Hint). Desktop: a HoverHint below the box; mobile: a drawer. That one
   * follows the VIEWPORT, not the group's orientation: it is a pointer
   * question (hover or tap), not a layout question.
   */
  nameHint?: ReactNode;
  /**
   * The desktop hint bubble's width. Default 384 — the conflict design's
   * "Max Width" pin; the doc page's generic example draws 276.
   */
  nameHintWidth?: number;
  /**
   * Forces the `nameHint`'s presentation — HoverHint's own prop, forwarded.
   * Default "auto": the VIEWPORT decides (bubble on desktop, drawer on
   * mobile). It is not a layout prop; set it only in Storybook or tests, to
   * show the drawer on a wide screen.
   */
  nameHintBreakpoint?: Breakpoint;
  /**
   * Layout — see `FilterChipOrientation`. Defaults to the enclosing
   * FilterChipGroup's `orientation`, else "horizontal"; set it only on a chip
   * that stands outside a group.
   */
  orientation?: FilterChipOrientation;
  className?: string;
}

/**
 * One content box ("name" / "operator" / "value") — exported for the docs
 * examples; inside a chip FilterChip renders it for you.
 */
export interface FilterChipBoxProps {
  /**
   * The group's layout. "horizontal" (default) caps the box at 240px and
   * truncates; "vertical" lifts the cap. Set by FilterChip.
   */
  orientation?: FilterChipOrientation;
  /** Left slot — an Icon or an avatar at xs (20px). */
  slotLeft?: ReactNode;
  /**
   * Makes the box interactive. Without a handler it renders non-interactive.
   * An interactive box also draws the chevron — the mark that it opens a
   * list; that is the Figma part's `isClickable`, so the two cannot diverge.
   */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables an interactive box: 30% opacity, not-allowed cursor. */
  disabled?: boolean;
  /**
   * Holds the box's fill (the hover tint) while the list it opened is on
   * screen, so the box reads as the open one; a real press still steps the
   * fill further. Only meaningful on an interactive box.
   */
  isPressed?: boolean;
  /**
   * Fill the remaining chip width (the "value" box in a vertical group)
   * instead of hugging the content. Set by FilterChip.
   */
  fill?: boolean;
  /** The conflict treatment: `--text-warning` text (and inherited slot icon). */
  warning?: boolean;
  /**
   * The box text. Truncates with an ellipsis; when truncated, hovering the
   * box shows a tooltip with the full value.
   */
  children: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The "remove" box — exported for the docs examples; inside a chip FilterChip
 * renders it for you.
 */
export interface FilterChipRemoveProps {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables the box: 30% opacity, not-allowed cursor. */
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}
