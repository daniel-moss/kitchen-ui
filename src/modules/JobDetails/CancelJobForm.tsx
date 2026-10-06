import { useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";

import { Scheduling } from "./SchedulingForm";

import { useCurrentJobId } from "./currentJob";

import textDialog from "../shared/textDialog.module.scss";

interface CancelJobFormProps {
  open: boolean;
  onClose: () => void;
  /** The current scheduling — the form mirrors the page's Scheduled for / Duration. */
  scheduling: Scheduling;
  /** Cancels the job with the (required) reason. */
  onCancel: (reason: string) => void;
  mobile?: boolean;
}

// "Cancel job" form (Figma 24047-12612 desktop / 24047-12610 mobile). Its body
// is ONE TextArea, which makes it a TEXT DIALOG: on mobile the drawer fills the
// screen (`fillHeight`) and the field stretches to use all of it — the shared
// `textDialog` rules, the same ones EditNotesDialog uses. Desktop keeps the DS
// TextArea's own 4-row minimum (the node draws 88px). The destructive
// "Cancel job" button confirms.
export default function CancelJobForm({ open, onClose, onCancel, mobile = false }: CancelJobFormProps) {
  const jobId = useCurrentJobId();
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
    toast({ type: "success", title: `"${jobId}" cancelled` });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cancel job"
      breakpoint={mobile ? "mobile" : "desktop"}
      fillHeight
      confirmOnDismiss={reason !== ""}
      footer={
        // The two buttons name the two OUTCOMES, not the dialog (Daniel,
        // 2026-10-04): leaving is "Don't cancel", going through with it is
        // "Cancel". The dialog's own title already says which job.
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Don&apos;t cancel
            </Button>
          }
        >
          <Button size="lg" variant="danger" leftIcon="ban" onClick={cancelJob}>
            Cancel
          </Button>
        </PopoverFooter>
      }
    >
      <Input
        label="Cancel reason"
        helpText="Why was this job cancelled?"
        className={mobile ? textDialog.fillField : undefined}
      >
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
    </Dialog>
  );
}
