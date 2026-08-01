import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import DateField from "../../components/Fields/DateField/DateField";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { SelectPopoverList, useSelectPopover } from "./selectPopover";
import { Session } from "./TimesheetPanel";

import styles from "./SessionForm.module.scss";

export type Meridiem = "AM" | "PM";
const MERIDIEMS: Meridiem[] = ["AM", "PM"];

// The completed form values handed back on Save (dates are non-null once valid).
export interface SessionDraft {
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

// "9:00" → "09:00" — the input always shows a 2-digit hour ("00:00" format).
const padClock = (c: string) => {
  const [h, m] = c.split(":");
  return h != null && m != null ? `${h.padStart(2, "0")}:${m}` : c;
};

// "11:30 AM" → { clock: "11:30", meridiem: "AM" }; "January 1, 2026" → a Date.
const parseParts = (dateLabel?: string, timeLabel?: string): TimeParts => ({
  date: dateLabel != null ? new Date(dateLabel) : null,
  clock: timeLabel != null ? padClock(timeLabel.replace(/\s*(AM|PM)\s*/i, "").trim()) : "",
  meridiem: timeLabel != null && /PM/i.test(timeLabel) ? "PM" : "AM",
});

// Mask any input to a "HH:MM" clock: keep ≤ 4 digits, drop a colon in after 2.
const maskClock = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
};

// A 12-hour clock is valid: hour 01–12, minute 00–59.
const isValidClock = (clock: string) => /^(0[1-9]|1[0-2]):[0-5]\d$/.test(clock);

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
            onChange={(e) => onClock(maskClock(e.target.value))}
            onFocus={onFocusTime}
            onBlur={onBlurTime}
            keyboard="numeric"
            placeholder="00:00"
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

// The "Time session" form (Figma node 24105-15772). Two labelled InputGroups —
// Start time / End time — each fusing Date + masked Time + AM/PM. Adding
// prefills Start date with today and mirrors it into End date; End is disabled
// until Start time is a valid clock; the End date picker can't precede the Start
// date, and moving Start past End clears End's date. End can't be earlier than
// Start (date + time). Save commits the session — Figma toast 24105-15803.
export default function SessionForm({ open, onClose, session, onSave, mobile = false }: SessionFormProps) {
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
      setStart(parseParts(session.dateLabel, session.startLabel));
      setEnd(parseParts(session.endDateLabel ?? session.dateLabel, session.endLabel));
      setEndEdited(true);
    } else {
      const today = new Date();
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
    if (startBad || endBad || start.date == null || end.date == null) {
      setSubmitted(true);
      return;
    }
    onSave({
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
