import { Fragment, ReactNode } from "react";

import styles from "./objectText.module.scss";
import { TEXT_SEPARATOR } from "../utils/textSeparator";

// The mechanism behind the "Object data" rules: a line that holds two or three
// values, where each value may be absent on its own.
//
// Why this exists rather than `joinWithSeparator`: `joinWithSeparator` DROPS an
// empty part, which is right when the value simply has nothing to say. Object
// rows do the opposite — an absent value keeps its slot and shows "No <name>",
// and ONLY that half turns `--text-placeholder` while the value beside it keeps
// the line's own color. A string cannot carry two colors, so these helpers
// return a ReactNode: `ItemText`'s title/caption/tag all take one.

/** One value in a joined line, plus the name to use when it is absent. */
export interface Value {
  /** The rendered text, or a falsy value when it is absent. */
  text: string | null | undefined;
  /** The field name — "industry", "phone number". Rendered as `No <Name>`. */
  name: string;
}

/**
 * "No Industry", "No Phone number" — "No " plus the field name with its first
 * letter capitalised and the rest left alone. Exactly what `ValueDisplay`
 * already does for an empty field, so a row and a field never disagree.
 */
export const placeholderFor = (name: string): string =>
  `No ${name.charAt(0).toUpperCase()}${name.slice(1)}`;

/**
 * Declares one value of a line.
 *
 * Pass the text ALREADY formatted, so a prefixed value stays one expression:
 * `value(e.serial && \`Serial: ${e.serial}\`, "Serial number")` renders
 * "Serial: 4182-KD" when it is there and "No Serial number" when it is not.
 */
export const value = (text: string | null | undefined, name: string): Value => ({ text, name });

/** The separator for a date range — Warranty's "start → end". */
export const RANGE_ARROW = " → ";

/**
 * Joins values into one line, drawing every absent one as "No <name>" in
 * `--text-placeholder`. The line's own color is untouched, so a present value
 * beside a missing one still reads as data.
 */
export function joinValues(values: Value[], separator: string = TEXT_SEPARATOR): ReactNode {
  return (
    <>
      {values.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && separator}
          {item.text ? item.text : <span className={styles.placeholder}>{placeholderFor(item.name)}</span>}
        </Fragment>
      ))}
    </>
  );
}

/** How many of these values are absent — the input to an object's issue rule. */
export const countMissing = (values: Value[]): number => values.filter((item) => !item.text).length;

/** "Aug 12, 2026" — US order, and the year ALWAYS shows. */
export const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * "Marcus W." — the first name in full, the surname's first letter only.
 * An unattributed action is by **"Someone"**, never by a blank.
 */
export const userName = (first?: string | null, last?: string | null): string => {
  if (first == null || first === "") return "Someone";
  return last == null || last === "" ? first : `${first} ${last[0]}.`;
};
