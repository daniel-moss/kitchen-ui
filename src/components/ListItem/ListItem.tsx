import { Children, KeyboardEvent, MouseEvent, PointerEvent as ReactPointerEvent, ReactNode, isValidElement, useEffect, useRef } from "react";
import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import { isRowDragActive } from "../../utils/dragLock";
import { Icon } from "../Icon/Icon";
import { Divider } from "../Divider/Divider";
import ToggleSwitch from "../Toggle/ToggleSwitch";
import switchStyles from "../Toggle/ToggleSwitch.module.scss";
import ListItemBody from "./ListItemBody";

import styles from "./ListItem.module.scss";
import { ListItemProps } from "./ListItem.types";

// Only clicks on INTERACTIVE slot instances stay inside the slot — a click
// on a static instance (ListItemSlotIcon, an avatar) belongs to the row (the
// open chevron must activate it). Keep in sync with $slot-interactive in
// ListItem.module.scss.
const INTERACTIVE = 'button, a, input, select, textarea, [role="button"], [role="switch"]';

const stopIfInteractive = (e: MouseEvent) => {
  const hit = (e.target as Element).closest(INTERACTIVE);
  if (hit != null && (e.currentTarget as Element).contains(hit)) e.stopPropagation();
};

// Figma's ListItem doc: a TabGroup or an input in the right slot OWNS the
// interaction, so the row itself must stay non-clickable. TypeScript cannot
// look inside a ReactNode, so the rule is checked at runtime and reported in
// the console — the slot's element name is matched against this list.
const CONTROLS_BLOCKING_CLICK = ["TabGroup", "TextField", "TextArea", "SelectField", "DateField", "SearchField", "PasswordField", "OTPField"];

const elementName = (node: ReactNode): string | null => {
  if (!isValidElement(node)) return null;
  const type = node.type as string | { displayName?: string; name?: string };
  return typeof type === "string" ? null : (type.displayName ?? type.name ?? null);
};

const blockingControlIn = (slotRight: ReactNode): string | null => {
  for (const child of Children.toArray(slotRight)) {
    const name = elementName(child);
    if (name != null && CONTROLS_BLOCKING_CLICK.includes(name)) return name;
  }
  return null;
};

// Touch taps activate rows from the POINTER event, not the click: iOS groups
// two quick taps near each other and dispatches the synthesized click on the
// FIRST target — tapping two adjacent rows toggled the first one twice. The
// pointer events always carry the true target. After a pointer-activation,
// the synthesized click that follows is swallowed GLOBALLY (it may land on a
// different row — that is exactly the bug).
let suppressClicksUntil = 0;

// ItemGroup calls this when a row drag ends: the release must not read as
// a tap (the row would toggle) — see the long-press drag start in the group.
export const suppressListItemTaps = (ms = 700) => {
  suppressClicksUntil = Date.now() + ms;
};

// ListItem — a list row: the body (content + optional right slot) with an
// optional bottom slot (one full-width instance) 8px below. Variants: static
// (default, no states); draggable (grip handle, consumer-driven dragging
// state); clickable (row button with hover / press / focus states — slot
// clicks don't trigger it; `toggle` makes the whole row an on/off switch);
// accordion (collapsible header + body below a divider, like DisplayModule).
// See Figma "ListItem".
export default function ListItem({
  slotBottom,
  slotRight,
  isDraggable,
  isDragging = false,
  isClickable,
  onClick,
  toggle,
  checked,
  defaultChecked = false,
  onCheckedChange,
  toggleDisabled = false,
  isAccordion,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  disabled = false,
  className,
  ...bodyProps
}: ListItemProps) {
  const [isChecked, setChecked] = useControllableState(checked, defaultChecked, onCheckedChange);
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);

  // See CONTROLS_BLOCKING_CLICK above — the one rule the types cannot carry.
  const blocking = isClickable === true ? blockingControlIn(slotRight) : null;
  useEffect(() => {
    if (blocking != null) {
      console.warn(`ListItem: a row with a ${blocking} in slotRight must not be clickable — the control owns the interaction. Drop \`isClickable\`.`);
    }
  }, [blocking]);

  const handleActivate = (e: MouseEvent<HTMLDivElement>) => {
    if (isAccordion) {
      setOpen(!isOpen);
      return;
    }
    if (toggle && toggleDisabled) return; // the switch is off-limits
    if (toggle) setChecked(!isChecked);
    onClick?.(e);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate(e as unknown as MouseEvent<HTMLDivElement>);
    }
  };

  // Touch path (see suppressClicksUntil above): a touch tap — down + up on
  // the row without real movement, outside the slots — activates on
  // pointerup; the synthesized click afterwards is ignored everywhere.
  const touchStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const handleRowPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") touchStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const handleRowPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    // Releasing a row drag (started by long-press, so down + up can both be
    // on the row with no movement) is not a tap.
    if (isRowDragActive()) {
      touchStart.current = null;
      return;
    }
    const start = touchStart.current;
    touchStart.current = null;
    if (start == null || start.id !== e.pointerId) return;
    if (Math.abs(e.clientX - start.x) > 10 || Math.abs(e.clientY - start.y) > 10) return; // a scroll/drag, not a tap
    const target = e.target as Element;
    // A tap inside a slot only stays there when it hit an INTERACTIVE
    // instance — static ones (chevron, avatar) activate the row.
    const slot = target.closest(`.${styles.slotStop}, .${styles.slotBottom}`);
    if (slot != null) {
      const hit = target.closest(INTERACTIVE);
      if (hit != null && slot.contains(hit)) return;
    }
    suppressClicksUntil = Date.now() + 700;
    handleActivate(e as unknown as MouseEvent<HTMLDivElement>);
  };
  const handleRowClick = (e: MouseEvent<HTMLDivElement>) => {
    if (Date.now() < suppressClicksUntil) return; // already handled on pointerup
    handleActivate(e);
  };

  // Toggle rows show the switch visual at the end of the right slot (the
  // whole row is the control); other slot instances render before it, with
  // their clicks stopped. On clickable / accordion rows, the consumer's right
  // slot is wrapped so its clicks don't trigger the row.
  const effectiveSlotRight = toggle ? (
    <>
      {slotRight != null && (
        <span className={styles.slotStop} onClick={stopIfInteractive}>
          {slotRight}
        </span>
      )}
      <ToggleSwitch checked={isChecked} dimmed={toggleDisabled} interactive={!toggleDisabled} />
    </>
  ) : (isClickable || isAccordion) && slotRight != null ? (
    <span className={styles.slotStop} onClick={stopIfInteractive}>
      {slotRight}
    </span>
  ) : (
    slotRight
  );

  const main = (
    <div className={styles.main}>
      <ListItemBody {...bodyProps} slotRight={effectiveSlotRight} />
      {slotBottom != null && (
        <div className={styles.slotBottom} onClick={isClickable || isAccordion ? stopIfInteractive : undefined}>
          {slotBottom}
        </div>
      )}
    </div>
  );

  // ---- accordion — collapsible header + body below a divider ----
  if (isAccordion) {
    return (
      <div className={clsx(styles.item, styles.accordion, isOpen && styles.accordionOpen, className)}>
        <div
          className={clsx(styles.accordionHeader, disabled && styles.disabled)}
          role="button"
          tabIndex={disabled ? undefined : 0}
          aria-expanded={isOpen}
          aria-disabled={disabled || undefined}
          onClick={disabled ? undefined : handleActivate}
          onKeyDown={disabled ? undefined : handleKeyDown}
        >
          <span className={clsx(styles.caret, isOpen && styles.caretOpen)} aria-hidden="true">
            <Icon icon="caret-down" pack="solid" size={14} />
          </span>
          {main}
        </div>
        <div className={clsx(styles.collapse, isOpen && styles.collapseOpen)}>
          <div className={styles.collapseInner}>
            <Divider />
            <div className={styles.accordionBody}>{children}</div>
          </div>
        </div>
      </div>
    );
  }

  const interactive = isClickable && !disabled;

  return (
    <div
      className={clsx(
        styles.item,
        isClickable && styles.clickable,
        toggle && switchStyles.control, // row hover/press drive the switch visual
        isDragging && styles.dragging,
        disabled && styles.disabled,
        className,
      )}
      role={isClickable ? (toggle ? "switch" : "button") : undefined}
      aria-checked={toggle ? isChecked : undefined}
      aria-disabled={(isClickable && disabled) || (toggle && toggleDisabled) || undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? handleRowClick : undefined}
      onPointerDown={interactive ? handleRowPointerDown : undefined}
      onPointerUp={interactive ? handleRowPointerUp : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {isDraggable && (
        <span className={styles.handle} data-listitem-handle="" aria-hidden="true">
          <Icon icon={isDragging ? "arrows-up-down" : "grip-dots-vertical"} pack="regular" size={14} container="square" />
        </span>
      )}
      {main}
    </div>
  );
}
