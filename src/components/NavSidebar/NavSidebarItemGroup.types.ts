import { ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

export interface NavSidebarItemGroupProps {
  /** Header icon (the stack-header NavSidebarItem's icon). */
  icon: string;
  /** Header label. */
  label: ReactNode;
  /** Header shows the active (strong) look — e.g. the stack holds the current page. */
  headerActive?: boolean;
  /** The stack is expanded. Controlled or uncontrolled. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Disables the header (the stack can not be toggled). */
  isDisabled?: boolean;
  /** Forwarded to the header and to children without their own value. */
  breakpoint?: Breakpoint;
  /** The stack items (`NavSidebarItem type="stackItem"`). */
  children: ReactNode;
  className?: string;
}
