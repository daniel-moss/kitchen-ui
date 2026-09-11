import { CSSProperties, ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";

import useIsDesktop from "../../hooks/useIsDesktop";
import Hint from "./Hint";
import { HintProps, HintTongue, HintTongueAlignment } from "./Hint.types";

/** Where the hint sits relative to the trigger. */
export type HintPosition = "top" | "bottom" | "left" | "right";

interface HoverHintProps extends Pick<HintProps, "state" | "indicator" | "title" | "caption"> {
  /** The trigger — usually a HintTrigger. */
  children: ReactNode;
  /**
   * Free-slot content — the Hint's slot variant, replacing title/caption
   * (e.g. the FilterChip conflict hint's EmptyState). With `content` set the
   * desktop bubble becomes INTERACTIVE: it accepts the pointer, and hiding
   * gets a short grace period so the pointer can travel from the trigger
   * into the bubble (to reach a button inside).
   */
  content?: ReactNode;
  /** Hint side relative to the trigger. Default "top" (pops up on top). */
  position?: HintPosition;
  /**
   * How the hint aligns to the trigger along the other axis (which is also
   * where its tongue sits). Default "center".
   */
  align?: HintTongueAlignment;
  /** Bubble width. Default 320. */
  width?: number;
  /** "auto" (default) switches to the drawer on mobile — tap instead of hover. */
  breakpoint?: "auto" | "desktop" | "mobile";
  className?: string;
}

// the tongue sits on the side facing the trigger
const TONGUE_FOR_POSITION: Record<HintPosition, HintTongue> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

// The tongue is absolutely positioned (it does not grow the bubble box), so
// the body edge sits 10px from the trigger: ~6px tongue + 4px visual gap.
const GAP = 10;
// tongue center inset from the bubble corner: 12px padding + ~6px half-base
const TONGUE_INSET = 18;

// HoverHint — shows a Hint while hovering/focusing the trigger (desktop), in
// a body portal so no overflow ancestor clips it. On mobile the hint turns
// into a drawer, opened by tapping the trigger. See the Hint documentation.
export default function HoverHint({
  children,
  content,
  position = "top",
  align = "center",
  width = 320,
  breakpoint = "auto",
  state,
  indicator,
  title,
  caption,
  className,
}: HoverHintProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const ref = useRef<HTMLSpanElement>(null);
  // Touch devices emulate mouseenter on tap (and never end it) — hover-shows
  // only where hover is real.
  const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Interactive bubbles (`content`) hide on a short grace period, so the
  // pointer can cross the 10px gap into the bubble without closing it.
  const hideTimer = useRef<number | null>(null);
  const cancelHide = () => {
    if (hideTimer.current != null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const show = () => {
    cancelHide();
    const el = ref.current;
    if (el != null) setAnchor(el.getBoundingClientRect());
  };
  const hide = () => {
    cancelHide();
    setAnchor(null);
  };
  const hideSoon = () => {
    if (content == null) {
      hide();
      return;
    }
    cancelHide();
    hideTimer.current = window.setTimeout(() => setAnchor(null), 150);
  };
  // Keyboard focus only — a click also focuses, and on touch the hint would
  // stay stuck with no hover to end it.
  const showOnKeyboardFocus = (e: React.FocusEvent) => {
    if (e.target.matches(":focus-visible")) show();
  };

  // The bubble is fixed-positioned so that its tongue (at `align`, inset 18px
  // from the corner) points at the trigger's center.
  const bubbleStyle = (r: DOMRect): CSSProperties => {
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const style: CSSProperties = {
      position: "fixed",
      width,
      zIndex: "var(--z-tooltip)" as never,
      // A plain text hint never takes the pointer; an interactive one
      // (`content` — it can hold buttons) must.
      pointerEvents: content == null ? "none" : "auto",
    };
    if (position === "top" || position === "bottom") {
      style.left = align === "start" ? cx - TONGUE_INSET : align === "center" ? cx - width / 2 : cx + TONGUE_INSET - width;
      // Anchor with top + translateY(-100%), never `bottom: innerHeight - …`:
      // innerHeight does not always match the fixed-position viewport
      // (scrollbars, zoom), and browsers disagree — Chrome/Safari showed the
      // hint far above the trigger while Firefox looked right.
      if (position === "top") {
        style.top = r.top;
        style.transform = `translateY(calc(-100% - ${GAP}px))`;
      } else style.top = r.bottom + GAP;
    } else {
      style.top = align === "start" ? cy - TONGUE_INSET : cy;
      style.transform = align === "center" ? "translateY(-50%)" : align === "end" ? "translateY(calc(-100% + 18px))" : undefined;
      if (position === "left") style.left = r.left - width - GAP;
      else style.left = r.right + GAP;
    }
    return style;
  };

  // Mobile: tap opens the drawer instead (hover does not exist on touch).
  if (!isDesktop) {
    return (
      <span
        ref={ref}
        className={className}
        style={{ display: "inline-flex" }}
        // A scrim tap bubbles through the React portal back to this trigger —
        // without the guard the drawer closes and instantly reopens (the
        // "can't dismiss" iPad bug). Only an OPENING tap may set true.
        onClick={() => {
          if (!drawerOpen) setDrawerOpen(true);
        }}
      >
        {children}
        {drawerOpen &&
          (content != null ? (
            <Hint variant="drawer" state={state} onClose={() => setDrawerOpen(false)}>
              {content}
            </Hint>
          ) : (
            <Hint variant="drawer" state={state} indicator={indicator} title={title} caption={caption} onClose={() => setDrawerOpen(false)} />
          ))}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-flex" }}
      onMouseEnter={canHover ? show : undefined}
      onMouseLeave={canHover ? hideSoon : undefined}
      onFocus={showOnKeyboardFocus}
      onBlur={hide}
    >
      {children}
      {anchor != null &&
        createPortal(
          <div
            style={bubbleStyle(anchor)}
            // Keep an interactive bubble open while the pointer is inside it.
            onMouseEnter={content != null ? cancelHide : undefined}
            onMouseLeave={content != null ? hideSoon : undefined}
          >
            {content != null ? (
              <Hint state={state} tongue={TONGUE_FOR_POSITION[position]} tongueAlignment={align}>
                {content}
              </Hint>
            ) : (
              <Hint
                state={state}
                indicator={indicator}
                title={title}
                caption={caption}
                tongue={TONGUE_FOR_POSITION[position]}
                tongueAlignment={align}
              />
            )}
          </div>,
          document.body,
        )}
    </span>
  );
}
