import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { AvatarGroupItem, AvatarGroupSize } from "../Avatar/AvatarGroup.types";
import Tooltip from "./Tooltip";
import { TooltipAlign, TooltipVariant } from "./Tooltip.types";
import styles from "./useAnchoredTooltip.module.scss";

// Tongue center ↔ tooltip edge distance for start/end: 8px inset + half of
// the 8px tongue (see Tooltip.module.scss).
const X_SHIFT: Record<TooltipAlign, string> = {
  start: "-12px",
  center: "-50%",
  end: "calc(-100% + 12px)",
};

// Keep-clear margin from the screen edges when re-anchoring.
const EDGE_MARGIN = 8;

/** Where the body is pinned, and how it is drawn from there. */
export interface AnchoredTooltipPosition {
  /** Viewport x the tongue points at — the trigger's horizontal center. */
  x: number;
  /** Viewport y of the trigger edge the tooltip sits against. */
  y: number;
  placement: "top" | "bottom";
  align: TooltipAlign;
}

export interface AnchoredTooltipConfig {
  /** Body content type. Default "text". */
  variant?: TooltipVariant;
  /**
   * Tongue position along the edge — the body extends the other way. Default
   * "center", which re-anchors itself at the screen edges.
   */
  align?: TooltipAlign;
  /** Text alignment inside the body (variant "text"). Default "center". */
  textAlign?: "center" | "left";
  /** Tooltip text (variant "text"). */
  text?: string;
  /** Avatars (variant "avatarGroup"). */
  items?: AvatarGroupItem[];
  /** The avatar stack's size (variant "avatarGroup"). Default "xs". */
  avatarGroupSize?: AvatarGroupSize;
  /** Arbitrary tooltip content (variant "slot"). */
  content?: ReactNode;
  /** Max body width. Default 240 (the Tooltip default). */
  maxWidth?: number | string;
}

/**
 * True when the element's content overflows AND is clipped — i.e. it really
 * shows an ellipsis or a line clamp. Horizontal (one line) and vertical (a
 * `-webkit-line-clamp`) both count.
 *
 * The clipping check matters: an overflow-visible box over-reports
 * `scrollWidth` without hiding anything (e.g. LinkButton's `::before` hit area
 * extends 8px past the button), which would read as "truncated" on every
 * hover.
 *
 * @param deep Also test descendants — for a trigger that WRAPS the clipped
 * element (a badge or LinkButton inside a value slot) instead of being it.
 */
export function isTextClipped(el: HTMLElement | null, { deep = false }: { deep?: boolean } = {}): boolean {
  if (el == null) return false;
  const nodes = deep ? [el, ...Array.from(el.querySelectorAll("*"))] : [el];
  return nodes.some((node) => {
    const { overflowX, overflowY } = getComputedStyle(node);
    const clips = (value: string) => value === "hidden" || value === "clip";
    // +1 absorbs sub-pixel layout rounding, which would otherwise report a
    // text that fits exactly as overflowing.
    return (
      (node.scrollWidth > node.clientWidth + 1 && clips(overflowX)) ||
      (node.scrollHeight > node.clientHeight + 1 && clips(overflowY))
    );
  });
}

/**
 * Positions a `Tooltip` against a trigger ELEMENT's box, in a `<body>` portal
 * so no ancestor's overflow can clip it. The single source of tooltip
 * placement in the DS — `HoverTooltip` and the truncation tooltips
 * (TruncatingText, ValueDisplay, FilterChip) all run through it.
 *
 * Placement is top, flipping to bottom when there is no room above; the tongue
 * points at the trigger's horizontal CENTER and re-anchors to start/end near a
 * screen edge so the body grows inward.
 *
 * NOT cursor-aligned, on purpose (Daniel, 2026-10-04): production builds
 * tooltips on Radix Primitives, whose Tooltip is positioned from the trigger's
 * box and has no cursor anchor — a tooltip that follows the pointer could not
 * be rebuilt there.
 *
 * The caller owns the events: call `show(el)` on enter/focus and `hide()` on
 * leave/blur, and render `node`.
 */
export default function useAnchoredTooltip({
  variant = "text",
  align = "center",
  textAlign = "center",
  text,
  items,
  avatarGroupSize,
  content,
  maxWidth,
}: AnchoredTooltipConfig = {}) {
  const [pos, setPos] = useState<AnchoredTooltipPosition | null>(null);
  const bodyRef = useRef<HTMLSpanElement>(null);

  /** Pin the tooltip to `el`'s box. A missing element shows nothing. */
  const show = (el: HTMLElement | null) => {
    if (el == null) return;
    const r = el.getBoundingClientRect();
    // Rich tooltips are taller than a text line — keep a larger flip margin.
    const room = variant === "text" ? 56 : 160;
    const placement: "top" | "bottom" = r.top < room ? "bottom" : "top";
    setPos({
      x: r.left + r.width / 2,
      y: placement === "top" ? r.top : r.bottom,
      placement,
      align,
    });
  };

  const hide = () => setPos(null);

  // Re-anchor AFTER the first paint, from the body's real width: a centered
  // tooltip that overflows a screen edge moves its tongue to the near side so
  // the body grows inward. Runs once per show — `align` only ever leaves
  // "center", so it cannot oscillate. It used to guess with `maxWidth / 2`,
  // i.e. 120px for every tooltip, which re-anchored a 50px "Copy" tooltip that
  // had ample room (Daniel, 2026-09-28).
  useLayoutEffect(() => {
    if (pos == null || pos.align !== "center") return;
    const el = bodyRef.current;
    if (el == null) return;
    const r = el.getBoundingClientRect();
    const next: TooltipAlign | null =
      r.left < EDGE_MARGIN ? "start" : r.right > window.innerWidth - EDGE_MARGIN ? "end" : null;
    if (next != null) setPos((prev) => (prev == null ? prev : { ...prev, align: next }));
  }, [pos]);

  const node =
    pos &&
    createPortal(
      <span
        ref={bodyRef}
        className={styles.anchor}
        style={{
          left: pos.x,
          top: pos.y,
          // Keeps the Tooltip's own clamp, so long text wraps instead of
          // stretching the intrinsic width the class sets (Daniel, 2026-09-28).
          maxWidth: maxWidth ?? 240,
          // 8px = 4px gap + ~4px tongue protrusion → 4px between trigger and tongue tip.
          transform: `translate(${X_SHIFT[pos.align]}, ${pos.placement === "top" ? "calc(-100% - 8px)" : "8px"})`,
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
    );

  return { isOpen: pos != null, show, hide, node };
}
