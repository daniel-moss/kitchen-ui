import { useContext, useEffect, useRef } from "react";

import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import useIsDesktop from "../../hooks/useIsDesktop";
import AvatarUser from "../Avatar/AvatarUser";
import Menu from "../Menu/Menu";
import DrawerHeader from "../Popover/DrawerHeader";
import PopoverHeaderContent from "../Popover/PopoverHeaderContent";
import PopoverHeaderText from "../Popover/PopoverHeaderText";
import { NavSidebarBreakpointContext } from "./NavSidebarContext";

import styles from "./NavSidebarProfileButton.module.scss";
import { NavSidebarProfileButtonProps } from "./NavSidebarProfileButton.types";

// The name + e-mail section at the top of the profile menu (desktop card).
// It takes part in Menu's children so it must swallow the `divider` prop the
// Menu injects — the design shows no divider under it (the first item group
// brings its own).
function ProfileMenuHeader({ name, email }: { name: string; email?: string; divider?: boolean }) {
  return (
    <div className={styles.menuHeader}>
      <span className={styles.menuName}>{name}</span>
      {email != null && <span className={styles.menuEmail}>{email}</span>}
    </div>
  );
}

// NavSidebarProfileButton — the sidebar's avatar button: a 36px circle with
// the md user avatar. Clicking opens the profile Menu (desktop: a card 4px
// below, left-aligned; mobile: the drawer, with avatar + name + e-mail in the
// drawer header). The button STAYS PRESSED while the menu is open. See Figma
// "NavSidebarProfileButton".
export default function NavSidebarProfileButton({
  name,
  email,
  avatarSrc,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  isDisabled = false,
  breakpoint,
  className,
}: NavSidebarProfileButtonProps) {
  const inherited = useContext(NavSidebarBreakpointContext);
  const resolved = breakpoint ?? inherited ?? "auto";
  const isDesktop = useIsDesktop(resolved);
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Desktop: clicking outside the button + card closes the menu (the mobile
  // drawer closes itself via the scrim / swipe).
  useEffect(() => {
    if (!isDesktop || !isOpen) return undefined;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current != null && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [isDesktop, isOpen, setOpen]);

  const menu = (
    <Menu
      open={isOpen}
      onClose={() => setOpen(false)}
      breakpoint={resolved}
      header={
        <DrawerHeader>
          <PopoverHeaderContent avatar={<AvatarUser size="xl" imageSrc={avatarSrc} />}>
            <PopoverHeaderText variant="titleCaption" title={name} caption={email} />
          </PopoverHeaderContent>
        </DrawerHeader>
      }
    >
      {/* Desktop: the name section is the card's first block. Mobile: the
          name lives in the drawer HEADER instead (set above). */}
      {isDesktop && <ProfileMenuHeader name={name} email={email} />}
      {children}
    </Menu>
  );

  return (
    <div ref={wrapRef} className={clsx(styles.wrap, isDesktop && styles.wrapDesktop, className)}>
      <button
        type="button"
        className={clsx(styles.button, isOpen && styles.open, isDisabled && styles.disabled)}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={name}
        onClick={() => setOpen(!isOpen)}
      >
        <AvatarUser size="md" imageSrc={avatarSrc} />
      </button>
      {isDesktop ? <div className={styles.menuAnchor}>{menu}</div> : menu}
    </div>
  );
}
