import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import DateField from "../../components/Fields/DateField/DateField";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { SelectPopoverList, useSelectPopover } from "./selectPopover";
import { Session } from "./TimesheetPanel";

import styles from "./SessionForm.module.scss";

export type Meridiem = "AM" | "PM";
const MERIDIEMS: Meridiem[] = ["AM", "PM"];

// The session statuses (Figma 24105-15788) — same pair as check-in.
const STATUSES = [
  { value: "Travelling", icon: "van" },
  { value: "Working", icon: "wrench-simple" },
];

// The completed form values handed back on Save (dates are non-null once valid).
export interface SessionDraft {
  /** The picked status — "Travelling" / "Working". */
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

// One labelled InputGroup fusing three segments — Date + masked Time (fixed
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
}: {
  label: string;
  value: TimeParts;
  mobile: boolean;
  disabled?: boolean;
  showError: boolean;
  errorMessage: string;
  minDate?: Date;
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
  mobile?: boolean;
}

// The "Time session" form (Figma 24105-15773 mobile / 24105-15788 desktop).
// A required status RadioGroup (Travelling / Working — error 24114-16327:
// "Choose an option") over two labelled InputGroups — Start time / End time —
// each fusing Date + masked Time + AM/PM. Adding prefills Start date with today
// and mirrors it into End date; End is disabled until Start time is a valid
// clock; the End date picker can't precede the Start date. End can't be earlier
// than Start (date + time). Save commits the session — Figma toast 24105-15803.
export default function SessionForm({ open, onClose, session, onSave, mobile = false }: SessionFormProps) {
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
      const today = new Date();
      setCategory("");
      setStart({ date: today, clock: "", meridiem: "AM" });
      setEnd({ date: today, clock: "", meridiem: "AM" });
      setEndEdited(false);
    }
    setStartTouched(false);
    setEndTouched(false);
    setStartFocused(false);
    setEndFocused(false);
    setSubmitted(false);
  }, [open, session]);

  // Prefill ONLY the End DATE from Start — the End time stays empty for the user
  // to enter (Daniel: no time prefill). End date mirrors Start date until the user
  // picks a different End date; Start's date never CLEARS End's (the old bug).
  const onStartDate = (date: Date | null) => {
    setStart((s) => ({ ...s, date }));
    if (!endEdited && date != null) setEnd((e) => ({ ...e, date }));
  };
  const onStartClock = (clock: string) => setStart((s) => ({ ...s, clock }));
  const onStartMeridiem = (meridiem: Meridiem) => setStart((s) => ({ ...s, meridiem }));

  // End time is locked until Start time is a valid clock.
  const endDisabled = !isValidClock(start.clock);

  const startBad = !isValidClock(start.clock);
  const endClockBad = !isValidClock(end.clock);
  // End must be strictly after Start (date + time) — no negative sessions.
  const endBeforeStart =
    !startBad && !endClockBad && start.date != null && end.date != null && combine(end.date, end.clock, end.meridiem) <= combine(start.date, start.clock, start.meridiem);
  const endError = endClockBad ? "Invalid time" : "End time must be after start time";
  const endBad = endClockBad || endBeforeStart;

  // Error appears only once focus has LEFT the input (blurred / submitted), never
  // while typing — an empty field only errors on Save.
  const startShowError = startBad && !startFocused && (submitted || (startTouched && start.clock !== ""));
  const endShowError = !endDisabled && endBad && !endFocused && (submitted || (endTouched && end.clock !== ""));

  const save = () => {
    // The status is required (Figma 24114-16327) — Save with none picked shows
    // the RadioGroup error alongside any time errors.
    if (category === "" || startBad || endBad || start.date == null || end.date == null) {
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
        {/* Status — horizontal on BOTH breakpoints (mobile node 24105-15773
            shows the two cards side by side). */}
        <Input label="What time do you want to log?">
          <RadioGroup
            orientation="horizontal"
            value={category}
            onChange={setCategory}
            isValid={!(submitted && category === "")}
            errorMessage="Choose an option"
          >
            {STATUSES.map((s) => (
              <RadioItem key={s.value} value={s.value} variant="card" icon={s.icon} iconPack="regular" label={s.value} />
            ))}
          </RadioGroup>
        </Input>

        <TimeGroup
          label="Start time"
          value={start}
          mobile={mobile}
          showError={startShowError}
          errorMessage="Invalid time"
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
        />
      </div>
    </Dialog>
  );
}
