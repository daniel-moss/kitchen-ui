import { useEffect, useState } from "react";

import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import { toast } from "../../../../components/Toast/Toaster";
import { TaxRateItem } from "../../../../data/db";
import { NameField, nameIssues } from "../../../shared/pricebookFields";
import { TaxRateGeneral } from "../TaxRatePanel.types";

import styles from "../TaxRatePanel.module.scss";

// The tax rate's "General" edit form: a default Dialog titled "General" with
// the Name alone (the shared Name field) — a tax rate has no subtype.

interface EditGeneralDialogProps {
  open: boolean;
  onClose: () => void;
  rate: TaxRateItem;
  /** Every other pricebook item's name — production's `description` is unique. */
  existingNames?: string[];
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (edits: TaxRateGeneral) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditGeneralDialog({ open, onClose, rate, existingNames = [], onSave, breakpoint = "auto" }: EditGeneralDialogProps) {
  const [name, setName] = useState(rate.name);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(rate.name);
    setShowErrors(false);
  }, [open, rate]);

  const issues = nameIssues(name, existingNames, rate.name);
  const dirty = name !== rate.name;

  const save = async () => {
    if (issues.missing || issues.tooLong != null || issues.duplicate) {
      setShowErrors(true);
      return;
    }
    if ((await onSave({ name: name.trim() })) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Couldn\'t update "General" module',
        caption: "Something went wrong. Please try again.",
      });
      return;
    }
    toast({ type: "success", title: '"General" module updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="General"
      breakpoint={breakpoint}
      confirmOnDismiss={dirty}
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
      <div className={styles.fields}>
        <NameField value={name} onChange={setName} existingNames={existingNames} ownName={rate.name} itemLabel="Tax rate" showErrors={showErrors} />
      </div>
    </Dialog>
  );
}
