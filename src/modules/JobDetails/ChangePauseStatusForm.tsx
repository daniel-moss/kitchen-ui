import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import EmptyState from "../../components/EmptyState/EmptyState";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";

import DismissCancelButton from "../shared/DismissCancelButton";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";
import CheckInOutField, {
  CheckInOutResult,
  useCheckInOut,
} from "./CheckInOutField";
import {
  PAUSE_COPY,
  PauseType,
  REASON_LIMIT,
  STATUS_ROWS,
} from "./PauseJobForm";

import styles from "./jobForm.module.scss";

interface ChangePauseStatusFormProps {
  open: boolean;
  onClose: () => void;
  /** WHICH dialog this is — the job's current pause type. Decides every label. */
  initialType: PauseType;
  /** The current pause sub-status, pre-selected on open. */
  initialSubStatus?: string;
  /** Commits the pause Type, sub-status, reason (may be "") and the Check In / Out outcome. */
  onSubmit: (
    type: string,
    subStatus: string,
    reason: string,
    clock: CheckInOutResult,
  ) => void;
  /** The viewer is an ASSIGNEE: the Check In / Out control shows. Default true. */
  showCheckIn?: boolean;
  /** The viewer's running session ("Working: 01:30:05"); null = checked out. */
  runningSession?: string | null;
  mobile?: boolean;
}

// "Change job pause status" form (Figma 24101-15722, re-read 2026-10-26): the
// "Pause job" form's shape — Pause status (pre-filled with the current one,
// the same company rules), a NEW Pause reason and, for an assignee, the shared
// Check In / Out control (same default as Pause: "Check out" / "Stay checked
// out"). "Change pause status" (no icon) toasts "Pause status changed". A HELD
// job gets the same form with the Hold copy.
export default function ChangePauseStatusForm({
  open,
  onClose,
  initialType,
  initialSubStatus = "",
  onSubmit,
  showCheckIn = true,
  runningSession = null,
  mobile = false,
}: ChangePauseStatusFormProps) {
  // The job is paused OR held; the dialog never switches between them, so the
  // entry point's type simply decides the copy. NOT state: the form stays
  // mounted while the job's status changes underneath it, so `useState` would
  // freeze the copy at whatever the status was on first render.
  const type = initialType;
  const held = type === "on-hold";
  const copy = PAUSE_COPY[type];
  // Pause status (Figma 27189-56150) — the same rules as "Pause job": shown when
  // the company has sub-statuses for this status; required when it requires
  // them AND there are 2+; with exactly one required, the system picks it.
  const groups = STATUS_ROWS[type];
  const statuses = groups.flatMap((group) => group.rows);
  const asksStatus = copy.enabled && statuses.length > 0;
  const onlyStatus =
    asksStatus && copy.required && statuses.length === 1
      ? statuses[0].name
      : "";
  const statusRequired = asksStatus && copy.required && statuses.length > 1;
  const initial = onlyStatus || initialSubStatus;
  const [subStatus, setSubStatus] = useState(initial);
  // The Pause reason always starts EMPTY (Daniel, 2026-08-05): it is a NEW
  // reason for this status change, not an edit of the one given when pausing.
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);
  const clock = useCheckInOut({
    open,
    shown: showCheckIn,
    checkedIn: runningSession != null,
    defaults: { checkedIn: "change", checkedOut: "stay" },
  });

  useEffect(() => {
    if (!open) {
      setShowError(false);
      subStatusPop.close();
      return;
    }
    setSubStatus(initial);
    setReason("");
    setShowError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = subStatus !== initial || reason !== "" || clock.dirty;

  // The reason follows the PICKED sub-status, the same rules as "Pause job" /
  // "Hold job" (Daniel, 2026-10-23): required when it requires a reason, its
  // own label replaces the default help text, and past 60 characters a warning
  // replaces either — it never blocks the form.
  const picked = statuses.find((row) => row.name === subStatus);
  const reasonRequired = picked?.reasonRequired === true;
  const customHelp =
    picked?.reasonLabel != null && picked.reasonLabel !== ""
      ? picked.reasonLabel
      : undefined;
  const defaultHelp = copy.reasonHelp;
  const tooLong = reason.length > REASON_LIMIT;
  const reasonHelp = tooLong
    ? `${reason.length} / ${REASON_LIMIT} characters. Keep it short. Add details to the job summary.`
    : (customHelp ?? defaultHelp);

  const statusBad = statusRequired && subStatus === "";
  const reasonBad = reasonRequired && reason.trim() === "";

  const submit = () => {
    if (statusBad || reasonBad || clock.statusBad) {
      setShowError(true);
      return;
    }
    onSubmit(type, subStatus, reason, clock.result());
    // Names the status, not the job (Figma 24101-16162 / held 24970-48577,
    // 2026-10-23).
    toast({
      type: "success",
      title: held ? "Hold status changed" : "Pause status changed",
    });
    onClose();
  };

  // The Sub-status select — revealed inside whichever Type card is selected.

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={held ? "Change hold status" : "Change job pause status"}
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter leadingButton={<DismissCancelButton />}>
          {/* No icon (Figma 24101-15725). */}
          <Button size="lg" variant="solid" onClick={submit}>
            {held ? "Change hold status" : "Change pause status"}
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        {/* No Pause-type RadioGroup (Daniel, 2026-10-05; Figma 24101-15722 /
            24970-48572): the job is already paused OR held, so the dialog
            changes the status WITHIN that — it does not switch between them. */}
        {asksStatus &&
          (onlyStatus !== "" ? (
            <Input
              label={copy.statusLabel}
              helpText="The only status available"
            >
              <SelectField value={onlyStatus} readOnly />
            </Input>
          ) : (
            <Input
              label={copy.statusLabel}
              labelCondition={statusRequired ? undefined : "optional"}
            >
              <SelectField
                value={subStatus || undefined}
                isValid={!(showError && statusBad)}
                errorMessage={`Choose ${copy.statusLabel}`}
                open={subStatusPop.open}
                onClick={(e: MouseEvent<HTMLDivElement>) =>
                  subStatusPop.toggle(e.currentTarget)
                }
              />
            </Input>
          ))}

        <Input
          label={copy.reasonLabel}
          labelCondition={reasonRequired ? undefined : "optional"}
          helpText={reasonHelp}
          helpTextStatus={tooLong ? "warning" : undefined}
        >
          <TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            isValid={!(showError && reasonBad)}
          />
        </Input>

        {/* Check In / Out (Figma 27163-52433): only for an assignee. */}
        {showCheckIn && (
          <CheckInOutField
            runningSession={runningSession}
            choice={clock.choice}
            onChoiceChange={(choice) => {
              clock.setChoice(choice);
              setShowError(false);
            }}
            status={clock.status}
            onStatusChange={(status) => {
              clock.setStatus(status);
              setShowError(false);
            }}
            showError={showError}
            mobile={mobile}
          />
        )}
      </div>

      {asksStatus && onlyStatus === "" && (
        <SelectPopoverList
          pop={subStatusPop}
          mobile={mobile}
          title={held ? "Hold status" : "Pause status"}
          searchable
          searchPlaceholder="Status..."
          noResultsState={<EmptyState caption="No statuses match" />}
        >
          {/* The SAME grouping the "Pause job" / "Hold job" dialogs use (Daniel,
            2026-10-05) — one plain list for a quick-pause, two labelled groups
            for on hold: "External" waits on the client, "Internal" on us. A
            group shows only when it holds a status. */}
          {groups
            .filter((group) => group.rows.length > 0)
            .map((group) => (
              <SelectListItemGroup
                key={group.label ?? "all"}
                label={
                  group.label == null ? undefined : (
                    <GroupLabel variant="secondary" label={group.label} />
                  )
                }
              >
                {group.rows.map(({ name }) => (
                  <SelectListItem
                    key={name}
                    label={name}
                    selected={name === subStatus}
                    onClick={() => {
                      setSubStatus(name);
                      setShowError(false);
                      subStatusPop.close();
                    }}
                  />
                ))}
              </SelectListItemGroup>
            ))}
        </SelectPopoverList>
      )}
    </Dialog>
  );
}
