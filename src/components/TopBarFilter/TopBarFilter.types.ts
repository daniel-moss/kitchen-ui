import { MouseEvent, ReactNode } from "react";

import { FilterChipBreakpoint } from "./FilterChip.types";

export interface TopBarFilterProps {
  /**
   * The FilterChip elements. With no chips the bar renders nothing at all —
   * the bar only exists while there are applied filters.
   */
  children: ReactNode;
  /** Forwarded to the FilterChipGroup inside: content for the "Add filter" Menu. */
  addMenu?: ReactNode;
  /** Forwarded to the FilterChipGroup inside: a plain "Add filter" click handler. */
  onAddClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Forwarded to the FilterChipGroup inside: with `onAddClick`, keeps the
   * "Add filter" button pressed while the follow-up it opened is on screen.
   */
  addPressed?: boolean;
  /**
   * Renders the "Clear all" button in the right slot (standard views).
   * Removing all the filters — and with them the bar — is the consumer's
   * wiring: empty the chips in the handler. Never together with `onReset`;
   * when both are set, "Clear all" wins.
   */
  onClearAll?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Renders the "Reset" button in the right slot (views with fixed
   * filters, once the user has added their own filters). Never together with
   * `onClearAll`.
   */
  onReset?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * The bar exists ONLY on desktop — on mobile it renders nothing. "auto"
   * (default) tracks the viewport; "desktop" / "mobile" force one
   * (Storybook, tests).
   */
  breakpoint?: FilterChipBreakpoint;
  className?: string;
}
