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
  /** The "condition" box text (e.g. "is"). */
  condition: string;
  /**
   * Makes the "condition" box interactive (usually opens a SelectList with
   * condition options). Without a handler the box renders non-interactive.
   * Ignored on a fixed chip (`isFixed`) — its condition box always renders
   * non-interactive.
   */
  onConditionClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables the "condition" box: 30% opacity, not-allowed cursor. */
  conditionDisabled?: boolean;
  /** The "value" box text (e.g. "John Doe"). */
  value: string;
  /**
   * Makes the "value" box interactive (usually opens a SelectList with value
   * options, or a Dialog). Without a handler the box renders non-interactive.
   * In a fixed chip (`isFixed`), wire it only when the box holds SEVERAL
   * values — it opens the selected options in a read-only list; with one
   * value leave it unset (the box is not clickable).
   */
  onValueClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables the "value" box: 30% opacity, not-allowed cursor. */
  valueDisabled?: boolean;
  /**
   * Whether the chip is fixed (not adjustable). A fixed chip has no "remove"
   * box (nor its divider) and its "condition" box renders non-interactive.
   * Default false.
   */
  isFixed?: boolean;
  /** Click on the "remove" box — remove the filter chip from the list. */
  onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Disables the "remove" box: 30% opacity, not-allowed cursor. */
  removeDisabled?: boolean;
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
   * Fill the remaining chip width (the mobile "value" box) instead of hugging
   * the content. Set by FilterChip.
   */
  fill?: boolean;
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
