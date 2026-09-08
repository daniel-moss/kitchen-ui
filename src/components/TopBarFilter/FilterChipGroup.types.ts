import { MouseEvent, ReactNode } from "react";

import { FilterChipBreakpoint } from "./FilterChip.types";

export interface FilterChipGroupProps {
  /**
   * The FilterChip elements. With no chips the group renders nothing at all —
   * a group only exists while there are filters.
   */
  children: ReactNode;
  /**
   * Content for the "Add filter" Menu — MenuItemGroup elements. Clicking the
   * "Add filter" IconButton opens the Menu 4px below it, left edges aligned,
   * and the button stays pressed while the Menu is open. The button itself is
   * always there on desktop (and never on mobile).
   */
  addMenu?: ReactNode;
  /**
   * Alternative to `addMenu`: a plain click handler for the "Add filter"
   * button, for a follow-up that is not a Menu (e.g. a Dialog). Ignored when
   * `addMenu` is set.
   */
  onAddClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * With `onAddClick`: keeps the "Add filter" button pressed while the
   * follow-up it opened is on screen — set it to that follow-up's open state.
   * The built-in `addMenu` holds the button pressed by itself.
   */
  addPressed?: boolean;
  /**
   * Presentation. Desktop: a wrapping row, chips `--size-2` (8px) apart on
   * both axes, the "Add filter" IconButton after the chips. Mobile: a column
   * of full-width chips, 8px apart, no button. The resolved value is handed
   * to the chips inside through context, so they follow the group. Default
   * "auto".
   */
  breakpoint?: FilterChipBreakpoint;
  className?: string;
}
