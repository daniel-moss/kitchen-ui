import { Breakpoint } from "../../hooks/useIsDesktop";

export interface WorkspaceItem {
  id: string;
  name: string;
  /** Workspace image. Without it the icon shows the name's first character. */
  imageSrc?: string;
}

export interface NavSidebarWorkspaceButtonProps {
  /** The workspaces. With a single one the button is NON-interactive (no states, no angles icon). */
  workspaces: WorkspaceItem[];
  /** Selected workspace id. Controlled or uncontrolled. */
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** The workspace list is open. Controlled or uncontrolled. The button stays pressed while open. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isDisabled?: boolean;
  /** Desktop = anchored select list; mobile = drawer. "auto" follows the viewport. */
  breakpoint?: Breakpoint;
  className?: string;
}
