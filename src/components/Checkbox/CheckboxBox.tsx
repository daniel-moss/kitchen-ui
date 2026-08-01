import clsx from "clsx";

import { Icon } from "../Icon/Icon";

import styles from "./CheckboxBox.module.scss";

export interface CheckboxBoxProps {
  checked?: boolean;
  indeterminate?: boolean;
  error?: boolean;
  loading?: boolean;
  /** Dim to 30% (disabled checkbox / read-only). */
  dimmed?: boolean;
  /** Whether hover/press should respond to the parent `.control`. Default true. */
  interactive?: boolean;
  className?: string;
}

// The 16px checkbox visual — the box plus the check/hyphen glyphs. Prop-driven;
// hover/press/focus come from an interactive ancestor carrying the `.control`
// class. Shared by Checkbox and CheckboxItem so they are the same component.
export default function CheckboxBox({
  checked = false,
  indeterminate = false,
  error = false,
  loading = false,
  dimmed = false,
  interactive = true,
  className,
}: CheckboxBoxProps) {
  const filled = checked || indeterminate;
  return (
    <span
      className={clsx(
        styles.box,
        interactive && styles.interactive,
        filled && styles.filled,
        checked && styles.checked,
        indeterminate && styles.indeterminate,
        error && styles.error,
        loading && styles.loading,
        dimmed && styles.dimmed,
        className,
      )}
      aria-hidden="true"
    >
      {!loading && (
        <>
          <span className={clsx(styles.icon, styles.checkIcon)}>
            <Icon icon="check" pack="solid" size={10} />
          </span>
          <span className={clsx(styles.icon, styles.hyphenIcon)}>
            <Icon icon="hyphen" pack="solid" size={10} />
          </span>
        </>
      )}
    </span>
  );
}
