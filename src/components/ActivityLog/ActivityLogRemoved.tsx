import clsx from "clsx";
import { HTMLAttributes } from "react";

import styles from "./ActivityLogRemoved.module.scss";

export type ActivityLogRemovedProps = HTMLAttributes<HTMLSpanElement>;

// The value that is GONE inside a log sentence — the old value of a changed
// field, a removed label, a deleted session. Regular, gray-a8, struck through
// (DS doc "Log" / "Cases"). Beside ActivityLogSubtle:
//   <>Lorne Riddle<Subtle> updated </Subtle>Priority: <Removed>Medium</Removed> → High</>
// A value icon inside it turns gray-a8 too — a removed value keeps no tint.
export default function ActivityLogRemoved({ children, className, ...rest }: ActivityLogRemovedProps) {
  return (
    <span className={clsx(styles.removed, className)} {...rest}>
      {children}
    </span>
  );
}
