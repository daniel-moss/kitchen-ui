import { useEffect, useState } from "react";

import AvatarUser from "../../components/Avatar/AvatarUser";
import Button from "../../components/Button/Button";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ItemTextBlock from "../../components/ItemText/ItemText/ItemTextBlock";
import ListItem from "../../components/ListItem/ListItem";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";

import DismissCancelButton from "../shared/DismissCancelButton";
import { categoryIcon } from "./TimesheetPanel";
import styles from "./UnscheduleJobForm.module.scss";

/** An assignee whose clock is running. */
export interface CheckedInAssignee {
  id: number;
  name: string;
  avatar?: string;
  /** Their check-in status, e.g. "Working". */
  status?: string;
  /** Seconds on the running session — the caller keeps it ticking. */
  elapsedSec: number;
}

interface UnscheduleJobFormProps {
  open: boolean;
  onClose: () => void;
  /** Unschedules the job with the (required) reason. */
  onUnschedule: (reason: string) => void;
  /**
   * The assignees who are checked in right now. Unscheduling checks them all
   * out, so a non-empty list shows the warning block listing them.
   */
  checkedIn?: CheckedInAssignee[];
  mobile?: boolean;
}

// "1:30:45", "0:45:24" — the running session, hours never padded (Figma 27263-65227).
const sessionTime = (sec: number) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${Math.floor(sec / 3600)}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;
};

// "Unschedule job" (Figma 27154-49578) — opened by the "Unschedule" menu item.
// It replaced the "Unschedule job?" Prompt on 2026-10-22: the user now says
// WHY, and the reason becomes the Status module's message ("Unschedule
// reason"). Its body is ONE required TextArea — but NOT a text dialog: on
// mobile the drawer hugs its content and the field keeps its default size,
// and the drawer has a drag handle instead of the close button (Daniel,
// 2026-10-25, Figma DrawerHeader dragHandle on, close off).
//
// Below the field (Figma 27263-65227, 2026-10-26): when anyone is checked in,
// a warning DisplayModule — "N assignee(s) is/are checked in. Unscheduling will
// check them out." — over a list of those assignees: avatar and name, and on
// the right their running time (it keeps counting) over their status, both
// red. Checked-in assignees only, no truncation. It replaced the AlertBanner
// that named them in one sentence. "Unschedule" clears "Scheduled for",
// closes, and toasts "Job unscheduled".
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

  const count = checkedIn.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Unschedule job"
      breakpoint={mobile ? "mobile" : "desktop"}
      drawerHeader="default"
      confirmOnDismiss={reason !== ""}
      footer={
        <PopoverFooter leadingButton={<DismissCancelButton />}>
          <Button size="lg" variant="solid" leftIcon="calendar-xmark" onClick={unschedule}>
            Unschedule
          </Button>
        </PopoverFooter>
      }
    >
      {/* The error is the Input's default, "Provide Unschedule reason". */}
      <Input label="Unschedule reason" helpText="Why does this job need to be unscheduled?">
        <TextArea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (showError) setShowError(false);
          }}
          isValid={!showError}
        />
      </Input>
      {count > 0 && (
        <DisplayModule
          variant="bodyOnly"
          status="warning"
          banner={{
            children: `${count} ${count === 1 ? "assignee is" : "assignees are"} checked in. Unscheduling will check them out.`,
          }}
          bodyPadded={false}
          content={
            <ItemGroup>
              {checkedIn.map((assignee) => (
                <ListItem
                  key={assignee.id}
                  variant="title"
                  title={assignee.name}
                  avatar={<AvatarUser size="xl" imageSrc={assignee.avatar} />}
                  right={
                    <ItemTextBlock
                      align="right"
                      variant={assignee.status != null ? "titleCaption" : "title"}
                      title={sessionTime(assignee.elapsedSec)}
                      titleColor="error"
                      titleClassName={styles.time}
                      caption={assignee.status}
                      captionColor="error"
                      // The slot's icon color is the caller's (the DS leaves it open).
                      captionSlotLeft={
                        assignee.status != null ? (
                          <Icon icon={categoryIcon(assignee.status)} size={14} className={styles.statusIcon} />
                        ) : undefined
                      }
                    />
                  }
                />
              ))}
            </ItemGroup>
          }
        />
      )}
    </Dialog>
  );
}
