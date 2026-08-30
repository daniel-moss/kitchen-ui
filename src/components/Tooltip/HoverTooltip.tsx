import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { AvatarGroupItem, AvatarGroupSize } from "../Avatar/AvatarGroup.types";
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
  /** Avatars (variant "avatarGroup") — a stack, like the Tooltip itself. */
  items?: AvatarGroupItem[];
  /** The avatar stack's size (variant "avatarGroup"). Default "xs". */
  avatarGroupSize?: AvatarGroupSize;
  /** Arbitrary tooltip content (variant "slot"). */
  content?: ReactNode;
  /** Max body width. Default 240 (the Tooltip default). */
  maxWidth?: number | string;
  /**
   * Use an element the CALLER owns as the trigger, instead of the wrapper span
   * this component renders by default. The tooltip then both listens on that
   * element and is measured against it, so it appears above / below it.
   *
   * For triggers that cannot take a wrapper — a table cell is a flex child
   * carrying its own width, so an `inline-flex` span around it would break the
   * row. Passing a ref also makes the WHOLE element the hover area, padding
   * included, rather than just the content inside it.
   */
  triggerRef?: RefObject<HTMLElement | null>;
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
  avatarGroupSize,
  content,
  maxWidth,
  tapToShow = false,
  triggerRef,
  children,
  className,
}: HoverTooltipProps) {
  const ownRef = useRef<HTMLSpanElement>(null);
  // The element the tooltip listens on and is measured against: the caller's
  // when `triggerRef` is set, otherwise the wrapper span below.
  const ref = (triggerRef ?? ownRef) as RefObject<HTMLElement | null>;
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

  // External trigger: React's onMouseEnter is not available on an element we do
  // not render, so the listeners go on directly. `mouseenter`/`mouseleave` are
  // the native non-bubbling pair, which is exactly the enter/leave semantics
  // React synthesises — moving between children never re-fires them.
  useEffect(() => {
    const el = triggerRef?.current;
    if (el == null || !canHover) return undefined;
    el.addEventListener("mouseenter", show);
    el.addEventListener("mouseleave", hide);
    return () => {
      el.removeEventListener("mouseenter", show);
      el.removeEventListener("mouseleave", hide);
    };
  });

  // Same marker the wrapper span sets, for a trigger we do not render.
  useEffect(() => {
    const el = triggerRef?.current;
    if (el == null) return undefined;
    if (pos != null) el.setAttribute("data-tooltip-open", "true");
    else el.removeAttribute("data-tooltip-open");
    return undefined;
  }, [triggerRef, pos]);

  const tip = pos && (
    createPortal(
      <span
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          // 8px = 4px gap + ~4px tongue protrusion → 4px between button and tongue tip.
          transform: `translate(${X_SHIFT[pos.align]}, ${pos.placement === "top" ? "calc(-100% - 8px)" : "8px"})`,
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        <Tooltip
          placement={pos.placement}
          align={pos.align}
          textAlign={textAlign}
          variant={variant}
          text={text}
          items={items}
          avatarGroupSize={avatarGroupSize}
          maxWidth={maxWidth}
        >
          {content}
        </Tooltip>
      </span>,
      document.body,
    )
  );

  // With a caller-owned trigger there is no wrapper to render — the children
  // are handed back untouched, so the trigger's own layout is never disturbed.
  if (triggerRef != null) {
    return (
      <>
        {children}
        {tip}
      </>
    );
  }

  return (
    <span
      ref={ownRef}
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
      {tip}
    </span>
  );
}
