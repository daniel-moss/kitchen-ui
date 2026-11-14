import { useEffect, useRef, useState } from "react";

import Input from "../../components/Input/Input";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import { COMPANY } from "../../data/db";
import type { CheckInAction, CheckInAfter, JobSubStatusRecord } from "../../data/db/types";
import { TEXT_SEPARATOR } from "../../utils/textSeparator";

import TechStatusField from "./TechStatusField";
import { soleTechStatus, techStatusesEnabled } from "./TimesheetPanel";
import styles from "./CheckInOutField.module.scss";

/** "stay" keeps the viewer's clock as it is; "change" checks in or out. */
export type CheckInOutChoice = "stay" | "change";

/**
 * Where the tech should end up after `action` (Daniel, 2026-11-14): the picked
 * sub-status's own rule, else the company's generic rule for the action. Read
 * at use time — the Demo settings page edits both.
 */
export const checkInAfterFor = (action: CheckInAction, picked?: JobSubStatusRecord): CheckInAfter =>
  picked?.checkInAfter ?? COMPANY.checkInAfter[action];

/**
 * The preselected option that leads to `after`, from either state: to end up
 * checked IN, a checked-in tech stays and a checked-out one checks in; to end
 * up checked OUT, the other way round.
 */
export const checkInDefaults = (after: CheckInAfter): { checkedIn: CheckInOutChoice; checkedOut: CheckInOutChoice } =>
  after === "in" ? { checkedIn: "stay", checkedOut: "change" } : { checkedIn: "change", checkedOut: "stay" };

/** What a form hands the page: start a session under `status`, or end the running one. */
export interface CheckInOutResult {
  checkIn: boolean;
  checkOut: boolean;
  status: string;
}

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
// form that can start or stop the viewer's time: Start / Resume, Pause / Hold,
// Change pause status, Reschedule and Change active status. The form shows it only to an ASSIGNEE.
//
//   Checked out — "You're checked out": "Stay checked out" or "Check in"; "Check
//     in" opens the required "Your status" (the company's tech statuses — none
//     at all when the company has them off). Always stacked.
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

  const statusBad = showError && choice === "change" && status === "" && techStatusesEnabled();
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
            techStatusesEnabled() ? (
              <TechStatusField
                value={status}
                onChange={onStatusChange}
                isValid={!statusBad}
                errorMessage="Choose Your status"
                mobile={mobile}
              />
            ) : undefined
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
  /**
   * The pre-picked choice per state — from the company's rules
   * (`checkInDefaults(checkInAfterFor(...))`). It may change while the form
   * is open (a sub-status with its own rule is picked): the choice follows it
   * until the user picks an option by hand.
   */
  defaults: { checkedIn: CheckInOutChoice; checkedOut: CheckInOutChoice };
}

/**
 * The control's state for one form: the choice (reset to the form's default
 * on every open), the status, what to validate and what to submit.
 */
export function useCheckInOut({ open, shown, checkedIn, defaults }: UseCheckInOutOptions) {
  const initial = checkedIn ? defaults.checkedIn : defaults.checkedOut;
  const [choice, setChoice] = useState<CheckInOutChoice>(initial);
  // A company with ONE status starts on it (read-only in the field).
  const [status, setStatus] = useState(soleTechStatus);
  // The user picked an option by hand: the default stops moving it.
  const touched = useRef(false);

  useEffect(() => {
    if (!open) return;
    touched.current = false;
    setChoice(initial);
    setStatus(soleTechStatus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A new default (another sub-status picked) moves an untouched choice.
  useEffect(() => {
    if (!open || touched.current) return;
    setChoice(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const changing = shown && choice === "change";
  return {
    choice,
    status,
    // Leaving "Check in" resets the status pick (Daniel).
    setChoice: (next: CheckInOutChoice) => {
      touched.current = true;
      setChoice(next);
      if (next === "stay") setStatus(soleTechStatus());
    },
    setStatus,
    /** "Check in" is picked with no status (only asked while the company has statuses). */
    statusBad: changing && !checkedIn && status === "" && techStatusesEnabled(),
    dirty: shown && (choice !== initial || status !== soleTechStatus()),
    /** Start a session under `status`. */
    checkIn: changing && !checkedIn,
    /** End the running session. */
    checkOut: changing && checkedIn,
    /** The three together, for the form's submit. */
    result: (): CheckInOutResult => ({
      checkIn: changing && !checkedIn,
      checkOut: changing && checkedIn,
      status: changing && !checkedIn ? status : "",
    }),
  };
}
