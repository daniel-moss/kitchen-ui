import { useEffect, useState } from "react";

import AvatarGroup from "../../components/Avatar/AvatarGroup";
import Button from "../../components/Button/Button";
import CheckboxItem from "../../components/Checkbox/CheckboxItem";
import Dialog from "../../components/Dialog/Dialog";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { users } from "../../data/users";

import styles from "./UnscheduleJobForm.module.scss";

interface UnscheduleJobFormProps {
  open: boolean;
  onClose: () => void;
  /** Current assignee user ids (the dialog only shows for a non-empty list). */
  assignees: number[];
  /** Confirms — `unassign` mirrors the checkbox. */
  onUnschedule: (unassign: boolean) => void;
  mobile?: boolean;
}

// The "Unschedule job" dialog for an ASSIGNED job (Figma 24215-18740 mobile /
// 24221-19652 desktop; checked state 24221-19890/19892): centered current-
// assignees avatar stack, "Remove assignees?" copy, and an "Unassign job"
// CheckboxItem card (regular users-slash). The primary button is "Unschedule"
// — or "Unschedule + Unassign" while the checkbox is checked. An UNASSIGNED
// job skips this dialog and gets the plain prompt instead.
export default function UnscheduleJobForm({ open, onClose, assignees, onUnschedule, mobile = false }: UnscheduleJobFormProps) {
  const [unassign, setUnassign] = useState(false);

  // A fresh open starts unchecked.
  useEffect(() => {
    if (open) setUnassign(false);
  }, [open]);

  const assigneeItems = assignees
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is (typeof users)[number] => u != null)
    .map((u) => ({ name: u.name, imageSrc: u.avatar }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Unschedule job"
      breakpoint={mobile ? "mobile" : "desktop"}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button
            size="lg"
            variant="solid"
            onClick={() => {
              onUnschedule(unassign);
              onClose();
            }}
          >
            {unassign ? "Unschedule + Unassign" : "Unschedule"}
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.body}>
        {/* The current assignees — an inline xl stack; overflowing avatars
            truncate into the "+N" counter. */}
        <AvatarGroup variation="inline" size="xl" items={assigneeItems} max={mobile ? 8 : 14} />
        <div className={styles.copy}>
          <span className={styles.copyTitle}>Remove assignees?</span>
          <span className={styles.copyCaption}>Do you want to remove assignees from the job?</span>
        </div>
        <CheckboxItem
          variant="card"
          icon="users-slash"
          iconPack="regular"
          label="Unassign job"
          checked={unassign}
          onChange={(e) => setUnassign(e.target.checked)}
        />
      </div>
    </Dialog>
  );
}
