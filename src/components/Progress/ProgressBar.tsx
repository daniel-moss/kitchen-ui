import clsx from "clsx";

import styles from "./ProgressBar.module.scss";
import { ProgressBarProps } from "./ProgressBar.types";

// The design is drawn for 0–100, so anything outside is clamped rather than
// overflowing the track.
const clamp = (n: number) => Math.min(100, Math.max(0, n));

export default function ProgressBar({
  value = 0,
  color,
  isLoading = false,
  ariaLabel,
  isDecorative = false,
  className,
}: ProgressBarProps) {
  const pct = clamp(value);

  return (
    <div
      className={clsx(styles.track, isLoading && styles.loading, className)}
      // A decorative bar (a chart) is not a task in progress, so it carries no
      // progressbar role. While loading the value is unknown — the role stays
      // but aria-valuenow is left out, which is how an unknown value is
      // expressed.
      role={isDecorative ? undefined : "progressbar"}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={isDecorative ? undefined : ariaLabel}
      aria-valuemin={isDecorative ? undefined : 0}
      aria-valuemax={isDecorative ? undefined : 100}
      aria-valuenow={isDecorative || isLoading ? undefined : pct}
    >
      {!isLoading && pct > 0 && (
        <span className={styles.fill} style={{ width: `${pct}%`, background: color }} />
      )}
    </div>
  );
}
