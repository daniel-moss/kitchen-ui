import { KeyboardEvent, useEffect, useRef, useState } from "react";

import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import useEscapeKey from "../../hooks/useEscapeKey";
import useIsDesktop from "../../hooks/useIsDesktop";
import useMountTransition from "../../hooks/useMountTransition";
import useRestoreFocus from "../../hooks/useRestoreFocus";
import {
  addDays,
  buildMonthGrid,
  formatFullDate,
  formatMonthTitle,
  isOutOfRange,
  isSameDay,
  isSameMonth,
  WEEKDAYS,
} from "../../utils/calendar";
import { Divider } from "../Divider/Divider";
import IconButton from "../IconButton/IconButton";
import DrawerHeader from "../Popover/DrawerHeader";
import Popover from "../Popover/Popover";
import DateButton from "./DateButton";

import styles from "./DatePicker.module.scss";
import { DatePickerProps } from "./DatePicker.types";
import { DateButtonType } from "./DateButton.types";

const DURATION = 160; // desktop card fade — matches Menu

const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// DatePicker — a month calendar. Desktop = a floating card (positioned by the
// consumer, like Menu); mobile = a Popover drawer with a drag handle and an
// optional footer (the DateField + Apply). Always 6 week rows, Monday first,
// the 1st always on row 1 (Figma). Today gets the `today` style, the selected
// day the `selected` style. See Figma "DatePicker".
export default function DatePicker({
  value,
  defaultValue,
  onChange,
  defaultMonth,
  minDate,
  maxDate,
  today,
  breakpoint = "auto",
  open = true,
  onClose,
  footer,
  className,
  style,
}: DatePickerProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const { mounted, visible } = useMountTransition(open, DURATION);

  const todayDate = today ?? new Date();
  const [selected, setSelected] = useControllableState<Date | null>(value, defaultValue ?? null, (d) => {
    if (d != null) onChange?.(d);
  });

  // The visible month + the roving-focus day.
  const [viewMonth, setViewMonth] = useState(() => firstOfMonth(selected ?? defaultMonth ?? todayDate));
  const [focusedDate, setFocusedDate] = useState<Date | null>(() => selected ?? todayDate);
  // Direction of the last month change → the grid's slide-in animation.
  const [slideDir, setSlideDir] = useState<"next" | "prev" | null>(null);

  // A fresh open jumps to the selected month (else default/today) and puts the
  // roving focus on the selected day (else today, else the 1st in view).
  useEffect(() => {
    if (!open) return;
    const base = selected ?? defaultMonth ?? todayDate;
    const month = firstOfMonth(base);
    setViewMonth(month);
    setSlideDir(null); // no slide on (re)open
    setFocusedDate(selected ?? (isSameMonth(todayDate, month) ? todayDate : month));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEscapeKey(open && isDesktop, onClose);
  useRestoreFocus(open && isDesktop);

  const gridRef = useRef<HTMLDivElement>(null);
  const keyboardNav = useRef(false);

  // After an arrow-key move, focus the button for the new focusedDate.
  useEffect(() => {
    if (!keyboardNav.current || focusedDate == null) return;
    keyboardNav.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${dayKey(focusedDate)}"]`)?.focus();
  });

  const pick = (date: Date) => {
    setSelected(date);
    setFocusedDate(date);
  };

  const goToMonth = (delta: number) => {
    setSlideDir(delta > 0 ? "next" : "prev");
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (focusedDate == null) return;
    const weekdayOffset = (focusedDate.getDay() + 6) % 7; // Mon=0 … Sun=6
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft":
        next = addDays(focusedDate, -1);
        break;
      case "ArrowRight":
        next = addDays(focusedDate, 1);
        break;
      case "ArrowUp":
        next = addDays(focusedDate, -7);
        break;
      case "ArrowDown":
        next = addDays(focusedDate, 7);
        break;
      case "Home":
        next = addDays(focusedDate, -weekdayOffset);
        break;
      case "End":
        next = addDays(focusedDate, 6 - weekdayOffset);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (next == null || isOutOfRange(next, minDate, maxDate)) return;
    keyboardNav.current = true;
    setFocusedDate(next);
    if (!isSameMonth(next, viewMonth)) setViewMonth(firstOfMonth(next));
  };

  const prevDisabled = minDate != null && monthIndex(viewMonth) <= monthIndex(minDate);
  const nextDisabled = maxDate != null && monthIndex(viewMonth) >= monthIndex(maxDate);

  // Mobile: swipe the calendar left/right to change month. A mostly-horizontal
  // swipe past the threshold flips the month (respecting min/max); a vertical
  // gesture is left to the drawer (scroll / swipe-to-dismiss).
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStart.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = swipeStart.current;
    swipeStart.current = null;
    const t = e.changedTouches[0];
    if (s == null || t == null) return;
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return; // not a horizontal swipe
    if (dx < 0 && !nextDisabled) goToMonth(1); // swipe left → next
    else if (dx > 0 && !prevDisabled) goToMonth(-1); // swipe right → previous
  };

  const grid = buildMonthGrid(viewMonth);
  const rows: Date[][] = [];
  for (let i = 0; i < 42; i += 7) rows.push(grid.slice(i, i + 7));

  // Which day is the single tab stop (roving tabindex).
  const tabbable = focusedDate ?? selected ?? (isSameMonth(todayDate, viewMonth) ? todayDate : viewMonth);

  const inner = (
    <>
      <div className={styles.header}>
        <IconButton
          aria-label="Previous month"
          icon="angle-left"
          variant="ghost"
          size="md"
          isDisabled={prevDisabled}
          onClick={() => goToMonth(-1)}
        />
        <div className={styles.title}>{formatMonthTitle(viewMonth)}</div>
        <IconButton
          aria-label="Next month"
          icon="angle-right"
          variant="ghost"
          size="md"
          isDisabled={nextDisabled}
          onClick={() => goToMonth(1)}
        />
      </div>

      <div className={styles.calendarBlock}>
        <div className={styles.weekdays}>
          {WEEKDAYS.map((w) => (
            <div key={w} className={styles.weekday}>
              {w}
            </div>
          ))}
        </div>

        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={gridRef}
          key={monthIndex(viewMonth)}
          className={clsx(styles.grid, slideDir === "next" && styles.slideNext, slideDir === "prev" && styles.slidePrev)}
          role="grid"
          onKeyDown={onGridKeyDown}
        >
          {rows.map((row, i) => (
            <div key={i} className={styles.row} role="row">
              {row.map((date) => {
                const inMonth = isSameMonth(date, viewMonth);
                const disabled = !inMonth || isOutOfRange(date, minDate, maxDate);
                let type: DateButtonType = "default";
                if (!disabled) type = isSameDay(date, selected) ? "selected" : isSameDay(date, todayDate) ? "today" : "default";
                return (
                  <DateButton
                    key={date.getTime()}
                    day={date.getDate()}
                    type={type}
                    disabled={disabled}
                    aria-label={formatFullDate(date)}
                    tabIndex={!disabled && isSameDay(date, tabbable) ? 0 : -1}
                    data-day={dayKey(date)}
                    onClick={() => pick(date)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  if (isDesktop) {
    if (!mounted) return null;
    return (
      <div className={clsx(styles.picker, styles.card, visible && styles.cardOpen, className)} style={style} role="dialog">
        {inner}
      </div>
    );
  }

  return (
    <Popover drawer open={open} onClose={onClose} header={<DrawerHeader variant="dragHandle" />} className={className} style={style}>
      <div className={clsx(styles.picker, styles.pickerMobile)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {inner}
      </div>
      {footer != null && (
        <>
          <Divider />
          <div className={styles.footer}>{footer}</div>
        </>
      )}
    </Popover>
  );
}
