import { Children, isValidElement, ReactElement, useEffect, useRef, useState } from "react";

import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import IconButton from "../IconButton/IconButton";
import Menu from "../Menu/Menu";
import DrawerHeader from "../Popover/DrawerHeader";
import PopoverHeaderContent from "../Popover/PopoverHeaderContent";
import PopoverHeaderText from "../Popover/PopoverHeaderText";
import HoverTooltip from "../Tooltip/HoverTooltip";
import TopBarNavTitle from "./TopBarNavTitle";

import styles from "./TopBarNavLeftElements.module.scss";
import { TopBarNavLeftElementsProps } from "./TopBarNavLeftElements.types";
import { TopBarNavTitleProps } from "./TopBarNavTitle.types";

// TopBarNavLeftElements — the top bar's left side: an optional back button,
// the title assembly (TopBarNavTitle), and an optional context-menu button.
// Both buttons are 36px (lg) ghost IconButtons, 8px from the title. With
// `contextMenu`, the component OWNS the menu: a desktop card 4px below the
// button (left-aligned) or a mobile drawer whose header repeats the page
// title + avatar (read off the TopBarNavTitle child). See Figma TopBarNav
// "#️⃣ Left Elements" / "#️⃣ Context Menu".
export default function TopBarNavLeftElements({
  children,
  onBack,
  contextMenu,
  onActions,
  actionsPressed = false,
  breakpoint = "auto",
  className,
}: TopBarNavLeftElementsProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  const ownsMenu = contextMenu != null;

  // Desktop card: clicking outside the button + card closes the menu.
  // (The mobile drawer closes through its own scrim via onClose.)
  useEffect(() => {
    if (!(ownsMenu && menuOpen && isDesktop)) return undefined;
    const onDown = (e: PointerEvent) => {
      if (menuWrapRef.current != null && !menuWrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [ownsMenu, menuOpen, isDesktop]);

  // The mobile drawer header repeats the page title and its avatar — read
  // them off the TopBarNavTitle child (the doc: "The drawer title corresponds
  // to the title of the details page…").
  const titleEl = Children.toArray(children).find(
    (c): c is ReactElement<TopBarNavTitleProps> => isValidElement(c) && c.type === TopBarNavTitle,
  );
  const drawerHeader =
    titleEl != null ? (
      <DrawerHeader>
        <PopoverHeaderContent avatar={titleEl.props.slotLeft}>
          <PopoverHeaderText variant="title" title={titleEl.props.title} />
        </PopoverHeaderContent>
      </DrawerHeader>
    ) : undefined;

  const contextButton = (
    <IconButton
      icon="ellipsis"
      variant="ghost"
      size="lg"
      aria-label="Actions"
      onClick={ownsMenu ? () => setMenuOpen(!menuOpen) : onActions}
      isPressed={ownsMenu ? menuOpen : actionsPressed}
      noDebounce
    />
  );

  return (
    <div className={clsx(styles.root, className)}>
      {onBack != null && (
        <span className={styles.slotLeft}>
          <HoverTooltip text="Back">
            <IconButton icon="arrow-left" variant="ghost" size="lg" aria-label="Back" onClick={onBack} />
          </HoverTooltip>
        </span>
      )}
      {children}
      {ownsMenu ? (
        <span className={styles.slotRight}>
          {/* The relative wrap sits INSIDE the padded slot, so the menu card's
              left: 0 aligns with the BUTTON edge, not the 8px slot padding. */}
          <span ref={menuWrapRef} className={isDesktop ? styles.menuWrap : undefined}>
            {contextButton}
            <span className={isDesktop ? styles.menuAnchor : undefined}>
              <Menu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                breakpoint={breakpoint}
                drawerHeader={drawerHeader}
              >
                {contextMenu}
              </Menu>
            </span>
          </span>
        </span>
      ) : (
        onActions != null && <span className={styles.slotRight}>{contextButton}</span>
      )}
    </div>
  );
}
