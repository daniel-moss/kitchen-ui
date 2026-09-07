import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import { JOB_ID } from "./jobData";
import { SelectPopoverList, useSelectPopover } from "../../modules/shared/selectPopover";
import { PAUSE_SUB_STATUSES } from "./PauseJobForm";

import styles from "./jobForm.module.scss";

interface ChangePauseStatusFormProps {
  open: boolean;
  onClose: () => void;
  /** The current pause type ("quick-pause" | "on-hold"), pre-selected on open. */
  initialType: string;
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
  const [type, setType] = useState(initialType);
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
    setType(initialType);
    setSubStatus(initialSubStatus);
    setReason("");
    setShowError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = type !== initialType || subStatus !== initialSubStatus || reason !== "";

  // Sub-status is required (Type is always set — pre-selected).
  const submit = () => {
    if (subStatus === "") {
      setShowError(true);
      return;
    }
    onSubmit(type, subStatus, reason);
    toast({ type: "success", title: `"${JOB_ID}" status changed` });
    onClose();
  };

  // The Sub-status select — revealed inside whichever Type card is selected.
  const subStatusSelect = (
    <Input label="Job sub-status">
      <SelectField
        value={subStatus || undefined}
        isValid={!(showError && subStatus === "")}
        open={subStatusPop.open}
        onClick={(e: MouseEvent<HTMLDivElement>) => subStatusPop.toggle(e.currentTarget)}
      />
    </Input>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Change job pause status"
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
          <Button size="lg" variant="solid" onClick={submit}>
            Change job status
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        <Input label="Pause type">
        <RadioGroup
          value={type}
          onChange={(v) => {
            setType(v);
            // A different type has different sub-statuses — reset the pick.
            setSubStatus(v === initialType ? initialSubStatus : "");
            setShowError(false);
          }}
        >
          <RadioItem
            value="quick-pause"
            variant="card"
            icon="circle-pause"
            iconColor="var(--amber-a10)"
            label="Quick-pause"
            caption="For periods within the same day. E.g. taking a lunch or heading to the shop for parts."
            error={showError && type === "quick-pause" && subStatus === ""}
            content={subStatusSelect}
          />
          <RadioItem
            value="on-hold"
            variant="card"
            icon="circle-stop"
            iconColor="var(--crimson-9)"
            label="On hold"
            caption="For longer pause. E.g. waiting for parts to be shipped and aren't sure when to reschedule yet."
            error={showError && type === "on-hold" && subStatus === ""}
            content={subStatusSelect}
          />
        </RadioGroup>
        </Input>

        <Input label="Pause reason" labelCondition="optional" helpText="Why do you need to pause this job?">
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Input>
      </div>

      <SelectPopoverList pop={subStatusPop} mobile={mobile} title="Job sub-status" searchable searchPlaceholder="Search by status name...">
        <SelectListItemGroup>
          {(PAUSE_SUB_STATUSES[type] ?? []).map((s) => (
            <SelectListItem
              key={s}
              label={s}
              selected={s === subStatus}
              onClick={() => {
                setSubStatus(s);
                setShowError(false);
                subStatusPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </Dialog>
  );
}
