import { ReactNode } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";

/**
 * TopBarNav variant: `list` for object lists (table, cards), `details` for
 * object details pages, `inner` for inner pages (back + title only).
 */
export type TopBarNavVariant = "list" | "details" | "inner";

interface TopBarNavBase {
  /** The left side — a `TopBarNavLeftElements` assembly. */
  children: ReactNode;
  /** Desktop / mobile format. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  className?: string;
}

/**
 * The list bar: title + optional phase tabs; right side = optional search
 * (desktop only) + optional create button. No live users on list pages.
 */
export interface TopBarNavListProps extends TopBarNavBase {
  variant?: "list";
  /**
   * The phase tabs — a `TabGroup` element (`default` / `lg` — the bar's
   * default size flows in via context). Optional. Scrolls with a 40px edge fade when
   * space is tight, on desktop and mobile.
   */
  tabs?: ReactNode;
  /** DESKTOP only: the "Object search" IconButton. Shown when set. */
  onSearch?: () => void;
  /** The create button — "New" Button on desktop, solid plus IconButton on mobile. */
  onCreate?: () => void;
  /** The desktop create button's label (and the mobile tooltip). Default "New". */
  createLabel?: string;

  liveUsers?: never;
}

/** The details bar: navigation tabs after the title; right side = live users. */
export interface TopBarNavDetailsProps extends TopBarNavBase {
  variant: "details";
  /**
   * The navigation tabs — a `TabGroup` element (`default` / `lg` — the bar's
   * default size flows in via context). Desktop: inline after the title, scrolling with a
   * 40px edge fade. Mobile: a second 60px bar row without the fade; the row
   * hides while scrolling down and returns on scrolling up.
   */
  tabs?: ReactNode;
  /**
   * The live-users stack on the right: up to 3 avatars on desktop / 2 on
   * mobile, a hover tooltip with all users (desktop), a tap-drawer (mobile).
   */
  liveUsers?: AvatarGroupItem[];

  onSearch?: never;
  onCreate?: never;
  createLabel?: never;
}

/** The inner bar: an optional back button + the title, nothing else. */
export interface TopBarNavInnerProps extends TopBarNavBase {
  variant: "inner";

  tabs?: never;
  liveUsers?: never;
  onSearch?: never;
  onCreate?: never;
  createLabel?: never;
}

export type TopBarNavProps = TopBarNavListProps | TopBarNavDetailsProps | TopBarNavInnerProps;
