import { CSSProperties, MouseEvent as ReactMouseEvent, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import { Divider } from "../Divider/Divider";
import HoverHint from "../Hint/HoverHint";
import { Icon } from "../Icon/Icon";
import HoverTooltip from "../Tooltip/HoverTooltip";
import Tooltip from "../Tooltip/Tooltip";

import { FilterChipOrientationContext } from "./FilterChipOrientationContext";
import styles from "./FilterChip.module.scss";
import { FilterChipBoxProps, FilterChipProps, FilterChipRemoveProps } from "./FilterChip.types";

// FilterChip — one applied filter as a 'name – operator – value' expression
// plus a "remove" box, the boxes separated by vertical Dividers (high
// contrast, inset 8px top and bottom). Interactivity is per box: a box with a
// click handler is a <button> (usually opening a SelectList / Dialog — the
// CONSUMER's wiring), a box without one is a plain <div>. The "name" box is
// always non-interactive, and in a LOCKED chip (`isLocked`) the "operator" box
// is non-interactive too — `onOperatorClick` is ignored there.
//
// See Figma: component 29552-11955, parts 29544-9456, documentation
// 29552-12681. Rebuilt 2026-09-17: the chip is a `--gray-a2` body in a 1px
// `--gray-a6` inner ring (no card, no shadow), every interactive box carries
// the chevron, and the two boxes at the chip's right end take its radius. The
// boxes were renamed with the Figma component — "property" → "name",
// "condition" → "operator".
//
// 2026-09-18: the chip has ONE size — 36px boxes with 12px side paddings, a
// 36px "remove" box — and no `breakpoint`. What used to be the mobile
// presentation is now the enclosing FilterChipGroup's `orientation`: in a
// VERTICAL group the chip fills the row, the "value" box takes the slack and
// no box has a max width.

// One content box. Text truncates with an ellipsis (a horizontal group caps
// each box at 240px; in a vertical group the "value" box fills and truncates)
// — when it actually truncates, hovering THE BOX shows a tooltip with the full
// value. Same mechanics as TruncatingText (measure on enter, cursor-following
// X, body portal), but the hover area is the whole box, not just the text span.
// Hover is the only trigger, and only on devices that have one — on touch a
// tap would otherwise pin the tooltip open (and also click the box).
export function FilterChipBox({
  orientation = "horizontal",
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
    orientation === "vertical" && styles.boxVertical,
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
      {/* The chevron marks a box that opens a list, so it belongs to
          `isClickable` and nothing else decides it (the Figma part draws it
          inside `#️⃣ isClickable`). `flex: none` keeps it out of the ellipsis:
          the text shrinks, the glyph never does — so a truncated value still
          shows what it can do. */}
      {onClick != null && (
        <span className={styles.chevron}>
          <Icon icon="angle-down" pack="solid" size={10} />
        </span>
      )}
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
export function FilterChipRemove({ onClick, disabled = false, className, style }: FilterChipRemoveProps) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <HoverTooltip text="Remove" triggerRef={ref}>
      <button
        ref={ref}
        type="button"
        className={clsx(styles.remove, className)}
        style={style}
        onClick={onClick}
        disabled={disabled}
        aria-label="Remove"
      >
        <Icon icon="xmark" size={12} />
      </button>
    </HoverTooltip>
  );
}

export default function FilterChip({
  name,
  slotLeft,
  operator,
  onOperatorClick,
  operatorDisabled = false,
  operatorPressed = false,
  value,
  valueSlotLeft,
  onValueClick,
  valueDisabled = false,
  valuePressed = false,
  isLocked = false,
  onRemove,
  removeDisabled = false,
  isWarning = false,
  nameHint,
  nameHintWidth = 384,
  nameHintBreakpoint = "auto",
  orientation,
  className,
}: FilterChipProps) {
  // An enclosing FilterChipGroup publishes its orientation through context;
  // the chip's own prop wins when set, and a chip outside a group is
  // horizontal.
  const groupOrientation = useContext(FilterChipOrientationContext);
  const dir = orientation ?? groupOrientation ?? "horizontal";
  const isVertical = dir === "vertical";

  // Every divider in the chip is the same: high contrast, inset 8px from the
  // top and bottom so the line stops short of the chip's ring instead of
  // meeting it in a T-junction.
  const divider = <Divider orientation="vertical" contrast="high" padding="var(--size-2) 0" />;

  // In a VERTICAL group the "name" and "operator" boxes may take at most an
  // EQUAL SHARE of the width the content boxes have between them — the chip
  // minus the 1px dividers and the 36px remove box (Daniel, 2026-09-25: on a
  // 343px chip that is (343 − 36 − 3) / 3 = 101.33px each). The value box is
  // exempt; it fills whatever the other two leave.
  //
  // The share has to be computed HERE because only the chip knows which parts
  // it drew: a locked chip has no remove box and one divider fewer, and a
  // filter with no operator has one box and one divider fewer again. CSS
  // cannot see that, so the chip hands the answer down as a custom property.
  const boxCount = operator != null ? 3 : 2;
  const dividerCount = 1 + (operator != null ? 1 : 0) + (isLocked ? 0 : 1);
  const chipStyle = isVertical
    ? ({
        "--fc-box-max": `calc((100% - ${dividerCount}px${isLocked ? "" : " - var(--size-9)"}) / ${boxCount})`,
      } as CSSProperties)
    : undefined;

  const nameBox = (
    <FilterChipBox
      orientation={dir}
      // A warning chip draws the SOLID `warning` icon in the name slot ITSELF
      // — the Figma master's isWarning behavior — so the consumer's slotLeft
      // is set aside while it warns.
      slotLeft={isWarning ? <Icon icon="warning" pack="solid" size={14} /> : slotLeft}
      warning={isWarning}
    >
      {name}
    </FilterChipBox>
  );

  return (
    <div
      className={clsx(styles.chip, isVertical && styles.chipVertical, isWarning && styles.chipWarning, className)}
      style={chipStyle}
    >
      {/* The conflict hint hangs off the "name" box — hover shows the bubble
          below it, a tap (mobile) opens the same content as a drawer. The
          bubble width defaults to the conflict design's 384 "Max Width" pin.
          The Hint follows the VIEWPORT, not the group's orientation:
          hover-or-tap is a pointer question. `nameHintBreakpoint` forces it
          for Storybook and tests. */}
      {nameHint != null ? (
        <HoverHint
          position="bottom"
          align="center"
          width={nameHintWidth}
          content={nameHint}
          breakpoint={nameHintBreakpoint}
        >
          {nameBox}
        </HoverHint>
      ) : (
        nameBox
      )}
      {divider}
      {/* A chip whose filter has no operator renders without the box — the
          Figma `operator=false` variant. No operator text = no box and no
          second divider. */}
      {operator != null && (
        <>
          <FilterChipBox
            orientation={dir}
            onClick={isLocked ? undefined : onOperatorClick}
            disabled={operatorDisabled}
            isPressed={!isLocked && operatorPressed}
            warning={isWarning}
          >
            {operator}
          </FilterChipBox>
          {divider}
        </>
      )}
      <FilterChipBox
        orientation={dir}
        slotLeft={valueSlotLeft}
        fill={isVertical}
        onClick={onValueClick}
        disabled={valueDisabled}
        isPressed={valuePressed}
        warning={isWarning}
      >
        {value}
      </FilterChipBox>
      {!isLocked && (
        <>
          {divider}
          <FilterChipRemove onClick={onRemove} disabled={removeDisabled} />
        </>
      )}
    </div>
  );
}
