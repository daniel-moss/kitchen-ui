import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import Tooltip from "./Tooltip";
import { TooltipAlign, TooltipVariant } from "./Tooltip.types";

// Tongue center ↔ tooltip edge distance for start/end: 8px inset + half of
// the 8px tongue (see Tooltip.module.scss).
const X_SHIFT: Record<TooltipAlign, string> = {
  start: "-12px",
  center: "-50%",
  end: "calc(-100% + 12px)",
};

interface HoverTooltipProps {
  /** Body content type. Default "text". */
  variant?: TooltipVariant;
  /**
   * Tongue position along the edge — the body extends the other way. Use
   * "end" near the right screen edge so the body grows leftwards. Default
   * "center".
   */
  align?: TooltipAlign;
  /** Text alignment inside the body (variant "text"). Default "center". */
  textAlign?: "center" | "left";
  /**
   * Touch devices have no hover, so the tooltip normally can't appear. Set this
   * for triggers where a tap SHOULD reveal it (e.g. a HintTrigger info icon):
   * tapping toggles it, tapping elsewhere or scrolling dismisses it. The tap is
   * swallowed so it doesn't also activate an enclosing control (e.g. a radio).
   */
  tapToShow?: boolean;
  /** Tooltip text (variant "text"). */
  text?: string;
  /** Avatars (variant "avatarGroup") — an xs stack, like the Tooltip itself. */
  items?: AvatarGroupItem[];
  /** Arbitrary tooltip content (variant "slot"). */
  content?: ReactNode;
  /** Max body width. Default 240 (the Tooltip default). */
  maxWidth?: number | string;
  /** The trigger. */
  children: ReactNode;
  className?: string;
}

// Shows a Tooltip while hovering/focusing the trigger — any Tooltip content:
// text, an avatar stack, or a free slot. Rendered in a portal to <body> so it
// sits above everything and is never clipped by an ancestor's overflow.
// Placement top, flips to bottom when there isn't room above.
export default function HoverTooltip({
  variant = "text",
  align = "center",
  textAlign = "center",
  text,
  items,
  content,
  maxWidth,
  tapToShow = false,
  children,
  className,
}: HoverTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Touch devices emulate mouseenter on tap (and never end it) — a tooltip is
  // a hover affordance, so on touch it simply does not exist.
  const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  const [pos, setPos] = useState<{ x: number; y: number; placement: "top" | "bottom"; align: TooltipAlign } | null>(
    null,
  );
  const tapMode = tapToShow && !canHover;

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Rich tooltips are taller than a text line — keep a larger flip margin.
    const room = variant === "text" ? 56 : 160;
    const placement: "top" | "bottom" = r.top < room ? "bottom" : "top";
    const cx = r.left + r.width / 2;
    // Horizontal: a centered body near a screen edge would overflow it (the
    // "Bill to client" hint touched the left edge). If so, re-anchor the tongue
    // to the near side so the body grows inward: "start" (tongue left, body
    // extends right) at the left edge, "end" (tongue right, body extends left)
    // at the right edge. Uses maxWidth as a conservative half-width estimate.
    const halfW = (typeof maxWidth === "number" ? maxWidth : 240) / 2;
    const M = 8;
    let effAlign = align;
    if (align === "center") {
      if (cx - halfW < M) effAlign = "start";
      else if (cx + halfW > window.innerWidth - M) effAlign = "end";
    }
    setPos({ x: cx, y: placement === "top" ? r.top : r.bottom, placement, align: effAlign });
  };
  const hide = () => setPos(null);
  // Keyboard focus only — a click/tap also focuses the trigger, and on touch
  // that used to leave the tooltip stuck with no hover to end it.
  const showOnKeyboardFocus = (e: React.FocusEvent) => {
    if (e.target.matches(":focus-visible")) show();
  };

  // Tap mode (touch, tapToShow): a tap toggles the tooltip and is swallowed so
  // it doesn't activate an enclosing control (e.g. select a radio option).
  const onTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pos) hide();
    else show();
  };
  // While a tapped tooltip is open, dismiss it on any outside tap or scroll (it
  // is pinned at show-time, so a scroll would otherwise leave it floating).
  useEffect(() => {
    if (!tapMode || pos == null) return undefined;
    const onDown = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) hide();
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", hide, true);
    };
  }, [tapMode, pos]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-flex" }}
      // Marks the trigger while the tooltip is open — a HintTrigger inside reads
      // this to show its active (hover-color) state even on touch, where :hover
      // never fires.
      data-tooltip-open={pos != null ? "true" : undefined}
      onMouseEnter={canHover ? show : undefined}
      onMouseLeave={canHover ? hide : undefined}
      onClick={tapMode ? onTap : undefined}
      onFocus={showOnKeyboardFocus}
      onBlur={tapMode ? undefined : hide}
    >
      {children}
      {pos &&
        createPortal(
          <span
            style={{
              position: "fixed",
              left: pos.x,
              top: pos.y,
              // 8px = 4px gap + ~4px tongue protrusion → 4px between button and tongue tip.
              transform: `translate(${X_SHIFT[pos.align]}, ${
                pos.placement === "top" ? "calc(-100% - 8px)" : "8px"
              })`,
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            <Tooltip placement={pos.placement} align={pos.align} textAlign={textAlign} variant={variant} text={text} items={items} maxWidth={maxWidth}>
              {content}
            </Tooltip>
          </span>,
          document.body,
        )}
    </span>
  );
}
