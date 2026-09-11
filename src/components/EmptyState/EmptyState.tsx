import clsx from "clsx";

import { Icon } from "../Icon/Icon";
import Button from "../Button/Button";

import styles from "./EmptyState.module.scss";
import { EmptyStateProps } from "./EmptyState.types";

// A centered empty/error state: optional top slot (icon or avatar), a title +
// caption, and up to two actions. Fills its container. See Figma "EmptyState".
export default function EmptyState({
  title,
  caption,
  error = false,
  icon,
  // "regular" since 2026-09-10 (Daniel, with the Filters states update): every
  // EmptyState icon in the new boards is regular — the error `circle-xmark`
  // included — so the old "solid" default flipped.
  iconPack = "regular",
  slot,
  primaryAction,
  secondaryAction,
  className,
  ...rest
}: EmptyStateProps) {
  const topSlot = icon ? (
    <span className={styles.icon}>
      {/* 20px since 2026-09-09 (was 16 — the component update). */}
      <Icon icon={icon} pack={iconPack} size={20} />
    </span>
  ) : (
    slot ?? null
  );

  const hasActions = !!primaryAction || !!secondaryAction;

  return (
    <div className={clsx(styles.emptyState, { [styles.error]: error }, className)} {...rest}>
      {topSlot && <div className={styles.slotTop}>{topSlot}</div>}

      <div className={styles.text}>
        {title && <span className={styles.title}>{title}</span>}
        {caption && <span className={styles.caption}>{caption}</span>}
      </div>

      {hasActions && (
        <div className={styles.actions}>
          {/* Default SUBTLE since 2026-09-09 (the No Objects Match states,
              node 14205-65570); per-action `variant` since 2026-09-10 — the
              FilterChip conflict Hint draws its action GHOST. */}
          {secondaryAction && (
            <Button
              size="lg"
              variant={secondaryAction.variant ?? "subtle"}
              leftIcon={secondaryAction.leftIcon}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              size="lg"
              variant={primaryAction.variant ?? "subtle"}
              leftIcon={primaryAction.leftIcon}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
