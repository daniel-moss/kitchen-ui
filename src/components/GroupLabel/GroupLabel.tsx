import { cloneElement, isValidElement, KeyboardEvent, MouseEvent, ReactElement } from "react";
import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import { Icon } from "../Icon/Icon";
import { IconProps } from "../Icon/Icon.types";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";

import styles from "./GroupLabel.module.scss";
import { GroupLabelProps } from "./GroupLabel.types";

// GroupLabel — a group header row for lists (ItemGroup, SelectListItemGroup,
// ActivityLogs, …). primary = 40px filled row with slotLeft / counter / caption;
// secondary = 28px transparent row. `isAccordion` makes the row a toggle: primary
// gets a leading caret, secondary a caret right after the label. The row only
// renders the header — collapsing the group content is the parent's job.
// See Figma "GroupLabel".
export default function GroupLabel({
  variant = "primary",
  label,
  slotLeft,
  counter,
  counterIcon,
  caption,
  slotRight,
  isAccordion = false,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  isLoading = false,
  className,
  ...rest
}: GroupLabelProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);

  const toggle = () => setOpen(!isOpen);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  const isPrimary = variant === "primary";
  const hasCounter = counter != null;
  const hasCaption = caption != null;
  const hasMeta = hasCounter || hasCaption;

  const dot = (
    <span className={styles.dot} aria-hidden="true">
      <Icon icon="dot" pack="solid" size={12} />
    </span>
  );

  // The slotLeft is conventionally an Icon (or an avatar). An Icon there uses a
  // square container box (its standard sizing) — force it so callers don't have
  // to; avatars and anything else pass through untouched.
  const leftSlot =
    isValidElement(slotLeft) && slotLeft.type === Icon
      ? cloneElement(slotLeft as ReactElement<IconProps>, {
          container: (slotLeft as ReactElement<IconProps>).props.container ?? "square",
        })
      : slotLeft;

  const content = isPrimary ? (
    <div className={styles.content}>
      {slotLeft != null && <span className={styles.slotLeft}>{leftSlot}</span>}
      <span className={clsx(styles.label, !hasMeta && styles.labelFill)}>{label}</span>
      {hasCounter && (
        <>
          {dot}
          <span className={styles.counter}>
            {counterIcon != null && (
              <span className={styles.counterIcon}>
                <Icon icon={counterIcon} pack="regular" size={14} />
              </span>
            )}
            {counter}
          </span>
        </>
      )}
      {hasCaption && (
        <>
          {dot}
          <span className={styles.caption}>{caption}</span>
        </>
      )}
    </div>
  ) : (
    <div className={styles.content}>
      <span className={styles.label}>{label}</span>
      {isAccordion && (
        <span className={clsx(styles.caretSecondary, isOpen && styles.caretOpen)} aria-hidden="true">
          <Icon icon="caret-down" pack="solid" size={12} />
        </span>
      )}
    </div>
  );

  // ---- loading — the label becomes a bar, everything else waits ----
  // The caret, the counter, the caption, the left slot and the action are all
  // hidden: they are controls or data, and neither exists yet. The header keeps
  // its own shape, so only the label is replaced, and it stops responding — a
  // header whose own label is unknown has nothing to collapse.
  if (isLoading) {
    return (
      <div className={clsx(styles.root, isPrimary ? styles.primary : styles.secondary, styles.loading, className)} {...rest}>
        <div className={styles.body}>
          {/* A group label is short, so the bar is a fixed width rather than
              filling the header — the same 96px ItemText falls back to. */}
          <SkeletonTypography variant="captionMD" width="var(--size-24)" />
        </div>
      </div>
    );
  }

  const interactive = isAccordion && !disabled;

  return (
    <div
      className={clsx(
        styles.root,
        isPrimary ? styles.primary : styles.secondary,
        isAccordion && styles.accordion,
        isAccordion && disabled && styles.disabled,
        className,
      )}
      role={isAccordion ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-expanded={isAccordion ? isOpen : undefined}
      aria-disabled={(isAccordion && disabled) || undefined}
      onClick={interactive ? toggle : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
      {...rest}
    >
      {isPrimary && isAccordion && (
        <span className={clsx(styles.caret, isOpen && styles.caretOpen)} aria-hidden="true">
          <Icon icon="caret-down" pack="solid" size={14} />
        </span>
      )}
      <div className={clsx(styles.body, slotRight != null && styles.bodySlotRight)}>
        {content}
        {slotRight != null && (
          <span className={styles.slotRight} onClick={(e: MouseEvent) => e.stopPropagation()}>
            {slotRight}
          </span>
        )}
      </div>
    </div>
  );
}
