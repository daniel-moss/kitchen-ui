import { createContext, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import clsx from "clsx";

import useMountTransition from "../../hooks/useMountTransition";
import useIsDesktop from "../../hooks/useIsDesktop";
import useEscapeKey from "../../hooks/useEscapeKey";
import useRestoreFocus from "../../hooks/useRestoreFocus";
import { withGroupDividers } from "../../utils/groupDividers";
import { moveMenuFocus } from "./menuKeyNav";
import Popover from "../Popover/Popover";
import ScrollArea from "../ScrollArea/ScrollArea";
import DrawerHeader from "../Popover/DrawerHeader";
import PopoverHeaderContent from "../Popover/PopoverHeaderContent";
import PopoverHeaderText from "../Popover/PopoverHeaderText";

import styles from "./Menu.module.scss";
import { MenuProps } from "./Menu.types";

// Card fade duration. Keep in sync with the transitions in Menu.module.scss.
const DURATION = 160;

// What a MenuItem needs from its Menu: which presentation is active, and (on
// mobile) how to open a sub-menu — the drawer content is swapped in place.
export interface MenuContextValue {
  isDesktop: boolean;
  pushSubMenu: (label: string, content: ReactNode) => void;
  /** Desktop: the ONE sub-menu currently allowed open (its trigger's id). On
   * touch there is no pointerleave to close the previous sub-menu, so opening
   * a sibling must close it via this shared marker. */
  activeSub: string | null;
  setActiveSub: (id: string | null) => void;
}
export const MenuContext = createContext<MenuContextValue | null>(null);

// Rules 4–5 (every group but the last gets a divider) are applied via the
// shared withGroupDividers helper (src/utils/groupDividers).

// Menu — a floating action menu built on Popover, holding MenuItemGroups.
// Desktop = an adaptive card (width fits the content, min 160 / max 384, max
// height 1000) shown 4px from its trigger; a MenuItem with `subMenu` opens a
// nested card on hover, 4px beside the item. Mobile = the Popover drawer; a
// sub-menu replaces the drawer content, with a back button and the trigger's
// label as the title. See Figma "Menu".
export default function Menu({
  children,
  open = true,
  onClose,
  title,
  header: rootHeader,
  breakpoint = "auto",
  className,
  style,
}: MenuProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const { mounted, visible } = useMountTransition(open, DURATION);

  // Mobile sub-menu stack. Designed for one level (back returns to the root),
  // but deeper nesting pops level by level.
  const [stack, setStack] = useState<{ label: string; content: ReactNode }[]>([]);
  const top = stack.length > 0 ? stack[stack.length - 1] : undefined;

  // A fresh open always starts at the root.
  useEffect(() => {
    if (open) setStack([]);
  }, [open]);

  const pushSubMenu = (label: string, content: ReactNode) => setStack((s) => [...s, { label, content }]);
  // Desktop sub-menu exclusivity (see MenuContextValue.activeSub).
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const popSubMenu = () => setStack((s) => s.slice(0, -1));

  // Escape closes the menu; focus returns to the trigger that opened it.
  useEscapeKey(open, onClose);
  useRestoreFocus(open);

  // Arrow keys (plus Home/End) walk the menu items, skipping disabled ones.
  // With nothing focused yet, ArrowDown enters at the top, ArrowUp at the bottom.
  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented) return;
    // Only the ROOT card handles this; a MenuItem sub-menu card (portaled to
    // body) owns its own keydown, so its items never reach here.
    if (moveMenuFocus(e.currentTarget, e.key)) e.preventDefault();
  };

  // Desktop: menus open by click, so focus moves into the card on open — that
  // is what lets the arrow keys reach the handler above.
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isDesktop && visible) cardRef.current?.focus({ preventScroll: true });
  }, [isDesktop, visible]);

  if (isDesktop) {
    if (!mounted) return null;
    return (
      <MenuContext.Provider value={{ isDesktop: true, pushSubMenu, activeSub, setActiveSub }}>
        <div
          ref={cardRef}
          role="menu"
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className={clsx(styles.card, visible && styles.cardOpen, className)}
          style={style}
        >
          <ScrollArea wrapperClassName={styles.body}>{withGroupDividers(children)}</ScrollArea>
        </div>
      </MenuContext.Provider>
    );
  }

  // Mobile drawer header: sub-menu = back + trigger label; root = the custom
  // `header` when given, else an optional title; without either, just the
  // drag handle.
  const headerText = top ? top.label : title;
  const header =
    top == null && rootHeader != null ? (
      rootHeader
    ) : headerText != null ? (
      <DrawerHeader back={top != null} onBack={popSubMenu}>
        <PopoverHeaderContent>
          <PopoverHeaderText variant="title" title={headerText} />
        </PopoverHeaderContent>
      </DrawerHeader>
    ) : (
      <DrawerHeader variant="dragHandle" />
    );

  return (
    <MenuContext.Provider value={{ isDesktop: false, pushSubMenu, activeSub, setActiveSub }}>
      <Popover drawer open={open} onClose={onClose} header={header} className={className} style={style}>
        <div role="menu" onKeyDown={handleMenuKeyDown}>
          {withGroupDividers(top ? top.content : children)}
        </div>
      </Popover>
    </MenuContext.Provider>
  );
}
