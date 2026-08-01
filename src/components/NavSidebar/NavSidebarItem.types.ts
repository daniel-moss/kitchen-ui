import { MouseEvent, ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

/**
 * NavSidebarItem type: `default` (a link with an icon and optional modifier),
 * `stackHeader` (opens/closes an item stack — NOT a link), `stackItem` (a
 * link inside a stack — no icon, label aligned with the default items').
 */
export type NavSidebarItemType = "default" | "stackHeader" | "stackItem";

interface NavSidebarItemBase {
  /** The label. Truncates with an ellipsis. */
  children: ReactNode;
  /** Holds the current page (strong colors; default/stackItem also fill). */
  active?: boolean;
  /**
   * Strong icon + label colors at REST, without a fill and keeping the
   * regular icon weight — the sidebar's Create button adjustment (the doc:
   * "Text and icon colour on default state are different").
   */
  strong?: boolean;
  /** Hold the pressed fill — e.g. while a menu the item opened is showing. */
  isPressed?: boolean;
  isDisabled?: boolean;
  /** Desktop 32px / mobile 36px row. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
}

/** Navigation types render a real link when `href` is set, a button otherwise. */
interface NavSidebarLinkBase extends NavSidebarItemBase {
  href?: string;
  target?: string;
  rel?: string;
}

export interface NavSidebarItemDefaultProps extends NavSidebarLinkBase {
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

export interface NavSidebarItemStackHeaderProps extends NavSidebarItemBase {
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

export interface NavSidebarItemStackItemProps extends NavSidebarLinkBase {
  type: "stackItem";

  icon?: never;
  hotKey?: never;
  notificationDot?: never;
  open?: never;
  defaultOpen?: never;
  onOpenChange?: never;
}

export type NavSidebarItemProps =
  | NavSidebarItemDefaultProps
  | NavSidebarItemStackHeaderProps
  | NavSidebarItemStackItemProps;
