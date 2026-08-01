import { MouseEvent } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";

export interface NavTopBarRightElementsProps {
  /** Live collaborators — the live-users stack: up to 3 avatars on desktop
   * / 2 on mobile, a hover tooltip with ALL users (desktop) and a tap-drawer
   * (mobile). */
  avatars?: AvatarGroupItem[];
  /**
   * DESKTOP only: the search IconButton (32 ghost). Mobile has no search in
   * the top bar. Shown when set.
   */
  onSearch?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * The create button — desktop: a solid md Button with a plus icon and the
   * label; mobile: a solid md plus IconButton. Shown when set.
   */
  onCreate?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** The desktop create button's label. Default "New". */
  createLabel?: string;
  /** Desktop / mobile format. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  className?: string;
}
