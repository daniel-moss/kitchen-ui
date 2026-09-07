import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Chip from "../../components/Chip/Chip";
import DateField from "../../components/Fields/DateField/DateField";
import Dialog from "../../components/Dialog/Dialog";
import Input from "../../components/Input/Input";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectField from "../../components/Fields/SelectField/SelectField";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import TextField from "../../components/Fields/TextField/TextField";
import { toast } from "../../components/Toast/Toaster";
import { SelectPopoverList, useSelectPopover } from "../../modules/shared/selectPopover";
import { JOB_ID } from "./jobData";

import styles from "./SchedulingForm.module.scss";

// ---- data model -------------------------------------------------------------

export interface Scheduling {
  date: Date | null;
  time: string; // "12:00 PM"
  hours: string; // typed, e.g. "1"
  minutes: string; // "00" | "15" | "30" | "45"
}

// All 24 hours in 15-minute steps, starting 6:00 AM and wrapping to 5:45 AM.
export const TIME_OPTIONS = ((): string[] => {
  const out: string[] = [];
  const start = 6 * 60; // 6:00 AM
  for (let i = 0; i < 96; i++) {
    const total = (start + i * 15) % (24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    const ampm = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    out.push(`${h12}:${String(m).padStart(2, "0")} ${ampm}`);
  }
  return out;
})();
export const MINUTE_OPTIONS = ["00", "15", "30", "45"];
// Exported for HvacPmStepForm — its "Estimated time to complete" uses the
// same presets (verified identical in the stepper design 24337-41981).
export const DURATION_PRESETS: { label: string; hours: string; minutes: string }[] = [
  { label: "30 min", hours: "0", minutes: "30" },
  { label: "1 hr", hours: "1", minutes: "00" },
  { label: "1 hr 30 min", hours: "1", minutes: "30" },
  { label: "2 hr", hours: "2", minutes: "00" },
  { label: "2 hr 30 min", hours: "2", minutes: "30" },
];
// "Mon, Jan 1" (+ ", YYYY" only when the year is not the current one — the
// app-wide year rule).
const SHORT_DATE = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const SHORT_DATE_YEAR = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const shortDate = (d: Date) => (d.getFullYear() === new Date().getFullYear() ? SHORT_DATE : SHORT_DATE_YEAR).format(d);
export const formatEditDate = shortDate;

// "Monday, January 1" — the Schedule-job toast's caption format (Figma
// 24049-13916), with the year added only when it is not the current one (the
// app-wide date rule).
const LONG_DATE = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const LONG_DATE_YEAR = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const longDate = (d: Date) => (d.getFullYear() === new Date().getFullYear() ? LONG_DATE : LONG_DATE_YEAR).format(d);

/** "Mon, Jan 1 at 12:00 PM" — the value shown in the Details panel's Scheduling module. */
export const scheduledForLabel = (s: Scheduling) =>
  s.date != null ? `${shortDate(s.date)} at ${s.time}` : s.time;

/** Combine the scheduling date + "h:mm AM/PM" time into a single Date (null if unset). */
export function schedulingDateTime(s: Scheduling): Date | null {
  if (s.date == null) return null;
  const d = new Date(s.date);
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s.time.trim());
  if (m != null) {
    let h = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) h += 12;
    d.setHours(h, parseInt(m[2], 10), 0, 0);
  }
  return d;
}

/** Past due = the scheduled date+time is before now. */
export function isPastDue(s: Scheduling): boolean {
  const dt = schedulingDateTime(s);
  return dt != null && dt.getTime() < Date.now();
}

/** The demo default: a near-future noon slot, so the job reads "Upcoming". */
export function defaultScheduling(): Scheduling {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  d.setHours(12, 0, 0, 0);
  return { date: d, time: "12:00 PM", hours: "1", minutes: "30" };
}

/** "1 hr 30 min" (drops a zero part). */
export const durationLabel = (hours: string, minutes: string) => {
  const h = parseInt(hours, 10) || 0;
  const m = parseInt(minutes, 10) || 0;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0) parts.push(`${m} min`);
  return parts.join(" ") || "0 min";
};

// ---- the form ---------------------------------------------------------------

/** Which half of the "Date & time" choice is picked. */
type ScheduleMode = "unschedule" | "schedule";

interface SchedulingFormProps {
  open: boolean;
  onClose: () => void;
  initial: Scheduling;
  onSave: (next: Scheduling) => void;
  mobile?: boolean;
  /** Dialog title. Default "Scheduling". */
  title?: string;
  /**
   * Forces which half of the "Date & time" choice opens selected — the
   * "Schedule job" / "Unschedule job" actions each pre-pick their own (Daniel,
   * 2026-08-05). Left out (the module's pen), the form opens on the job's
   * current state.
   */
  initialMode?: ScheduleMode;
}

// The Scheduling dialog (Figma 24522-84503). ONE form for all four entry
// points — the module's pen, "Schedule job", "Reschedule job" and "Unschedule
// job" (Daniel, 2026-08-05). "Date & time" is a radio: Unschedule clears the
// slot, Schedule reveals the date + time pair. Duration always shows, with its
// five presets. Assignees left this form on 2026-08-05 — they are their own
// module now.
export default function SchedulingForm({
  open,
  onClose,
  initial,
  onSave,
  mobile = false,
  title = "Scheduling",
  initialMode,
}: SchedulingFormProps) {
  const [date, setDate] = useState<Date | null>(initial.date);
  const [time, setTime] = useState(initial.time);
  const [hours, setHours] = useState(initial.hours);
  const [minutes, setMinutes] = useState(initial.minutes);
  // The form opens on the job's real state: a scheduled job on "Schedule", an
  // unscheduled one on "Unschedule".
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(initialMode ?? (initial.date != null ? "schedule" : "unschedule"));
  const [showErrors, setShowErrors] = useState(false);

  // A fresh open resets the draft to the saved values.
  useEffect(() => {
    if (!open) return;
    setDate(initial.date);
    setTime(initial.time);
    setHours(initial.hours);
    setMinutes(initial.minutes);
    setScheduleMode(initialMode ?? (initial.date != null ? "schedule" : "unschedule"));
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const timePop = useSelectPopover(mobile);
  const minutePop = useSelectPopover(mobile);

  // When the form itself closes, force every nested select popover shut — else a
  // popover left open (e.g. dismissed together with the form) would still be
  // "open" in state and pop straight back up when the form is reopened.
  useEffect(() => {
    if (open) return;
    timePop.close();
    minutePop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // "Dirty" = any value differs from the saved scheduling. When dirty, the
  // Dialog warns before discarding (close X / scrim).
  const unscheduling = scheduleMode === "unschedule";
  const sameDate = (unscheduling ? null : date?.getTime() ?? null) === (initial.date?.getTime() ?? null);
  const dirty = !sameDate || (!unscheduling && time !== initial.time) || hours !== initial.hours || minutes !== initial.minutes;

  // The primary button names what saving will DO (Figma 24522-88085 / 88541 /
  // 88893): Unschedule, or Schedule / Reschedule depending on whether the job
  // already had a slot.
  const submitLabel = unscheduling ? "Unschedule" : initial.date != null ? "Reschedule" : "Schedule";

  // Scheduling requires the whole slot AND a duration; unscheduling requires
  // nothing (the duration stays as it is).
  const dateTimeBad = !unscheduling && (date == null || time === "");
  const durationBad = !unscheduling && (parseInt(hours, 10) || 0) === 0 && (parseInt(minutes, 10) || 0) === 0;

  const save = () => {
    if (dateTimeBad || durationBad) {
      setShowErrors(true);
      return;
    }
    // Unscheduling clears the slot and keeps everything else.
    const next: Scheduling = unscheduling
      ? { ...initial, date: null, time: "", hours, minutes }
      : { ...initial, date, time, hours, minutes };
    onSave(next);
    // The toasts name the JOB (Figma 24531-90433 / 24532-90489 / 24531-90463),
    // in the double quotes every other id toast here uses. Scheduling and
    // rescheduling are DETAILED — the caption is the slot the job landed on
    // plus its duration; unscheduling has no slot left, so it stays title-only.
    const title = `"${JOB_ID}" ${unscheduling ? "unscheduled" : initial.date != null ? "rescheduled" : "scheduled"}`;
    toast(
      unscheduling || date == null
        ? { type: "success", title }
        : { type: "success", variant: "detailed", title, caption: `${longDate(date)} at ${time} for ${durationLabel(hours, minutes)}` },
    );
    onClose();
  };

  const activePreset = (p: (typeof DURATION_PRESETS)[number]) => p.hours === String(parseInt(hours, 10) || 0) && p.minutes === minutes;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={save}>
            {submitLabel}
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        {/* Date & time — a choice, not a plain field (Figma 24522-88085).
            "Schedule" reveals the date + time pair inside its own card. */}
        <Input label="Date & time">
          <RadioGroup value={scheduleMode} onChange={(v) => setScheduleMode(v as ScheduleMode)}>
            <RadioItem value="unschedule" variant="card" icon="calendar-xmark" iconPack="regular" label="Unschedule" />
            <RadioItem
              value="schedule"
              variant="card"
              icon="calendar-check"
              iconPack="regular"
              label="Schedule"
              error={showErrors && dateTimeBad}
              content={
                <Input label="Date & time">
                  <InputGroup isValid={!(showErrors && dateTimeBad)}>
                    <DateField value={date} onDateChange={setDate} formatValue={formatEditDate} breakpoint={mobile ? "mobile" : "desktop"} />
                    <SelectField
                      value={time}
                      open={timePop.open}
                      onClick={(e: MouseEvent<HTMLDivElement>) => timePop.toggle(e.currentTarget)}
                    />
                  </InputGroup>
                </Input>
              }
            />
          </RadioGroup>
        </Input>

        {/* Duration */}
        <div className={styles.duration}>
            <Input label="Duration">
              <InputGroup isValid={!(showErrors && durationBad)}>
                <TextField
                  value={hours}
                  onChange={(e) => setHours(e.target.value.replace(/[^\d]/g, ""))}
                  keyboard="numeric"
                  suffix="hr"
                />
                <SelectField
                  value={minutes}
                  suffix="min"
                  open={minutePop.open}
                  onClick={(e: MouseEvent<HTMLDivElement>) => minutePop.toggle(e.currentTarget)}
                />
              </InputGroup>
            </Input>
            <div className={styles.chips}>
              {DURATION_PRESETS.map((p) => (
                <Chip
                  key={p.label}
                  size="md"
                  isSelected={activePreset(p)}
                  onClick={() => {
                    setHours(p.hours);
                    setMinutes(p.minutes);
                  }}
                >
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>
      </div>

      {/* Time picker */}
      <SelectPopoverList pop={timePop} mobile={mobile} title="Time" searchable searchPlaceholder="Search time...">
        <SelectListItemGroup>
          {TIME_OPTIONS.map((t) => (
            <SelectListItem
              key={t}
              label={t}
              selected={t === time}
              onClick={() => {
                setTime(t);
                timePop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* Minutes picker */}
      <SelectPopoverList pop={minutePop} mobile={mobile} title="Minutes">
        <SelectListItemGroup>
          {MINUTE_OPTIONS.map((m) => (
            <SelectListItem
              key={m}
              label={m}
              selected={m === minutes}
              onClick={() => {
                setMinutes(m);
                minutePop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

    </Dialog>
  );
}
