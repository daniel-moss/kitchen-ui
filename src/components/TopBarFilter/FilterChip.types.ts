import { CSSProperties, MouseEvent, ReactNode } from "react";

/**
 * Which presentation to use: "auto" (default) tracks the viewport
 * (desktop ≥ 1024px), "desktop" / "mobile" force one (Storybook, tests).
 */
export type FilterChipBreakpoint = "auto" | "desktop" | "mobile";

/** The breakpoint the parts receive — FilterChip resolves "auto" itself. */
export type FilterChipPartBreakpoint = "desktop" | "mobile";

export interface FilterChipProps {
  /**
   * The "property" box text — what the filter is about (e.g. "Assignee").
   * The box is always non-interactive.
   */
  property: string;
  /**
   * Left slot in the "property" box: an Icon (14px; every icon parameter is
   * the caller's) or ANY avatar at the fixed **xs (20px)** size. Sits
   * `--size-2` (8px) before the text.
   */
  slotLeft?: ReactNode;
  /**
   * The "condition" box text (e.g. "is"). OPTIONAL since 2026-09-09: a chip
   * whose filter has no condition — a preset timeframe value like
   * "Next 3 days" — renders WITHOUT the box (and without its divider). The
   * Figma component's boolean `condition` prop is this prop's presence.
   */
  condition?: string;
  /**
   * Makes the "condition" box interactive (usually opens a SelectList with
   * condition options). Without a handler the box renders non-interactive.
   * Ignored on a locked chip (`isLocked`) — its condition box always renders
   * non-interactive.
   */
  onConditionClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables the "condition" box: 30% opacity, not-allowed cursor. */
  conditionDisabled?: boolean;
  /**
   * Holds the "condition" box's fill while the list it opened is on screen —
   * set it to that list's open state. Ignored on a locked chip.
   */
  conditionPressed?: boolean;
  /** The "value" box text (e.g. "John Doe"). */
  value: string;
  /**
   * Left slot in the "value" box — an Icon (14px; every icon parameter is
   * the caller's) or ANY avatar at the fixed **xs (20px)** size, like the
   * property box's `slotLeft` (the boxes are the same part). Sits `--size-2`
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
   * clickable. (Rule corrected 2026-09-10 — the earlier "only with several
   * values" doc rule was wrong, per Daniel.)
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
   * box (nor its divider) and its "condition" box renders non-interactive.
   * Default false.
   */
  isLocked?: boolean;
  /** Click on the "remove" box — remove the filter chip from the list. */
  onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables the "remove" box: 30% opacity, not-allowed cursor. */
  removeDisabled?: boolean;
  /**
   * The WARNING state (doc's "Warning — isWarning" section; first usage: the
   * schedule-horizon conflict, Filters file 14101-46526): the "property",
   * "condition" and "value" boxes render `--text-warning` and the property
   * slot swaps to the `warning` icon (the chip owns the swap — the Figma
   * master's behavior — so `slotLeft` is set aside while warning). The
   * "remove" box keeps its colors, and interaction states are unchanged.
   * A default-colored `valueSlotLeft` icon inherits the warning color; an
   * icon with a customized color keeps its own color. The explaining bubble
   * goes in `propertyHint`.
   */
  isWarning?: boolean;
  /**
   * Free-slot Hint content anchored to the "property" box (the conflict
   * design's rule: "hovering over / tapping on the 'property' box triggers
   * the Hint"). Desktop: a HoverHint below the box; mobile: a tap on the
   * box opens the same content as a drawer.
   */
  propertyHint?: ReactNode;
  /**
   * The desktop hint bubble's width. Default 384 — the conflict design's
   * "Max Width" pin; the doc page's generic example draws 276.
   */
  propertyHintWidth?: number;
  /**
   * Presentation. Desktop: 32px (`--size-8`) boxes, 10px (`--size-2_5`) side
   * paddings, each box capped at 240px, the chip hugs its content. Mobile:
   * 36px (`--size-9`) boxes, 12px (`--size-3`) side paddings, the chip fills
   * the width and the "value" box takes the remaining space. Defaults to the
   * enclosing FilterChipGroup's breakpoint, else "auto".
   */
  breakpoint?: FilterChipBreakpoint;
  className?: string;
}

/**
 * One content box ("property" / "condition" / "value") — exported for the
 * docs examples; inside a chip FilterChip renders it for you.
 */
export interface FilterChipBoxProps {
  /** Resolved presentation (no "auto" — FilterChip resolves it). Default "desktop". */
  breakpoint?: FilterChipPartBreakpoint;
  /** Left slot — an Icon or an avatar at xs (20px). */
  slotLeft?: ReactNode;
  /** Makes the box interactive. Without a handler it renders non-interactive. */
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
   * Fill the remaining chip width (the mobile "value" box) instead of hugging
   * the content. Set by FilterChip.
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
  /** Resolved presentation: fixed width 32px desktop / 36px mobile. Default "desktop". */
  breakpoint?: FilterChipPartBreakpoint;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables the box: 30% opacity, not-allowed cursor. */
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}
