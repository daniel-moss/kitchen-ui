import { useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import DateField from "../../../components/Fields/DateField/DateField";
import TextField from "../../../components/Fields/TextField/TextField";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import { toast } from "../../../components/Toast/Toaster";
import { Warranty } from "../../../data/db";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { WarrantyEdits } from "../WarrantyPanel.types";

import styles from "../../shared/fieldRow.module.scss";

// The warranty's "General details" edit form (Figma 21869-13823): a default
// Dialog titled "Warranty general details" holding the same three fields the
// "New warranty" form collects, pre-filled — Name, Start date, End date.
//
// The design draws the RETIRED TextInput / DateInput; these are the current
// `Input` wrapper + `TextField` / `DateField`. Its own annotation points at the
// "New warranty" form for the inputs, so the two forms stay identical.
//
// NO FormModule: the form has no sections, so a section header repeating the
// dialog's own title would be redundant (the Equipment panel's rule).

const toDate = (iso: string | undefined): Date | null => (iso == null ? null : new Date(iso));
const toIso = (date: Date | null): string | undefined => (date == null ? undefined : date.toISOString().slice(0, 10));

interface EditGeneralDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  warranty: Warranty;
  /**
   * Save. Return `false` (or a Promise of it) to say the save FAILED: the form
   * shows the designed error toast and stays open with the values intact.
   */
  onSave: (edits: WarrantyEdits) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditGeneralDetailsDialog({ open, onClose, warranty, onSave, breakpoint = "auto" }: EditGeneralDetailsDialogProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [name, setName] = useState(warranty.name);
  const [startDate, setStartDate] = useState<Date | null>(toDate(warranty.startDate));
  const [endDate, setEndDate] = useState<Date | null>(toDate(warranty.endDate));
  const [showErrors, setShowErrors] = useState(false);

  // Re-read the record every time the form opens — the panel may have changed
  // underneath it.
  useEffect(() => {
    if (!open) return;
    setName(warranty.name);
    setStartDate(toDate(warranty.startDate));
    setEndDate(toDate(warranty.endDate));
    setShowErrors(false);
  }, [open, warranty]);

  const missingName = name.trim() === "";
  const missingStartDate = startDate == null;

  const dirty = name !== warranty.name || toIso(startDate) !== warranty.startDate || toIso(endDate) !== warranty.endDate;

  const save = async () => {
    if (missingName || missingStartDate) {
      setShowErrors(true);
      return;
    }

    // "Save — 1. Saves changes  2. Triggers the toast" (the Save button's
    // annotation, node 21864-11908).
    if ((await onSave({ name: name.trim(), startDate: toIso(startDate)!, endDate: toIso(endDate) })) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Could not update "General details"',
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    toast({ type: "success", title: '"General details" updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Warranty general details"
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
        <Input label="Name">
          <TextField value={name} onChange={(event) => setName(event.target.value)} isValid={!(showErrors && missingName)} />
        </Input>

        <div className={styles.fieldRow}>
          <Input label="Start date">
            <DateField
              value={startDate}
              onDateChange={setStartDate}
              isValid={!(showErrors && missingStartDate)}
              // A warranty cannot start after it ends.
              maxDate={endDate ?? undefined}
              breakpoint={mobile ? "mobile" : "desktop"}
            />
          </Input>
          <Input label="End date" labelCondition="optional">
            <DateField
              value={endDate}
              onDateChange={setEndDate}
              minDate={startDate ?? undefined}
              breakpoint={mobile ? "mobile" : "desktop"}
            />
          </Input>
        </div>
      </>
    </Dialog>
  );
}
