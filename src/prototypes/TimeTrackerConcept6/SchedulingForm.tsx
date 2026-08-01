import { MouseEvent, useEffect, useState } from "react";

import AvatarUser from "../../components/Avatar/AvatarUser";
import Button from "../../components/Button/Button";
import Chip from "../../components/Chip/Chip";
import DateField from "../../components/Fields/DateField/DateField";
import Dialog from "../../components/Dialog/Dialog";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import IconButton from "../../components/IconButton/IconButton";
import Input from "../../components/Input/Input";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectField from "../../components/Fields/SelectField/SelectField";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import TextField from "../../components/Fields/TextField/TextField";
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { users } from "../../data/users";
import { SelectPopoverList, useSelectPopover } from "./selectPopover";

import styles from "./SchedulingForm.module.scss";

// ---- data model -------------------------------------------------------------

export interface Scheduling {
  date: Date | null;
  time: string; // "12:00 PM"
  hours: string; // typed, e.g. "1"
  minutes: string; // "00" | "15" | "30" | "45"
  assignees: number[]; // user ids
}

// All 24 hours in 15-minute steps, starting 6:00 AM and wrapping to 5:45 AM.
const TIME_OPTIONS = ((): string[] => {
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
const MINUTE_OPTIONS = ["00", "15", "30", "45"];
const DURATION_PRESETS: { label: string; hours: string; minutes: string }[] = [
  { label: "30 min", hours: "0", minutes: "30" },
  { label: "1 hr", hours: "1", minutes: "00" },
  { label: "1 hr 30 min", hours: "1", minutes: "30" },
  { label: "2 hr", hours: "2", minutes: "00" },
  { label: "2 hr 30 min", hours: "2", minutes: "30" },
];
// The searchable people pool (the first 10 demo users, shown alphabetically).
const ASSIGNEE_POOL = [...users.slice(0, 10)].sort((a, b) => a.name.localeCompare(b.name));

// "Mon, Jan 1" — weekday + short month/day (the Scheduling module value).
const SHORT_DATE = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
// "Mon, Jan 1, 2026" — the date field's display format inside the edit form.
const EDIT_DATE = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
export const formatEditDate = (d: Date) => EDIT_DATE.format(d);

/** "Mon, Jan 1 at 12:00 PM" — the value shown in the Details panel's Scheduling module. */
export const scheduledForLabel = (s: Scheduling) =>
  s.date != null ? `${SHORT_DATE.format(s.date)} at ${s.time}` : s.time;

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
  return { date: d, time: "12:00 PM", hours: "1", minutes: "30", assignees: [1, 2, 5] };
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

interface SchedulingFormProps {
  open: boolean;
  onClose: () => void;
  initial: Scheduling;
  onSave: (next: Scheduling) => void;
  mobile?: boolean;
}

export default function SchedulingForm({ open, onClose, initial, onSave, mobile = false }: SchedulingFormProps) {
  const [date, setDate] = useState<Date | null>(initial.date);
  const [time, setTime] = useState(initial.time);
  const [hours, setHours] = useState(initial.hours);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [assignees, setAssignees] = useState<number[]>(initial.assignees);

  // A fresh open resets the draft to the saved values.
  useEffect(() => {
    if (!open) return;
    setDate(initial.date);
    setTime(initial.time);
    setHours(initial.hours);
    setMinutes(initial.minutes);
    setAssignees(initial.assignees);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const timePop = useSelectPopover(mobile);
  const minutePop = useSelectPopover(mobile);
  const assigneePop = useSelectPopover(mobile);

  // When the form itself closes, force every nested select popover shut — else a
  // popover left open (e.g. dismissed together with the form) would still be
  // "open" in state and pop straight back up when the form is reopened.
  useEffect(() => {
    if (open) return;
    timePop.close();
    minutePop.close();
    assigneePop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleAssignee = (id: number) =>
    setAssignees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const assigneeUsers = assignees.map((id) => users.find((u) => u.id === id)).filter((u): u is (typeof users)[number] => u != null);

  // Exactly one selected → show that person's name; more → the summary copy
  // (the multi-select SelectField rule).
  const assigneeValue = assignees.length === 1 ? assigneeUsers[0]?.name : "Assignees selected";

  // "Dirty" = any value differs from the saved scheduling. When dirty, the
  // Dialog warns before discarding (close X / scrim).
  const sameAssignees =
    assignees.length === initial.assignees.length && assignees.every((id) => initial.assignees.includes(id));
  const sameDate = (date?.getTime() ?? null) === (initial.date?.getTime() ?? null);
  const dirty = !sameDate || time !== initial.time || hours !== initial.hours || minutes !== initial.minutes || !sameAssignees;

  const save = () => {
    onSave({ date, time, hours, minutes, assignees });
    toast({ type: "success", title: '"Scheduling" updated' });
    onClose();
  };

  const activePreset = (p: (typeof DURATION_PRESETS)[number]) => p.hours === String(parseInt(hours, 10) || 0) && p.minutes === minutes;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Scheduling"
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
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        <FormModuleGroup>
          <FormModule title="Details">
          {/* Date & time */}
          <Input label="Date & time">
            <InputGroup>
              <DateField value={date} onDateChange={setDate} formatValue={formatEditDate} breakpoint={mobile ? "mobile" : "desktop"} />
              <SelectField
                value={time}
                open={timePop.open}
                onClick={(e: MouseEvent<HTMLDivElement>) => timePop.toggle(e.currentTarget)}
              />
            </InputGroup>
          </Input>

          {/* Duration */}
          <div className={styles.duration}>
            <Input label="Duration">
              <InputGroup>
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
                  active={activePreset(p)}
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
          </FormModule>

          <FormModule title="Assignees">
            <SelectField
              multiSelect
              count={assignees.length}
              value={assigneeValue}
              multiSelectLabel="Assignees selected"
            onClearSelection={() => setAssignees([])}
            open={assigneePop.open}
            onClick={(e: MouseEvent<HTMLDivElement>) => assigneePop.toggle(e.currentTarget)}
          />
          {assigneeUsers.length > 0 && (
            <DisplayModule
              variant="bodyOnly"
              content={
                <div className={styles.listBody}>
                  <ItemGroup>
                    {assigneeUsers.map((u) => (
                      <ListItem
                        key={u.id}
                        variant="title"
                        title={u.name}
                        avatar={<AvatarUser size="xl" imageSrc={u.avatar} />}
                        slotRight={
                          <HoverTooltip text="Remove">
                            <IconButton
                              icon="xmark"
                              variant="ghost"
                              size="md"
                              aria-label={`Remove ${u.name}`}
                              onClick={() => toggleAssignee(u.id)}
                            />
                          </HoverTooltip>
                        }
                      />
                    ))}
                  </ItemGroup>
                </div>
              }
            />
          )}
          </FormModule>
        </FormModuleGroup>
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

      {/* Assignees picker */}
      <SelectPopoverList
        pop={assigneePop}
        mobile={mobile}
        title="Assignees"
        multiSelect
        searchable
        // NOT "…user name…": WebKit reads "user name" as a username field and
        // pops the iOS password-autofill bar over the keyboard. "assignees"
        // avoids the heuristic (the client/time searches never hit it).
        searchPlaceholder="Search assignees..."
      >
        <SelectListItemGroup>
          {ASSIGNEE_POOL.map((u) => (
            <SelectListItem
              key={u.id}
              multiSelect
              selected={assignees.includes(u.id)}
              slotLeft={<AvatarUser size="xs" imageSrc={u.avatar} />}
              label={u.name}
              onClick={() => toggleAssignee(u.id)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </Dialog>
  );
}
