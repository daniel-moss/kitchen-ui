import { useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";
import useIsDesktop from "../../hooks/useIsDesktop";

import styles from "./EditNotesDialog.module.scss";

// The "Notes" edit form — the shared "Text Area" form pattern (its Figma doc
// file pnpE6Jr6JG1Bm2iLWyy1vS): a default Dialog whose body is one TextArea.
//
// SHARED since 2026-09-28 (promoted out of the Equipment side panel): the
// Warranty side panel opens the same dialog, only with its own title
// ("Warranty notes", node 22049-1908) and an "(optional)" label condition.
//
// The doc's four rules:
//   Behaviour      the field is focused on open (the mobile keyboard follows),
//   Minimum height 12 rows on desktop; none on mobile — there the drawer fills
//                  the screen (Dialog's `fillHeight`) and the field fills the
//                  drawer,
//   Maximum height the dialog caps at 1000px and the DIALOG BODY scrolls — the
//                  text area itself never scrolls, it grows to hug its content
//                  ("an intentional request from our users"). That is the DS
//                  TextArea's own behaviour, so nothing is needed for it here,
//   Dismiss        empty = dismiss straight away, filled = confirm first.

interface EditNotesDialogProps {
  open: boolean;
  onClose: () => void;
  notes?: string;
  /**
   * Save. Return `false` (or a Promise of it) to say the save FAILED: the
   * dialog shows the designed error toast and stays open with the text intact
   * (the Warranty panel's "Update Notes" toasts, node 21869-14056). Anything
   * else counts as success.
   */
  onSave: (notes: string) => void | boolean | Promise<void | boolean>;
  /**
   * The dialog title. Default "Notes" (the Equipment panel); the Warranty
   * panel names its object — "Warranty notes".
   */
  title?: string;
  /** Show "(optional)" next to the field label. Default false. */
  optional?: boolean;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditNotesDialog({
  open,
  onClose,
  notes,
  onSave,
  title = "Notes",
  optional = false,
  breakpoint = "auto",
}: EditNotesDialogProps) {
  const mobile = !useIsDesktop(breakpoint);
  const [value, setValue] = useState(notes ?? "");

  useEffect(() => {
    if (!open) return;
    setValue(notes ?? "");
  }, [open, notes]);

  const save = async () => {
    if ((await onSave(value.trim())) === false) {
      toast({ type: "error", variant: "detailed", title: 'Could not update "Notes"', caption: "Something went wrong. Please try again." });
      return;
    }
    toast({ type: "success", title: '"Notes" updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      breakpoint={breakpoint}
      // Mobile: the sheet takes the whole screen so the field can use it all.
      fillHeight
      // "If there is no content entered, the user can dismiss the dialog
      // without confirmation. If content is provided, we ask to confirm."
      confirmOnDismiss={value.trim() !== "" && value !== (notes ?? "")}
      footer={
        <PopoverFooter
          slotLeft={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <Input
        label="Notes"
        labelCondition={optional ? "optional" : undefined}
        className={mobile ? styles.fillField : styles.tallField}
      >
        <TextArea autoFocus value={value} onChange={(event) => setValue(event.target.value)} onClear={() => setValue("")} />
      </Input>
    </Dialog>
  );
}
