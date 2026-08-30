import clsx from "clsx";

import Avatar from "./Avatar";

import styles from "./AvatarDay.module.scss";
import { AvatarDayProps } from "./AvatarDay.types";

// AvatarDay — a date shown as an avatar-sized calendar page. It is NOT built on
// Avatar (different anatomy), but it belongs to the avatar family: same 36px
// box, same --border-radius-1_5 corners, and the loading state IS the generic
// Avatar skeleton (object / xl is exactly this box).
export default function AvatarDay({
  colorScheme = "gray",
  month = "JAN",
  day = 1,
  isLoading = false,
  ariaLabel,
  className,
}: AvatarDayProps) {
  if (isLoading) return <Avatar shape="square" size="xl" isLoading className={className} />;

  return (
    <div
      className={clsx(styles.base, styles[colorScheme], className)}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      <div className={styles.top} aria-hidden={ariaLabel ? true : undefined}>
        {/* The strip fits 3 letters, so the month is always cut to 3. */}
        <span className={styles.month}>{String(month).slice(0, 3)}</span>
      </div>
      <div className={styles.bottom} aria-hidden={ariaLabel ? true : undefined}>
        <div className={styles.dayContainer}>
          <span className={styles.day}>{day}</span>
        </div>
      </div>
    </div>
  );
}
