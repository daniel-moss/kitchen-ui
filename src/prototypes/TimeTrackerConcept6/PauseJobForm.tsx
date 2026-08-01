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
import { SelectPopoverList, useSelectPopover } from "./selectPopover";

import styles from "./jobForm.module.scss";

// The sub-statuses available per pause Type (placeholder demo values).
export const PAUSE_SUB_STATUSES: Record<string, string[]> = {
  "quick-pause": ["Break", "Lunch", "Getting parts"],
  "on-hold": ["Waiting on parts", "Waiting on approval", "Waiting on access"],
};

interface PauseJobFormProps {
  open: boolean;
  onClose: () => void;
  /** Pauses with the chosen Type (quick-pause | on-hold), sub-status and reason. */
  onPause: (type: string, subStatus: string, reason: string) => void;
  mobile?: boolean;
}

// "Pause job" form (Figma node 24058-15840): a required Type choice — Quick-pause
// (amber circle-pause) / On hold (crimson circle-stop), card radios with a
// description — that reveals a required Sub-status select, then an optional
// Pause reason. No read-only job-identity group.
export default function PauseJobForm({ open, onClose, onPause, mobile = false }: PauseJobFormProps) {
  const [type, setType] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);

  useEffect(() => {
    if (open) return;
    setType("");
    setSubStatus("");
    setReason("");
    setShowError(false);
    subStatusPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = type !== "" || reason !== "";

  // Type AND its Sub-status are required.
  const pause = () => {
    if (type === "" || subStatus === "") {
      setShowError(true);
      return;
    }
    onPause(type, subStatus, reason);
    toast({ type: "success", title: `"${JOB_ID}" paused` });
    onClose();
  };

  // The Sub-status select — revealed inside whichever Type card is selected.
  const subStatusSelect = (
    <Input label="Sub-status">
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
      title="Pause job"
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
          <Button size="lg" variant="solid" onClick={pause}>
            Pause
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        <Input label="Type">
        <RadioGroup
          value={type}
          onChange={(v) => {
            setType(v);
            setSubStatus("");
            setShowError(false);
          }}
          isValid={!(showError && type === "")}
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

      <SelectPopoverList
        pop={subStatusPop}
        mobile={mobile}
        title="Sub-status"
        searchable
        searchPlaceholder="Search by status name..."
      >
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
