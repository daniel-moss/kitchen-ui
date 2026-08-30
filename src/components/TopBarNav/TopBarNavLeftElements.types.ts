import { MouseEvent, ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

export interface TopBarNavLeftElementsProps {
  /** The title assembly — a `TopBarNavTitle` element. */
  children: ReactNode;
  /**
   * Left slot: the back IconButton (`arrow-left`, ghost `lg` / 36px, 8px from
   * the title, hover tooltip "Back"). Shown when set.
   */
  onBack?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Right slot content: the context-menu items (MenuItemGroup elements).
   * When set, the ellipsis IconButton shows and TopBarNav OWNS the menu:
   * desktop = a Menu card 4px below the button, left-aligned; mobile = a
   * Menu drawer whose header repeats the page title and its avatar. The
   * button holds its pressed look while the menu is open.
   */
  contextMenu?: ReactNode;
  /**
   * ESCAPE HATCH — report-only ellipsis click, for consumers wiring their
   * own menu. Ignored when `contextMenu` is set. Prefer `contextMenu`.
   */
  onActions?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** With `onActions`: the button shows its pressed look — e.g. while the consumer's menu is open. */
  actionsPressed?: boolean;
  /** Desktop / mobile format for the context menu. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  className?: string;
}
