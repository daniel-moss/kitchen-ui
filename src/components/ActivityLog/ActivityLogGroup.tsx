import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import GroupLabel from "../GroupLabel/GroupLabel";

import styles from "./ActivityLogGroup.module.scss";
import { ActivityLogGroupProps } from "./ActivityLogGroup.types";

// ActivityLogGroup — one month of an activity log: a secondary GroupLabel that
// collapses the stack under it. Open by default. A group is only rendered when
// it HAS logs, so there is no empty state. See Figma "LogGroup".
export default function ActivityLogGroup({
  label,
  open,
  defaultOpen = true,
  onOpenChange,
  children,
  className,
  ...rest
}: ActivityLogGroupProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);

  return (
    <div className={clsx(styles.root, className)} {...rest}>
      <GroupLabel variant="secondary" accordion label={label} open={isOpen} onOpenChange={setOpen} />
      <div className={clsx(styles.collapse, isOpen && styles.collapseOpen)}>
        <div className={styles.collapseInner}>
          <div className={styles.stack}>{children}</div>
        </div>
      </div>
    </div>
  );
}
