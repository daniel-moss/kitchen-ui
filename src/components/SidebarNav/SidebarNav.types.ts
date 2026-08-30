import { ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";
import { WorkspaceItem } from "./SidebarNavWorkspaceButton.types";

export interface SidebarNavProps {
  // ---- header (sticks on top) ----
  /** The workspaces (the workspace button; single = non-interactive). */
  workspaces: WorkspaceItem[];
  workspaceValue?: string;
  defaultWorkspace?: string;
  onWorkspaceChange?: (id: string) => void;
  /** The user (the profile button + its menu header). */
  profileName: string;
  profileEmail?: string;
  profileAvatarSrc?: string;
  /** The profile menu content — MenuItemGroup elements. */
  profileMenu: ReactNode;

  // ---- search (rendered when onSearchClick is set) ----
  /** Opens the app's command panel. */
  onSearchClick?: () => void;
  /** Hot-key hint. Defaults per OS: "⌘K" on macOS, "Ctrl K" elsewhere. Display only. */
  searchHotKey?: string;

  // ---- content ----
  /** Top navigation — SidebarNavItem / SidebarNavItemGroup elements. */
  children: ReactNode;
  /** Bottom items pinned to the bottom (e.g. Help center, What's new). */
  bottomItems?: ReactNode;

  // ---- Create button (rendered when createMenu is set, at the TOP) ----
  /** The Create menu content — MenuItemGroup elements. */
  createMenu?: ReactNode;
  /** Hot-key hint on the Create button. Default "C". Display only. */
  createHotKey?: string;

  /**
   * The sidebar exists ONLY on desktop (> 1024px) — on mobile it renders
   * nothing (the BottomBarNav takes over). "auto" (default) follows the
   * viewport; also provided to everything inside via context.
   */
  breakpoint?: Breakpoint;
  className?: string;
}
