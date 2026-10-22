import { useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";

import textDialog from "../shared/textDialog.module.scss";

interface UnscheduleJobFormProps {
  open: boolean;
  onClose: () => void;
  /** Unschedules the job with the (required) reason. */
  onUnschedule: (reason: string) => void;
  mobile?: boolean;
}

// "Unschedule job" (Figma 27154-49578) — opened by the "Unschedule" menu item.
// It replaced the "Unschedule job?" Prompt on 2026-10-22: the user now says
// WHY, and the reason becomes the Status module's message ("Unschedule
// reason"). Its body is ONE required TextArea, so it is a TEXT DIALOG like
// "Cancel job": on mobile the drawer fills the screen and the field with it.
// "Unschedule" clears "Scheduled for", closes, and toasts "Job unscheduled".
export default function UnscheduleJobForm({ open, onClose, onUnschedule, mobile = false }: UnscheduleJobFormProps) {
  const [reason, setReason] = useState("");
  // Validated on the "Unschedule" click; typing clears the error.
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    if (!open) {
      setReason("");
      setShowError(false);
    }
  }, [open]);

  const unschedule = () => {
    if (reason.trim() === "") {
      setShowError(true);
      return;
    }
    onUnschedule(reason.trim());
    toast({ type: "success", title: "Job unscheduled" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Unschedule job"
      breakpoint={mobile ? "mobile" : "desktop"}
      fillHeight
      confirmOnDismiss={reason !== ""}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" leftIcon="calendar-xmark" onClick={unschedule}>
            Unschedule
          </Button>
        </PopoverFooter>
      }
    >
      {/* The help text follows the field's own doc (27154-49599): "…to be
          unscheduled?" — the dialog frames still say "rescheduled". The error
          is the Input's default, "Provide Unschedule reason". */}
      <Input
        label="Unschedule reason"
        helpText="Why does this job need to be unscheduled?"
        className={mobile ? textDialog.fillField : undefined}
      >
        <TextArea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (showError) setShowError(false);
          }}
          isValid={!showError}
        />
      </Input>
    </Dialog>
  );
}
