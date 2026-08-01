import { CSSProperties, ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

export interface MenuProps {
  /**
   * The MenuItemGroup elements. Menu manages their dividers automatically:
   * every group gets one except the last (rules 4–5) — the groups' own
   * `divider` props are overridden.
   */
  children: ReactNode;
  /**
   * Controls the enter/exit animation, like Popover: keep the Menu mounted
   * and flip this. Default true.
   */
  open?: boolean;
  /** Mobile: called when the drawer is dismissed (scrim tap / swipe down). */
  onClose?: () => void;
  /**
   * Mobile root title, shown in the drawer header. Optional — without it the
   * root drawer shows only the drag handle. (A sub-menu always shows a title —
   * the label of the MenuItem that opened it — plus a back button.)
   */
  title?: string;
  /**
   * Mobile: a custom ROOT drawer header (a DrawerHeader element), replacing
   * the title-based one — e.g. the profile button's avatar + name + email.
   * Sub-menu headers still take over while a sub-menu is open.
   */
  header?: ReactNode;
  /** Presentation: auto (viewport) / desktop / mobile. Default "auto". */
  breakpoint?: Breakpoint;
  className?: string;
  style?: CSSProperties;
}
