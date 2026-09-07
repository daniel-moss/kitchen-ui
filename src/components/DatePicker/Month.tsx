import clsx from "clsx";

import {
  buildMonthGrid,
  formatFullDate,
  formatMonthTitle,
  isOutOfRange,
  isSameDay,
  isSameMonth,
  monthIndex,
  startOfDay,
  WEEKDAYS,
} from "../../utils/calendar";
import IconButton from "../IconButton/IconButton";
import HoverTooltip from "../Tooltip/HoverTooltip";
import DateChip from "./DateChip";

import styles from "./DatePicker.module.scss";
import { DateChipBand } from "./DateChip.types";

/** The chips' data-day key — DatePicker queries it to move keyboard focus. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export interface MonthProps {
  /** First of the visible month. */
  month: Date;
  today: Date;
  /** Chips rendered selected (single: the value; range: start + end). */
  selectedDates: (Date | null)[];
  /** Inclusive banded span (committed range, or the hover preview) — or null. */
  band: { start: Date; end: Date } | null;
  minDate?: Date;
  maxDate?: Date;

  /** Show the nav cluster (range: the right month only). */
  showNav: boolean;
  prevDisabled: boolean;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** null hides the return button; otherwise the direction its icon points. */
  returnDirection: "left" | "right" | null;
  onReturn: () => void;

  onPick: (date: Date) => void;
  /** Range hover preview (desktop) — fired per chip, null on grid leave. */
  onHover?: (date: Date | null) => void;
  /** The one chip with tabIndex 0 (roving tabindex) — or null. */
  tabbable: Date | null;
  /** Month-change slide; the keyed grid remount replays it. */
  slideDir: "next" | "prev" | null;
}

const between = (d: Date, start: Date, end: Date) => {
  const t = startOfDay(d).getTime();
  return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime();
};

// Month — one month view (Figma "#️⃣ Month"): the month header (title +
// optional return/back/forward IconButtons, all lg ghost) over the grid
// (weekday captions, then always 6 rows of 7 cells). Cells outside the month
// are empty placeholders — they just fill the space. The band is uniform:
// every place it stops — a range end, a row break, or the hover preview's
// end — gets the same 6px cap, so a banded chip's band value is purely its
// position in the row's banded run (first / middle / last / alone).
export default function Month({
  month,
  today,
  selectedDates,
  band,
  minDate,
  maxDate,
  showNav,
  prevDisabled,
  nextDisabled,
  onPrev,
  onNext,
  returnDirection,
  onReturn,
  onPick,
  onHover,
  tabbable,
  slideDir,
}: MonthProps) {
  const grid = buildMonthGrid(month);
  const rows: Date[][] = [];
  for (let i = 0; i < 42; i += 7) rows.push(grid.slice(i, i + 7));

  const inBand = (d: Date) => band != null && between(d, band.start, band.end);

  return (
    <div className={styles.month}>
      <div className={styles.header}>
        <div className={styles.title}>{formatMonthTitle(month)}</div>
        {showNav && (
          <div className={styles.nav}>
            {returnDirection != null && (
              <HoverTooltip text="Jump to today">
                <IconButton
                  aria-label="Jump to today"
                  icon={returnDirection === "left" ? "arrow-turn-left" : "arrow-turn-right"}
                  variant="ghost"
                  size="lg"
                  onClick={onReturn}
                />
              </HoverTooltip>
            )}
            <IconButton
              aria-label="Previous month"
              icon="angle-left"
              variant="ghost"
              size="lg"
              isDisabled={prevDisabled}
              onClick={onPrev}
            />
            <IconButton
              aria-label="Next month"
              icon="angle-right"
              variant="ghost"
              size="lg"
              isDisabled={nextDisabled}
              onClick={onNext}
            />
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.weekdays}>
          {WEEKDAYS.map((w) => (
            <div key={w} className={styles.weekday}>
              {w}
            </div>
          ))}
        </div>

        <div
          key={monthIndex(month)}
          className={clsx(styles.rows, slideDir === "next" && styles.slideNext, slideDir === "prev" && styles.slidePrev)}
          role="grid"
          onPointerLeave={onHover ? () => onHover(null) : undefined}
        >
          {rows.map((row, i) => {
            // The banded run inside this row — its first/last chip get caps.
            const banded = row.filter((d) => isSameMonth(d, month) && inBand(d));
            const first = banded[0];
            const last = banded[banded.length - 1];
            return (
              <div key={i} className={styles.row} role="row">
                {row.map((date) => {
                  if (!isSameMonth(date, month)) {
                    // A cell with no date — a non-interactive placeholder.
                    return <div key={date.getTime()} className={styles.placeholder} />;
                  }
                  let chipBand: DateChipBand = "none";
                  if (inBand(date)) {
                    const isFirst = first != null && isSameDay(date, first);
                    const isLast = last != null && isSameDay(date, last);
                    chipBand = isFirst && isLast ? "capBoth" : isFirst ? "capLeft" : isLast ? "capRight" : "middle";
                  }
                  const disabled = isOutOfRange(date, minDate, maxDate);
                  return (
                    <DateChip
                      key={date.getTime()}
                      day={date.getDate()}
                      isSelected={selectedDates.some((s) => isSameDay(date, s))}
                      isToday={isSameDay(date, today)}
                      disabled={disabled}
                      band={chipBand}
                      aria-label={formatFullDate(date)}
                      tabIndex={!disabled && tabbable != null && isSameDay(date, tabbable) ? 0 : -1}
                      data-day={dayKey(date)}
                      onClick={() => onPick(date)}
                      onPointerEnter={onHover ? () => onHover(date) : undefined}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
