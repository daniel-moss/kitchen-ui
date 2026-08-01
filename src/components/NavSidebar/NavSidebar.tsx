import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import { Divider } from "../Divider/Divider";
import Menu from "../Menu/Menu";
import ScrollArea from "../ScrollArea/ScrollArea";
import { NavSidebarBreakpointContext } from "./NavSidebarContext";
import NavSidebarItem from "./NavSidebarItem";
import NavSidebarProfileButton from "./NavSidebarProfileButton";
import NavSidebarWorkspaceButton from "./NavSidebarWorkspaceButton";

import styles from "./NavSidebar.module.scss";
import { NavSidebarProps } from "./NavSidebar.types";

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

// The Create button + its menu. Desktop: the menu card opens to the RIGHT of
// the button, bottoms aligned, 4px gap — in a body portal with a measured
// fixed position, because the sidebar's scroll container would clip an
// absolutely-anchored card. Mobile: the Menu drawer, titled "Create".
function CreateButton({
  hotKey,
  menu,
  breakpoint,
}: {
  hotKey: string;
  menu: React.ReactNode;
  breakpoint: "auto" | "desktop" | "mobile";
}) {
  const isDesktop = useIsDesktop(breakpoint);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);

  // Measure while open (and on scroll/resize — the sidebar scrolls).
  useLayoutEffect(() => {
    if (!open || !isDesktop) return undefined;
    const update = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ left: rect.right + 4, bottom: window.innerHeight - rect.bottom });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, isDesktop]);

  // Desktop: clicking outside the button + card closes the menu.
  useEffect(() => {
    if (!isDesktop || !open) return undefined;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (wrapRef.current?.contains(target)) return;
      if (target.closest?.("[data-nav-create-menu]") != null) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [isDesktop, open]);

  const menuEl = (
    <Menu open={open} onClose={() => setOpen(false)} title="Create" breakpoint={breakpoint}>
      {menu}
    </Menu>
  );

  return (
    <div ref={wrapRef}>
      <NavSidebarItem icon="plus" strong hotKey={hotKey} isPressed={open} onClick={() => setOpen(!open)}>
        Create
      </NavSidebarItem>
      {isDesktop
        ? pos != null &&
          createPortal(
            <div data-nav-create-menu className={styles.createMenu} style={{ left: pos.left, bottom: pos.bottom }}>
              {menuEl}
            </div>,
            document.body,
          )
        : menuEl}
    </div>
  );
}

// NavSidebar — the desktop navigation sidebar: a 280px column + the divider
// on its right edge. Header (workspace + profile buttons) sticks on top; the
// rest scrolls when the height runs out, with the bottom items pinned down
// while everything fits. See Figma "NavSidebar".
export default function NavSidebar({
  workspaces,
  workspaceValue,
  defaultWorkspace,
  onWorkspaceChange,
  profileName,
  profileEmail,
  profileAvatarSrc,
  profileMenu,
  onSearchClick,
  searchHotKey,
  children,
  bottomItems,
  createMenu,
  createHotKey = "C",
  breakpoint = "auto",
  className,
}: NavSidebarProps) {
  const inherited = useContext(NavSidebarBreakpointContext);
  const resolved = breakpoint === "auto" && inherited != null ? inherited : breakpoint;
  const hotKey = searchHotKey ?? (isMac() ? "⌘K" : "Ctrl K");

  // The sidebar exists ONLY on desktop — on mobile it renders nothing (the
  // NavBottomBar is the mobile navigation).
  const isDesktop = useIsDesktop(resolved);
  if (!isDesktop) return null;

  return (
    <NavSidebarBreakpointContext.Provider value={resolved}>
      <div className={clsx(styles.sidebar, className)}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <NavSidebarWorkspaceButton
              workspaces={workspaces}
              value={workspaceValue}
              defaultValue={defaultWorkspace}
              onChange={onWorkspaceChange}
              className={styles.workspace}
            />
            <NavSidebarProfileButton name={profileName} email={profileEmail} avatarSrc={profileAvatarSrc}>
              {profileMenu}
            </NavSidebarProfileButton>
          </div>
          <ScrollArea wrapperClassName={styles.scrollWrap} className={styles.scroll}>
            <div className={styles.top}>
              {onSearchClick != null && (
                <NavSidebarItem icon="magnifying-glass" hotKey={hotKey} onClick={onSearchClick}>
                  Search...
                </NavSidebarItem>
              )}
              <div className={styles.items}>{children}</div>
            </div>
            {(bottomItems != null || createMenu != null) && (
              <div className={styles.bottom}>
                {bottomItems != null && <div className={styles.items}>{bottomItems}</div>}
                {createMenu != null && <CreateButton hotKey={createHotKey} menu={createMenu} breakpoint={resolved} />}
              </div>
            )}
          </ScrollArea>
        </div>
        <Divider orientation="vertical" className={styles.edge} />
      </div>
    </NavSidebarBreakpointContext.Provider>
  );
}
