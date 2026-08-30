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
// label as the title. `header` adds a MenuHeader (search bar) above the items
// on both presentations — Figma's Menu `header=true`. See Figma "Menu".
export default function Menu({
  children,
  open = true,
  onClose,
  title,
  drawerHeader: customDrawerHeader,
  header,
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
  //
  // WITH a header the card must NOT take focus: the MenuHeader focuses its own
  // search input on mount, and the card's focus lands a tick later (it waits
  // for `visible`), so it would steal the caret straight back. Nothing is lost
  // — the input sits inside the card, so its keydowns still bubble to the
  // handler above and the arrow keys keep walking the items, exactly as they do
  // from SelectList's search.
  const hasHeader = header != null;
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isDesktop && visible && !hasHeader) cardRef.current?.focus({ preventScroll: true });
  }, [isDesktop, visible, hasHeader]);

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
          {/* The MenuHeader, sticky above the scrolling items — the card is a
              flex column, so it must not shrink (see .header). */}
          {header != null && <div className={styles.header}>{header}</div>}
          <ScrollArea wrapperClassName={styles.body}>{withGroupDividers(children)}</ScrollArea>
        </div>
      </MenuContext.Provider>
    );
  }

  // Mobile drawer header: sub-menu = back + trigger label; root = the custom
  // `drawerHeader` when given, else an optional title; without either, just the
  // drag handle.
  const headerText = top ? top.label : title;
  const titleHeader =
    top == null && customDrawerHeader != null ? (
      customDrawerHeader
    ) : headerText != null ? (
      <DrawerHeader back={top != null} onBack={popSubMenu}>
        <PopoverHeaderContent>
          <PopoverHeaderText variant="title" title={headerText} />
        </PopoverHeaderContent>
      </DrawerHeader>
    ) : (
      <DrawerHeader variant="dragHandle" />
    );
  // The MenuHeader goes in the drawer's sticky header region, UNDER the title —
  // the order the node draws (DrawerHeader, then MenuHeader, then the body).
  // Root level only, so a sub-menu drawer shows just its back + title header.
  const showHeader = hasHeader && top == null;
  const sheetHeader = showHeader ? (
    <>
      {titleHeader}
      {header}
    </>
  ) : (
    titleHeader
  );

  return (
    <MenuContext.Provider value={{ isDesktop: false, pushSubMenu, activeSub, setActiveSub }}>
      {/* A drawer WITH a header always fills the height (.drawerFull) — the
          same rule as SelectList: a content-hugging sheet would resize on every
          keystroke and make the header and search bar jump. The node draws it
          the same way (Menu `variant=drawer, header=true` is 768 tall in an
          812 frame — the screen minus the 44px top inset). */}
      <Popover
        drawer
        open={open}
        onClose={onClose}
        header={sheetHeader}
        className={clsx(className, showHeader && styles.drawerFull)}
        style={style}
      >
        <div role="menu" onKeyDown={handleMenuKeyDown}>
          {withGroupDividers(top ? top.content : children)}
        </div>
      </Popover>
    </MenuContext.Provider>
  );
}
