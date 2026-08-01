import clsx from "clsx";

import styles from "./ActivityLog.module.scss";
import { ActivityLogProps } from "./ActivityLog.types";

// ActivityLog — the list of events on an object, grouped by month. The order is
// the consumer's: the component renders the groups exactly as given.
// See Figma "ActivityLog".
export default function ActivityLog({ children, className, ...rest }: ActivityLogProps) {
  return (
    <div className={clsx(styles.root, className)} {...rest}>
      {children}
    </div>
  );
}
