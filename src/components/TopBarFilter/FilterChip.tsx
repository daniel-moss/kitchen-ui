import { MouseEvent as ReactMouseEvent, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import { Divider } from "../Divider/Divider";
import HoverHint from "../Hint/HoverHint";
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
// non-interactive, and in a LOCKED chip (`isLocked`) the "condition" box is
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
  isPressed = false,
  fill = false,
  warning = false,
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
    warning && styles.warning,
    onClick != null && styles.clickable,
    onClick != null && isPressed && styles.pressed,
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
  conditionPressed = false,
  value,
  valueSlotLeft,
  onValueClick,
  valueDisabled = false,
  valuePressed = false,
  isLocked = false,
  onRemove,
  removeDisabled = false,
  isWarning = false,
  propertyHint,
  propertyHintWidth = 384,
  breakpoint,
  className,
}: FilterChipProps) {
  // An enclosing FilterChipGroup hands its resolved breakpoint down through
  // context; the chip's own prop wins when set.
  const groupBreakpoint = useContext(FilterChipBreakpointContext);
  const isDesktop = useIsDesktop(breakpoint ?? groupBreakpoint ?? "auto");
  const bp = isDesktop ? "desktop" : "mobile";

  const propertyBox = (
    <FilterChipBox
      breakpoint={bp}
      // A warning chip draws the `warning` icon in the property slot ITSELF —
      // the Figma master's isWarning behavior (Daniel, 2026-09-10: the
      // master-level prop "helps to set a specific icon for the 'property'
      // box") — so the consumer's slotLeft is set aside while it warns.
      slotLeft={isWarning ? <Icon icon="warning" size={14} /> : slotLeft}
      warning={isWarning}
    >
      {property}
    </FilterChipBox>
  );

  return (
    <div className={clsx(styles.chip, !isDesktop && styles.chipMobile, className)}>
      {/* The conflict hint hangs off the "property" box — hover shows the
          bubble below it, a tap (mobile) opens the same content as a drawer
          (the design's annotation, section 14101-46526). The bubble width is
          the design's 384 "Max Width" pin. */}
      {propertyHint != null ? (
        <HoverHint position="bottom" align="center" width={propertyHintWidth} content={propertyHint} breakpoint={bp}>
          {propertyBox}
        </HoverHint>
      ) : (
        propertyBox
      )}
      <Divider orientation="vertical" contrast="medium" />
      {/* A chip whose filter has no condition renders without the box — the
          Figma `condition=false` variant (2026-09-09). No condition text = no
          box and no second divider. */}
      {condition != null && (
        <>
          <FilterChipBox
            breakpoint={bp}
            onClick={isLocked ? undefined : onConditionClick}
            disabled={conditionDisabled}
            isPressed={!isLocked && conditionPressed}
            warning={isWarning}
          >
            {condition}
          </FilterChipBox>
          <Divider orientation="vertical" contrast="medium" />
        </>
      )}
      <FilterChipBox
        breakpoint={bp}
        slotLeft={valueSlotLeft}
        fill={!isDesktop}
        onClick={onValueClick}
        disabled={valueDisabled}
        isPressed={valuePressed}
        warning={isWarning}
      >
        {value}
      </FilterChipBox>
      {!isLocked && (
        <>
          <Divider orientation="vertical" contrast="medium" />
          <FilterChipRemove breakpoint={bp} onClick={onRemove} disabled={removeDisabled} />
        </>
      )}
    </div>
  );
}
