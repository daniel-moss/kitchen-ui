import { MouseEvent, ReactNode, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Chip from "../../components/Chip/Chip";
import Dialog from "../../components/Dialog/Dialog";
import DateField from "../../components/Fields/DateField/DateField";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextField from "../../components/Fields/TextField/TextField";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { SelectPopoverList, useSelectPopover } from "../../modules/shared/selectPopover";
import { Session, TECH_STATUSES } from "./TimesheetPanel";

import styles from "./SessionForm.module.scss";

export type Meridiem = "AM" | "PM";
const MERIDIEMS: Meridiem[] = ["AM", "PM"];

// The completed form values handed back on Save (dates are non-null once valid).
export interface SessionDraft {
  /** The picked tech status (one of TECH_STATUSES). */
  category: string;
  startDate: Date;
  startClock: string;
  startMeridiem: Meridiem;
  endDate: Date;
  endClock: string;
  endMeridiem: Meridiem;
}

// Date segment: "Mon, Jan 1", plus the year only when it is not the current one.
const WD = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const WD_YEAR = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const fmtDate = (d: Date) => (d.getFullYear() === new Date().getFullYear() ? WD : WD_YEAR).format(d);
// A date + "HH:MM" + AM/PM → a full Date (12-hour → 24-hour), for ordering.
const combine = (date: Date, clock: string, meridiem: Meridiem) => {
  const [h, m] = clock.split(":").map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), (h % 12) + (meridiem === "PM" ? 12 : 0), m);
};

interface TimeParts {
  date: Date | null;
  clock: string;
  meridiem: Meridiem;
}

// "11:30 AM" → { clock: "11:30", meridiem: "AM" }; "January 1, 2026" → a Date.
// The clock is taken exactly as the label writes it — "9:00" stays "9:00",
// because hours 2–9 use the one-digit "0:00" mask (see maskClock).
const parseParts = (dateLabel?: string, timeLabel?: string): TimeParts => ({
  date: dateLabel != null ? new Date(dateLabel) : null,
  clock: timeLabel != null ? timeLabel.replace(/\s*(AM|PM)\s*/i, "").trim() : "",
  meridiem: timeLabel != null && /PM/i.test(timeLabel) ? "PM" : "AM",
});

// Mask the typed digits to a clock. NOTHING is ever added but the COLON, and
// the FIRST digit picks the pattern (Daniel, 2026-08-05):
//   0 or 1 → a two-digit hour is still possible (10, 11, 12), so the mask is
//            "00:00" and the colon appears after the SECOND digit.
//   2–9    → only a one-digit hour is possible, so the mask is "0:00" and the
//            colon appears immediately ("3" → "3:", "345" → "3:45").
// The colon shows up as soon as the hour is complete, so it is clear it is
// already typed. It can never be deleted ON ITS OWN (Daniel, 2026-08-05): a
// Delete that lands on the colon takes the digit before it too, so "5:" goes
// straight back to "" — while a Delete that only removed a MINUTE digit leaves
// the colon in place ("5:4" → "5:").
const maskClock = (raw: string, deleting = false) => {
  const digits = raw.replace(/\D/g, "");
  const hourLen = /^[01]/.test(digits) ? 2 : 1;
  const d = digits.slice(0, hourLen + 2);
  if (d.length < hourLen) return d;
  if (d.length === hourLen) {
    if (!deleting) return `${d}:`;
    // The colon is still there → a minute digit went; it is gone → the delete
    // hit the colon, so the hour's last digit goes with it.
    return raw.endsWith(":") ? `${d}:` : d.slice(0, -1);
  }
  return `${d.slice(0, hourLen)}:${d.slice(hourLen)}`;
};

// A 12-hour clock is valid: hour 1–12 (a written leading zero is allowed),
// minute 00–59.
const isValidClock = (clock: string) => /^(0?[1-9]|1[0-2]):[0-5]\d$/.test(clock);

// A full Date → the three parts an InputGroup holds (the inverse of `combine`).
const splitParts = (d: Date): TimeParts => {
  const h24 = d.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return {
    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    clock: `${h12}:${String(d.getMinutes()).padStart(2, "0")}`,
    meridiem: h24 >= 12 ? "PM" : "AM",
  };
};

// The End-time shortcuts under the field (Figma 24105-15788): each sets End to
// Start plus that much, so a session can be logged without typing a clock.
// Five per row on both breakpoints, stretched to equal widths.
const END_OFFSETS: { label: string; minutes: number }[] = [
  { label: "+15m", minutes: 15 },
  { label: "+30m", minutes: 30 },
  { label: "+45m", minutes: 45 },
  { label: "+1h", minutes: 60 },
  { label: "+1.5h", minutes: 90 },
  { label: "+2h", minutes: 120 },
  { label: "+2.5h", minutes: 150 },
  { label: "+3h", minutes: 180 },
  { label: "+3.5h", minutes: 210 },
  { label: "+4h", minutes: 240 },
];

// One labeled InputGroup fusing three segments — Date + masked Time (fixed
// width) + AM/PM select (hugs). The group shows its error only once focus has
// left the time input (never while typing).
const TimeGroup = ({
  label,
  value,
  mobile,
  disabled = false,
  showError,
  errorMessage,
  minDate,
  onDate,
  onClock,
  onMeridiem,
  onFocusTime,
  onBlurTime,
  below,
}: {
  label: string;
  value: TimeParts;
  mobile: boolean;
  disabled?: boolean;
  showError: boolean;
  errorMessage: string;
  minDate?: Date;
  /** Extra content under the field, inside the labeled Input (the End-time chips). */
  below?: ReactNode;
  onDate: (date: Date | null) => void;
  onClock: (clock: string) => void;
  onMeridiem: (m: Meridiem) => void;
  onFocusTime: () => void;
  onBlurTime: () => void;
}) => {
  const mpop = useSelectPopover(mobile);
  return (
    <>
      <Input label={label}>
        <InputGroup disabled={disabled} isValid={!showError} errorMessage={errorMessage}>
          <DateField
            value={value.date}
            onDateChange={onDate}
            breakpoint={mobile ? "mobile" : "desktop"}
            minDate={minDate}
            formatValue={fmtDate}
            pickerLabel="Date"
          />
          <TextField
            className={styles.time}
            value={value.clock}
            onChange={(e) => onClock(maskClock(e.target.value, ((e.nativeEvent as InputEvent).inputType ?? "").startsWith("delete")))}
            onFocus={onFocusTime}
            onBlur={onBlurTime}
            keyboard="numeric"
          />
          <SelectField
            className={styles.ampm}
            value={value.meridiem}
            open={mpop.open}
            onClick={(e: MouseEvent<HTMLDivElement>) => mpop.toggle(e.currentTarget)}
          />
        </InputGroup>
        {below}
      </Input>

      <SelectPopoverList pop={mpop} mobile={mobile}>
        <SelectListItemGroup>
          {MERIDIEMS.map((m) => (
            <SelectListItem
              key={m}
              label={m}
              selected={m === value.meridiem}
              onClick={() => {
                onMeridiem(m);
                mpop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
};

interface SessionFormProps {
  open: boolean;
  onClose: () => void;
  /** The session being edited; unset = adding a new session. Prefills the fields. */
  session?: Session;
  /** Commits the completed form — the consumer adds (or updates) the session row. */
  onSave: (draft: SessionDraft) => void;
  /**
   * The day a NEW session starts on, instead of today. The Timesheet review
   * form's per-day plus passes its own day (Figma 24598-41150: "opens the form
   * with auto-populated 'Start time' date"). Ignored while editing.
   */
  startDate?: Date;
  mobile?: boolean;
}

// The "Time session" form (Figma 24105-15772, 2026-08-04 update). A required
// "Your status" RadioGroup — the four tech statuses as VERTICAL card radios,
// empty error "Choose your status" — over two labeled InputGroups — Start time / End time —
// each fusing Date + masked Time + AM/PM (the DS dateTextSelect shape).
// Adding prefills Start date with today (Daniel: keep) and mirrors it into
// End date; End is disabled until Start time is a valid clock; the End date
// picker can't precede the Start date; moving Start PAST a filled End clears
// End's date, the time stays (node Logic rule 2). End can't be earlier than
// Start (date + time) — "Must be after Start time". Save commits the session
// — Figma toast 24105-15803.
export default function SessionForm({ open, onClose, session, onSave, startDate, mobile = false }: SessionFormProps) {
  const [category, setCategory] = useState("");
  const [start, setStart] = useState<TimeParts>({ date: null, clock: "", meridiem: "AM" });
  const [end, setEnd] = useState<TimeParts>({ date: null, clock: "", meridiem: "AM" });
  const [startTouched, setStartTouched] = useState(false);
  const [endTouched, setEndTouched] = useState(false);
  const [startFocused, setStartFocused] = useState(false);
  const [endFocused, setEndFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // True once the user has manually changed ANY End field. Until then End
  // mirrors Start (item 7: prefill End from Start, consistently — never clear it).
  const [endEdited, setEndEdited] = useState(false);

  // A fresh open prefills. Editing → the session's values (End already set, so no
  // mirroring); adding → Start date is today and End mirrors Start; clocks empty.
  useEffect(() => {
    if (!open) return;
    if (session != null) {
      setCategory(session.category ?? "");
      setStart(parseParts(session.dateLabel, session.startLabel));
      setEnd(parseParts(session.endDateLabel ?? session.dateLabel, session.endLabel));
      setEndEdited(true);
    } else {
      // The caller's day when it named one (the Timesheet review's per-day
      // plus), otherwise today.
      const day = startDate ?? new Date();
      setCategory("");
      setStart({ date: day, clock: "", meridiem: "AM" });
      setEnd({ date: day, clock: "", meridiem: "AM" });
      setEndEdited(false);
    }
    setStartTouched(false);
    setEndTouched(false);
    setStartFocused(false);
    setEndFocused(false);
    setSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session]);

  // Node Logic rule 2: the user moves Start LATER than a filled End → End's
  // DATE resets to empty (the time stays). Runs on every Start change.
  const clearEndIfStartLater = (nextStart: TimeParts) => (e: TimeParts): TimeParts => {
    const comparable = nextStart.date != null && isValidClock(nextStart.clock) && e.date != null && isValidClock(e.clock);
    if (!comparable) return e;
    return combine(nextStart.date!, nextStart.clock, nextStart.meridiem) > combine(e.date!, e.clock, e.meridiem) ? { ...e, date: null } : e;
  };

  // Prefill ONLY the End DATE from Start — the End time stays empty for the user
  // to enter (Daniel: no time prefill). End date mirrors Start date until the user
  // picks a different End date (node Logic rule 1).
  const onStartDate = (date: Date | null) => {
    const nextStart = { ...start, date };
    setStart(nextStart);
    setEnd((e) => clearEndIfStartLater(nextStart)(!endEdited && date != null ? { ...e, date } : e));
  };
  const onStartClock = (clock: string) => {
    const nextStart = { ...start, clock };
    setStart(nextStart);
    setEnd(clearEndIfStartLater(nextStart));
  };
  const onStartMeridiem = (meridiem: Meridiem) => {
    const nextStart = { ...start, meridiem };
    setStart(nextStart);
    setEnd(clearEndIfStartLater(nextStart));
  };

  // End time is locked until Start time is provided (a valid clock — the date
  // is prefilled; Figma annotation "Disabled until start time provided").
  const endDisabled = !isValidClock(start.clock);

  // The offset chips share that gate — without a Start there is nothing to add
  // to. Picking one fills End outright and counts as editing it, so the date
  // mirroring stops and the field can show its own errors.
  const startAt = start.date != null && !endDisabled ? combine(start.date, start.clock, start.meridiem) : null;
  const applyOffset = (minutes: number) => {
    if (startAt == null) return;
    setEnd(splitParts(new Date(startAt.getTime() + minutes * 60_000)));
    setEndEdited(true);
    setEndTouched(true);
  };
  // A chip reads as active when End is exactly that far after Start.
  const offsetActive = (minutes: number) => {
    if (startAt == null || end.date == null || !isValidClock(end.clock)) return false;
    return combine(end.date, end.clock, end.meridiem).getTime() - startAt.getTime() === minutes * 60_000;
  };

  const startClockBad = !isValidClock(start.clock);
  const endClockBad = !isValidClock(end.clock);
  // End must be strictly after Start (date + time) — no negative sessions.
  const endBeforeStart =
    !startClockBad &&
    !endClockBad &&
    start.date != null &&
    end.date != null &&
    combine(end.date, end.clock, end.meridiem) <= combine(start.date, start.clock, start.meridiem);
  // Error copies (Figma 24114-16327): a bad clock → "Invalid time"; a missing
  // date (rule 2 cleared it) → the DS missing-value copy; End ≤ Start →
  // "Must be after Start time".
  const startError = startClockBad ? "Invalid time" : "Provide Start time";
  const endError = endClockBad ? "Invalid time" : end.date == null ? "Provide End time" : "Must be after Start time";

  // Error appears only once focus has LEFT the input (blurred / submitted), never
  // while typing — an empty field (or a missing date) only errors on Save.
  const startShowError =
    !startFocused && ((submitted && (startClockBad || start.date == null)) || (startClockBad && startTouched && start.clock !== ""));
  const endShowError =
    !endDisabled &&
    !endFocused &&
    ((submitted && (endClockBad || end.date == null || endBeforeStart)) || ((endClockBad || endBeforeStart) && endTouched && end.clock !== ""));

  const save = () => {
    // The status is required — Save with none picked shows the select's
    // "Choose Status" error alongside any time errors.
    if (category === "" || startClockBad || endClockBad || endBeforeStart || start.date == null || end.date == null) {
      setSubmitted(true);
      return;
    }
    onSave({
      category,
      startDate: start.date,
      startClock: start.clock,
      startMeridiem: start.meridiem,
      endDate: end.date,
      endClock: end.clock,
      endMeridiem: end.meridiem,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Time session"
      breakpoint={mobile ? "mobile" : "desktop"}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        {/* Status — a VERTICAL stack of card radios over the four tech
            statuses (Figma 24105-15772, error copy from 24114-16327). */}
        <Input label="Your status">
          <RadioGroup
            value={category}
            onChange={setCategory}
            isValid={!(submitted && category === "")}
            errorMessage="Choose your status"
          >
            {TECH_STATUSES.map((s) => (
              <RadioItem key={s.value} value={s.value} variant="card" icon={s.icon} iconPack="regular" label={s.value} />
            ))}
          </RadioGroup>
        </Input>

        <TimeGroup
          label="Start time"
          value={start}
          mobile={mobile}
          showError={startShowError}
          errorMessage={startError}
          onDate={onStartDate}
          onClock={onStartClock}
          onMeridiem={onStartMeridiem}
          onFocusTime={() => setStartFocused(true)}
          onBlurTime={() => {
            setStartFocused(false);
            setStartTouched(true);
          }}
        />
        <TimeGroup
          label="End time"
          value={end}
          mobile={mobile}
          disabled={endDisabled}
          showError={endShowError}
          errorMessage={endError}
          minDate={start.date ?? undefined}
          onDate={(date) => {
            setEnd((e) => ({ ...e, date }));
            setEndEdited(true); // a manual End date stops the date mirroring
          }}
          onClock={(clock) => setEnd((e) => ({ ...e, clock }))}
          onMeridiem={(m) => setEnd((e) => ({ ...e, meridiem: m }))}
          onFocusTime={() => setEndFocused(true)}
          onBlurTime={() => {
            setEndFocused(false);
            setEndTouched(true);
          }}
          below={
            <div className={styles.offsets}>
              {END_OFFSETS.map((o) => (
                <Chip
                  key={o.label}
                  size="md"
                  isSelected={offsetActive(o.minutes)}
                  isDisabled={endDisabled}
                  onClick={() => applyOffset(o.minutes)}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          }
        />
      </div>

    </Dialog>
  );
}
