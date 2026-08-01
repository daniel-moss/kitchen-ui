import clsx from "clsx";

import styles from "./ToggleSwitch.module.scss";

export interface ToggleSwitchProps {
  /** On (active) state. */
  checked?: boolean;
  error?: boolean;
  loading?: boolean;
  /** Dim to 30% (disabled toggle / read-only). */
  dimmed?: boolean;
  /** Whether hover/press should respond to the parent `.control`. Default true. */
  interactive?: boolean;
  className?: string;
}

// The 34×22 switch visual — the track plus the sliding 16px knob. Prop-driven;
// hover/press/focus come from an interactive ancestor carrying the `.control`
// class. Shared by Toggle and ToggleItem so they are the same component.
export default function ToggleSwitch({
  checked = false,
  error = false,
  loading = false,
  dimmed = false,
  interactive = true,
  className,
}: ToggleSwitchProps) {
  return (
    <span
      className={clsx(
        styles.track,
        interactive && styles.interactive,
        checked && styles.checked,
        error && styles.error,
        loading && styles.loading,
        dimmed && styles.dimmed,
        className,
      )}
      aria-hidden="true"
    >
      {!loading && <span className={styles.knob} />}
    </span>
  );
}
