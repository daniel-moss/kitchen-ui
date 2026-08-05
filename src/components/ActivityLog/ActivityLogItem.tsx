import { KeyboardEvent } from "react";
import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import { Divider } from "../Divider/Divider";
import { Icon } from "../Icon/Icon";
import HoverTooltip from "../Tooltip/HoverTooltip";

import styles from "./ActivityLogItem.module.scss";
import { ActivityLogItemProps } from "./ActivityLogItem.types";
import { exactTimestamp, shortTimestamp } from "./timestamp";

const POSITION_CLASS = {
  top: styles.posTop,
  center: styles.posCenter,
  bottom: styles.posBottom,
  single: styles.posSingle,
};

// ActivityLogItem — one event in an activity log: the timeline symbol, the log
// sentence and the relative timestamp (hovering it shows the exact date/time).
// With children the row becomes an accordion revealing the event details.
// The connectors it draws come from its position in the stack — the CSS reads
// :first-child / :last-child, so nothing has to be passed down.
export default function ActivityLogItem({
  symbol,
  text,
  date,
  label,
  tooltipLabel,
  accordion,
  open,
  defaultOpen = false,
  onOpenChange,
  position,
  children,
  className,
  ...rest
}: ActivityLogItemProps) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);

  const isAccordion = accordion ?? children != null;
  const toggle = () => setOpen(!isOpen);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  const timestamp = label ?? (date != null ? shortTimestamp(date) : undefined);
  const tooltip = tooltipLabel ?? (date != null ? exactTimestamp(date) : undefined);

  const timestampNode =
    timestamp == null ? null : (
      <span className={styles.timestamp}>{timestamp}</span>
    );

  const header = (
    <div className={styles.main}>
      <div className={styles.connector} aria-hidden="true">
        <span className={styles.lineTop} />
        <span className={styles.symbol}>{symbol ?? <Icon icon="diamonds-4" size={14} />}</span>
        <span className={styles.lineBottom} />
      </div>
      <div className={styles.textRow}>
        <span className={styles.text}>{text}</span>
        {timestampNode != null &&
          (tooltip ? (
            <HoverTooltip text={tooltip} className={styles.timestampWrap}>
              {timestampNode}
            </HoverTooltip>
          ) : (
            <span className={styles.timestampWrap}>{timestampNode}</span>
          ))}
      </div>
    </div>
  );

  return (
    <div
      className={clsx(styles.root, position ? POSITION_CLASS[position] : styles.posAuto, className)}
      {...rest}
    >
      <div
        className={clsx(styles.body, isAccordion && styles.interactive, isAccordion && isOpen && styles.open)}
        role={isAccordion ? "button" : undefined}
        tabIndex={isAccordion ? 0 : undefined}
        aria-expanded={isAccordion ? isOpen : undefined}
        onClick={isAccordion ? toggle : undefined}
        onKeyDown={isAccordion ? onKeyDown : undefined}
      >
        <div className={styles.row}>
          {header}
          {isAccordion && (
            <span className={styles.caret} aria-hidden="true">
              <Icon
                className={clsx(styles.caretIcon, isOpen && styles.caretOpen)}
                icon="caret-down"
                pack="solid"
                size={12}
              />
            </span>
          )}
        </div>
        {isAccordion && (
          <div className={clsx(styles.collapse, isOpen && styles.collapseOpen)}>
            <div className={styles.collapseInner}>
              <div className={styles.subStack}>
                {/* 8px more on the right than the stack's own 8 → the line
                    stops 16px from the card edge (Daniel, 2026-08-04). */}
                <Divider padding="0 var(--size-2) 0 0" />
                {children}
              </div>
            </div>
          </div>
        )}
      </div>
      <span className={styles.spacer} aria-hidden="true">
        <span className={styles.spacerInner}>
          <span className={styles.spacerLine} />
        </span>
      </span>
    </div>
  );
}
