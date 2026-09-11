import { Children } from "react";

import clsx from "clsx";

import useIsDesktop from "../../hooks/useIsDesktop";
import Button from "../Button/Button";
import { Divider } from "../Divider/Divider";

import FilterChipGroup from "./FilterChipGroup";
import styles from "./TopBarFilter.module.scss";
import { TopBarFilterProps } from "./TopBarFilter.types";

// TopBarFilter — the bar that holds the applied filters: a FilterChipGroup
// filling the width plus an optional right slot ("Clear all" or "Reset" — a
// ghost/md Button), with a Divider under the bar. It exists ONLY on desktop
// (on mobile it renders nothing — the SidebarNav breakpoint-exclusivity rule)
// and only while there are applied filters (no chips → nothing). Which right
// slot to show — "Clear all" on standard views, "Reset" on views with
// locked filters once the user added their own — is the consumer's
// state logic. See Figma: component 29562-16614, parts 29562-16683,
// documentation 29562-15978.
export default function TopBarFilter({
  children,
  addMenu,
  onAddClick,
  addPressed,
  onClearAll,
  onReset,
  breakpoint = "auto",
  className,
}: TopBarFilterProps) {
  const isDesktop = useIsDesktop(breakpoint);
  if (!isDesktop) return null;
  if (Children.toArray(children).length === 0) return null;

  return (
    <div className={clsx(styles.bar, className)}>
      <div className={styles.content}>
        <FilterChipGroup
          breakpoint="desktop"
          addMenu={addMenu}
          onAddClick={onAddClick}
          addPressed={addPressed}
          className={styles.chips}
        >
          {children}
        </FilterChipGroup>
        {onClearAll != null && (
          <Button variant="ghost" size="md" className={styles.slotRight} onClick={onClearAll}>
            Clear all
          </Button>
        )}
        {/* Plain text since 2026-09-09 — Daniel removed the icon from the
            doc's Reset button (node 29562-15978). */}
        {onClearAll == null && onReset != null && (
          <Button variant="ghost" size="md" className={styles.slotRight} onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
      <Divider contrast="medium" />
    </div>
  );
}
