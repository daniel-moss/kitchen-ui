import {
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import Button from "../../components/Button/Button";
import Chip from "../../components/Chip/Chip";
import ChipGroup from "../../components/Chip/ChipGroup";
import DateChip from "../../components/DatePicker/DateChip";
import Month from "../../components/DatePicker/Month";
import Dialog from "../../components/Dialog/Dialog";
import { Divider } from "../../components/Divider/Divider";
import DateField from "../../components/Fields/DateField/DateField";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectList from "../../components/SelectList/SelectList";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { isSameMonth } from "../../utils/calendar";

import { DIALOG_MARKER } from "./appShell";
import {
  ADDRESS_FIELDS,
  DATE_PRESETS,
  AddressValue,
  AnyFilterDef,
  DATE_CONDITIONS,
  AMOUNT_DIALOG_CONDITIONS,
  DateCompare,
  DateTimeframe,
  DateValue,
  DateWindowPreset,
  AmountCompare,
  AmountValue,
  FIRST_YEAR,
  FilterDef,
  FilterInstance,
  FilterOption,
  FilterValue,
  YEARS_AFTER_TODAY,
  conditionChoices,
  dateCompareLabel,
  amountOf,
  amountPresets,
  datePreset,
  emptyAddress,
  formatFooterDate,
  formatLongDate,
  isDateRange,
  isoOf,
} from "./filterDefs";
import { LocationRecord, TODAY, dayOffset } from "./listData";

import styles from "./Filters.module.scss";

// FILTER FUNCTIONALITY — the KINDS. Daniel's Figma node 14267-23297 ("Filter
// Functionality", inside the "Filters ↳ Shared Behavior" page 14199-65429)
// lists what a filter can BE, as behaviour rather than as a named filter:
// Multi-Select, Timeframe, Duration, Address and Money.
//
// A KIND is not a filter. "Duration" is a kind here AND a Jobs filter over
// there (jobsFilters.tsx); "Last modified" and "Status changed" are two shared
// TEMPLATES that both run on the Timeframe kind. What lives in this module is
// what a kind owns:
//   - its PREDICATE builder, generic over the row it measures, so a registry
//     hands it a reader and gets a whole filter's matching back;
//   - its CUSTOM DIALOG, where it has one. The date, duration, money and
//     address dialogs are around a thousand lines and belong to their kind, not
//     to the generic filter shell — a Timeframe dialog is Timeframe behaviour.
//
// MULTI-SELECT needs neither: its predicate is one line per registry entry
// (`ids.includes(...)`) and its UI is the plain option list in filterUI.tsx.
//
// ALL FIVE ARE BUILT since 2026-09-12, when MONEY arrived with the Estimates
// list's Total filter (section 14299-49183). Duration and Money are one
// machinery — see `amountFilter` and the `AmountValue` shape: same four
// measures, same list, same dialog, different unit.

// ---- the TIMEFRAME kind -----------------------------------------------------

/** "2026-08-17" → the day offset from TODAY, the same scale as `dayOffset`. */
const isoOffset = (iso: string) => dayOffset(`${iso}T12:00:00`);

/**
 * A MONTH value is stored as the first of that month and a YEAR value as the
 * first of January; these turn either one into its real bounds, which is what
 * `matches` compares against.
 */
const periodStartIso = (iso: string, timeframe: DateTimeframe) =>
  timeframe === "year" ? `${iso.slice(0, 4)}-01-01` : `${iso.slice(0, 7)}-01`;
const periodEndIso = (iso: string, timeframe: DateTimeframe) => {
  const date = new Date(`${iso}T12:00:00`);
  return timeframe === "year"
    ? `${date.getFullYear()}-12-31`
    : isoOf(new Date(date.getFullYear(), date.getMonth() + 1, 0));
};

/**
 * The LAST day (offset from today, `dayOffset` scale) a "Scheduled for" value
 * can match — the schedule-horizon CONFLICT rule (Figma section 14101-46526,
 * agreed with Daniel 2026-09-10). Returns:
 *   `false`  — the value can never reach beyond a horizon ("Not scheduled",
 *              no date picked): never warn;
 *   `null`   — no end at all (an open "after"): warns against EVERY finite
 *              horizon;
 *   a number — the value's last matching day: warns when it is beyond the
 *              horizon's last day.
 * Mirrors `dateFilter`'s matching exactly — "before X" ends the day before X,
 * "on"/"within" end at their period's last day (month/year expanded).
 *
 * `windows` is the filter's OWN preset list (`FilterDef.dateWindows`), passed
 * in rather than looked up: only a window filter can conflict with a horizon,
 * and which windows it offers is the registry's business, not this module's.
 */
export function scheduledValueEnd(
  date: DateValue | null | undefined,
  windows: DateWindowPreset[] = [],
): number | null | false {
  if (date == null) return false;
  if (date.preset != null) {
    const window = windows.find((w) => w.id === date.preset);
    // "Not scheduled" matches only unscheduled jobs, which the horizon never
    // hides — the node's rule 3. A PAST window ("Past due") ends before today,
    // so it can never reach beyond a horizon either; its own `to` says so.
    if (window == null || window.absent) return false;
    return window.to ?? null;
  }
  if (date.from == null) return false;
  const timeframe = date.timeframe ?? "day";
  const startOf = (iso: string) => isoOffset(timeframe === "day" ? iso : periodStartIso(iso, timeframe));
  const endOf = (iso: string) => isoOffset(timeframe === "day" ? iso : periodEndIso(iso, timeframe));
  if (isDateRange(date)) return date.to == null ? false : endOf(date.to);
  switch (date.compare) {
    case "before":
      return startOf(date.from) - 1;
    case "after":
      return null;
    // "on" — the day, or the whole month / year it falls in.
    default:
      return endOf(date.from);
  }
}

/**
 * The FORWARD windows — the preset list a date filter takes when the field it
 * reads points into the future. Both filters that do draw exactly these six, in
 * this order: Jobs' "Scheduled for" (node 14101-46526) and Estimates' "Expires"
 * (14297-48370). A window is a complete answer, so a list built on these has NO
 * condition chips and its chip renders without a condition box.
 *
 * Scheduled for prepends its own "Not scheduled" row — an ABSENCE window, which
 * Expires has no use for (every estimate has a due date).
 */
const FUTURE_WINDOWS: DateWindowPreset[] = [
  { id: "today", label: "Today", from: 0, to: 0 },
  { id: "tomorrow", label: "Tomorrow", from: 1, to: 1 },
  { id: "next3", label: "Next 3 days", from: 0, to: 3 },
  { id: "next7", label: "Next 7 days", from: 0, to: 7 },
  { id: "next14", label: "Next 14 days", from: 0, to: 14 },
  { id: "next30", label: "Next 30 days", from: 0, to: 30 },
];

/**
 * The PAST row plus the six future ones, in the nodes' order.
 *
 * The past row arrived on 2026-09-12 (Daniel, after the review): the absence
 * row matches only the rows with NO date, so a row whose date has gone by was
 * reachable through the Custom dialog alone. It has no floor — everything up to
 * yesterday — and the two lists WORD it differently: a job is "Past due"
 * (14101-46526), an estimate is "Expired" (14297-48370). Same window, so the
 * label is the parameter.
 */
export const forwardWindows = (pastLabel: string): DateWindowPreset[] => [
  { id: "past", label: pastLabel, to: -1 },
  ...FUTURE_WINDOWS,
];

/**
 * Options + matcher for a date filter over one job field.
 *
 * The POSITIVE half of each pair is what `matches` answers; `applyFilters` flips
 * it for the negative half, so the two are exact opposites:
 *   after N days ago  = received later than that day   → before = on it or earlier
 *   within [from, to] = received on or between the two → outside = neither
 */
export function dateFilter<TRow>(
  read: (row: TRow) => string | null,
  /** WINDOW presets instead of the shared past-anchored list — Scheduled for. */
  windows?: DateWindowPreset[],
): { options: FilterOption[]; matches: FilterDef<TRow>["matches"]; excluded: FilterDef<TRow>["excluded"] } {
  return {
    options: (windows ?? DATE_PRESETS).map((preset) => ({ id: preset.id, label: preset.label })),
    // A row with NOTHING in this field is not part of a date filter's answer at
    // all (Daniel, 2026-09-12) — see `FilterDef.excluded`. Without this the
    // negative half would list every dateless row: an unscheduled job under
    // every "before" / "outside" Scheduled for, a job whose status never
    // changed under every "before" Status changed. The ABSENCE window
    // ("Not scheduled") is the one value that asks for these rows, so it is
    // exempt — `matches` answers it directly.
    excluded: (row, value) => {
      if (read(row) != null) return false;
      const preset = value.date?.preset;
      if (preset != null) {
        const window = windows?.find((w) => w.id === preset);
        if (window?.absent) return false;
      }
      return true;
    },
    matches: (row, value) => {
      const date = value.date;
      if (date == null) return true;
      const iso = read(row);
      // A WINDOW preset first, BEFORE the no-date bail: "Not scheduled" (the
      // windowless row, first in the 2026-09-09 list update) is exactly the
      // jobs with nothing in this field. A real window is a whole range, both
      // ends inclusive — "Next 7 days" = today through the end of today+7
      // (Daniel: "from today + N days; Tomorrow is tomorrow only"). Window
      // values never flip: there is no condition on them.
      if (date.preset != null) {
        const window = windows?.find((w) => w.id === date.preset);
        if (window != null) {
          // The ABSENCE row matches the empty field and nothing else.
          if (window.absent) return iso == null;
          if (iso == null) return false;
          const dayOff = dayOffset(iso);
          // An end left unset is OPEN — "Past due" / "Expired" run back
          // without a floor (`{ to: -1 }`).
          if (window.from != null && dayOff < window.from) return false;
          if (window.to != null && dayOff > window.to) return false;
          return true;
        }
      }
      // A job with NOTHING in this field matches nothing else — "after 1 week
      // ago" cannot be true of a job that has no date. (The old flag about
      // unscheduled jobs having no row is RESOLVED by "Not scheduled" above;
      // what remains: `applyFilters` FLIPS this false for the negative half
      // ("before"), so an unscheduled job still shows up under every
      // "before" / "outside" condition on the PAST-anchored filters.)
      if (iso == null) return false;
      const offset = dayOffset(iso);
      if (date.preset != null) {
        const preset = datePreset(date.preset);
        return preset == null ? true : offset > -preset.days;
      }
      // A MONTH value holds the first of its month and a YEAR value the first
      // of January; either is compared as the WHOLE period, first day to last
      // (nodes 13962-14374 / 13965-24022 / 13965-29278 / 13965-31488). A DAY is
      // just itself.
      const timeframe = date.timeframe ?? "day";
      const startOf = (iso: string) => isoOffset(timeframe === "day" ? iso : periodStartIso(iso, timeframe));
      const endOf = (iso: string) => isoOffset(timeframe === "day" ? iso : periodEndIso(iso, timeframe));

      // `within` reads BOTH ends — it is the old Range toggle (Daniel,
      // 2026-08-24) — and the two ends are whole periods: the FIRST day of
      // `from`'s period to the LAST day of `to`'s.
      if (isDateRange(date)) {
        if (date.from == null || date.to == null) return true;
        return offset >= startOf(date.from) && offset <= endOf(date.to);
      }
      if (date.from == null) return true;
      const start = startOf(date.from);
      const end = endOf(date.from);
      // `compare` is the Custom dialog's own condition and is never flipped by
      // `applyFilters` (its values always carry `negated: false`).
      switch (date.compare) {
        case "before":
          return offset < start;
        case "after":
          return offset > end;
        // "on" — the day itself, or the WHOLE month / year it falls in. Also the
        // fallback for a custom value that somehow carries no `compare`.
        default:
          return offset >= start && offset <= end;
      }
    },
  };
}

// ---- the DURATION kind ------------------------------------------------------

/**
 * Options + matcher for the DURATION filter (Figma section 13874-10420).
 *
 * `compare` IS the condition, so `applyFilters` never flips this — every value
 * carries `negated: false`, the same contract the date filter's `compare` has.
 *
 * A row with NO duration (nothing scheduled) matches nothing: "longer than an
 * hour" cannot be true of a job that has no length. The old bucket list had a
 * "No duration" option for those; the new design has no equivalent row, so they
 * simply drop out. FLAGGED — say the word and it comes back as a fifth preset.
 */
export function durationFilter<TRow>(
  read: (row: TRow) => number | null,
): { options: FilterOption[]; matches: FilterDef<TRow>["matches"] } {
  return amountFilter("duration", read);
}

// ---- the MONEY kind ---------------------------------------------------------

/**
 * Options + matcher for a MONEY filter (Figma section 14299-49183, built
 * 2026-09-12 for the Estimates list's Total — 14297-48909).
 *
 * The kind is the DURATION's twin: the same four measures, the same
 * single-select list over a "Custom..." row, the same Custom dialog. Only the
 * unit differs — dollars instead of minutes — so both share `amountFilter`
 * below and the `AmountValue` shape. A row with NO amount matches nothing, the
 * duration's rule.
 */
export function moneyFilter<TRow>(
  read: (row: TRow) => number | null,
): { options: FilterOption[]; matches: FilterDef<TRow>["matches"] } {
  return amountFilter("money", read);
}

/**
 * What both amount kinds do, written once: read the number this value stands
 * for (its preset's, or the custom one) and compare the row's own against it.
 *
 * `over` and `under` are STRICT — a row sitting exactly on the number matches
 * only `is`. See the note on AmountCompare: if the boundary should be included,
 * this is the place, and the copy changes with it.
 */
function amountFilter<TRow>(
  kind: "duration" | "money",
  read: (row: TRow) => number | null,
): { options: FilterOption[]; matches: FilterDef<TRow>["matches"] } {
  return {
    options: amountPresets(kind).map((preset) => ({ id: preset.id, label: preset.label })),
    matches: (row, value) => {
      const amount = value.amount;
      if (amount == null) return true;
      const from = amountOf(kind, amount);
      if (from == null) return true;
      const own = read(row);
      if (own == null) return false;
      switch (amount.compare) {
        case "under":
          return own < from;
        case "is":
          return own === from;
        case "within":
          return amount.to == null ? true : own >= from && own <= amount.to;
        // "over" — the first chip, and the fallback.
        default:
          return own > from;
      }
    },
  };
}

// ---- the ADDRESS kind -------------------------------------------------------

/**
 * Does a typed field match the job's? A BLANK field is not part of the question
 * and always passes; a filled one is a case-insensitive SUBSTRING test, which is
 * what "contains" says — typing "Mission" finds "418 Mission St".
 */
const addressFieldMatches = (typed: string, actual: string | null | undefined) => {
  const query = typed.trim().toLowerCase();
  return query === "" || (actual ?? "").toLowerCase().includes(query);
};

/**
 * The ADDRESS matcher (Figma section 13988-53503). Every filled field has to
 * match — Daniel, 2026-08-24: "if typed in 'Street address' matches location
 * address 'Street address' of one of the jobs on the list, we show those jobs."
 * Field against FIELD, so "Mission" typed into City does not match a job on
 * Mission St.
 *
 * `matches` answers the POSITIVE half only; `applyFilters` flips it for "does
 * not contain", which makes that the exact opposite: NOT every field matches.
 * FLAGGED — that reading means a job matching only some of the typed fields IS
 * shown by "does not contain". The alternative ("no field matches") is a
 * different question; the node does not settle it.
 */
export const addressFilter =
  <TRow,>(locationOfRow: (row: TRow) => LocationRecord): FilterDef<TRow>["matches"] =>
  (row, value) => {
  const address = value.address;
  if (address == null) return true;
  const location = locationOfRow(row);
  return (
    addressFieldMatches(address.street, location.street) &&
    addressFieldMatches(address.suite, location.unit) &&
    addressFieldMatches(address.city, location.city) &&
    addressFieldMatches(address.state, location.state) &&
    addressFieldMatches(address.postalCode, location.postalCode)
  );
};

// ---- the kinds' Custom dialogs ----------------------------------------------

// ---- the date filter's "Custom..." dialog -----------------------------------

// The modal behind the list's "Custom..." row, from Figma nodes 13962-8889
// (desktop) / 13962-8893 (mobile). The DS `Dialog`, titled with the filter's own
// name, holding four blocks:
//
//   TIMEFRAME (a 16px row) — a `ChipGroup` of `lg` Chips, Day / Month / Year,
//     that picks WHICH timeframe the date is expressed in.
//   a `Divider`, FULL-BLEED — edge to edge, no side inset.
//   CONDITION (its own 16px container) — a second `ChipGroup` of `lg` Chips:
//     HOW the timeframe is measured — on / before / after / within.
//   SELECTION (16px sides and bottom, none on top — the Condition block above
//     closes with its own 16 — and 16px between items). Unique to the chosen
//     timeframe:
//     - a `DateField` labelled "Date". It does NOT open the DatePicker
//       (`withPicker={false}`, Daniel 2026-08-23) — the calendar is already in
//       the dialog, so the field is a text field that parses what is typed;
//     - the calendar itself (`DialogCalendar` below).
//   the FOOTER: the picked date on the left, "Apply" on the right.
//
// REBUILT 2026-08-24 (Daniel): the "Range (within)" ToggleItem that used to
// share the Timeframe row is GONE, and its job is now the fourth condition chip,
// `within` — "it does the same thing as the Range toggle, just structured
// differently". Three things follow from that:
//   - `DateValue` has no `range` flag any more; `compare === "within"` IS the
//     range (`isDateRange`);
//   - the Condition block is shown in range mode too (nodes 13962-12748 /
//     13962-12750 now draw it), where the old build hid it;
//   - the four chips are the same on every timeframe, so switching timeframe no
//     longer rewrites the condition — only the dates are dropped.
//
// Everything inside is a DRAFT until Apply, so an unfinished edit never wipes
// the chip.
// (`isoOf` is filterDefs' — the dialogs used to keep an identical private copy
// of it, which the 2026-09-11 re-organisation removed.)
const dateOf = (iso: string | null) => (iso == null ? null : new Date(`${iso}T12:00:00`));

/** The top ChipGroup, in the node's order. All three are built. */
const TIMEFRAMES: { id: DateTimeframe; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

// ---- the dialog's MONTH grid and YEAR list ---------------------------------

// The Month and Year timeframes' content — the documented Timeframe filter
// section (14038-21304, 2026-09-03; Month dialog 14097-21480, Year dialog
// 14098-28104). Neither has date fields or a calendar — the period IS the
// value.
//
// The cells are the DS `DateChip` since 2026-09-03 — the same component the
// day calendar uses, which is exactly what the nodes draw ("#️⃣ DateChip"):
// 36px tall, 6px radius, stretching to fill its column; the picked period =
// the chip's own `selected` (a2 fill + gray-12 stroke, Medium); the CURRENT
// period — the one holding today — reads `--text-error`, like the calendar's
// today (the nodes' annotation: "A year with the current day is highlighted");
// a range runs as the chip's own band. The old local Chip restyle (the dark
// pill, the full radius) is gone with it.
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface PeriodListProps {
  /** "month" draws twelve chips per year; "year" draws one chip per year. */
  timeframe: "month" | "year";
  /** SINGLE mode: the picked period as an ISO first-of-period, or null. */
  from: string | null;
  /** RANGE mode's second end; `range` says which mode this is. */
  to: string | null;
  range: boolean;
  onPick: (iso: string) => void;
  today: Date;
}

// Both the MONTH grid and the YEAR list — the same list of years, drawn two
// ways. Month gives each year a 36px `heading-h3` header over its twelve
// months in three touching columns, rows 4px apart (node 14097-21480); Year is
// one full-width cell per year, 4px apart, no titles (node 14098-28104). The
// list SCROLLS and opens on the period holding today (the nodes' annotation),
// or on the picked one.
function PeriodList({ timeframe, from, to, range, onPick, today }: PeriodListProps) {
  // Same preview as the calendar's: with only one end picked, the band follows
  // the pointer. NOT IN THE NODE — a static frame cannot draw a hover.
  const [hovered, setHovered] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const openYearRef = useRef<HTMLDivElement>(null);

  // Open on the year that matters — the picked one, else today's (Daniel,
  // 2026-08-23; the documented nodes' "Shows the year with the current day by
  // default"). The scroll is set on the LIST, not through `scrollIntoView`:
  // that walks up every scrollable ancestor, and it would take the Timeframe
  // and Condition rows off the top of the dialog with it.
  useEffect(() => {
    const list = listRef.current;
    const year = openYearRef.current;
    if (list != null && year != null) list.scrollTop = year.offsetTop;
  }, []);

  const bandFrom = range ? from : null;
  const bandTo = range ? (to ?? (bandFrom != null && hovered != null && hovered > bandFrom ? hovered : null)) : null;

  const openYear = from != null ? Number(from.slice(0, 4)) : today.getFullYear();
  // 1990 up to ten years past today — the annotation on node 14098-28104.
  const years: number[] = [];
  for (let year = FIRST_YEAR; year <= today.getFullYear() + YEARS_AFTER_TODAY; year++) years.push(year);

  /** The period (first-of-month / first-of-year ISO) that holds today. */
  const currentIso =
    timeframe === "year"
      ? `${today.getFullYear()}-01-01`
      : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

  // One cell — a month or a whole year: the DS DateChip. `rowStart`/`rowEnd`
  // cap the range band at the row's edges, the chip's own band rule ("a range
  // end, a row break … they all look the same").
  const cell = (iso: string, label: string, rowStart: boolean, rowEnd: boolean) => {
    const picked = range ? iso === bandFrom || iso === bandTo : iso === from;
    const inBand = bandFrom != null && bandTo != null && iso >= bandFrom && iso <= bandTo;
    const capLeft = iso === bandFrom || rowStart;
    const capRight = iso === bandTo || rowEnd;
    return (
      <DateChip
        key={iso}
        day={label}
        isSelected={picked}
        isToday={iso === currentIso}
        band={!inBand ? "none" : capLeft && capRight ? "capBoth" : capLeft ? "capLeft" : capRight ? "capRight" : "middle"}
        aria-label={label}
        onPointerEnter={() => setHovered(iso)}
        onClick={() => onPick(iso)}
      />
    );
  };

  return (
    <div
      ref={listRef}
      className={clsx(styles.monthYears, timeframe === "year" && styles.monthYearsRows)}
      onPointerLeave={() => setHovered(null)}
    >
      {years.map((year) =>
        timeframe === "year" ? (
          // A year is a row of its own, so an in-band year is capped both ways.
          <div key={year} ref={year === openYear ? openYearRef : undefined} className={styles.yearRow}>
            {cell(`${year}-01-01`, String(year), true, true)}
          </div>
        ) : (
          <div key={year} ref={year === openYear ? openYearRef : undefined} className={styles.monthYear}>
            <div className={styles.monthYearTitle}>{year}</div>
            <div className={styles.monthGrid}>
              {MONTH_LABELS.map((label, index) =>
                cell(`${year}-${String(index + 1).padStart(2, "0")}-01`, label, index % 3 === 0, index % 3 === 2),
              )}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

// ---- the dialog's calendar -------------------------------------------------

// The month calendar drawn INSIDE the Custom dialog — the documented Day
// dialog (node 14095-7347, 2026-09-03; it replaced 13962-8889 / 13962-8893).
// Since 2026-09-03 each visible month IS the DS `Month` component (Daniel:
// "Use Month component from the DS") — the same piece DatePicker renders,
// which is exactly what the node embeds ("#️⃣ Month"): the 36px header with
// the title left and the lg jump-to-today / prev / next buttons right, the
// weekday captions, the fixed 6×7 DateChip grid with empty placeholders
// outside the month, and the band capped at range ends and row breaks alike.
//
// What stays local is only the ARRANGEMENT the DS root cannot provide inline
// (`DatePicker` renders as a floating card or its own drawer): one or two
// months side by side (the nav on the LAST one, moving both — node
// 14096-10085), the swipe-to-change-month gesture, and the half-picked
// range's hover preview, which `Month`'s own `onHover` contract exists for.

/** Range mode's two ends, as ISO `yyyy-mm-dd`. Its presence IS the mode. */
interface CalendarRange {
  from: string | null;
  to: string | null;
}

interface DialogCalendarProps {
  /** SINGLE mode: the picked day, or null — the dialog opens with none. */
  value?: Date | null;
  /** RANGE mode: the two ends. Passing this switches the calendar's behavior. */
  range?: CalendarRange;
  onChange: (date: Date) => void;
  /** The FIRST month on show; the arrows and swipes move on from there. */
  month: Date;
  onMonthChange: (month: Date) => void;
  /**
   * How many months side by side. 2 on desktop in range mode (node
   * 13962-12748); 1 everywhere else — mobile shows one month at a time.
   */
  monthCount?: number;
  /** "Today" — a prop so a story can pin it. Defaults to the real today. */
  today?: Date;
}

const firstOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
/** Months since year 0 — lets two months be compared with one number. */
const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

function DialogCalendar({ value, range, onChange, month, onMonthChange, monthCount = 1, today }: DialogCalendarProps) {
  // `useState` initialiser, not a bare `new Date()`: the reference must not
  // change on every render, or the "today" cell could flip mid-session.
  const [todayDate] = useState(() => today ?? new Date());
  // The day under the pointer while a range is half-picked — it previews where
  // the band would end (`Month`'s own `onHover` contract). NOT IN THE NODE (a
  // static frame cannot draw a hover), but picking a range blind is guesswork.
  // FLAGGED.
  const [hovered, setHovered] = useState<Date | null>(null);
  const goToMonth = (delta: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  // JUMP TO TODAY (Figma nodes 13973-32477 / 13973-32495) — `Month`'s own
  // return button. It appears only once today is in NONE of the shown months,
  // and its icon points the way back. Jumping puts today in the FIRST month.
  const monthsAfterLast = monthIndex(todayDate) - (monthIndex(month) + monthCount - 1);
  const monthsBeforeFirst = monthIndex(todayDate) - monthIndex(month);
  const returnDirection = monthsAfterLast > 0 ? "right" : monthsBeforeFirst < 0 ? "left" : null;

  // Swipe sideways to change month — the same gesture (and the same 48px /
  // mostly-horizontal test) the DS DatePicker's drawer uses. A vertical drag is
  // left alone so the mobile dialog can still be swiped away.
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    const touch = e.changedTouches[0];
    if (start == null || touch == null) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
    goToMonth(dx < 0 ? 1 : -1);
  };

  // The band's two ends, as DATES (`Month`'s contract). With only `from`
  // picked the hovered day stands in for `to`, so the band follows the pointer.
  const from = dateOf(range?.from ?? null);
  const to = dateOf(range?.to ?? null);
  const bandEnd = to ?? (from != null && hovered != null && hovered > from ? hovered : null);
  const band = from != null && bandEnd != null ? { start: from, end: bandEnd } : null;
  // The selected chips: the range's two ends, or the single mode's one pick.
  const selectedDates = range != null ? [from, to] : [value ?? null];

  const months = Array.from({ length: monthCount }, (_, i) => new Date(month.getFullYear(), month.getMonth() + i, 1));

  return (
    <div className={styles.dialogCalendar} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className={styles.dialogCalendarMonths}>
        {months.map((shown, index) => {
          // The controls live on the LAST month only, so with two of them the
          // arrows sit at the far right and move the pair together (node
          // 14096-10085).
          const withNav = index === monthCount - 1;
          // The keyboard entry point: the selected end shown in this month,
          // else the month's first day.
          const selectedHere = selectedDates.find((s) => s != null && isSameMonth(s, shown)) ?? null;
          return (
            <Month
              key={monthIndex(shown)}
              month={shown}
              today={todayDate}
              selectedDates={selectedDates}
              band={band}
              showNav={withNav}
              prevDisabled={false}
              nextDisabled={false}
              onPrev={() => goToMonth(-1)}
              onNext={() => goToMonth(1)}
              returnDirection={withNav ? returnDirection : null}
              onReturn={() => onMonthChange(firstOfMonth(todayDate))}
              onPick={onChange}
              // The hover preview only matters while a range is half-picked.
              onHover={range != null ? setHovered : undefined}
              tabbable={selectedHere ?? shown}
              slideDir={null}
            />
          );
        })}
      </div>
    </div>
  );
}

interface DateCustomProps {
  /** The filter this dialog belongs to — it names the dialog. */
  def: AnyFilterDef;
  /** The value being edited — a fresh one from the list, or the chip's. */
  value: FilterValue;
  /** The finished date. `negated` is always false — `compare` IS the condition. */
  onApply: (date: DateValue) => void;
  onClose: () => void;
  open: boolean;
  /** Presentation — the PROTOTYPE's breakpoint, not the window's (DeviceFrame). */
  breakpoint: "desktop" | "mobile";
}

function DateCustom({ def, value, onApply, onClose, open, breakpoint }: DateCustomProps) {
  // Opening on a PRESET starts empty — a preset and a custom date are
  // alternatives, so there is nothing to carry over.
  const editing = value.date != null && value.date.preset == null ? value.date : null;
  const [draft, setDraft] = useState<DateValue>({
    preset: null,
    from: editing?.from ?? null,
    to: editing?.to ?? null,
    // The dialog ALWAYS carries a measure — it is the second ChipGroup, and
    // there is no unset state for it. "after" is the first chip and the default
    // (Daniel, 2026-08-24: "'After' should be the first one and the default
    // one"). The rebuilt nodes settle it: Day 13979-32841, Month 13979-34143 and
    // Year 13979-35147 all draw `after` active.
    compare: editing?.compare ?? "after",
    timeframe: editing?.timeframe ?? "day",
  });
  // No separate flag any more — `within` IS the range (Daniel, 2026-08-24).
  const range = isDateRange(draft);
  const timeframe = draft.timeframe ?? "day";
  // The DEMO CLOCK, not the real one (fixed 2026-09-12). Every preset in this
  // prototype measures from `TODAY` in the db — "1 week ago" is a week before
  // the demo's own today — so the dialog's calendar has to agree, or the two
  // halves of one filter answer different questions: Daniel opened the Custom
  // dialog, saw the real date circled and could not square it with what
  // "after 1 week ago" had just listed. Pinned once per mount, like the
  // calendar's, so the cell cannot flip mid-session.
  const [todayDate] = useState(() => TODAY);
  const from = dateOf(draft.from);
  const to = dateOf(draft.to);
  // Two months side by side on DESKTOP in range mode (node 13962-12748); one
  // everywhere else — "on mobile we only show 1 month at a time" (Daniel).
  const monthCount = range && breakpoint === "desktop" ? 2 : 1;

  // The FIRST month on show. It follows a date typed into a field, and the
  // arrows / swipes move it on their own.
  const [month, setMonth] = useState(() => firstOfMonth(from ?? TODAY));

  /** Move the view only if `date` is not already on screen. */
  const revealMonth = (date: Date) =>
    setMonth((current) => {
      const offset = monthIndex(date) - monthIndex(current);
      return offset >= 0 && offset < monthCount ? current : firstOfMonth(date);
    });

  const setEnd = (key: "from" | "to", date: Date | null) => {
    setDraft((current) => ({ ...current, [key]: date == null ? null : isoOf(date) }));
    if (date != null) revealMonth(date);
  };

  // Clicking a day, or a month chip — both hand over an ISO date, so the rule
  // is one. SINGLE mode replaces the one pick. RANGE mode fills `from` first,
  // then `to`; a click before `from`, or one made when the range is already
  // whole, starts a new range there.
  const pickIso = (iso: string) =>
    setDraft((current) => {
      if (!isDateRange(current)) return { ...current, from: iso };
      if (current.from == null || current.to != null || iso < current.from) {
        return { ...current, from: iso, to: null };
      }
      return { ...current, to: iso };
    });

  // Switching timeframe DROPS the picked dates: a day is not a month, so
  // carrying "Aug 5" over to the Month grid would leave a value nobody chose.
  // The CONDITION survives — since 2026-08-24 the four chips are the same on
  // every timeframe, so there is nothing to reset.
  const setTimeframe = (next: DateTimeframe) =>
    setDraft((current) => ({ ...current, timeframe: next, from: null, to: null }));

  // The condition chips. Picking one keeps `from` — the date already chosen
  // becomes the range's first end, or the single value again — and always drops
  // `to`, so a half-finished range can never survive the switch.
  const setCompare = (next: DateCompare) => setDraft((current) => ({ ...current, compare: next, to: null }));

  // Apply stays disabled until there is something to apply: one day, or BOTH
  // ends of a range (Daniel, 2026-08-23).
  const ready = range ? draft.from != null && draft.to != null : draft.from != null;

  // What the DateFields SHOW (Daniel, 2026-08-23): the month spelled out on
  // desktop, shortened on the phone — where "Date from" and "Date to" share one
  // row, so a long month name would truncate. Typed input is still parsed the
  // same way; this only changes the committed text.
  const formatField = breakpoint === "desktop" ? formatLongDate : formatFooterDate;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // The filter's own name titles the dialog, not the word "Custom".
      title={def.label}
      breakpoint={breakpoint}
      // DIALOG_MARKER is a plain class the outside-click handlers look for. No
      // z-index override: the menu and the option list close when the dialog
      // opens, so it sits on the normal --z-modal layer.
      // The DS Dialog card is already 608px wide, the node's own width.
      className={DIALOG_MARKER}
      // Every block below brings its own 16px — the DS default would add 24
      // between them.
      bodyPadded={false}
      footer={
        // Cancel / Apply since the documented Timeframe section (2026-09-03,
        // nodes 14095-7347 / 14097-21480 / 14098-28104 — every variant draws
        // the ghost Cancel in the left slot). The old picked-date preview
        // (Daniel, 2026-08-23, node 13979-35697) is GONE from the design; the
        // duration dialog still carries its own. Apply stays disabled until a
        // value is picked, the nodes' annotation.
        <PopoverFooter
          leadingButton={
            <Button variant="ghost" size="lg" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button
            variant="solid"
            size="lg"
            isDisabled={!ready}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Apply
          </Button>
        </PopoverFooter>
      }
    >
      {/* TIMEFRAME — the chips that pick Day / Month / Year. The Range toggle
          that used to share this row is gone (Daniel, 2026-08-24); the row is
          the ChipGroup and nothing else. */}
      <div className={styles.dateCustomTimeframe}>
        <ChipGroup>
          {TIMEFRAMES.map((option) => (
            <Chip key={option.id} size="lg" isSelected={timeframe === option.id} onClick={() => setTimeframe(option.id)}>
              {option.label}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* FULL-BLEED — edge to edge, no side inset (Daniel, 2026-08-23). */}
      <Divider contrast="medium" />

      {/* CONDITION — its own 16px container, between the Divider and the
          Selection block (Figma frame 13973-32462). ALWAYS shown, `within`
          included: the nodes draw it in range mode too now (13962-12748 /
          13962-12750), because `within` is the chip that PUTS the dialog in
          range mode. */}
      <div className={styles.dateCustomCondition}>
        <ChipGroup>
          {DATE_CONDITIONS.map((choice) => (
            <Chip key={choice} size="lg" isSelected={draft.compare === choice} onClick={() => setCompare(choice)}>
              {/* "on" a day, "in" a month or a year — the only measure whose
                  wording follows the timeframe (nodes 13979-34143 / 13979-35147). */}
              {dateCompareLabel(choice, timeframe)}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* A SECOND full-bleed Divider closes the Condition block on EVERY
          timeframe now — DAY joined Month and Year on 2026-09-09 (the Day
          section's new dividers, nodes 14205-65591…65613; Month/Year drew it
          all along, 14097-21480 / 14098-28104). */}
      <Divider contrast="medium" />

      {/* The chosen timeframe's own content. MONTH and YEAR: the period list,
          which carries its own 16px padding and scrolls behind the line. DAY
          keeps the Selection block (field + calendar). */}
      {timeframe !== "day" ? (
        <PeriodList
          timeframe={timeframe}
          from={draft.from}
          to={draft.to}
          range={range}
          onPick={pickIso}
          today={todayDate}
        />
      ) : (
        <div className={styles.dateCustomSelection}>
          <>
            {range ? (
              // Two fields sharing the row, 16px apart (nodes 13962-12748 /
              // 13962-12750). Neither opens a DatePicker, like the single field.
              <div className={styles.dateCustomFields}>
                <Input label="Date from">
                  <DateField
                    value={from}
                    onDateChange={(date) => setEnd("from", date)}
                    withPicker={false}
                    formatValue={formatField}
                  />
                </Input>
                <Input label="Date to">
                  <DateField
                    value={to}
                    onDateChange={(date) => setEnd("to", date)}
                    withPicker={false}
                    formatValue={formatField}
                  />
                </Input>
              </div>
            ) : (
              <Input label="Date">
                <DateField
                  value={from}
                  // NO DatePicker (Daniel, 2026-08-23): the calendar is right
                  // below, so a second one on top of it would be in the way. The
                  // field still parses whatever is typed and hands back a Date.
                  withPicker={false}
                  formatValue={formatField}
                  onDateChange={(date) => setEnd("from", date)}
                />
              </Input>
            )}

            <DialogCalendar
              value={range ? undefined : from}
              range={range ? { from: draft.from, to: draft.to } : undefined}
              onChange={(date) => pickIso(isoOf(date))}
              month={month}
              onMonthChange={setMonth}
              monthCount={monthCount}
              // The demo clock — see `todayDate` above. Without it the grid
              // circles the REAL today and the "jump to today" button aims at
              // the wrong month.
              today={todayDate}
            />
          </>
        </div>
      )}
    </Dialog>
  );
}

// ---- the duration filter's "Custom..." dialog ------------------------------

// The modal behind the duration list's "Custom..." row — the documented Form
// section (14100-38325, 2026-09-03: No Range nodes 13923-24049 desktop /
// 13923-24742 mobile, Range 13923-24617 / 13923-24921, plus their Filled
// twins). The DS `Dialog`, titled with the filter's own name, holding:
//
//   CONDITION (a 16px row) — a `ChipGroup` of `lg` Chips: over / under / is /
//     within. This is the ONE place `within` can be chosen, because it is the
//     only place that can collect a second value.
//   a `Divider`, FULL-BLEED — edge to edge, like the date and address
//     dialogs'. NEW with the documented section; the old node drew none here.
//   CONTENT (16px all round, 16px between items):
//     - one `Input` labelled "Duration", or, in `within`, two stacked Inputs
//       labelled "From" and "To" (the documented nodes' labels — they read
//       "Duration from" / "Duration until" before);
//     - each is the DS `InputGroup` in its TextField + SelectField shape: hours
//       typed with an "hr" suffix, minutes picked from a list with a "min" one.
//   the FOOTER: a ghost Cancel and a solid Apply, like the date and address
//     dialogs. The old value-being-built preview (node 13983-38225) is GONE
//     from the design — the Filled nodes (14100-39378 / 14100-40342) draw a
//     plain Cancel / Apply pair too.
//
// Apply stays disabled until the value is complete — the nodes' annotations:
// "until the 'date' Input is filled out", and on a range "until both the
// 'From' and the 'To' inputs are filled out".
//
// Everything inside is a DRAFT until Apply, so an unfinished edit never wipes
// the chip.

/** The minutes the picker offers — quarter hours, as everywhere else in the app. */
const MINUTE_OPTIONS = ["00", "15", "30", "45"];

/** A duration split into what the two fields hold. */
interface DurationParts {
  hours: string;
  minutes: string;
}

const splitDuration = (total: number | null): DurationParts =>
  total == null
    ? // A ZERO in the hours field, not a blank — the empty nodes draw "0 hr" /
      // "00 min" in the filled style (13923-24049 / 13923-24617). Zero still
      // counts as "not filled in", which is what keeps Apply disabled.
      { hours: "0", minutes: "00" }
    : { hours: String(Math.floor(total / 60)), minutes: String(total % 60).padStart(2, "0") };

/**
 * What the two fields add up to, or null when they add up to nothing. An empty
 * hours field with "00" minutes is NOT a duration of zero — it is a field the
 * user has not filled in, which is what keeps Apply disabled.
 */
const joinDuration = (parts: DurationParts): number | null => {
  const total = (parseInt(parts.hours, 10) || 0) * 60 + (parseInt(parts.minutes, 10) || 0);
  return total > 0 ? total : null;
};

/**
 * One SelectField inside the Custom dialog. The list is a body portal — the
 * dialog's own body would clip it — marked with DIALOG_MARKER so the chip's
 * `useAnchoredCard` counts it as part of the dialog and does not close the whole
 * stack underneath it. Outside clicks are caught in the CAPTURE phase: the
 * Dialog card stops `pointerdown` from bubbling to the document, so a
 * bubble-phase listener would never see a click on another field in the dialog.
 */
function useDialogSelect(mobile: boolean) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const measure = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, top: rect.bottom + 4, width: rect.width };
  };

  const toggle = (el: HTMLElement) => {
    if (open) {
      setOpen(false);
      return;
    }
    triggerRef.current = el;
    if (!mobile) setPos(measure(el));
    setOpen(true);
  };
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open || mobile) return undefined;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (cardRef.current?.contains(target) === true) return;
      if (triggerRef.current?.contains(target) === true) return;
      setOpen(false);
    };
    const onResize = () => {
      if (triggerRef.current != null) setPos(measure(triggerRef.current));
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, mobile]);

  return { open, pos, cardRef, toggle, close };
}

type DialogSelect = ReturnType<typeof useDialogSelect>;

/** One "N hr / NN min" row — the DS InputGroup's TextField + SelectField shape. */
function DurationInput({
  label,
  value,
  onChange,
  pop,
  mobile,
}: {
  label: string;
  value: DurationParts;
  onChange: (next: DurationParts) => void;
  pop: DialogSelect;
  mobile: boolean;
}) {
  // The list's rows are the same on either breakpoint — only the shell differs.
  const items = (
    <SelectListItemGroup>
      {MINUTE_OPTIONS.map((minutes) => (
        <SelectListItem
          key={minutes}
          label={minutes}
          select="single"
          selected={minutes === value.minutes}
          onClick={() => {
            onChange({ ...value, minutes });
            pop.close();
          }}
        />
      ))}
    </SelectListItemGroup>
  );

  return (
    <>
      {/* Input takes exactly ONE field, so the minutes list is its sibling, not
          a second child. */}
      <Input label={label}>
        <InputGroup>
          <TextField
            value={value.hours}
            // Digits only — the field is a number of hours, and the mobile
            // keyboard follows. Leading zeros are dropped because the field
            // STARTS at "0" (the node's empty state): typing after it would
            // otherwise read "02" where the user meant "2".
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
              onChange({ ...value, hours: digits.replace(/^0+(?=\d)/, "") });
            }}
            keyboard="numeric"
            suffix="hr"
            aria-label={`${label} hours`}
          />
          <SelectField
            value={value.minutes}
            suffix="min"
            open={pop.open}
            aria-label={`${label} minutes`}
            onClick={(e: MouseEvent<HTMLDivElement>) => pop.toggle(e.currentTarget)}
          />
        </InputGroup>
      </Input>
      {pop.open &&
        (mobile ? (
          <SelectList variant="drawer" breakpoint="mobile" open onClose={pop.close} title="Minutes">
            {items}
          </SelectList>
        ) : (
          pop.pos != null &&
          createPortal(
            <div
              ref={pop.cardRef}
              className={clsx(styles.filtersSub, DIALOG_MARKER)}
              style={{ left: pop.pos.left, top: pop.pos.top }}
            >
              <SelectList
                variant="inline"
                open
                onClose={pop.close}
                // The SelectField → SelectList rule: the card matches the
                // trigger's width.
                style={{ width: pop.pos.width, minWidth: pop.pos.width, maxWidth: pop.pos.width }}
              >
                {items}
              </SelectList>
            </div>,
            document.body,
          )
        ))}
    </>
  );
}

interface DurationCustomProps {
  def: AnyFilterDef;
  value: FilterValue;
  /** The finished duration. `negated` is always false — `compare` IS the condition. */
  onApply: (duration: AmountValue) => void;
  onClose: () => void;
  open: boolean;
  /** Presentation — the PROTOTYPE's breakpoint, not the window's (DeviceFrame). */
  breakpoint: "desktop" | "mobile";
}

function DurationCustom({ def, value, onApply, onClose, open, breakpoint }: DurationCustomProps) {
  const mobile = breakpoint === "mobile";
  // Opening on a PRESET starts empty — a preset and a custom duration are
  // alternatives, so there is nothing to carry over (the same rule the date
  // dialog follows). The CONDITION does carry over: the list header's chips have
  // already set it, and arriving on "over" after choosing "under" would undo a
  // decision the user just made.
  const editing = value.amount != null && value.amount.preset == null ? value.amount : null;
  const [compare, setCompare] = useState<AmountCompare>(value.amount?.compare ?? "over");
  const [from, setFrom] = useState<DurationParts>(() => splitDuration(editing?.from ?? null));
  const [to, setTo] = useState<DurationParts>(() => splitDuration(editing?.to ?? null));

  const fromPop = useDialogSelect(mobile);
  const toPop = useDialogSelect(mobile);

  const within = compare === "within";
  const fromMinutes = joinDuration(from);
  const toMinutes = joinDuration(to);

  // Apply stays disabled until there is something to apply (the nodes'
  // annotation: "until the 'date' Input is filled out" / "until both the 'From'
  // and the 'To' inputs are filled out"): one length, or BOTH ends of a range —
  // and the second end has to be the LONGER one, or the range is empty and the
  // filter would silently match nothing. That last check is INVENTED, flagged:
  // the nodes draw no error state for a backwards range.
  const ready = within ? fromMinutes != null && toMinutes != null && toMinutes > fromMinutes : fromMinutes != null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // The filter's own name titles the dialog, not the word "Custom".
      title={def.label}
      breakpoint={breakpoint}
      className={DIALOG_MARKER}
      // Both blocks below bring their own 16px — the DS default would add 24
      // between them.
      bodyPadded={false}
      footer={
        // Cancel / Apply since the documented Form section (2026-09-03, nodes
        // 13923-24049 / 13923-24617 — every variant draws the ghost Cancel in
        // the left slot). The old value-being-built preview (an hourglass +
        // the text, node 13983-38223) is GONE from the design.
        <PopoverFooter
          leadingButton={
            <Button variant="ghost" size="lg" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button
            variant="solid"
            size="lg"
            isDisabled={!ready}
            onClick={() => {
              onApply({
                compare,
                preset: null,
                from: fromMinutes,
                to: within ? toMinutes : null,
              });
              onClose();
            }}
          >
            Apply
          </Button>
        </PopoverFooter>
      }
    >
      {/* CONDITION — the four measures, `within` among them. */}
      <div className={styles.amountCustomCondition}>
        <ChipGroup>
          {AMOUNT_DIALOG_CONDITIONS.map((choice) => (
            <Chip key={choice} size="lg" isSelected={compare === choice} onClick={() => setCompare(choice)}>
              {choice}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* FULL-BLEED — edge to edge, like the date and address dialogs'. NEW
          with the documented section; the old build drew none here. */}
      <Divider contrast="medium" />

      {/* CONTENT — one field row, or two when the condition needs both ends.
          The single "Duration" row and the range's "From" SHARE one state,
          which is the node's own annotation made real (13923-24617): "selecting
          'within' automatically populates 'From' duration with that value".
          Leaving `within` keeps whatever was typed into the second row, so a
          slip on the chips costs nothing; only Apply reads it. */}
      <div className={styles.amountCustomContent}>
        {within ? (
          <>
            <DurationInput label="From" value={from} onChange={setFrom} pop={fromPop} mobile={mobile} />
            <DurationInput label="To" value={to} onChange={setTo} pop={toPop} mobile={mobile} />
          </>
        ) : (
          <DurationInput label="Duration" value={from} onChange={setFrom} pop={fromPop} mobile={mobile} />
        )}
      </div>
    </Dialog>
  );
}

// ---- the Money dialog -------------------------------------------------------

// The MONEY kind's Custom dialog — section 14299-49210, built 2026-09-12. The
// duration dialog's twin, and deliberately so: the same Dialog titled with the
// filter's name, the same four `lg` condition Chips over a full-bleed Divider,
// the same Cancel / Apply footer with Apply disabled until the value is there
// (the node's annotations: "Stays disabled until the value is provided" /
// "until both inputs are filled out").
//
// What differs is the field: ONE `Input` labelled with the FILTER's name
// ("Total" — the node's own text, which is the menu row's label) holding a
// TextField with a "$" PREFIX and nothing else. A range swaps it for "From" and
// "To", and those two sit SIDE BY SIDE on both breakpoints (the node puts them
// at 280px each in the 608px card, 163.5px each in the drawer), where the
// duration's stack. Hence its own content class.
//
// Dollars are whole numbers here — every node draws "$1,000", no cents — so the
// field takes digits only. The db stores cents-bearing totals (3480.5), and the
// comparison is against the real number: "over $3,480" includes it.
interface MoneyCustomProps {
  def: AnyFilterDef;
  value: FilterValue;
  /** The finished amount. `negated` is always false — `compare` IS the condition. */
  onApply: (amount: AmountValue) => void;
  onClose: () => void;
  open: boolean;
  breakpoint: "desktop" | "mobile";
}

/** Digits only, no leading zeros — an empty field is `null`, not 0. */
const moneyDigits = (raw: string) => raw.replace(/\D/g, "").slice(0, 9).replace(/^0+(?=\d)/, "");
const moneyNumber = (digits: string) => (digits === "" ? null : Number(digits));

function MoneyCustom({ def, value, onApply, onClose, open, breakpoint }: MoneyCustomProps) {
  // Opening on a PRESET starts empty — a preset and a custom amount are
  // alternatives (the duration dialog's rule). The CONDITION carries over: the
  // list header's chips have already set it.
  const editing = value.amount != null && value.amount.preset == null ? value.amount : null;
  const [compare, setCompare] = useState<AmountCompare>(value.amount?.compare ?? "over");
  const [from, setFrom] = useState(editing?.from == null ? "" : String(editing.from));
  const [to, setTo] = useState(editing?.to == null ? "" : String(editing.to));

  const within = compare === "within";
  const fromAmount = moneyNumber(from);
  const toAmount = moneyNumber(to);
  // One amount, or BOTH ends of a range — and the second has to be the LARGER,
  // or the range is empty and the filter would silently match nothing. That last
  // check is the duration dialog's, kept in step; the nodes draw no error state
  // for a backwards range. FLAGGED there, flagged here.
  const ready = within ? fromAmount != null && toAmount != null && toAmount > fromAmount : fromAmount != null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // The filter's own name titles the dialog, and labels the single field —
      // both annotated "Inherits the name from the 'Filters' menu".
      title={def.label}
      breakpoint={breakpoint}
      className={DIALOG_MARKER}
      bodyPadded={false}
      footer={
        <PopoverFooter
          leadingButton={
            <Button variant="ghost" size="lg" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button
            variant="solid"
            size="lg"
            isDisabled={!ready}
            onClick={() => {
              onApply({ compare, preset: null, from: fromAmount, to: within ? toAmount : null });
              onClose();
            }}
          >
            Apply
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.amountCustomCondition}>
        <ChipGroup>
          {AMOUNT_DIALOG_CONDITIONS.map((choice) => (
            <Chip key={choice} size="lg" isSelected={compare === choice} onClick={() => setCompare(choice)}>
              {choice}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      <Divider contrast="medium" />

      {/* The single field and the range's "From" SHARE one state — the node's
          annotation made real: "If the user provides the value on 'over',
          'under' or 'is', then selecting 'within' automatically populates
          'From' with that value". */}
      <div className={styles.moneyCustomContent}>
        <Input label={within ? "From" : def.label}>
          <TextField
            value={from}
            onChange={(e) => setFrom(moneyDigits(e.target.value))}
            keyboard="numeric"
            prefix="$"
            aria-label={within ? `${def.label} from` : def.label}
          />
        </Input>
        {within && (
          <Input label="To">
            <TextField
              value={to}
              onChange={(e) => setTo(moneyDigits(e.target.value))}
              keyboard="numeric"
              prefix="$"
              aria-label={`${def.label} to`}
            />
          </Input>
        )}
      </div>
    </Dialog>
  );
}

// ---- the Address dialog ----------------------------------------------------

// The ADDRESS filter's whole interface — the documented section 14100-36446
// (nodes 14100-36447 desktop / 14100-36463 mobile, 2026-09-03; it replaced
// 13988-53606 / 13988-53696). Unlike every other filter this one never opens a
// list — there is nothing to list — so the row in the Filters menu opens this
// straight away, and so does the chip's value segment.
//
// The DS `Dialog`, titled with the filter's name, holding:
//
//   CONDITION (a 16px row, NEW with the documented section) — a `ChipGroup` of
//     two `lg` Chips, "contains" / "does not contain". The same pair the chip's
//     condition segment offers, from the same `conditionChoices` source — so
//     the dialog and the chip cannot drift apart.
//   a `Divider`, FULL-BLEED — edge to edge, like the date dialog's.
//   the FIVE `Input`s at 24px apart inside 16px padding, each labelled
//     "(optional)" because any one of them on its own is a real question. The
//     only difference between the breakpoints is the last row: DESKTOP puts
//     State / Province and Postal code side by side (280px each inside the
//     608px card), MOBILE stacks all five.
//
// The footer is a plain Cancel / Apply pair — not the value-preview footer the
// date and duration dialogs use, because the value is already legible in the
// fields above it.
//
// Everything is a DRAFT until Apply — the condition chips included — the same
// contract the other two dialogs have, so an unfinished edit never touches the
// chip.
interface AddressCustomProps {
  def: AnyFilterDef;
  value: FilterValue;
  onApply: (address: AddressValue, negated: boolean) => void;
  onClose: () => void;
  open: boolean;
  breakpoint: "desktop" | "mobile";
}

function AddressCustom({ def, value, onApply, onClose, open, breakpoint }: AddressCustomProps) {
  const [draft, setDraft] = useState<AddressValue>(() => value.address ?? emptyAddress());
  // The condition is part of the draft too: re-opening the dialog seeds it from
  // the application ("contains" on a fresh one — `negated: false`), and only
  // Apply writes it back.
  const [negated, setNegated] = useState(value.negated);

  const field = (key: keyof AddressValue) => {
    const spec = ADDRESS_FIELDS.find((entry) => entry.key === key);
    return (
      <Input label={spec?.label} labelCondition="optional">
        <TextField
          value={draft[key]}
          onChange={(e) => setDraft((current) => ({ ...current, [key]: e.target.value }))}
        />
      </Input>
    );
  };

  // Apply stays disabled while every field is blank — an empty address would
  // match every job, which is the same as no filter at all. INVENTED, flagged:
  // the node draws no disabled state, but Duration's dialog already works this
  // way and `upsertFilter` would drop the empty application anyway.
  const ready = ADDRESS_FIELDS.some((entry) => draft[entry.key].trim() !== "");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={def.label}
      breakpoint={breakpoint}
      className={DIALOG_MARKER}
      // The block below brings its own 16px; the DS default would add 24 more.
      bodyPadded={false}
      footer={
        <PopoverFooter
          leadingButton={
            <Button variant="ghost" size="lg" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button
            variant="solid"
            size="lg"
            isDisabled={!ready}
            onClick={() => {
              onApply(draft, negated);
              onClose();
            }}
          >
            Apply
          </Button>
        </PopoverFooter>
      }
    >
      {/* CONDITION — "contains" / "does not contain" as lg Chips in a 16px row
          (node 14100-36449), the pair `conditionChoices` already defines for an
          address. Picking one only marks it; Apply commits it. */}
      <div className={styles.addressCustomCondition}>
        <ChipGroup>
          {conditionChoices(value).map((choice) => (
            <Chip
              key={choice.label}
              size="lg"
              isSelected={negated === choice.negated}
              onClick={() => setNegated(choice.negated)}
            >
              {choice.label}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* FULL-BLEED — edge to edge, no side inset, like the date dialog's. */}
      <Divider contrast="medium" />

      <div className={styles.addressCustomContent}>
        {field("street")}
        {field("suite")}
        {field("city")}
        {breakpoint === "desktop" ? (
          <div className={styles.addressCustomRow}>
            {field("state")}
            {field("postalCode")}
          </div>
        ) : (
          <>
            {field("state")}
            {field("postalCode")}
          </>
        )}
      </div>
    </Dialog>
  );
}

// ---- the Custom dialog, for whichever kind asked for it ---------------------

// Date and duration each have their own Custom dialog; every place that opens
// one holds a FilterInstance and wants one back, so the choice is made here
// instead of at each of the three call sites.
interface CustomDialogProps {
  def: AnyFilterDef;
  instance: FilterInstance;
  breakpoint: "desktop" | "mobile";
  /** The application with its new custom value — ready for `upsertFilter`. */
  onApply: (next: FilterInstance) => void;
  onClose: () => void;
}

export function CustomDialog({ def, instance, breakpoint, onApply, onClose }: CustomDialogProps) {
  if (def.kind === "address") {
    return (
      <AddressCustom
        def={def}
        value={instance}
        breakpoint={breakpoint}
        open
        // The dialog owns the condition since the documented section
        // (14100-36446): its own chips edit the contains / does not contain
        // pair, so Apply writes `negated` back along with the fields. The
        // chip's condition segment still edits the same pair between visits.
        onApply={(address, negated) => onApply({ ...instance, address, negated })}
        onClose={onClose}
      />
    );
  }
  if (def.kind === "duration") {
    return (
      <DurationCustom
        def={def}
        value={instance}
        breakpoint={breakpoint}
        open
        // `negated` stays false: the dialog's own measure chips ARE the
        // condition (see `withCondition`).
        onApply={(amount) => onApply({ ...instance, negated: false, amount })}
        onClose={onClose}
      />
    );
  }
  if (def.kind === "money") {
    return (
      <MoneyCustom
        def={def}
        value={instance}
        breakpoint={breakpoint}
        open
        onApply={(amount) => onApply({ ...instance, negated: false, amount })}
        onClose={onClose}
      />
    );
  }
  return (
    <DateCustom
      def={def}
      value={instance}
      breakpoint={breakpoint}
      open
      onApply={(date) => onApply({ ...instance, negated: false, date })}
      onClose={onClose}
    />
  );
}
