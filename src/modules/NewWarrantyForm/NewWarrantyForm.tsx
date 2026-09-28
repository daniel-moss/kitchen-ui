import { useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import DateField from "../../components/Fields/DateField/DateField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";
import useIsDesktop from "../../hooks/useIsDesktop";

import { NewWarranty, NewWarrantyFormProps } from "./NewWarrantyForm.types";

import styles from "../shared/fieldRow.module.scss";

// The reusable "New warranty" form (Figma file Li6YWAxeT71o5tPDPZgo3Y,
// section 23801-3854): a default Dialog titled "New warranty" with the owning
// equipment in the header caption, four fields and a Create action.
//
// Name · Start date + End date (one row) · Notes.
//
// The design draws the RETIRED TextInput / DateInput / TextArea components —
// these are the current `Input` wrapper plus the DS field components, the same
// swap EditGeneralDetailsDialog made.
//
// NO FormModule: the form has no sections, so a section header repeating the
// dialog's own title would be redundant (Daniel's rule for the sibling
// Equipment-panel forms, 2026-09-28). The fields are a plain list at the
// Dialog body's own 24px rhythm.

export default function NewWarrantyForm({
  open,
  onClose,
  equipmentName,
  onCreated,
  onPreview,
  breakpoint = "auto",
}: NewWarrantyFormProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  // A fresh form every time it opens — this one creates a record, it does not
  // edit one, so there is nothing to re-read.
  useEffect(() => {
    if (!open) return;
    setName("");
    setStartDate(null);
    setEndDate(null);
    setNotes("");
    setShowErrors(false);
  }, [open]);

  // The two required fields (the Validation frame, node 23802-1922). The error
  // copy there — "Enter Name" / "Choose Start date" — is exactly what
  // TextField and DateField derive from the Input label, so neither needs an
  // `errorMessage`.
  const missingName = name.trim() === "";
  const missingStartDate = startDate == null;

  const dirty = name.trim() !== "" || startDate != null || endDate != null || notes.trim() !== "";

  const create = async () => {
    if (missingName || missingStartDate) {
      setShowErrors(true);
      return;
    }

    const warranty: NewWarranty = {
      name: name.trim(),
      startDate,
      endDate,
      notes: notes.trim(),
    };

    if ((await onCreated?.(warranty)) === false) {
      // The designed failure toast (node 23801-3866). The form stays open with
      // the values intact so the user can try again.
      toast({
        type: "error",
        variant: "detailed",
        title: "Could not create the warranty",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    // "Create — 1. Adds the warranty  2. Triggers the toast" (the Create
    // button's annotation). The CTA opens the "Warranty" side panel, which
    // the caller owns.
    toast({
      type: "success",
      variant: "detailed",
      title: "Warranty created",
      caption: warranty.name,
      cta: onPreview == null ? undefined : { children: "Preview", onClick: () => onPreview(warranty) },
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New warranty"
      // "Equipment for which the warranty is being added. Format:
      // [equipment_name]" (the caption's annotation).
      caption={equipmentName}
      captionLeftSlot={<Icon icon="cube" pack="regular" size={14} />}
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
          <Button size="lg" variant="solid" onClick={create}>
            Create
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

        <Input label="Notes" labelCondition="optional">
          <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} onClear={() => setNotes("")} />
        </Input>
      </>
    </Dialog>
  );
}

// Re-exported so a consumer can type its handlers without reaching inside.
export type { NewWarranty, NewWarrantyFormProps } from "./NewWarrantyForm.types";
