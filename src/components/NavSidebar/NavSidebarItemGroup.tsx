import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import { NavSidebarBreakpointContext } from "./NavSidebarContext";
import NavSidebarItem from "./NavSidebarItem";

import styles from "./NavSidebarItemGroup.module.scss";
import { NavSidebarItemGroupProps } from "./NavSidebarItemGroup.types";

// NavSidebarItemGroup — an item stack: a stack-header NavSidebarItem that
// expands/collapses its stack items (2px apart). A Figma template; in code
// one component owns the organisation. See Figma "NavSidebarItemGroup".
export default function NavSidebarItemGroup({
  icon,
  label,
  headerActive = false,
  open,
  defaultOpen = false,
  onOpenChange,
  isDisabled = false,
  breakpoint,
  children,
  className,
}: NavSidebarItemGroupProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);

  const body = (
    <div className={clsx(styles.group, className)}>
      <NavSidebarItem
        type="stackHeader"
        icon={icon}
        open={isOpen}
        onOpenChange={setOpen}
        active={headerActive}
        isDisabled={isDisabled}
      >
        {label}
      </NavSidebarItem>
      <div className={clsx(styles.collapse, isOpen && styles.collapseOpen)}>
        <div className={styles.collapseInner}>
          <div role="group" className={styles.items}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // The group's breakpoint reaches the header and every item inside — via
  // context, so fragments/wrappers between don't break it.
  if (breakpoint == null) return body;
  return <NavSidebarBreakpointContext.Provider value={breakpoint}>{body}</NavSidebarBreakpointContext.Provider>;
}
