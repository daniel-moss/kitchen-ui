import clsx from "clsx";

import styles from "./ActivityLogSubtle.module.scss";
import { ActivityLogSubtleProps } from "./ActivityLogSubtle.types";

// The lighter run inside an ActivityLogItem `text`. The sentence is strong by
// default (body/500 compact, text-strong — Figma `↳ text`), so names, fields
// and values need nothing; the consumer marks the words BETWEEN them:
//   <>Lorne Riddle<Subtle> updated </Subtle>Priority: <Removed>Medium</Removed> → High</>
export default function ActivityLogSubtle({ children, className, ...rest }: ActivityLogSubtleProps) {
  return (
    <span className={clsx(styles.subtle, className)} {...rest}>
      {children}
    </span>
  );
}
