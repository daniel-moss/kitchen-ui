import { useEffect, useState } from "react";

import Input from "../../components/Input/Input";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import { TEXT_SEPARATOR } from "../../utils/textSeparator";

import { TECH_STATUSES } from "./TimesheetPanel";
import styles from "./CheckInOutField.module.scss";

/** "stay" keeps the viewer's clock as it is; "change" checks in or out. */
export type CheckInOutChoice = "stay" | "change";

interface CheckInOutFieldProps {
  /**
   * The viewer's running session, e.g. "Working: 01:30:05" (it keeps ticking
   * while the form is open). Null = the viewer is checked out.
   */
  runningSession: string | null;
  choice: CheckInOutChoice;
  onChoiceChange: (choice: CheckInOutChoice) => void;
  /** The "Your status" pick — only while checking in. */
  status: string;
  onStatusChange: (status: string) => void;
  /** The form was submitted: a missing "Your status" shows its error. */
  showError?: boolean;
  mobile?: boolean;
}

// The "Check In / Out" control (Figma 27163-52433) — ONE build for every job
// form that can start or stop the viewer's time: Start / Resume, Pause,
// Reschedule and Change active status. The form shows it only to an ASSIGNEE.
//
//   Checked out — "You're checked out": "Stay checked out" or "Check in"; "Check
//     in" opens the required "Your status" (the four tech statuses). Always
//     stacked.
//   Checked in — "You're checked in · Working: 01:30:05": "Stay checked in" or
//     "Check out". Side by side on desktop, stacked on mobile.
//
// "Stay" always comes first. Each form sets its own default (useCheckInOut).
export default function CheckInOutField({
  runningSession,
  choice,
  onChoiceChange,
  status,
  onStatusChange,
  showError = false,
  mobile = false,
}: CheckInOutFieldProps) {
  if (runningSession != null) {
    return (
      <Input
        label={
          <>
            You&apos;re checked in{TEXT_SEPARATOR}
            <span className={styles.session}>{runningSession}</span>
          </>
        }
      >
        <RadioGroup
          orientation={mobile ? "vertical" : "horizontal"}
          value={choice}
          onChange={(value) => onChoiceChange(value as CheckInOutChoice)}
        >
          <RadioItem
            value="stay"
            variant="card"
            icon="arrow-right-to-arc"
            iconPack="solid"
            label="Stay checked in"
            caption="Keep tracking time"
          />
          <RadioItem
            value="change"
            variant="card"
            icon="arrow-left-from-arc"
            iconPack="solid"
            label="Check out"
            caption="Stop tracking time"
          />
        </RadioGroup>
      </Input>
    );
  }

  const statusBad = showError && choice === "change" && status === "";
  return (
    <Input label="You're checked out">
      <RadioGroup value={choice} onChange={(value) => onChoiceChange(value as CheckInOutChoice)}>
        <RadioItem
          value="stay"
          variant="card"
          icon="arrow-left-from-arc"
          iconPack="solid"
          label="Stay checked out"
          caption="Don't track time"
        />
        <RadioItem
          value="change"
          variant="card"
          icon="arrow-right-to-arc"
          iconPack="solid"
          label="Check in"
          caption="Start tracking time"
          // A missing status puts the WHOLE card in error, not just the radios.
          error={statusBad}
          content={
            <Input label="Your status">
              <RadioGroup value={status} onChange={onStatusChange} isValid={!statusBad} errorMessage="Choose Your status">
                {TECH_STATUSES.map((s) => (
                  <RadioItem key={s.value} value={s.value} variant="card" icon={s.icon} iconPack="regular" label={s.value} />
                ))}
              </RadioGroup>
            </Input>
          }
        />
      </RadioGroup>
    </Input>
  );
}

interface UseCheckInOutOptions {
  open: boolean;
  /** The control is shown (the viewer is an assignee). */
  shown: boolean;
  /** The viewer is checked in right now. */
  checkedIn: boolean;
  /** The pre-picked choice per state — the company default once one exists. */
  defaults: { checkedIn: CheckInOutChoice; checkedOut: CheckInOutChoice };
}

/**
 * The control's state for one form: the choice (reset to the form's default
 * on every open), the status, what to validate and what to submit.
 */
export function useCheckInOut({ open, shown, checkedIn, defaults }: UseCheckInOutOptions) {
  const initial = checkedIn ? defaults.checkedIn : defaults.checkedOut;
  const [choice, setChoice] = useState<CheckInOutChoice>(initial);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) return;
    setChoice(initial);
    setStatus("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const changing = shown && choice === "change";
  return {
    choice,
    status,
    // Leaving "Check in" resets the status pick (Daniel).
    setChoice: (next: CheckInOutChoice) => {
      setChoice(next);
      if (next === "stay") setStatus("");
    },
    setStatus,
    /** "Check in" is picked with no status. */
    statusBad: changing && !checkedIn && status === "",
    dirty: shown && (choice !== initial || status !== ""),
    /** Start a session under `status`. */
    checkIn: changing && !checkedIn,
    /** End the running session. */
    checkOut: changing && checkedIn,
  };
}
