import { ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

export interface NavSidebarProfileButtonProps {
  /** The user's name (the menu header title). */
  name: string;
  /** The user's e-mail (the menu header caption). */
  email?: string;
  /** Avatar image URL (defaults to the Avatar placeholder portrait). */
  avatarSrc?: string;
  /** The menu content — MenuItemGroup elements (Menu manages the dividers). */
  children: ReactNode;
  /** The menu is open. Controlled or uncontrolled. The button stays pressed while open. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isDisabled?: boolean;
  /** Desktop = anchored menu card; mobile = drawer. "auto" follows the viewport. */
  breakpoint?: Breakpoint;
  className?: string;
}
