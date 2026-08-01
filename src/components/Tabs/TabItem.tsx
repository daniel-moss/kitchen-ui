import { forwardRef } from "react";
import clsx from "clsx";

import { Icon } from "../Icon/Icon";

import styles from "./TabItem.module.scss";
import { TabItemProps } from "./TabItem.types";

// TabItem — a single tab trigger. Three variants (default / container /
// underline), three sizes, and a vertical orientation for the container. Shows
// an optional icon (Regular → Solid on select) and an optional plain-text
// counter. The whole thing is a <button>; a Tabs container will own selection
// later. See Figma "_TabItem".
const TabItem = forwardRef<HTMLButtonElement, TabItemProps>(function TabItem(
  {
    variant = "default",
    size = "md",
    orientation = "horizontal",
    selected = false,
    icon,
    selectedIcon,
    iconPack,
    avatar,
    counter,
    iconOnly = false,
    selectedSurface = true,
    disabled = false,
    loading = false,
    children,
    className,
    ...rest
  },
  ref,
) {
  const vertical = variant === "container" && orientation === "vertical";
  const hasCounter = counter != null && counter !== "";
  // sm renders a 12px glyph; md/lg render 14px (both in the same-height box).
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={selected}
      disabled={disabled || loading}
      className={clsx(
        styles.tab,
        styles[variant],
        styles[size],
        vertical && styles.vertical,
        selected && styles.selected,
        !selectedSurface && styles.noSurface,
        iconOnly && styles.iconOnly,
        loading && styles.loading,
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className={styles.skeleton} aria-hidden="true" />
      ) : (
        <>
          {icon != null ? (
            <span className={styles.icon}>
              <Icon
                icon={selected ? (selectedIcon ?? icon) : icon}
                pack={iconPack ?? (selected ? "solid" : "regular")}
                size={iconSize}
              />
            </span>
          ) : avatar != null ? (
            <span className={styles.avatar}>{avatar}</span>
          ) : null}
          {(!iconOnly || hasCounter) && (
            <span className={styles.text}>
              {!iconOnly && <span className={styles.label}>{children}</span>}
              {hasCounter && <span className={styles.counter}>{counter}</span>}
            </span>
          )}
        </>
      )}
    </button>
  );
});

export default TabItem;
