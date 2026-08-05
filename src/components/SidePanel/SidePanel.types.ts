import { ReactNode } from "react";

import { PopoverHeaderTextVariant } from "../Popover/PopoverHeaderText.types";

export type SidePanelBreakpoint = "auto" | "desktop" | "mobile";

/**
 * Body state. "content" shows the children. "error" (the data could not be
 * fetched) and "offline" (no internet) replace the body with an EmptyState and
 * hide the navigation and the footer; the action retries via `onRetry`.
 */
export type SidePanelState = "content" | "error" | "offline";

export interface SidePanelProps {
  /** Controls the open/close animation and mounting. */
  open: boolean;
  /** Called on any dismissal: the close button, the scrim, or Escape. */
  onClose: () => void;

  // ---- header ----
  // The header is a PopoverHeader, and SidePanel exposes everything it can do.

  /** The panel title (shown in the header). */
  title: string;
  /** Optional caption line under the title (single line, truncates). */
  caption?: string;
  /**
   * Header text layout: title only, title + caption, or caption above title.
   * Defaults to "titleCaption" when a `caption` is set, else "title".
   */
  titleVariant?: PopoverHeaderTextVariant;
  /** Extra class for the title line (e.g. a status colour). */
  titleClassName?: string;
  /** Title slots — left takes an Icon, right an Icon or a HintTrigger. */
  titleLeftSlot?: ReactNode;
  titleRightSlot?: ReactNode;
  /** Caption slots — an Icon (e.g. the object's icon). */
  captionLeftSlot?: ReactNode;
  captionRightSlot?: ReactNode;
  /** Left slot of the header row — an Avatar. Must be the xl (36px) size. */
  avatar?: ReactNode;
  /** Right slot of the header row — up to 2 IconButtons (md, ghost). */
  headerActions?: ReactNode;
  /** Show the close button. Default true. */
  close?: boolean;
  /** Show the divider under the header. Default true. */
  headerDivider?: boolean;

  /**
   * Shows the back arrow in the header and is called when it is pressed. A link
   * inside a side panel never opens a SECOND panel — it replaces the content of
   * this one. SidePanel does not hold that history: keep the stack in your own
   * state, swap `title` + `children`, and pass `onBack` while there is
   * something to go back to. Any number of levels is supported this way.
   */
  onBack?: () => void;

  /**
   * Optional navigation pinned under the header — a `SidePanelNavigation`.
   * Hidden in the error / offline states.
   */
  nav?: ReactNode;
  /**
   * Optional footer pinned to the bottom — a `PopoverFooter`. Hidden in the
   * error / offline states.
   */
  footer?: ReactNode;

  /** Body content — the only scrolling region (shown when state is "content"). */
  children: ReactNode;
  /**
   * Wrap the content in the standard content slot: `--size-4` (16px) padding on
   * every side and `--size-4` (16px) between items. These are only defaults —
   * set it to false and give your content its own spacing when the design asks
   * for something else (e.g. full-bleed rows). Default true.
   */
  bodyPadded?: boolean;

  /** Body state. Default "content". */
  state?: SidePanelState;
  /** Retry handler for the error / offline states (Reload / Try again). */
  onRetry?: () => void;

  /**
   * "auto" (default) picks desktop ≥ 1024px, else mobile. "desktop" / "mobile"
   * force one. Desktop is a 400px panel on the right with a 12px margin; mobile
   * fills the whole screen.
   */
  breakpoint?: SidePanelBreakpoint;

  className?: string;
}
