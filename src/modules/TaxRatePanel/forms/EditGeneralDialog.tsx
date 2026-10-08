import { useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import TextField from "../../../components/Fields/TextField/TextField";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import { toast } from "../../../components/Toast/Toaster";
import { TaxRateItem } from "../../../data/db";
import { isRateText, MAX_NAME, NAME_COUNTER_FROM, rateIssue } from "../../NewTaxRateForm/rateRules";
import { TaxRateDetails } from "../TaxRatePanel.types";

// The tax rate's "General" edit form (Figma 1-7284): a default Dialog titled
// "General" — the module's own name, since the panel behind it already names
// the rate (Daniel, 2026-10-08) — with the two editable fields of that module,
// Name and Percentage, pre-filled.
//
// Its own annotation points at the "New tax rate" form for the inputs, so both
// share `rateRules` and neither can drift.
//
// NO FormModule: the form has no sections, so a section header repeating the
// dialog's own title would be redundant (the panel forms' rule).

interface EditGeneralDialogProps {
  open: boolean;
  onClose: () => void;
  rate: TaxRateItem;
  /**
   * Save. Return `false` (or a Promise of it) to say the save FAILED: the form
   * shows the designed error toast and stays open with the values intact.
   */
  onSave: (edits: TaxRateDetails) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditGeneralDialog({ open, onClose, rate, onSave, breakpoint = "auto" }: EditGeneralDialogProps) {
  const [name, setName] = useState(rate.name);
  const [percentage, setPercentage] = useState(String(rate.rate));
  const [showErrors, setShowErrors] = useState(false);

  // Re-read the record every time the form opens — the panel may have changed
  // underneath it.
  useEffect(() => {
    if (!open) return;
    setName(rate.name);
    setPercentage(String(rate.rate));
    setShowErrors(false);
  }, [open, rate]);

  const nameLeft = Math.max(0, MAX_NAME - name.length);
  const missingName = name.trim() === "";
  const issue = rateIssue(percentage);
  const rateInvalid = issue !== undefined;

  const dirty = name !== rate.name || Number(percentage) !== rate.rate;

  const save = async () => {
    if (missingName || rateInvalid) {
      setShowErrors(true);
      return;
    }

    if ((await onSave({ name: name.trim(), rate: Number(percentage) })) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Could not update "General" module',
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
      <>
        {/* The same two rules the create form's Name carries (Figma 44-3119):
            it caps at 50 characters without ever becoming an error, and the
            counter appears only in the last 10. */}
        <Input label="Name" helpText={nameLeft <= NAME_COUNTER_FROM ? `${nameLeft} characters left` : undefined}>
          <TextField
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_NAME}
            isValid={!(showErrors && missingName)}
          />
        </Input>

        <Input label="Percentage">
          <TextField
            value={percentage}
            onChange={(event) => {
              if (isRateText(event.target.value)) setPercentage(event.target.value);
            }}
            keyboard="decimal"
            suffix="%"
            isValid={!(showErrors && rateInvalid)}
            errorMessage={issue?.message}
          />
        </Input>
      </>
    </Dialog>
  );
}
