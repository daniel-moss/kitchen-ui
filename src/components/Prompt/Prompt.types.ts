import { ReactNode } from "react";

import { IconPack } from "../Icon/Icon.types";

export type PromptBreakpoint = "auto" | "desktop" | "mobile";
export type PromptActionVariant = "solid" | "danger";

export interface PromptProps {
  /** Controls the open/close animation and mounting. */
  open: boolean;
  /** The heading. */
  title: string;
  /** The body — a sentence, or richer content. */
  body: ReactNode;

  /** Cancel button label. Default "Cancel". */
  cancelLabel?: string;
  /** Called when Cancel is pressed. The only dismissal besides the action. */
  onCancel: () => void;

  /** Primary (action) button label. */
  actionLabel: string;
  /** Called when the action button is pressed. */
  onAction: () => void;
  /** Action button style — solid (default) or danger (destructive). */
  actionVariant?: PromptActionVariant;
  /** Optional icon on the action button (e.g. "trash" on a delete confirm). */
  actionIcon?: string;
  /** Weight of the action icon. Default "regular". */
  actionIconPack?: IconPack;
  /** Which side of the label the icon sits on. Default "left". */
  actionIconPosition?: "left" | "right";
  /** Class on the action icon — e.g. to tint it (a warning icon amber). */
  actionIconClassName?: string;

  /**
   * "auto" (default) picks desktop ≥ 1024px, else mobile. Desktop is a centered
   * card; mobile is a bottom sheet. Non-dismissible in both.
   */
  breakpoint?: PromptBreakpoint;

  className?: string;
}
