import { useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import { toast } from "../../../components/Toast/Toaster";
import { LABOR_SUBTYPES, LaborItem } from "../../../data/db";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { NameField, nameIssues, SubtypeField, subtypeRules } from "../../shared/pricebookFields";
import { LaborRateGeneral } from "../LaborRatePanel.types";

import styles from "../LaborRatePanel.module.scss";

// The labor rate's "General" edit form (Figma 1-7284): a default Dialog titled
// "General" — the module's own name — with the module's two editable fields,
// Name and Subtype, pre-filled.
//
// Both are the pricebook "Shared Fields", the same pieces the "Create" form
// uses. This is an "Edit" form, so it "shows every field that applies,
// required or optional" (Shared Behavior → Which Fields Show): Subtype appears
// whenever the company has subtypes, with "(optional)" and a "No subtype" row
// when the company does not require one.

interface EditGeneralDialogProps {
  open: boolean;
  onClose: () => void;
  rate: LaborItem;
  /** Every labor rate's name — production's `description` is unique. */
  existingNames?: string[];
  /** The company requires a subtype. */
  requireSubtypes?: boolean;
  /**
   * Save. Return `false` (or a Promise of it) to say the save FAILED: the form
   * shows the designed error toast and stays open with the values intact.
   */
  onSave: (edits: LaborRateGeneral) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditGeneralDialog({
  open,
  onClose,
  rate,
  existingNames = [],
  requireSubtypes = false,
  onSave,
  breakpoint = "auto",
}: EditGeneralDialogProps) {
  const mobile = !useIsDesktop(breakpoint);
  const subtype = subtypeRules(LABOR_SUBTYPES, requireSubtypes);

  const [name, setName] = useState(rate.name);
  const [subtypeId, setSubtypeId] = useState<string | null>(rate.subtypeId);
  const [showErrors, setShowErrors] = useState(false);

  // Re-read the record every time the form opens — the panel may have changed
  // underneath it. A lone required subtype is the value.
  useEffect(() => {
    if (!open) return;
    setName(rate.name);
    setSubtypeId(subtype.lone?.id ?? rate.subtypeId);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rate]);

  const issues = nameIssues(name, existingNames, rate.name);
  const missingSubtype = subtype.required && subtypeId == null;
  const dirty = name !== rate.name || subtypeId !== rate.subtypeId;

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
          ownName={rate.name}
          itemLabel="Labor rate"
          showErrors={showErrors}
        />
        <SubtypeField
          subtypes={LABOR_SUBTYPES}
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
