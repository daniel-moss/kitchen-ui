import { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

/** Chip sizes (px): sm 28, md 32, lg 36. */
export type ChipSize = "sm" | "md" | "lg";

export interface ChipProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "disabled" | "onClick" | "aria-pressed" | "aria-busy" | "aria-disabled"
  > {
  /**
   * sm = `--size-7` (28px), md = `--size-8` (32px), lg = `--size-9` (36px).
   * Default "md".
   */
  size?: ChipSize;
  /**
   * Selected look — the chip is the currently applied option: the 1px border
   * becomes `--gray-12` instead of `--gray-a7`, and the label / icon stay
   * `--text-strong` in every state. Also sets `aria-pressed`, so pass it
   * (true/false) on chips that work as toggles. (RENAMED from `active`,
   * 2026-09-06 — matches the Figma axis and the DS's selection vocabulary.)
   */
  isSelected?: boolean;
  /**
   * Left slot — an Icon (size 14; every icon parameter is the caller's) or ANY
   * avatar. The avatar size is fixed per chip size: **xxs (16px)** in `sm`,
   * **xs (20px)** in `md` and `lg`. An Icon with no color of its own follows
   * the label color; an Icon the caller colored keeps that color.
   */
  slotLeft?: ReactNode;
  /**
   * Set false when the chip's value fails validation: `--tomato-a2` fill, a
   * 2px `--tomato-9` border and `--text-error` label (a default-colored Icon
   * follows). The error look REPLACES the selection emphasis — an invalid
   * chip renders the same whether or not it is `active` — and persists
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
