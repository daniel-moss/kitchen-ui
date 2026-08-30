import clsx from "clsx";

import styles from "./ProgressRing.module.scss";
import { ProgressRingProps } from "./ProgressRing.types";

// Ring geometry, read from the design: a 16px box holding a circle of radius 7
// with a 2px stroke, so the ring's outer edge sits exactly on the box edge.
const BOX = 16;
const CENTER = BOX / 2;
const RADIUS = 7;
const STROKE = 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export default function ProgressRing({
  value = 0,
  color,
  isLoading = false,
  ariaLabel,
  className,
}: ProgressRingProps) {
  const pct = clamp(value);

  return (
    <span
      className={clsx(styles.base, isLoading && styles.loading, className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      // While loading the value is unknown, so aria-valuenow is left out.
      aria-valuenow={isLoading ? undefined : pct}
    >
      <svg className={styles.svg} viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true" focusable="false">
        <circle
          className={styles.baseRing}
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* At 0 the arc is not drawn at all — a zero-length dash with a round
            cap would still leave a dot at 12 o'clock. */}
        {!isLoading && pct > 0 && (
          <circle
            className={styles.progress}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - pct / 100)}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            style={color ? { stroke: color } : undefined}
          />
        )}
      </svg>
    </span>
  );
}
