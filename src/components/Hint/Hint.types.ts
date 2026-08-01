import { CSSProperties, ReactNode } from "react";

/** Indicator colors: info blue-9, success jade-9, warning amber-10, error tomato-9. */
export type HintState = "info" | "success" | "warning" | "error";

/** Which side of the bubble the tongue (arrow) sits on. */
export type HintTongue = "top" | "bottom" | "left" | "right";

/**
 * Where the tongue sits along its side: start/center/end map to
 * left/center/right (tongue on top or bottom) or top/center/bottom (tongue on
 * the left or right), always inset 12px from the corner.
 */
export type HintTongueAlignment = "start" | "center" | "end";

interface HintBaseProps {
  /** Indicator color. Default "info". */
  state?: HintState;
  /** The indicator bar is optional. Default true. */
  indicator?: boolean;
  /** Optional bold first line. */
  title?: ReactNode;
  /** The copy. */
  caption?: ReactNode;
  /**
   * Slot variant — replaces the whole text content (indicator included) with
   * any content, edge to edge (bring your own padding).
   */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export type HintProps =
  | (HintBaseProps & {
      /** inline = the floating bubble (desktop). Default. */
      variant?: "inline";
      /** Tongue side. Default "bottom" (the hint sits above its target). */
      tongue?: HintTongue;
      /** Tongue placement along the side. Default "center". */
      tongueAlignment?: HintTongueAlignment;
      open?: never;
      onClose?: never;
    })
  | (HintBaseProps & {
      /** drawer = the mobile bottom sheet ("usually, hint turns into a drawer on mobile"). */
      variant: "drawer";
      /** Controls the drawer enter/exit animation. Default true. */
      open?: boolean;
      /** Scrim tap / swipe-down dismiss. */
      onClose?: () => void;
      tongue?: never;
      tongueAlignment?: never;
    });
