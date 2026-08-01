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
  slot,
  primaryAction,
  secondaryAction,
  className,
  ...rest
}: EmptyStateProps) {
  const topSlot = icon ? (
    <span className={styles.icon}>
      <Icon icon={icon} pack="solid" size={16} />
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
          {secondaryAction && (
            <Button size="lg" variant="ghost" leftIcon={secondaryAction.leftIcon} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button size="lg" variant="subtle" leftIcon={primaryAction.leftIcon} onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
