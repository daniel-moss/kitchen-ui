import { cloneElement, isValidElement, KeyboardEvent, MouseEvent, PointerEvent as ReactPointerEvent, ReactElement, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import useMountTransition from "../../hooks/useMountTransition";
import useIsDesktop from "../../hooks/useIsDesktop";
import useControllableState from "../../hooks/useControllableState";
import { Icon } from "../Icon/Icon";
import ToggleSwitch from "../Toggle/ToggleSwitch";
import switchStyles from "../Toggle/ToggleSwitch.module.scss";
import { MenuContext } from "./Menu";
import { moveMenuFocus } from "./menuKeyNav";
import { withGroupDividers } from "../../utils/groupDividers";
import menuStyles from "./Menu.module.scss";

import styles from "./MenuItem.module.scss";
import { MenuItemProps } from "./MenuItem.types";

// Sub-menu gap to its trigger + hover-close grace period.
const SUB_MENU_GAP = 4;
const SUB_MENU_MARGIN = 8; // min gap the sub-menu keeps from the screen edges
const SUB_CLOSE_DELAY = 150;
const SUB_DURATION = 160; // matches the Menu card transition

// MenuItem — an action row in a dropdown / context menu. `[slotLeft] title
// [tag] [slotRight]` with an optional caption below the title. `danger` turns
// the copy + left icon into error tones (destructive actions, no right slot).
// `toggle` makes the whole row an on/off switch — clicking anywhere flips the
// ToggleSwitch on the right. `subMenu` makes the row a sub-menu trigger:
// desktop opens a nested Menu card on hover (4px beside the item); on mobile,
// inside a Menu, tapping swaps the drawer content. Row states: hover / press /
// focus (gray or tomato tints) / disabled. See Figma "MenuItem".
export default function MenuItem({
  label,
  caption,
  tag,
  slotLeft,
  slotRight,
  toggle,
  checked,
  defaultChecked = false,
  onCheckedChange,
  subMenu,
  subMenuTitle,
  danger = false,
  disabled = false,
  className,
  onClick,
  ...rest
}: MenuItemProps) {
  const menuCtx = useContext(MenuContext);
  const autoDesktop = useIsDesktop();
  // Inside a Menu the presentation follows the Menu (it can be forced via its
  // breakpoint prop); standalone falls back to the viewport.
  const isDesktop = menuCtx ? menuCtx.isDesktop : autoDesktop;

  const [isChecked, setChecked] = useControllableState(checked, defaultChecked, onCheckedChange);

  // ---- desktop sub-menu (hover) ----
  const hasSub = subMenu != null;
  const rootRef = useRef<HTMLDivElement>(null);
  const subCardRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  // Set when the sub-menu is opened via the keyboard (RightArrow/Enter) so its
  // first item gets focused once it mounts — a hover-open leaves it false.
  const focusFirstSub = useRef(false);
  const [subOpen, setSubOpen] = useState(false);
  const [subPos, setSubPos] = useState<{ left: number; top: number } | null>(null);
  // One sub-menu at a time (found on iPad, 2026-07-22): touch has no
  // pointerleave, so a previously opened sibling sub-menu would stay on screen
  // (with its trigger highlighted). The Menu tracks the active sub-trigger;
  // when another one claims it, this one closes itself.
  const subId = useId();
  const ctxActiveSub = menuCtx?.activeSub;
  useEffect(() => {
    if (menuCtx == null || !subOpen) return;
    if (ctxActiveSub !== subId) setSubOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxActiveSub]);
  const { mounted: subMounted, visible: subVisible } = useMountTransition(subOpen, SUB_DURATION);

  useEffect(() => {
    if (subVisible && focusFirstSub.current) {
      focusFirstSub.current = false;
      subCardRef.current?.querySelector<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"]),[role="menuitemcheckbox"]:not([aria-disabled="true"])',
      )?.focus();
    }
  }, [subVisible]);

  // Keep the sub-menu on-screen: it prefers the right of the trigger, top-aligned,
  // but flips to the LEFT when it would overflow the right edge and shifts UP when
  // it would overflow the bottom (so a low trigger — e.g. Pricebook near the
  // screen bottom — stays fully reachable). Measured after mount, before paint;
  // offsetWidth/Height are used so the open-transition transform doesn't skew it.
  useLayoutEffect(() => {
    if (!subOpen) return;
    const trigger = rootRef.current;
    const card = subCardRef.current;
    if (trigger == null || card == null) return;
    const t = trigger.getBoundingClientRect();
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = t.right + SUB_MENU_GAP;
    if (left + cw > vw - SUB_MENU_MARGIN) {
      const flipped = t.left - SUB_MENU_GAP - cw;
      left = flipped >= SUB_MENU_MARGIN ? flipped : Math.max(SUB_MENU_MARGIN, vw - SUB_MENU_MARGIN - cw);
    }
    let top = t.top;
    if (top + ch > vh - SUB_MENU_MARGIN) top = vh - SUB_MENU_MARGIN - ch;
    if (top < SUB_MENU_MARGIN) top = SUB_MENU_MARGIN;

    setSubPos((prev) => (prev != null && prev.left === left && prev.top === top ? prev : { left, top }));
  }, [subMounted, subOpen]);

  const cancelSubClose = () => window.clearTimeout(closeTimer.current);
  // Touch guards (found on iPad, 2026-07-22): a TAP emits pointerenter →
  // opens the sub-menu, then the synthetic pointer LEAVES right after the tap
  // → pointerleave schedules the close, so the sub-menu opens and instantly
  // closes. Hover open/close must ignore touch pointers entirely; a tap
  // TOGGLES via click instead (see handleActivate).
  const hoverOpenSub = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    openSub();
  };
  const hoverCancelClose = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    cancelSubClose();
  };
  const hoverScheduleClose = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    scheduleSubClose();
  };
  const openSub = () => {
    cancelSubClose();
    // Already open: keep the on-screen position the layout effect computed. Re-
    // seeding subPos here (openSub can fire again as the pointer travels from the
    // trigger into a shifted-up sub-menu) would snap it back to the raw, possibly
    // off-screen spot, and the effect wouldn't re-run since subOpen didn't change.
    if (subOpen) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) setSubPos({ left: rect.right + SUB_MENU_GAP, top: rect.top });
    setSubOpen(true);
    menuCtx?.setActiveSub(subId); // closes any sibling sub-menu
  };
  // Grace period so the pointer can travel from the item into the sub-menu.
  const scheduleSubClose = () => {
    cancelSubClose();
    closeTimer.current = window.setTimeout(() => setSubOpen(false), SUB_CLOSE_DELAY);
  };

  const handleActivate = (e: MouseEvent<HTMLDivElement>) => {
    if (hasSub) {
      if (isDesktop) {
        // Toggle so a TOUCH tap can close an open sub-menu (hover close is
        // disabled for touch). Mouse users open by hover, so a click on an
        // already-open trigger toggling shut only affects touch in practice.
        if (subOpen) setSubOpen(false);
        else openSub();
      } else {
        // The drawer title: subMenuTitle when given (e.g. "Create job"),
        // else the trigger's label — labels of sub-menu triggers should be
        // strings.
        menuCtx?.pushSubMenu(subMenuTitle ?? (typeof label === "string" ? label : ""), subMenu);
      }
      return; // a sub-menu trigger performs no action of its own
    }
    if (toggle) setChecked(!isChecked);
    onClick?.(e);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      focusFirstSub.current = hasSub && isDesktop; // Enter on a sub-trigger dives in
      handleActivate(e as unknown as MouseEvent<HTMLDivElement>);
      return;
    }
    // RightArrow opens a desktop sub-menu and moves focus into it.
    if (e.key === "ArrowRight" && hasSub && isDesktop) {
      e.preventDefault();
      focusFirstSub.current = true;
      openSub();
    }
  };

  // Inside an open sub-menu card: arrows walk its items; LeftArrow closes it and
  // returns focus to this trigger. (Escape is left to the Menu's global handler,
  // which closes the whole menu.)
  const handleSubKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      setSubOpen(false);
      rootRef.current?.focus();
      return;
    }
    if (moveMenuFocus(e.currentTarget, e.key)) e.preventDefault();
  };

  return (
    <div
      ref={rootRef}
      role={toggle ? "menuitemcheckbox" : "menuitem"}
      aria-checked={toggle ? isChecked : undefined}
      aria-haspopup={hasSub ? "menu" : undefined}
      aria-expanded={hasSub ? subOpen : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? undefined : 0}
      className={clsx(
        styles.item,
        toggle && switchStyles.control, // row hover/press drive the switch visual
        danger && styles.danger,
        disabled && styles.disabled,
        hasSub && subOpen && styles.subOpen, // stay highlighted while the sub-menu shows
        className,
      )}
      onClick={disabled ? undefined : handleActivate}
      onKeyDown={disabled ? undefined : handleKeyDown}
      onPointerEnter={hasSub && isDesktop && !disabled ? hoverOpenSub : undefined}
      onPointerLeave={hasSub && isDesktop && !disabled ? hoverScheduleClose : undefined}
      {...rest}
    >
      {/* A bare Icon in the left slot is forced into the SQUARE container so
          the slot is the same size whatever glyph is used (Daniel, 2026-07-22). */}
      {slotLeft != null && (
        <span className={styles.slotLeft}>
          {isValidElement(slotLeft) && slotLeft.type === Icon
            ? cloneElement(slotLeft as ReactElement<{ container?: string }>, { container: "square" })
            : slotLeft}
        </span>
      )}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{label}</span>
          {tag != null && <span className={styles.tag}>{tag}</span>}
        </div>
        {caption != null && <span className={styles.caption}>{caption}</span>}
      </div>
      {toggle ? (
        <span className={styles.slotRight}>
          <ToggleSwitch checked={isChecked} />
        </span>
      ) : hasSub ? (
        <span className={styles.slotRight}>
          <Icon icon="angle-right" pack="regular" size={14} container="square" />
        </span>
      ) : (
        slotRight != null && (
          <span className={styles.slotRight} onClick={(e: MouseEvent) => e.stopPropagation()}>
            {slotRight}
          </span>
        )
      )}
      {/* Desktop sub-menu: a nested Menu card, portaled to the body so the
          parent menu's scroll/overflow can't clip it. */}
      {hasSub &&
        isDesktop &&
        subMounted &&
        subPos != null &&
        createPortal(
          <div
            ref={subCardRef}
            role="menu"
            className={clsx(menuStyles.card, subVisible && menuStyles.cardOpen, menuStyles.subCard)}
            style={{ left: subPos.left, top: subPos.top }}
            onPointerEnter={hoverCancelClose}
            onPointerLeave={hoverScheduleClose}
            onKeyDown={handleSubKeyDown}
          >
            <div className={menuStyles.body}>{withGroupDividers(subMenu)}</div>
          </div>,
          document.body,
        )}
    </div>
  );
}
