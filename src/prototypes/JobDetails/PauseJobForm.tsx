import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import CheckboxItem from "../../components/Checkbox/CheckboxItem";
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
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";

import styles from "./jobForm.module.scss";

// The sub-statuses available per pause Type (placeholder demo values).
export const PAUSE_SUB_STATUSES: Record<string, string[]> = {
  "quick-pause": ["Break", "Lunch", "Getting parts"],
  "on-hold": ["Waiting on parts", "Waiting on approval", "Waiting on access"],
};

/**
 * Which "On hold" sub-statuses wait on something INSIDE the company. The Job
 * lifecycle module colours those rows brown instead of crimson (the DS
 * `BadgeJobStatus` on-hold variants). The others wait on the client and stay
 * crimson. DEMO data — the real app stores the internal/external kind on the
 * sub-status itself.
 */
export const INTERNAL_ON_HOLD = ["Waiting on parts"];

interface PauseJobFormProps {
  open: boolean;
  onClose: () => void;
  /**
   * Pauses with the chosen Type (quick-pause | on-hold), sub-status and reason.
   * `checkOut` = the tech's time stops with the job; unticked, the running
   * session keeps going.
   */
  onPause: (type: string, subStatus: string, reason: string, checkOut: boolean) => void;
  mobile?: boolean;
}

// "Pause job" form (Figma node 24058-15840): a required Pause-type choice —
// Quick-pause (amber circle-pause) / On hold (crimson circle-stop), card radios
// with a description — that reveals a required Sub-status select, then an
// optional Pause reason, then the "Check out" checkbox. No read-only
// job-identity group.
export default function PauseJobForm({ open, onClose, onPause, mobile = false }: PauseJobFormProps) {
  const [type, setType] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [reason, setReason] = useState("");
  // Checked by default (node annotation on 24512-62825) — pausing usually means
  // the tech stops working, but they can now keep their time running.
  const [checkOut, setCheckOut] = useState(true);
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);

  useEffect(() => {
    if (open) return;
    setType("");
    setSubStatus("");
    setReason("");
    setCheckOut(true);
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
    onPause(type, subStatus, reason, checkOut);
    toast({ type: "success", title: `"${JOB_ID}" paused` });
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
            Pause job
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

        {/* Pausing no longer checks the tech out by itself (Figma 24512-62825):
            this card decides it, and it is ticked by default. */}
        <CheckboxItem
          variant="card"
          icon="arrow-left-from-arc"
          label="Check out"
          caption="Stop tracking your time"
          checked={checkOut}
          onChange={(e) => setCheckOut(e.target.checked)}
        />
      </div>

      <SelectPopoverList
        pop={subStatusPop}
        mobile={mobile}
        title="Job sub-status"
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
