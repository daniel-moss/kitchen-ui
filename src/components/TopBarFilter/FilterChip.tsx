import { MouseEvent as ReactMouseEvent, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import { Divider } from "../Divider/Divider";
import { Icon } from "../Icon/Icon";
import HoverTooltip from "../Tooltip/HoverTooltip";
import Tooltip from "../Tooltip/Tooltip";

import { FilterChipBreakpointContext } from "./FilterChipBreakpointContext";
import styles from "./FilterChip.module.scss";
import { FilterChipBoxProps, FilterChipProps, FilterChipRemoveProps } from "./FilterChip.types";

// FilterChip — one applied filter as a 'property – condition – value'
// expression plus a "remove" box, the boxes separated by vertical Dividers
// (medium contrast). Interactivity is per box: a box with a click handler is
// a <button> (usually opening a SelectList / Dialog — the CONSUMER's wiring),
// a box without one is a plain <div>. The "property" box is always
// non-interactive, and in a FIXED chip (`isFixed`) the "condition" box is
// non-interactive too (the doc's rule, 2026-08-28) — `onConditionClick` is
// ignored there. See Figma: component 29552-11955, parts 29544-9456,
// documentation 29552-12681.

// One content box. Text truncates with an ellipsis (desktop caps each box at
// 240px; the mobile "value" box fills and truncates) — when it actually
// truncates, hovering THE BOX shows a tooltip with the full value. Same
// mechanics as TruncatingText (measure on enter, cursor-following X, body
// portal), but the hover area is the whole box, not just the text span.
// Hover is the only trigger, and only on devices that have one — on touch a
// tap would otherwise pin the tooltip open (and also click the box).
export function FilterChipBox({
  breakpoint = "desktop",
  slotLeft,
  onClick,
  disabled = false,
  fill = false,
  className,
  style,
  children,
}: FilterChipBoxProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  const track = (e: ReactMouseEvent) => {
    setTip({ x: e.clientX, y: e.currentTarget.getBoundingClientRect().top });
  };
  const handleEnter = (e: ReactMouseEvent) => {
    const el = textRef.current;
    if (el && el.scrollWidth > el.clientWidth) track(e);
  };
  const handleMove = (e: ReactMouseEvent) => {
    if (tip) track(e);
  };
  const hoverHandlers = canHover
    ? { onMouseEnter: handleEnter, onMouseMove: handleMove, onMouseLeave: () => setTip(null) }
    : {};

  const cls = clsx(
    styles.box,
    breakpoint === "mobile" && styles.boxMobile,
    fill && styles.fill,
    onClick != null && styles.clickable,
    className,
  );
  const content = (
    <>
      {slotLeft != null && <span className={styles.slot}>{slotLeft}</span>}
      <span ref={textRef} className={styles.copy}>
        {children}
      </span>
      {tip != null &&
        createPortal(
          <span className={styles.tooltipOverlay} style={{ left: tip.x, top: tip.y }}>
            <Tooltip placement="top" align="center" textAlign="left" text={children} />
          </span>,
          document.body,
        )}
    </>
  );

  if (onClick == null) {
    return (
      <div className={cls} style={style} {...hoverHandlers}>
        {content}
      </div>
    );
  }
  return (
    <button type="button" className={cls} style={style} onClick={onClick} disabled={disabled} {...hoverHandlers}>
      {content}
    </button>
  );
}

// The "remove" box: a fixed-width button with the xmark. Hovering it shows a
// "Remove" tooltip (hover is the only trigger, so touch devices simply don't
// get it; a disabled button fires no mouse events, so no tooltip either).
export function FilterChipRemove({
  breakpoint = "desktop",
  onClick,
  disabled = false,
  className,
  style,
}: FilterChipRemoveProps) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <HoverTooltip text="Remove" triggerRef={ref}>
      <button
        ref={ref}
        type="button"
        className={clsx(styles.remove, breakpoint === "mobile" && styles.removeMobile, className)}
        style={style}
        onClick={onClick}
        disabled={disabled}
        aria-label="Remove"
      >
        <Icon icon="xmark" size={14} />
      </button>
    </HoverTooltip>
  );
}

export default function FilterChip({
  property,
  slotLeft,
  condition,
  onConditionClick,
  conditionDisabled = false,
  value,
  onValueClick,
  valueDisabled = false,
  isFixed = false,
  onRemove,
  removeDisabled = false,
  breakpoint,
  className,
}: FilterChipProps) {
  // An enclosing FilterChipGroup hands its resolved breakpoint down through
  // context; the chip's own prop wins when set.
  const groupBreakpoint = useContext(FilterChipBreakpointContext);
  const isDesktop = useIsDesktop(breakpoint ?? groupBreakpoint ?? "auto");
  const bp = isDesktop ? "desktop" : "mobile";

  return (
    <div className={clsx(styles.chip, !isDesktop && styles.chipMobile, className)}>
      <FilterChipBox breakpoint={bp} slotLeft={slotLeft}>
        {property}
      </FilterChipBox>
      <Divider orientation="vertical" contrast="medium" />
      <FilterChipBox breakpoint={bp} onClick={isFixed ? undefined : onConditionClick} disabled={conditionDisabled}>
        {condition}
      </FilterChipBox>
      <Divider orientation="vertical" contrast="medium" />
      <FilterChipBox breakpoint={bp} fill={!isDesktop} onClick={onValueClick} disabled={valueDisabled}>
        {value}
      </FilterChipBox>
      {!isFixed && (
        <>
          <Divider orientation="vertical" contrast="medium" />
          <FilterChipRemove breakpoint={bp} onClick={onRemove} disabled={removeDisabled} />
        </>
      )}
    </div>
  );
}
