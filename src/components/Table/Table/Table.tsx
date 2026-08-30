import clsx from "clsx";

import styles from "./Table.module.scss";
import { TableProps } from "./Table.types";

/**
 * The table container: one sticky header row above a set of body rows.
 *
 * It owns the scrolling — sideways when the columns are wider than the space,
 * and down through the rows — which is what makes the header able to stick.
 *
 * It has no empty, error or no-results state of its own: those replace the
 * whole table with an `EmptyState`, so the states keep their own copy and
 * actions instead of being variants of a table full of rows.
 */
export function Table({ header, children, className }: TableProps) {
  return (
    <div role="table" className={clsx(styles.table, className)}>
      <div role="rowgroup" className={styles.header}>
        {header}
      </div>
      <div role="rowgroup" className={styles.body}>
        {children}
      </div>
    </div>
  );
}
