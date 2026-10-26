import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import EmptyState from "../../components/EmptyState/EmptyState";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";

import { JobSubStatusRecord } from "../../data/db/types";
import DismissCancelButton from "../shared/DismissCancelButton";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";
import CheckInOutField, { useCheckInOut } from "./CheckInOutField";

import styles from "./jobForm.module.scss";

export interface ChangeActiveStatusResult {
  subStatus: string;
  reason: string;
  /** Start a session under `status`. */
  checkIn: boolean;
  /** End the running session. */
  checkOut: boolean;
  status: string;
}

interface ChangeActiveStatusFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (result: ChangeActiveStatusResult) => void;
  /** The job's current active sub-status (pre-filled). */
  initialSubStatus?: string;
  /** The company's ACTIVE sub-statuses — the same list Start job offers. */
  activeSubStatuses: JobSubStatusRecord[];
  /** The company REQUIRES an active sub-status. Default true. */
  activeStatusRequired?: boolean;
  /** The viewer is an ASSIGNEE: the Check In / Out control shows. */
  showCheckIn?: boolean;
  /** The viewer's running session ("Working: 01:30:05"); null = checked out. */
  runningSession?: string | null;
  mobile?: boolean;
}

// "Change job active status" (Figma 24101-15203, 2026-10-25) — an Active job's
// menu item, for a company with active sub-statuses. The Start job form's shape:
// Active status (pre-filled with the current one), the Status change reason
// (empty — a NEW reason; required only when the picked sub-status requires
// one, its custom label as the help text) and, for an assignee, the shared
// Check In / Out control. Its defaults (Figma annotations): "Check in" when
// checked out, "Stay checked in" when checked in. "Change active status" (no
// icon — Daniel, 2026-10-26) applies it and toasts "Active status changed". It replaced SubStatusForm.
export default function ChangeActiveStatusForm({
  open,
  onClose,
  onSubmit,
  initialSubStatus = "",
  activeSubStatuses,
  activeStatusRequired = true,
  showCheckIn = false,
  runningSession = null,
  mobile = false,
}: ChangeActiveStatusFormProps) {
  const statuses = [...activeSubStatuses].sort((a, b) => a.name.localeCompare(b.name));
  const onlyStatus = activeStatusRequired && statuses.length === 1 ? statuses[0].name : "";
  const subStatusRequired = activeStatusRequired && statuses.length > 1;
  const initial = onlyStatus || initialSubStatus;

  const [subStatus, setSubStatus] = useState(initial);
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);
  const checkedIn = runningSession != null;
  const clock = useCheckInOut({ open, shown: showCheckIn, checkedIn, defaults: { checkedIn: "stay", checkedOut: "change" } });

  // A fresh open reloads the pre-fill; closing forces the select shut.
  useEffect(() => {
    if (!open) {
      subStatusPop.close();
      return;
    }
    setSubStatus(initial);
    setReason("");
    setShowError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const picked = statuses.find((row) => row.name === subStatus);
  const reasonRequired = picked?.reasonRequired === true;
  const reasonHelp = picked?.reasonLabel != null && picked.reasonLabel !== "" ? picked.reasonLabel : undefined;

  const dirty = subStatus !== initial || reason !== "" || clock.dirty;
  const subStatusBad = subStatusRequired && subStatus === "";
  const reasonBad = reasonRequired && reason.trim() === "";

  const submit = () => {
    if (subStatusBad || reasonBad || clock.statusBad) {
      setShowError(true);
      return;
    }
    onSubmit({ subStatus, reason: reason.trim(), checkIn: clock.checkIn, checkOut: clock.checkOut, status: clock.status });
    toast({ type: "success", title: "Active status changed" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Change job active status"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter leadingButton={<DismissCancelButton />}>
          <Button size="lg" variant="solid" onClick={submit}>
            Change active status
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        {onlyStatus !== "" ? (
          <Input label="Active status" helpText="The only status available">
            <SelectField value={onlyStatus} readOnly />
          </Input>
        ) : (
          <Input label="Active status" labelCondition={subStatusRequired ? undefined : "optional"}>
            <SelectField
              value={subStatus || undefined}
              isValid={!(showError && subStatusBad)}
              errorMessage="Choose Active status"
              open={subStatusPop.open}
              onClick={(e: MouseEvent<HTMLDivElement>) => subStatusPop.toggle(e.currentTarget)}
            />
          </Input>
        )}

        <Input label="Status change reason" labelCondition={reasonRequired ? undefined : "optional"} helpText={reasonHelp}>
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} isValid={!(showError && reasonBad)} />
        </Input>

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

      {onlyStatus === "" && (
        <SelectPopoverList
          pop={subStatusPop}
          mobile={mobile}
          title="Active status"
          searchable
          searchPlaceholder="Status..."
          noResultsState={<EmptyState caption="No statuses match" />}
        >
          <SelectListItemGroup>
            {statuses.map(({ name }) => (
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
        </SelectPopoverList>
      )}
    </Dialog>
  );
}
