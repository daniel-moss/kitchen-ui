import { ReactNode, RefObject, useEffect, useRef } from "react";

import { AvatarGroupItem, AvatarGroupSize } from "../Avatar/AvatarGroup.types";
import { TooltipAlign, TooltipVariant } from "./Tooltip.types";
import useAnchoredTooltip from "./useAnchoredTooltip";

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
// text, an avatar stack, or a free slot. Placement comes from the shared
// `useAnchoredTooltip` hook: a <body> portal, pinned to the trigger's box,
// above it unless there is no room.
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
  const tip = useAnchoredTooltip({ variant, align, textAlign, text, items, avatarGroupSize, content, maxWidth });
  const tapMode = tapToShow && !canHover;

  const show = () => tip.show(ref.current);
  const hide = () => tip.hide();
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
    if (tip.isOpen) hide();
    else show();
  };
  // While a tapped tooltip is open, dismiss it on any outside tap or scroll (it
  // is pinned at show-time, so a scroll would otherwise leave it floating).
  useEffect(() => {
    if (!tapMode || !tip.isOpen) return undefined;
    const onDown = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) hide();
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", hide, true);
    };
  }, [tapMode, tip.isOpen]);

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
    if (tip.isOpen) el.setAttribute("data-tooltip-open", "true");
    else el.removeAttribute("data-tooltip-open");
    return undefined;
  }, [triggerRef, tip.isOpen]);

  // With a caller-owned trigger there is no wrapper to render — the children
  // are handed back untouched, so the trigger's own layout is never disturbed.
  if (triggerRef != null) {
    return (
      <>
        {children}
        {tip.node}
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
      data-tooltip-open={tip.isOpen ? "true" : undefined}
      onMouseEnter={canHover ? show : undefined}
      onMouseLeave={canHover ? hide : undefined}
      onClick={tapMode ? onTap : undefined}
      onFocus={showOnKeyboardFocus}
      onBlur={tapMode ? undefined : hide}
    >
      {children}
      {tip.node}
    </span>
  );
}
