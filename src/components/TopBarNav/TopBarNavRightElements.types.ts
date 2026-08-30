import { MouseEvent } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

export interface TopBarNavRightElementsProps {
  /**
   * DESKTOP only: the "Object search" IconButton (ghost `lg` / 36px, hover
   * tooltip). Mobile has no search in the top bar. Shown when set.
   */
  onSearch?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * The create button — desktop: a solid `lg` Button with a plus icon and the
   * label; mobile: a solid `lg` plus IconButton with the label as its hover
   * tooltip. Shown when set.
   */
  onCreate?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** The create button's label (and the mobile tooltip). Default "New". */
  createLabel?: string;
  /** Desktop / mobile format. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  className?: string;
}
