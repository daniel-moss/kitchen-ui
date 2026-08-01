import { ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";

/**
 * NavTopBar variant: `list` for object lists (table, cards), `details` for
 * object details pages.
 */
export type NavTopBarVariant = "list" | "details";

interface NavTopBarBase {
  /** The left side — a `NavTopBarLeftElements` assembly. */
  children: ReactNode;
  /**
   * The live-users stack on the right: up to 3 avatars on desktop / 2 on
   * mobile, a hover tooltip with all users (desktop), a tap-drawer (mobile).
   */
  liveUsers?: AvatarGroupItem[];
  /**
   * MOBILE only: the top row stays pinned (sticky), and the details tabs
   * row hides while scrolling down and returns on scrolling up (the doc's
   * YouTube-like rule). The bar sticks to the top of its nearest scrollable
   * ancestor.
   */
  hideOnScroll?: boolean;
  /** Desktop / mobile format. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  className?: string;
}

/** The list bar: right side = live users + optional search (desktop only) + create. */
export interface NavTopBarListProps extends NavTopBarBase {
  variant?: "list";
  /** DESKTOP only: the search (command panel) IconButton. Shown when set. */
  onSearch?: () => void;
  /** The create button — "New" Button on desktop, plus IconButton on mobile. */
  onCreate?: () => void;
  /** The desktop create button's label. Default "New". */
  createLabel?: string;

  tabs?: never;
}

/** The details bar: navigation tabs after the title; right side = live users only. */
export interface NavTopBarDetailsProps extends NavTopBarBase {
  variant: "details";
  /**
   * The navigation tabs — a `TabGroup` element. Desktop: inline after the
   * title, scrolling horizontally with an edge fade when space is tight.
   * Mobile: a second 52px bar row (remember: "Details" is the first tab).
   */
  tabs?: ReactNode;

  onSearch?: never;
  onCreate?: never;
  createLabel?: never;
}

export type NavTopBarProps = NavTopBarListProps | NavTopBarDetailsProps;
