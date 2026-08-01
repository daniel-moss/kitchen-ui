import clsx from "clsx";

import { Icon } from "../Icon/Icon";

import styles from "./NavBottomBarItem.module.scss";
import { NavBottomBarItemProps } from "./NavBottomBarItem.types";

// NavBottomBarItem — one icon pill of the mobile bottom navigation bar:
// 68×44 (stretching up to 112 inside the bar), full radius. Active = gray-a3
// fill + SOLID icon; the icon-only button carries its section name as the
// accessible label. See Figma "NavBottomBarItem".
export default function NavBottomBarItem({
  icon,
  label,
  active = false,
  strong = false,
  isDisabled = false,
  href,
  target,
  rel,
  onClick,
  className,
}: NavBottomBarItemProps) {
  const isLink = href != null && !isDisabled;
  const Tag: "a" | "button" = isLink ? "a" : "button";

  return (
    <Tag
      className={clsx(styles.item, active && styles.active, strong && styles.strong, isDisabled && styles.disabled, className)}
      href={isLink ? href : undefined}
      target={isLink ? target : undefined}
      rel={isLink ? rel : undefined}
      type={isLink ? undefined : "button"}
      disabled={isLink ? undefined : isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={isDisabled ? undefined : onClick}
    >
      <Icon icon={icon} pack={active ? "solid" : "regular"} size={18} />
    </Tag>
  );
}
