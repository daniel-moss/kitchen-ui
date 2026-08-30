import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import SidebarNavItem from "./SidebarNavItem";

import styles from "./SidebarNavItemGroup.module.scss";
import { SidebarNavItemGroupProps } from "./SidebarNavItemGroup.types";

// SidebarNavItemGroup — an item stack: a stack-header SidebarNavItem that
// expands/collapses its stack items (1px apart). A Figma template; in code
// one component owns the organization. See Figma "SidebarNavItemGroup".
export default function SidebarNavItemGroup({
  icon,
  label,
  headerActive = false,
  open,
  defaultOpen = false,
  onOpenChange,
  isDisabled = false,
  children,
  className,
}: SidebarNavItemGroupProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);

  return (
    <div className={clsx(styles.group, className)}>
      <SidebarNavItem
        type="stackHeader"
        icon={icon}
        open={isOpen}
        onOpenChange={setOpen}
        active={headerActive}
        isDisabled={isDisabled}
      >
        {label}
      </SidebarNavItem>
      <div className={clsx(styles.collapse, isOpen && styles.collapseOpen)}>
        <div className={styles.collapseInner}>
          <div role="group" className={styles.items}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
