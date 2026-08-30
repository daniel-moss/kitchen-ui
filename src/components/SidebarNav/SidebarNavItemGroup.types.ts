import { ReactNode } from "react";

export interface SidebarNavItemGroupProps {
  /** Header icon (the stack-header SidebarNavItem's icon). */
  icon: string;
  /** Header label. */
  label: ReactNode;
  /** Header shows the active (strong) look — e.g. the stack holds the current page. */
  headerActive?: boolean;
  /** The stack is expanded. Controlled or uncontrolled. */
  open?: boolean;
  /** Uncontrolled initial expanded state. */
  defaultOpen?: boolean;
  /** Called with the new expanded state. */
  onOpenChange?: (open: boolean) => void;
  /** Disables the header (the stack can not be toggled). */
  isDisabled?: boolean;
  /** The stack items (`SidebarNavItem type="stackItem"`). */
  children: ReactNode;
  className?: string;
}
