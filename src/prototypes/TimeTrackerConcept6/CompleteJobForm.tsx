import { useEffect, useState } from "react";

import AlertBanner from "../../components/AlertBanner/AlertBanner";
import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";
import { JOB_ID } from "./jobData";
import { Session, SessionGroup, TimesheetUser } from "./TimesheetPanel";

import styles from "./CompleteJobForm.module.scss";

interface CompleteJobFormProps {
  open: boolean;
  onClose: () => void;
  /** The viewing tech whose logged time is reviewed. */
  viewer: TimesheetUser;
  /** The viewing tech's sessions (empty → the group shows "No time logged"). */
  sessions: Session[];
  onStopSession: () => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
  onAddSession: () => void;
  mobile?: boolean;
}

// "Time logged" form (Figma node 24110-19261): before completing the job the
// tech reviews their logged time — an info alert + their session group (or its
// "No time logged" empty state). Confirm completes the job (Figma toast
// 24106-16429); Cancel backs out.
export default function CompleteJobForm({
  open,
  onClose,
  viewer,
  sessions,
  onStopSession,
  onEditSession,
  onDeleteSession,
  onAddSession,
  mobile = false,
}: CompleteJobFormProps) {
  const [alertOpen, setAlertOpen] = useState(true);
  // Each fresh open brings the reminder alert back.
  useEffect(() => {
    if (open) setAlertOpen(true);
  }, [open]);

  const confirm = () => {
    onClose();
    toast({ type: "success", title: `"${JOB_ID}" completed` });
  };

  return (
    <Dialog
      bodyPadded={false}
      open={open}
      onClose={onClose}
      title="Time logged"
      breakpoint={mobile ? "mobile" : "desktop"}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={confirm}>
            Confirm
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.body}>
        {alertOpen && (
          <div className={styles.alert}>
            <AlertBanner orientation="vertical" status="info" onDismiss={() => setAlertOpen(false)}>
              Review logged time before you complete the job
            </AlertBanner>
          </div>
        )}
        <SessionGroup
          user={viewer}
          sessions={sessions}
          mobile={mobile}
          canAdd
          accordion={false}
          onStop={onStopSession}
          onEdit={onEditSession}
          onDelete={onDeleteSession}
          onAdd={onAddSession}
        />
      </div>
    </Dialog>
  );
}
