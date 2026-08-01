import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import { JOB_ID } from "./jobData";
import { SelectPopoverList, useSelectPopover } from "./selectPopover";

import styles from "./jobForm.module.scss";

// The two job sub-statuses a technician can start into (Figma).
const SUB_STATUSES = ["Travelling", "Working"];

interface StartJobFormProps {
  open: boolean;
  onClose: () => void;
  /** Starts the job with the chosen sub-status (may be "") and reason (may be ""). */
  onStart: (subStatus: string, reason: string) => void;
  mobile?: boolean;
}

// "Start job" form (Figma node 24042-18897): read-only job identity, a
// searchable Sub-status select, and an optional Start reason. Confirms with the
// primary "Start" button.
export default function StartJobForm({ open, onClose, onStart, mobile = false }: StartJobFormProps) {
  const [subStatus, setSubStatus] = useState("");
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);
  const subStatusPop = useSelectPopover(mobile);

  // A fresh open resets the draft; closing also forces the nested select shut.
  useEffect(() => {
    if (open) return;
    setSubStatus("");
    setReason("");
    setShowError(false);
    subStatusPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = subStatus !== "" || reason !== "";

  // Sub-status is required — clicking Start with none picked shows the error.
  const start = () => {
    if (subStatus === "") {
      setShowError(true);
      return;
    }
    onStart(subStatus, reason);
    toast({ type: "success", title: `"${JOB_ID}" started` });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Start job"
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
          <Button size="lg" variant="solid" onClick={start}>
            Start
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        <Input label="Sub-status">
          <SelectField
            value={subStatus || undefined}
            isValid={!showError}
            open={subStatusPop.open}
            onClick={(e: MouseEvent<HTMLDivElement>) => subStatusPop.toggle(e.currentTarget)}
          />
        </Input>

        <Input label="Start reason" labelCondition="optional">
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Input>
      </div>

      {/* Sub-status picker */}
      <SelectPopoverList
        pop={subStatusPop}
        mobile={mobile}
        title="Sub-status"
        searchable
        searchPlaceholder="Search by status name..."
      >
        <SelectListItemGroup>
          {SUB_STATUSES.map((s) => (
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
