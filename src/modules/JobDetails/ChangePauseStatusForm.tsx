import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";

import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";
import { PauseType, STATUS_GROUPS } from "./PauseJobForm";

import { useCurrentJobId } from "./currentJob";

import styles from "./jobForm.module.scss";

interface ChangePauseStatusFormProps {
  open: boolean;
  onClose: () => void;
  /** WHICH dialog this is — the job's current pause type. Decides every label. */
  initialType: PauseType;
  /** The current pause sub-status, pre-selected on open. */
  initialSubStatus?: string;
  /** Commits the chosen pause Type, sub-status and reason (may be ""). */
  onSubmit: (type: string, subStatus: string, reason: string) => void;
  mobile?: boolean;
}

// "Change pause status" form (Figma node 24101-15722): a Type choice —
// Quick-pause (amber circle-pause) / On hold (crimson circle-stop), card radios
// with a description that reveal a required Sub-status select — then an optional
// Pause reason. Same shape as "Pause job", but the Type / sub-status / reason
// are pre-filled (the job is already paused).
export default function ChangePauseStatusForm({
  open,
  onClose,
  initialType,
  initialSubStatus = "",
  onSubmit,
  mobile = false,
}: ChangePauseStatusFormProps) {
  const jobId = useCurrentJobId();
  // The job is paused OR held; the dialog never switches between them, so the
  // entry point's type simply decides the copy. NOT state: the form stays
  // mounted while the job's status changes underneath it, so `useState` would
  // freeze the copy at whatever the status was on first render.
  const type = initialType;
  const held = type === "on-hold";
  const [subStatus, setSubStatus] = useState(initialSubStatus);
  // The Pause reason always starts EMPTY (Daniel, 2026-08-05): it is a NEW
  // reason for this status change, not an edit of the one given when pausing.
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);

  useEffect(() => {
    if (!open) {
      setShowError(false);
      subStatusPop.close();
      return;
    }
    setSubStatus(initialSubStatus);
    setReason("");
    setShowError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = subStatus !== initialSubStatus || reason !== "";

  // Sub-status is required (Type is always set — pre-selected).
  const submit = () => {
    if (subStatus === "") {
      setShowError(true);
      return;
    }
    onSubmit(type, subStatus, reason);
    toast({ type: "success", title: `"${jobId}" status changed` });
    onClose();
  };

  // The Sub-status select — revealed inside whichever Type card is selected.

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={held ? "Change job on hold status" : "Change job pause status"}
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
          <Button size="lg" variant="solid" leftIcon={held ? "circle-stop" : "circle-pause"} onClick={submit}>
            Change status
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        {/* No Pause-type RadioGroup (Daniel, 2026-10-05; Figma 24101-15722 /
            24970-48572): the job is already paused OR held, so the dialog
            changes the status WITHIN that — it does not switch between them. */}
        <Input label={held ? "On hold status" : "Pause status"}>
          <SelectField
            value={subStatus || undefined}
            isValid={!(showError && subStatus === "")}
            errorMessage={held ? "Choose On hold status" : "Choose Pause status"}
            open={subStatusPop.open}
            onClick={(e: MouseEvent<HTMLDivElement>) => subStatusPop.toggle(e.currentTarget)}
          />
        </Input>

        <Input
          label={held ? "On hold reason" : "Pause reason"}
          labelCondition="optional"
          helpText={held ? "Why do you need to hold this job?" : "Why do you need to pause this job?"}
        >
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Input>
      </div>

      <SelectPopoverList pop={subStatusPop} mobile={mobile} title={held ? "On hold status" : "Pause status"} searchable searchPlaceholder="Status...">
        {/* The SAME grouping the "Pause job" / "Hold job" dialogs use (Daniel,
            2026-10-05) — one plain list for a quick-pause, two labelled groups
            for on hold: "External" waits on the client, "Internal" on us. */}
        {STATUS_GROUPS[type].map((group) => (
          <SelectListItemGroup
            key={group.label ?? "all"}
            label={group.label == null ? undefined : <GroupLabel variant="secondary" label={group.label} />}
          >
            {group.names.map((name) => (
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
    </Dialog>
  );
}
