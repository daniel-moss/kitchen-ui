import { MouseEvent, ReactNode } from "react";

/**
 * SidebarNavItem type: `default` (a link with an icon and optional modifier),
 * `stackHeader` (opens/closes an item stack — NOT a link), `stackItem` (a
 * link inside a stack — no icon, label aligned with the default items').
 */
export type SidebarNavItemType = "default" | "stackHeader" | "stackItem";

interface SidebarNavItemBase {
  /** The label. Truncates with an ellipsis. */
  children: ReactNode;
  /** Holds the current page (strong colors; default/stackItem also fill). */
  active?: boolean;
  /**
   * Solid icon + strong label colors at REST, without a fill — the sidebar's
   * Create button adjustment (the doc: the default-state text and icon
   * differ from a regular item).
   */
  strong?: boolean;
  /** Hold the pressed fill — e.g. while a menu the item opened is showing. */
  isPressed?: boolean;
  isDisabled?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
}

/** Navigation types render a real link when `href` is set, a button otherwise. */
interface SidebarNavLinkBase extends SidebarNavItemBase {
  href?: string;
  target?: string;
  rel?: string;
}

export interface SidebarNavItemDefaultProps extends SidebarNavLinkBase {
  type?: "default";
  /** Icon name (16px box, 14px glyph; regular — solid when active). */
  icon: string;
  /** Right modifier: a hot-key hint (e.g. "⌘K"). Display only. */
  hotKey?: string;
  /** Right modifier: a notification dot. Ignored when `hotKey` is set. */
  notificationDot?: boolean;

  open?: never;
  defaultOpen?: never;
  onOpenChange?: never;
}

export interface SidebarNavItemStackHeaderProps extends SidebarNavItemBase {
  type: "stackHeader";
  /** Icon name (16px box, 14px glyph; regular — solid when active). */
  icon: string;
  /** The stack is expanded — the caret points down. Controlled or uncontrolled. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  href?: never;
  target?: never;
  rel?: never;
  hotKey?: never;
  notificationDot?: never;
}

export interface SidebarNavItemStackItemProps extends SidebarNavLinkBase {
  type: "stackItem";

  icon?: never;
  hotKey?: never;
  notificationDot?: never;
  open?: never;
  defaultOpen?: never;
  onOpenChange?: never;
}

export type SidebarNavItemProps =
  | SidebarNavItemDefaultProps
  | SidebarNavItemStackHeaderProps
  | SidebarNavItemStackItemProps;
