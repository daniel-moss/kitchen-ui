import { HTMLAttributes, ReactNode } from "react";

import { ChipSelectionMode } from "./ChipSelectionModeContext";

export interface ChipGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The Chips. They keep their own props — the group only lays them out, it
   * does not control which one is selected.
   */
  children: ReactNode;
  /**
   * Stretch mode (like TabGroup's): the chips stop hugging and share the
   * row's full width equally, and the row does not wrap. This is the mode for
   * a switcher — a small, fixed set of options that should read as one
   * control. Default false — a wrapping row of hug-width chips.
   */
  isFullWidth?: boolean;
  /**
   * How many chips can be selected at once. The group never owns the value
   * either way — this is what the chips ANNOUNCE, plus the keyboard behavior
   * that goes with it.
   *
   * **"multiple"** (default): each chip is a toggle button (`aria-pressed`)
   * and Tab stops on every one of them.
   *
   * **"single"**: the row becomes a radio group — each chip is
   * `role="radio"` with `aria-checked`, Tab stops on the row once (at the
   * selected chip, or the first one when none is selected), and the arrow
   * keys move between chips, clicking as they go so the selection follows the
   * focus. The consumer still sets each chip's `isSelected` from its
   * `onClick`.
   */
  selectionMode?: ChipSelectionMode;
  /** false → error state: the chips turn error and the error message shows. Default true. */
  isValid?: boolean;
  /**
   * Error message shown under the chips when invalid. Default: "Choose
   * [Label]", derived from the surrounding Input's string label. Label and
   * help text live on the Input wrapper — the group is bare.
   */
  errorMessage?: ReactNode;
  className?: string;
}
