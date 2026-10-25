import { useEffect, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";

import DismissCancelButton from "../shared/DismissCancelButton";

interface UnscheduleJobFormProps {
  open: boolean;
  onClose: () => void;
  /** Unschedules the job with the (required) reason. */
  onUnschedule: (reason: string) => void;
  /**
   * Names of the assignees who are checked in right now. Unscheduling checks
   * them all out, so a non-empty list shows the warning banner naming them.
   */
  checkedIn?: string[];
  mobile?: boolean;
}

// "Ann", "Ann and Bo", "Ann, Bo, and Cy" — US serial comma (Daniel, 2026-10-25).
const nameList = (names: string[]) =>
  names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;

// "Unschedule job" (Figma 27154-49578) — opened by the "Unschedule" menu item.
// It replaced the "Unschedule job?" Prompt on 2026-10-22: the user now says
// WHY, and the reason becomes the Status module's message ("Unschedule
// reason"). Its body is ONE required TextArea — but NOT a text dialog: on
// mobile the drawer hugs its content and the field keeps its default size,
// and the drawer has a drag handle instead of the close button (Daniel,
// 2026-10-25, Figma DrawerHeader dragHandle on, close off). Below the field, a warning AlertBanner (Figma 27245-62594, added 2026-10-25)
// names whoever is still checked in — unscheduling checks them out, which
// stops their time. No cap on the names: Daniel, a job rarely has many.
// "Unschedule" clears "Scheduled for", closes, and toasts "Job unscheduled".
export default function UnscheduleJobForm({
  open,
  onClose,
  onUnschedule,
  checkedIn = [],
  mobile = false,
}: UnscheduleJobFormProps) {
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
      drawerHeader="default"
      confirmOnDismiss={reason !== ""}
      footer={
        <PopoverFooter
          leadingButton={<DismissCancelButton />}
        >
          <Button size="lg" variant="solid" leftIcon="calendar-xmark" onClick={unschedule}>
            Unschedule
          </Button>
        </PopoverFooter>
      }
    >
      {/* The error is the Input's default, "Provide Unschedule reason". */}
      <Input
        label="Unschedule reason"
        helpText="Why does this job need to be unscheduled?"
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
      {checkedIn.length > 0 && (
        <AlertBanner type="card" status="warning" orientation="vertical">
          {`${nameList(checkedIn)} ${checkedIn.length === 1 ? "is" : "are"} checked in. Unscheduling will check them out.`}
        </AlertBanner>
      )}
    </Dialog>
  );
}
