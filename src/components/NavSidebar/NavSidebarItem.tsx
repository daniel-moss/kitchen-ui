import { MouseEvent, useContext } from "react";

import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import useIsDesktop from "../../hooks/useIsDesktop";
import { Icon } from "../Icon/Icon";
import { NavSidebarBreakpointContext } from "./NavSidebarContext";

import styles from "./NavSidebarItem.module.scss";
import { NavSidebarItemProps } from "./NavSidebarItem.types";

// NavSidebarItem — one row of the navigation sidebar: `default` (icon + label
// + optional hot-key / notification-dot modifier), `stackHeader` (toggles an
// item stack, caret left/down — not a link) or `stackItem` (label-only link,
// aligned with the default items' labels). Fills the container width;
// desktop 32px / mobile 36px tall. See Figma "NavSidebarItem".
export default function NavSidebarItem(props: NavSidebarItemProps) {
  const { children, active = false, strong = false, isPressed = false, isDisabled = false, breakpoint, onClick, className } = props;
  const type = props.type ?? "default";
  // A container (NavSidebarItemGroup / the future NavSidebar) can set the
  // breakpoint for everything inside; the item's own prop still wins.
  const inherited = useContext(NavSidebarBreakpointContext);
  const isDesktop = useIsDesktop(breakpoint ?? inherited ?? "auto");

  const [isOpen, setOpen] = useControllableState(
    props.type === "stackHeader" ? props.open : undefined,
    (props.type === "stackHeader" ? props.defaultOpen : undefined) ?? false,
    props.type === "stackHeader" ? props.onOpenChange : undefined,
  );

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (type === "stackHeader") setOpen(!isOpen);
    onClick?.(e);
  };

  const href = props.type !== "stackHeader" ? props.href : undefined;
  const isLink = href != null && !isDisabled;
  const Tag: "a" | "button" = isLink ? "a" : "button";

  // An OPEN stack header carries the strong look too (solid icon, strong
  // text) — Daniel confirmed the Figma coupling; `active` still works for a
  // closed header that holds the current page.
  const emphasized = active || (type === "stackHeader" && isOpen);

  const rootClass = clsx(
    styles.item,
    isDesktop ? styles.desktop : styles.mobile,
    type === "stackItem" && styles.stackItem,
    type === "stackHeader" && styles.stackHeader,
    emphasized && styles.active,
    strong && styles.strong,
    isPressed && styles.pressed,
    isDisabled && styles.disabled,
    className,
  );

  return (
    <Tag
      className={rootClass}
      href={isLink ? href : undefined}
      target={isLink && props.type !== "stackHeader" ? props.target : undefined}
      rel={isLink && props.type !== "stackHeader" ? props.rel : undefined}
      type={isLink ? undefined : "button"}
      disabled={isLink ? undefined : isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-current={active && type !== "stackHeader" ? "page" : undefined}
      aria-expanded={type === "stackHeader" ? isOpen : undefined}
      onClick={isDisabled ? undefined : handleClick}
    >
      {type !== "stackItem" && (
        <span className={styles.icon}>
          <Icon icon={(props as { icon: string }).icon} pack={emphasized ? "solid" : "regular"} size={14} />
        </span>
      )}
      <span className={styles.label}>{children}</span>
      {type === "stackHeader" && (
        <span className={clsx(styles.chevron, isOpen && styles.chevronOpen)} aria-hidden="true">
          <Icon icon="caret-left" pack="solid" size={12} />
        </span>
      )}
      {type === "default" && props.hotKey != null && <span className={styles.hotKey}>{props.hotKey}</span>}
      {type === "default" && props.hotKey == null && props.notificationDot && (
        <span className={styles.dot} aria-hidden="true">
          <Icon icon="circle-small" pack="solid" size={8} />
        </span>
      )}
    </Tag>
  );
}
