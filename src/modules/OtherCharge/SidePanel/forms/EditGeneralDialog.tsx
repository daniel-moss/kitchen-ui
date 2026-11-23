import { useEffect, useState } from "react";

import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import { toast } from "../../../../components/Toast/Toaster";
import { ChargeItem, OTHER_SUBTYPES } from "../../../../data/db";
import useIsDesktop from "../../../../hooks/useIsDesktop";
import { NameField, nameIssues, SubtypeField, subtypeRules } from "../../../shared/pricebookFields";
import { OtherChargeGeneral } from "../OtherChargePanel.types";

import styles from "../OtherChargePanel.module.scss";

// The other charge's "General" edit form (the SHARED General module's edit
// form): a default Dialog titled "General" with the module's two editable
// fields, Name and Subtype, pre-filled.
//
// Both are the pricebook "Shared Fields", the same pieces the "Create" form
// uses. This is an "Edit" form, so it "shows every field that applies,
// required or optional" (Shared Behavior → Which Fields Show): Subtype appears
// whenever the company has subtypes, with "(optional)" and a "No subtype" row
// when the company does not require one.

interface EditGeneralDialogProps {
  open: boolean;
  onClose: () => void;
  charge: ChargeItem;
  /** Every other pricebook item's name — production's `description` is unique. */
  existingNames?: string[];
  /** The company requires a subtype. */
  requireSubtypes?: boolean;
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (edits: OtherChargeGeneral) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditGeneralDialog({
  open,
  onClose,
  charge,
  existingNames = [],
  requireSubtypes = false,
  onSave,
  breakpoint = "auto",
}: EditGeneralDialogProps) {
  const mobile = !useIsDesktop(breakpoint);
  const subtype = subtypeRules(OTHER_SUBTYPES, requireSubtypes);

  const [name, setName] = useState(charge.name);
  const [subtypeId, setSubtypeId] = useState<string | null>(charge.subtypeId);
  const [showErrors, setShowErrors] = useState(false);

  // Re-read the record every time the form opens — the panel may have changed
  // underneath it. A lone required subtype is the value.
  useEffect(() => {
    if (!open) return;
    setName(charge.name);
    setSubtypeId(subtype.lone?.id ?? charge.subtypeId);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, charge]);

  const issues = nameIssues(name, existingNames, charge.name);
  const missingSubtype = subtype.required && subtypeId == null;
  const dirty = name !== charge.name || subtypeId !== charge.subtypeId;

  const save = async () => {
    if (issues.missing || issues.tooLong != null || issues.duplicate || missingSubtype) {
      setShowErrors(true);
      return;
    }

    if ((await onSave({ name: name.trim(), subtypeId })) === false) {
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
        <NameField
          value={name}
          onChange={setName}
          existingNames={existingNames}
          ownName={charge.name}
          itemLabel="Other charge"
          showErrors={showErrors}
        />
        <SubtypeField
          subtypes={OTHER_SUBTYPES}
          required={requireSubtypes}
          value={subtypeId}
          onChange={setSubtypeId}
          showErrors={showErrors}
          mobile={mobile}
        />
      </div>
    </Dialog>
  );
}
