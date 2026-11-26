import clsx from "clsx";
import { HTMLAttributes, useMemo } from "react";

import styles from "./ActivityLogTextChange.module.scss";
import { diffWords } from "./textDiff";

export interface ActivityLogTextChangeProps extends HTMLAttributes<HTMLSpanElement> {
  /** The text before the edit. "" when the field was empty. */
  oldText: string;
  /** The text after the edit. "" when the field was cleared. */
  newText: string;
}

// ActivityLogTextChange — how a text field (a TextArea) was edited, as ONE
// merged paragraph: removed words struck through in gray-a8, added words on an
// amber-a4 highlight, the rest text-strong. Spacious line height, because it
// reads as a paragraph. The whole text is shown — the accordion already keeps
// the log short (DS doc "Sub-logs"). Goes in the caption of a sub-log without
// a title.
export default function ActivityLogTextChange({ oldText, newText, className, ...rest }: ActivityLogTextChangeProps) {
  // A word diff is not free and a log list re-renders often — keep it until
  // the text itself changes.
  const runs = useMemo(() => diffWords(oldText, newText), [oldText, newText]);
  return (
    <span className={clsx(styles.root, className)} {...rest}>
      {runs.map((run, index) => (
        <span
          // Runs have no id of their own and are rebuilt whole, so the index
          // IS the identity.
          key={index}
          className={run.kind === "removed" ? styles.removed : run.kind === "added" ? styles.added : undefined}
        >
          {run.text}
        </span>
      ))}
    </span>
  );
}
