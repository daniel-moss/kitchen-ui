import { ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";

/**
 * The page's top navigation bar. Everything in it is a slot, so one component
 * builds the bar of an object list, of an object details page and of an inner
 * page — what changes is what is put in the slots.
 */
export interface TopBarNavProps {
  /** The left side — a `TopBarNavLeftElements` assembly holding the title. */
  children: ReactNode;
  /**
   * The phase tabs — a `TabGroup` element (`default` / `lg` — the bar's
   * default size flows in through context). They sit beside the title on
   * desktop and on mobile alike, and scroll with a 40px edge fade when space
   * is tight. Open / Closed, Active / Inactive — not page navigation.
   */
  tabs?: ReactNode;
  /**
   * The live users — everyone on the page except the current user. They sit
   * beside the title, in the same place the tabs would. One user renders an
   * AvatarLive, two or more an AvatarGroup (`xl`).
   */
  liveUsers?: AvatarGroupItem[];
  /**
   * The actions at the right end — one to three buttons of any kind, 8px
   * apart. They act on the page as a whole. A list page passes
   * `TopBarNavRightElements`, which composes the search and create buttons
   * with their breakpoint rules; anything else passes its own buttons.
   */
  actions?: ReactNode;
  /**
   * While the page is still fetching what the bar names: the title becomes a
   * placeholder, and the avatar, the live users, the tabs and the actions are
   * not drawn at all. The back button stays — the user must be able to leave a
   * page that has not finished loading. Default false.
   */
  isLoading?: boolean;
  /** Desktop / mobile format. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  className?: string;
}
