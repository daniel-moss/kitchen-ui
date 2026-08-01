import clsx from "clsx";

import styles from "./ActivityLogEmphasis.module.scss";
import { ActivityLogEmphasisProps } from "./ActivityLogEmphasis.types";

// The emphasised run inside an ActivityLogItem `text`. Event copy differs per
// event type (some follow a pattern, some are one-offs), so the consumer writes
// the sentence and marks the strong parts with this:
//   <><Em>Lorne Riddle</Em> edited <Em>Series end date → Jan 1, 2027</Em></>
export default function ActivityLogEmphasis({ children, className, ...rest }: ActivityLogEmphasisProps) {
  return (
    <span className={clsx(styles.emphasis, className)} {...rest}>
      {children}
    </span>
  );
}
