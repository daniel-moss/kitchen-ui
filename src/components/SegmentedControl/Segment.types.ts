import { ButtonHTMLAttributes, ReactNode } from "react";

/** Segment sizes (px): md 32, lg 36. There is no sm — the designs never used one. */
export type SegmentSize = "md" | "lg";

/** Segment layouts: slot and label in one line, or the slot stacked above it. */
export type SegmentOrientation = "horizontal" | "vertical";

export interface SegmentProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "disabled" | "role" | "aria-checked" | "value"
  > {
  /**
   * Identifier SegmentedControl matches against its `value` to mark this
   * segment selected, and passes to `onChange` when it is clicked.
   */
  value?: string;
  /**
   * md = `--size-8` (32px), lg = `--size-9` (36px). The step up changes the
   * padding only — both carry `body-500-compact` (14/20). Default "lg" (the
   * one the designs use); md is for a control that has to fit a tighter row.
   */
  size?: SegmentSize;
  /**
   * Layout. **"horizontal"** (default) puts the slot and the label in one line.
   *
   * **"vertical"** stacks them — the slot on top in a `--size-5` (20px) square
   * box, the label under it, both centred — and the segment hugs its content
   * instead of taking the size's height. It exists at `lg` only, it always
   * needs a `slotLeft`, and its control should be full width.
   */
  orientation?: SegmentOrientation;
  /** The selected segment — `aria-checked` follows it. Set by SegmentedControl. */
  isSelected?: boolean;
  /**
   * Points at something behind the segment that needs attention. The icon and
   * the label take `--text-warning` and hold it in every state, so an inactive
   * segment still shows the problem.
   *
   * The slot draws the solid `warning` icon and REPLACES `slotLeft` — the state
   * is not a colour applied to any icon, it is that icon. It needs a label; on
   * a slot-only segment an amber glyph alone says nothing.
   */
  isWarning?: boolean;
  /** Dimmed and inert. */
  isDisabled?: boolean;
  /**
   * When false, a selected segment does NOT paint its own fill and border —
   * SegmentedControl sets this, because it slides one shared surface between
   * segments instead. The label's own colour is unchanged. Default true, so a
   * Segment used on its own still shows a selection.
   */
  hasSelectedSurface?: boolean;
  /**
   * An Icon or an avatar before the label. All the Icon's parameters are the
   * caller's; the avatar is `xs` (20px). Ignored while `isWarning` is on.
   */
  slotLeft?: ReactNode;
  /**
   * The label. Leave it out for a slot-only segment, and pass an `aria-label`.
   *
   * There is no counter: a segmented control's options are known before any
   * data arrives, so there is never a number to wait for (Daniel, 2026-09-30).
   * TabItem keeps its counter.
   */
  children?: ReactNode;
  className?: string;
}
