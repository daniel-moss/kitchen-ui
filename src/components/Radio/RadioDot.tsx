import clsx from "clsx";

import styles from "./RadioDot.module.scss";

export interface RadioDotProps {
  checked?: boolean;
  error?: boolean;
  loading?: boolean;
  /** Dim to 30% (disabled / read-only). */
  dimmed?: boolean;
  /** Whether hover/press should respond to the parent `.control`. Default true. */
  interactive?: boolean;
  className?: string;
}

// The 16px radio visual — a circle with a center dot (drawn via ::after) when
// selected. Prop-driven; hover/press/focus come from an interactive ancestor
// carrying the `.control` class. The radio counterpart to CheckboxBox.
export default function RadioDot({
  checked = false,
  error = false,
  loading = false,
  dimmed = false,
  interactive = true,
  className,
}: RadioDotProps) {
  return (
    <span
      className={clsx(
        styles.box,
        interactive && styles.interactive,
        checked && styles.filled,
        error && styles.error,
        loading && styles.loading,
        dimmed && styles.dimmed,
        className,
      )}
      aria-hidden="true"
    />
  );
}
