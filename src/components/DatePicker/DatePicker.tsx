import { KeyboardEvent, TouchEvent as ReactTouchEvent, useEffect, useRef, useState } from "react";

import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import useEscapeKey from "../../hooks/useEscapeKey";
import useIsDesktop from "../../hooks/useIsDesktop";
import useRestoreFocus from "../../hooks/useRestoreFocus";
import {
  addDays,
  addMonths,
  firstOfMonth,
  formatCompactDate,
  formatFullDate,
  isOutOfRange,
  isSameDay,
  isSameMonth,
  monthIndex,
  startOfDay,
} from "../../utils/calendar";
import Button from "../Button/Button";
import DateField from "../Fields/DateField/DateField";
import Input from "../Input/Input";
import DrawerHeader from "../Popover/DrawerHeader";
import Popover from "../Popover/Popover";
import PopoverFooter from "../Popover/PopoverFooter";
import Month, { dayKey } from "./Month";

import styles from "./DatePicker.module.scss";
import { DatePickerProps, DateRange } from "./DatePicker.types";

const EMPTY_RANGE: DateRange = { start: null, end: null };

// The range click rules (the docs): the first click sets the start, the second
// sets the end; a click on the start itself does nothing (a one-day range is
// not valid); an earlier date restarts; a third click restarts as well.
const pickIntoRange = (r: DateRange, d: Date): DateRange => {
  if (r.start == null || r.end != null) return { start: d, end: null };
  if (isSameDay(d, r.start)) return r;
  if (startOfDay(d).getTime() < startOfDay(r.start).getTime()) return { start: d, end: null };
  return { start: r.start, end: d };
};

// DatePicker — the month-calendar picker (Figma "DatePicker"), built on the
// Popover. Desktop = the Popover card (fixed width; positioned by the
// consumer, like Menu), optionally with inner DateField(s) for the
// Button-trigger case. Mobile = the Popover drawer: drag handle, inner
// DateField(s), the calendar, and an Apply footer — taps fill the fields,
// Apply commits and closes, a dismissal discards. Range mode shows two
// calendars on desktop (nav on the right one only) and From/To fields on
// mobile. Always 6 rows, Monday first, the 1st in the first row.
export default function DatePicker(props: DatePickerProps) {
  const {
    defaultMonth,
    minDate,
    maxDate,
    today,
    breakpoint = "auto",
    open = true,
    onClose,
    input = false,
    className,
    style,
  } = props;
  const isRangeMode = props.isRange === true;
  const singleLabel = (props.isRange ? undefined : props.label) ?? "Date";
  const fromLabel = (props.isRange ? props.fromLabel : undefined) ?? "From";
  const toLabel = (props.isRange ? props.toLabel : undefined) ?? "To";

  const isDesktop = useIsDesktop(breakpoint);
  const todayDate = today ?? new Date();

  // Committed values (controlled-or-uncontrolled). Both hooks always run —
  // only the matching one is used.
  const [selected, setSelected] = useControllableState<Date | null>(
    props.isRange ? undefined : props.value,
    (props.isRange ? null : props.defaultValue) ?? null,
    (d) => {
      if (!props.isRange && d != null) props.onChange?.(d);
    }
  );
  const [range, setRange] = useControllableState<DateRange>(
    props.isRange ? props.range : undefined,
    (props.isRange ? props.defaultRange : undefined) ?? EMPTY_RANGE,
    (r) => {
      if (props.isRange) props.onRangeChange?.(r);
    }
  );

  // Mobile edits a DRAFT: taps fill the inner field(s), Apply commits, a
  // dismissal (scrim tap / swipe-down) discards. Desktop edits live.
  const [draft, setDraft] = useState<Date | null>(null);
  const [draftRange, setDraftRange] = useState<DateRange>(EMPTY_RANGE);
  // Desktop inner-field typing: the parsed text previews as the selected chip
  // in real time; the value commits on Enter/blur.
  const [typedPreview, setTypedPreview] = useState<Date | null>(null);

  // The visible month (range desktop shows it + the next), the roving-focus
  // day, the month-change slide, and the range hover preview.
  const [viewMonth, setViewMonth] = useState(() =>
    firstOfMonth((isRangeMode ? range.start : selected) ?? defaultMonth ?? todayDate)
  );
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const [slideDir, setSlideDir] = useState<"next" | "prev" | null>(null);
  const [hovered, setHovered] = useState<Date | null>(null);

  // A fresh open jumps to the selection's month (range: the start date's),
  // else default/today, and re-seeds the drafts + roving focus.
  useEffect(() => {
    if (!open) return;
    const base = (isRangeMode ? range.start : selected) ?? defaultMonth ?? todayDate;
    const m = firstOfMonth(base);
    setViewMonth(m);
    setSlideDir(null);
    setHovered(null);
    setTypedPreview(null);
    setDraft(isRangeMode ? null : selected);
    setDraftRange(isRangeMode ? range : EMPTY_RANGE);
    setFocusedDate((isRangeMode ? range.start : selected) ?? (isSameMonth(todayDate, m) ? todayDate : m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEscapeKey(open && isDesktop, onClose);
  useRestoreFocus(open && isDesktop);

  const monthsShown = isRangeMode && isDesktop ? 2 : 1;
  const months = monthsShown === 2 ? [viewMonth, addMonths(viewMonth, 1)] : [viewMonth];
  const isVisible = (d: Date | null | undefined) => d != null && months.some((m) => isSameMonth(d, m));

  const goToMonth = (delta: number) => {
    setSlideDir(delta > 0 ? "next" : "prev");
    setViewMonth((m) => addMonths(m, delta));
  };
  const prevDisabled = minDate != null && monthIndex(viewMonth) <= monthIndex(minDate);
  const nextDisabled = maxDate != null && monthIndex(addMonths(viewMonth, monthsShown - 1)) >= monthIndex(maxDate);

  // The return button: shown when today's month is in none of the visible
  // months; its icon points back toward today. Jumping puts today's month in
  // the (left) calendar.
  const returnDirection: "left" | "right" | null = isVisible(todayDate)
    ? null
    : monthIndex(todayDate) < monthIndex(viewMonth)
      ? "left"
      : "right";
  const jumpToToday = () => {
    setSlideDir(null);
    setViewMonth(firstOfMonth(todayDate));
  };

  // What the chips show. Mobile shows the drafts; desktop the live values
  // (plus the typing preview in single mode).
  const useDrafts = !isDesktop;
  const shownDate = isRangeMode ? null : useDrafts ? draft : (typedPreview ?? selected);
  const shownRange: DateRange = isRangeMode ? (useDrafts ? draftRange : range) : EMPTY_RANGE;

  // Range band: the committed span, or — while picking the end on desktop —
  // the hover preview from the start to the hovered chip. A start with no end
  // still shows its own one-chip band (Figma).
  const previewEnd =
    isRangeMode &&
    isDesktop &&
    shownRange.start != null &&
    shownRange.end == null &&
    hovered != null &&
    startOfDay(hovered).getTime() > startOfDay(shownRange.start).getTime()
      ? hovered
      : null;
  const bandEnd = shownRange.end ?? previewEnd ?? shownRange.start;
  const band = isRangeMode && shownRange.start != null && bandEnd != null ? { start: shownRange.start, end: bandEnd } : null;
  const hoverEnabled = isRangeMode && isDesktop && shownRange.start != null && shownRange.end == null;

  const ensureVisible = (d: Date) => {
    if (isVisible(d)) return;
    setSlideDir(null);
    setViewMonth(monthIndex(d) < monthIndex(viewMonth) ? firstOfMonth(d) : addMonths(firstOfMonth(d), -(monthsShown - 1)));
  };

  const pick = (date: Date) => {
    setFocusedDate(date);
    if (isRangeMode) {
      if (useDrafts) setDraftRange((r) => pickIntoRange(r, date));
      else setRange(pickIntoRange(shownRange, date)); // applies live; never auto-closes
      return;
    }
    if (useDrafts) {
      setDraft(date); // fills the inner field; Apply commits
      return;
    }
    setTypedPreview(null);
    setSelected(date); // fires onChange
    onClose?.(); // desktop single: instantly applies + hides
  };

  // Mobile Apply — disabled until the draft is complete (range: both ends).
  const applyDisabled = isRangeMode ? draftRange.start == null || draftRange.end == null : draft == null;
  const apply = () => {
    if (isRangeMode) {
      if (draftRange.start != null && draftRange.end != null) setRange(draftRange);
    } else if (draft != null) {
      setSelected(draft);
    }
    onClose?.();
  };

  // ===== keyboard (roving tabindex over the visible month(s)) ==============
  const containerRef = useRef<HTMLDivElement>(null);
  const keyboardNav = useRef(false);
  useEffect(() => {
    if (!keyboardNav.current || focusedDate == null) return;
    keyboardNav.current = false;
    containerRef.current?.querySelector<HTMLButtonElement>(`[data-day="${dayKey(focusedDate)}"]`)?.focus();
  });
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
    ensureVisible(next);
  };
  const tabbable =
    (isVisible(focusedDate) ? focusedDate : null) ??
    (isVisible(isRangeMode ? shownRange.start : shownDate) ? (isRangeMode ? shownRange.start : shownDate) : null) ??
    (isVisible(todayDate) ? todayDate : viewMonth);

  // ===== mobile: swipe the calendar sideways to change month ===============
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: ReactTouchEvent) => {
    const t = e.touches[0];
    swipeStart.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e: ReactTouchEvent) => {
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

  // ===== inner DateFields ==================================================
  // Single: typing previews the matching chip in real time (desktop); the
  // value commits on Enter/blur. Mobile edits the draft. Inner fields ALWAYS
  // show the year — even the current one (Daniel, 2026-09-02); the full
  // format for the single field, the compact one for the mobile range pair.
  const singleField = (
    <Input label={singleLabel}>
      <DateField
        withPicker={false}
        breakpoint={breakpoint}
        today={todayDate}
        value={shownDate}
        formatValue={formatFullDate}
        onDateChange={(d) => {
          if (useDrafts) {
            setDraft(d);
          } else {
            setTypedPreview(null);
            setSelected(d);
          }
          if (d != null) {
            ensureVisible(d);
            setFocusedDate(d);
          }
        }}
        onDateInput={
          isDesktop
            ? (d) => {
                setTypedPreview(d instanceof Date ? d : null);
                if (d instanceof Date) ensureVisible(d);
              }
            : undefined
        }
      />
    </Input>
  );

  // Range From/To. From edits the start (an end that no longer fits clears);
  // To edits the end (a date not after the start clears it). Mobile shows the
  // compact format (Figma) in the two narrow fields.
  const rangeField = (which: "from" | "to") => {
    const current = shownRange;
    const setShownRange = (r: DateRange) => {
      if (useDrafts) setDraftRange(r);
      else setRange(r);
    };
    return (
      <Input label={which === "from" ? fromLabel : toLabel}>
        <DateField
          withPicker={false}
          breakpoint={breakpoint}
          today={todayDate}
          value={which === "from" ? current.start : current.end}
          formatValue={!isDesktop ? formatCompactDate : formatFullDate}
          onDateChange={(d) => {
            if (which === "from") {
              const keepEnd =
                d != null && current.end != null && startOfDay(current.end).getTime() > startOfDay(d).getTime();
              setShownRange({ start: d, end: keepEnd ? current.end : null });
            } else {
              const valid =
                d != null && current.start != null && startOfDay(d).getTime() > startOfDay(current.start).getTime();
              setShownRange({ start: current.start, end: valid ? d : null });
            }
            if (d != null) {
              ensureVisible(d);
              setFocusedDate(d);
            }
          }}
        />
      </Input>
    );
  };

  // ===== the months ========================================================
  const monthFor = (m: Date, index: number) => (
    <Month
      key={index}
      month={m}
      today={todayDate}
      selectedDates={isRangeMode ? [shownRange.start, shownRange.end] : [shownDate]}
      band={band}
      minDate={minDate}
      maxDate={maxDate}
      showNav={index === months.length - 1}
      prevDisabled={prevDisabled}
      nextDisabled={nextDisabled}
      onPrev={() => goToMonth(-1)}
      onNext={() => goToMonth(1)}
      returnDirection={returnDirection}
      onReturn={jumpToToday}
      onPick={pick}
      onHover={hoverEnabled ? setHovered : undefined}
      tabbable={tabbable}
      slideDir={slideDir}
    />
  );

  let content;
  if (isDesktop && isRangeMode) {
    // Two fixed-width columns; with `input`, each column pairs a field with
    // its month. Nav (and the return button) live on the right month.
    content = (
      <div ref={containerRef} className={styles.rangeColumns} onKeyDown={onGridKeyDown}>
        <div className={styles.column}>
          {input && rangeField("from")}
          {monthFor(months[0], 0)}
        </div>
        <div className={styles.column}>
          {input && rangeField("to")}
          {monthFor(months[1], 1)}
        </div>
      </div>
    );
  } else if (isDesktop) {
    content = (
      <div ref={containerRef} className={clsx(styles.body, styles.bodySingleDesktop)} onKeyDown={onGridKeyDown}>
        {input && singleField}
        {monthFor(viewMonth, 0)}
      </div>
    );
  } else {
    // Mobile: the field(s) above ONE month; swiping the calendar swipes the
    // month.
    content = (
      <div ref={containerRef} className={styles.body} onKeyDown={onGridKeyDown}>
        {isRangeMode ? (
          <div className={styles.inputs}>
            {rangeField("from")}
            {rangeField("to")}
          </div>
        ) : (
          singleField
        )}
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {monthFor(viewMonth, 0)}
        </div>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <Popover open={open} className={clsx(styles.card, className)} style={style}>
        <div role="dialog" className={styles.cardBody}>
          {content}
        </div>
      </Popover>
    );
  }

  return (
    <Popover
      drawer
      open={open}
      onClose={onClose}
      header={<DrawerHeader variant="dragHandle" />}
      footer={
        <PopoverFooter stretch>
          <Button size="lg" variant="solid" isDisabled={applyDisabled} onClick={apply}>
            Apply
          </Button>
        </PopoverFooter>
      }
      className={className}
      style={style}
    >
      <div className={styles.drawerBody}>{content}</div>
    </Popover>
  );
}
