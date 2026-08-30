import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import { Divider } from "../Divider/Divider";
import Menu from "../Menu/Menu";
import ScrollArea from "../ScrollArea/ScrollArea";
import { SidebarNavBreakpointContext } from "./SidebarNavContext";
import SidebarNavItem from "./SidebarNavItem";
import SidebarNavProfileButton from "./SidebarNavProfileButton";
import SidebarNavWorkspaceButton from "./SidebarNavWorkspaceButton";

import styles from "./SidebarNav.module.scss";
import { SidebarNavProps } from "./SidebarNav.types";

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

// The Create button + its menu. Desktop: the menu card opens to the RIGHT of
// the button, tops aligned, 4px gap (the button sits at the TOP of the
// sidebar) — in a body portal with a measured fixed position, because the
// sidebar's scroll container would clip an absolutely-anchored card.
// Mobile: the Menu drawer, titled "Create".
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
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Measure while open (and on scroll/resize — the sidebar scrolls).
  useLayoutEffect(() => {
    if (!open || !isDesktop) return undefined;
    const update = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ left: rect.right + 4, top: rect.top });
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
      <SidebarNavItem icon="circle-plus" strong hotKey={hotKey} isPressed={open} onClick={() => setOpen(!open)}>
        Create
      </SidebarNavItem>
      {isDesktop
        ? pos != null &&
          createPortal(
            <div data-nav-create-menu className={styles.createMenu} style={{ left: pos.left, top: pos.top }}>
              {menuEl}
            </div>,
            document.body,
          )
        : menuEl}
    </div>
  );
}

// SidebarNav — the desktop navigation sidebar: a 280px column + the medium
// divider on its right edge. Header (workspace + profile buttons) sticks on
// top; the rest scrolls when the height runs out, with the bottom items
// pinned down while everything fits. Create sits at the TOP, above Search
// and the items. See Figma "SidebarNav".
export default function SidebarNav({
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
}: SidebarNavProps) {
  const inherited = useContext(SidebarNavBreakpointContext);
  const resolved = breakpoint === "auto" && inherited != null ? inherited : breakpoint;
  const hotKey = searchHotKey ?? (isMac() ? "⌘K" : "Ctrl K");

  // The sidebar exists ONLY on desktop — on mobile it renders nothing (the
  // BottomBarNav is the mobile navigation).
  const isDesktop = useIsDesktop(resolved);
  if (!isDesktop) return null;

  return (
    <SidebarNavBreakpointContext.Provider value={resolved}>
      <div className={clsx(styles.sidebar, className)}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <SidebarNavWorkspaceButton
              workspaces={workspaces}
              value={workspaceValue}
              defaultValue={defaultWorkspace}
              onChange={onWorkspaceChange}
              className={styles.workspace}
            />
            <SidebarNavProfileButton name={profileName} email={profileEmail} avatarSrc={profileAvatarSrc}>
              {profileMenu}
            </SidebarNavProfileButton>
          </div>
          <ScrollArea wrapperClassName={styles.scrollWrap} className={styles.scroll}>
            <div className={styles.top}>
              {createMenu != null && <CreateButton hotKey={createHotKey} menu={createMenu} breakpoint={resolved} />}
              <div className={styles.items}>
                {onSearchClick != null && (
                  <SidebarNavItem icon="magnifying-glass" hotKey={hotKey} onClick={onSearchClick}>
                    Search...
                  </SidebarNavItem>
                )}
                {children}
              </div>
            </div>
            {bottomItems != null && <div className={styles.items}>{bottomItems}</div>}
          </ScrollArea>
        </div>
        <Divider orientation="vertical" contrast="medium" className={styles.edge} />
      </div>
    </SidebarNavBreakpointContext.Provider>
  );
}
