import styles from "./Skeleton.module.scss";
import { SkeletonProps } from "./Skeleton.types";

// A small self-contained loading placeholder (a pulsing block).
// In the codebase this wraps `react-loading-skeleton`; here it is dependency-free.
export function Skeleton({ width, height = 12, circle = false, borderRadius }: SkeletonProps) {
  return (
    <span
      className={styles.base}
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : borderRadius,
      }}
    />
  );
}
