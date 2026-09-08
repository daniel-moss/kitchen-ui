import { Children, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import IconButton from "../IconButton/IconButton";
import Menu from "../Menu/Menu";
import HoverTooltip from "../Tooltip/HoverTooltip";

import { FilterChipBreakpointContext } from "./FilterChipBreakpointContext";
import styles from "./FilterChipGroup.module.scss";
import { FilterChipGroupProps } from "./FilterChipGroup.types";

// FilterChipGroup — the container for the applied FilterChips. Desktop: a
// wrapping row with the "Add filter" IconButton (ghost/md, plus) after the
// chips; hovering the button shows an "Add filter" tooltip, clicking it opens
// the `addMenu` Menu 4px below (body-portaled with a measured fixed position,
// like SidebarNav's Create menu, so no overflow ancestor can clip it) and the
// button stays pressed while the Menu is open. Mobile: a column of full-width
// chips, no button. With no chips the group renders nothing. The resolved
// breakpoint flows to the chips inside via FilterChipBreakpointContext.
// See Figma: component 29561-14722, documentation 29561-14971.
export default function FilterChipGroup({
  children,
  addMenu,
  onAddClick,
  addPressed = false,
  breakpoint = "auto",
  className,
}: FilterChipGroupProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Measure while open (and on scroll/resize) so the card stays glued to the
  // button — 4px below, left edges aligned.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ left: rect.left, top: rect.bottom + 4 });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // Clicking outside the button + card closes the menu.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (wrapRef.current?.contains(target)) return;
      if (target.closest?.("[data-filter-chip-add-menu]") != null) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // No chips — no group.
  if (Children.toArray(children).length === 0) return null;

  return (
    <FilterChipBreakpointContext.Provider value={isDesktop ? "desktop" : "mobile"}>
      <div className={clsx(styles.group, !isDesktop && styles.groupMobile, className)}>
        {children}
        {isDesktop && (
          <span ref={wrapRef} className={styles.addWrap}>
            <HoverTooltip text="Add filter">
              <IconButton
                variant="ghost"
                size="md"
                icon="plus"
                aria-label="Add filter"
                isPressed={addMenu != null ? open : addPressed}
                onClick={addMenu != null ? () => setOpen(!open) : onAddClick}
              />
            </HoverTooltip>
            {addMenu != null &&
              pos != null &&
              createPortal(
                <div
                  data-filter-chip-add-menu
                  className={styles.addMenuCard}
                  style={{ left: pos.left, top: pos.top }}
                >
                  <Menu open={open} onClose={() => setOpen(false)} breakpoint="desktop">
                    {addMenu}
                  </Menu>
                </div>,
                document.body,
              )}
          </span>
        )}
      </div>
    </FilterChipBreakpointContext.Provider>
  );
}
