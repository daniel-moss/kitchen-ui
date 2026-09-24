import { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

/** Chip sizes (px): sm 28, md 32, lg 36. */
export type ChipSize = "sm" | "md" | "lg";

/** Chip layouts: slot and label in one line, or the slot stacked above it. */
export type ChipOrientation = "horizontal" | "vertical";

export interface ChipProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "disabled" | "onClick" | "aria-pressed" | "aria-checked" | "aria-busy" | "aria-disabled"
  > {
  /**
   * sm = `--size-7` (28px), md = `--size-8` (32px), lg = `--size-9` (36px).
   * The label is `caption-medium-400` (13/20) in sm and `body-400-compact`
   * (14/20) in md and lg. Default "md".
   *
   * `vertical` chips have ONE size and ignore this — see `orientation`.
   */
  size?: ChipSize;
  /**
   * Layout. **"horizontal"** (default) puts the slot and the label in one
   * line and the chip keeps its fixed height.
   *
   * **"vertical"** stacks them — the slot on top, the label under it, both
   * centered — and the chip hugs its content instead (64px with any slot).
   * It has one size: `--size-3` (12px) top, `--size-2_5` (10px) sides,
   * `--size-2` (8px) bottom, `--size-1` (4px) between slot and label, and
   * `size` no longer applies. A vertical chip ALWAYS needs a `slotLeft` —
   * without one it is only a taller horizontal chip.
   */
  orientation?: ChipOrientation;
  /**
   * Selected look — the chip is the currently applied option: the 1px border
   * becomes `--gray-12` instead of `--gray-a7`, and the label / icon stay
   * `--text-strong` in every state. Also sets `aria-pressed` — or
   * `aria-checked`, inside a ChipGroup with `selectionMode="single"` — so
   * pass it (true/false) on chips that work as toggles. (RENAMED from
   * `active`, 2026-09-06 — matches the Figma axis and the DS's selection
   * vocabulary.)
   */
  isSelected?: boolean;
  /**
   * Left slot — an Icon (size 14; every icon parameter is the caller's) or ANY
   * avatar. The avatar size is fixed per chip size: **xxs (16px)** in `sm`,
   * **xs (20px)** in `md` and `lg`. An Icon with no color of its own follows
   * the label color; an Icon the caller colored keeps that color.
   *
   * In the VERTICAL layout the slot sits on top instead, in a fixed 20×20
   * box — so an icon chip and an avatar chip are exactly the same height.
   */
  slotLeft?: ReactNode;
  /**
   * Set false when the chip's value fails validation: `--tomato-a2` fill, a
   * 2px `--tomato-9` border and `--text-error` label (a default-colored Icon
   * follows). The error look REPLACES the selection emphasis — an invalid
   * chip renders the same whether or not it is selected — and persists
   * through hover, press and focus. A disabled invalid chip keeps the error
   * scheme, dimmed. Default true.
   */
  isValid?: boolean;
  /**
   * Loading skeleton: a bar instead of the label, and a `--gray-a3` circle
   * instead of the left slot (if one is set). The chip is not interactive.
   */
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** The label text. */
  children?: ReactNode;
}
