import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import DateField from "../../components/Fields/DateField/DateField";
import InputGroup from "../../components/Fields/InputGroup/InputGroup";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import { TEXT_SEPARATOR } from "../../utils/textSeparator";
import AssigneesField from "../shared/AssigneesField";
import DurationField from "../shared/DurationField";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";

import { formatEditDate, formatFullDate, Scheduling, TIME_OPTIONS } from "./SchedulingForm";
import { TECH_INSTRUCTIONS_HINT } from "./ServiceForm";
import styles from "./RescheduleJobForm.module.scss";

/** What the "Schedule" / "Reschedule" button commits. */
export interface RescheduleResult {
  scheduling: Scheduling;
  assignees: number[];
  reason: string;
  tech: string;
  /** The required "Reschedule reason" — the Status module's message ("" when scheduling). */
  rescheduleReason: string;
  /** The viewer's running session ends with the reschedule. */
  checkOut: boolean;
}

export interface RescheduleJobFormProps {
  /**
   * "reschedule" (default, Figma 27091-45839) — the "Reschedule" menu item.
   * "schedule" (Figma 27163-54879) — an Unscheduled job's "Schedule" button:
   * the same fields WITHOUT the Reschedule reason and the clock choice, a
   * "Schedule" button and the "Job scheduled" toast.
   */
  mode?: "schedule" | "reschedule";
  open: boolean;
  onClose: () => void;
  /** The job's current scheduling — only its DURATION pre-fills. */
  scheduling: Scheduling;
  /** The job's current assignees (pre-filled). */
  assignees: number[];
  /** The job's current Reason for call / Tech instructions (pre-filled). */
  reason: string;
  tech: string;
  /**
   * The viewer's running time session, e.g. "Working: 01:30:05" — shows the
   * clock choice. Null when the viewer is not an ASSIGNEE who is checked in
   * (Figma 27163-54380): no choice. Reschedule only.
   */
  runningSession?: string | null;
  onReschedule: (result: RescheduleResult) => void;
  mobile?: boolean;
}

const toMinutes = (s: Scheduling) => (parseInt(s.hours, 10) || 0) * 60 + (parseInt(s.minutes, 10) || 0);

// "Reschedule job" (Figma 27091-45839) — opened by the "Reschedule" menu item
// of an Active / Paused / On hold job. The fields are the New Job form's own
// (their docs live there): Date & time (EMPTY — a new slot must be picked),
// Est. duration, Assignees (optional), Reason for call and Tech instructions
// (optional) — all pre-filled but the date — then the required "Reschedule
// reason". A viewer whose clock is running also chooses whether to stay
// checked in. "Reschedule" applies it all, sets the job to Upcoming and toasts
// "Job rescheduled".
//
// The SAME form is "Schedule job" (Figma 27163-54879, mode "schedule") — an
// Unscheduled job's "Schedule" button: no Reschedule reason, no clock choice,
// "Schedule" and "Job scheduled".
export default function RescheduleJobForm({
  mode = "reschedule",
  open,
  onClose,
  scheduling,
  assignees: initialAssignees,
  reason: initialReason,
  tech: initialTech,
  runningSession = null,
  onReschedule,
  mobile = false,
}: RescheduleJobFormProps) {
  const rescheduling = mode === "reschedule";
  // The clock choice is a reschedule's only — scheduling never meets a running session.
  const clock = rescheduling ? runningSession : null;
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState<number | null>(toMinutes(scheduling) || null);
  const [assignees, setAssignees] = useState(initialAssignees);
  const [reason, setReason] = useState(initialReason);
  const [tech, setTech] = useState(initialTech);
  const [rescheduleReason, setRescheduleReason] = useState("");
  // No company setting exists for the default yet, so it is "Check out" (the
  // block's annotation: the company default when there is one, else Check out).
  const [session, setSession] = useState<"stay" | "checkOut">("checkOut");
  const [showErrors, setShowErrors] = useState(false);
  const timePop = useSelectPopover(mobile, "belowEnd");

  // A fresh open reloads the job's values; closing forces the time list shut.
  useEffect(() => {
    if (!open) {
      timePop.close();
      return;
    }
    setDate(null);
    setTime("");
    setDuration(toMinutes(scheduling) || null);
    setAssignees(initialAssignees);
    setReason(initialReason);
    setTech(initialTech);
    setRescheduleReason("");
    setSession("checkOut");
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty =
    date != null ||
    time !== "" ||
    duration !== (toMinutes(scheduling) || null) ||
    assignees.join() !== initialAssignees.join() ||
    reason !== initialReason ||
    tech !== initialTech ||
    rescheduleReason !== "";

  const dateTimeBad = date == null || time === "";
  const durationBad = duration == null || duration === 0;
  const reasonBad = reason.trim() === "";
  const rescheduleReasonBad = rescheduling && rescheduleReason.trim() === "";

  const submit = () => {
    if (dateTimeBad || durationBad || reasonBad || rescheduleReasonBad) {
      setShowErrors(true);
      return;
    }
    const minutes = duration ?? 0;
    onReschedule({
      scheduling: {
        ...scheduling,
        date,
        time,
        hours: String(Math.floor(minutes / 60)),
        minutes: String(minutes % 60).padStart(2, "0"),
      },
      assignees,
      reason,
      tech,
      rescheduleReason: rescheduleReason.trim(),
      checkOut: clock != null && session === "checkOut",
    });
    toast({ type: "success", title: rescheduling ? "Job rescheduled" : "Job scheduled" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={rescheduling ? "Reschedule job" : "Schedule job"}
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
          <Button size="lg" variant="solid" leftIcon="calendar-lines-pen" onClick={submit}>
            {rescheduling ? "Reschedule" : "Schedule"}
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        {/* One fused field, one shared error — "Provide Date & time". The
            time hugs its value but never goes under 96px (New Job 17241-69326). */}
        <Input label="Date & time">
          <InputGroup isValid={!(showErrors && dateTimeBad)}>
            <DateField
              value={date}
              onDateChange={setDate}
              formatValue={mobile ? formatEditDate : formatFullDate}
              breakpoint={mobile ? "mobile" : "desktop"}
            />
            <SelectField
              value={time || undefined}
              fitContent
              className={styles.timeField}
              open={timePop.open}
              onClick={(event: MouseEvent<HTMLDivElement>) => timePop.toggle(event.currentTarget)}
            />
          </InputGroup>
        </Input>

        <Input label="Est. duration">
          <DurationField value={duration} onChange={setDuration} mobile={mobile} isValid={!(showErrors && durationBad)} />
        </Input>

        <AssigneesField value={assignees} onChange={setAssignees} mobile={mobile} showLabel />

        <Input label="Reason for call">
          <TextArea value={reason} onChange={(event) => setReason(event.target.value)} isValid={!(showErrors && reasonBad)} />
        </Input>

        <Input label="Tech instructions" labelCondition="optional" labelHintContent={TECH_INSTRUCTIONS_HINT}>
          <TextArea value={tech} onChange={(event) => setTech(event.target.value)} />
        </Input>

        {/* Shows in the Status module as the status message, under its own
            label (Figma 27146-48368). Required; no character limit. */}
        {rescheduling && (
          <Input label="Reschedule reason" helpText="Why does this job need to be rescheduled?">
            <TextArea
              value={rescheduleReason}
              onChange={(event) => setRescheduleReason(event.target.value)}
              isValid={!(showErrors && rescheduleReasonBad)}
            />
          </Input>
        )}

        {/* Check in / out (Figma 27163-54380): only for an assignee whose clock
            runs. The label names the running session — its status and tracked
            time — and the choice is required; "Check out" by default (no
            company preference in the demo). */}
        {clock != null && (
          <Input label={`Your clock is running${TEXT_SEPARATOR}${clock}`}>
            <RadioGroup orientation="horizontal" value={session} onChange={(value) => setSession(value as "stay" | "checkOut")}>
              <RadioItem value="stay" variant="card" icon="arrow-right-to-arc" iconPack="solid" label="Stay checked in" />
              <RadioItem value="checkOut" variant="card" icon="arrow-left-from-arc" iconPack="solid" label="Check out" />
            </RadioGroup>
          </Input>
        )}
      </div>

      <SelectPopoverList pop={timePop} mobile={mobile} title="Time" searchable searchPlaceholder="Time...">
        <SelectListItemGroup>
          {TIME_OPTIONS.map((option) => (
            <SelectListItem
              key={option}
              variant="default"
              label={option}
              selected={time === option}
              onClick={() => {
                setTime(option);
                timePop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </Dialog>
  );
}
