import { useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";
import { JOB_ID } from "./jobData";
import { Scheduling } from "./SchedulingForm";

import styles from "./jobForm.module.scss";

interface CancelJobFormProps {
  open: boolean;
  onClose: () => void;
  /** The current scheduling — the form mirrors the page's Scheduled for / Duration. */
  scheduling: Scheduling;
  /** Cancels the job with the (required) reason. */
  onCancel: (reason: string) => void;
  mobile?: boolean;
}

// "Cancel job" form (Figma node 24047-12612): read-only job summary (identity,
// location, schedule, reason for call) then a required-in-spirit Cancel reason.
// The destructive "Cancel job" button confirms.
export default function CancelJobForm({ open, onClose, onCancel, mobile = false }: CancelJobFormProps) {
  const [reason, setReason] = useState("");
  // The cancel reason is mandatory — attempting to cancel while empty shows the
  // error; typing clears it.
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    if (!open) {
      setReason("");
      setShowError(false);
    }
  }, [open]);

  const cancelJob = () => {
    if (reason.trim() === "") {
      setShowError(true);
      return;
    }
    onCancel(reason);
    toast({ type: "success", title: `"${JOB_ID}" cancelled` });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cancel job"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={reason !== ""}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Don&apos;t cancel
            </Button>
          }
        >
          <Button size="lg" variant="danger" onClick={cancelJob}>
            Cancel job
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        <Input label="Cancel reason" helpText="Why was this job cancelled?">
          <TextArea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (showError) setShowError(false);
            }}
            isValid={!showError}
            errorMessage="Provide a cancel reason"
          />
        </Input>
      </div>
    </Dialog>
  );
}
