import { MouseEvent, useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import EmptyState from "../../../components/EmptyState/EmptyState";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import TextField from "../../../components/Fields/TextField/TextField";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { toast } from "../../../components/Toast/Toaster";
import { LABOR_SUBTYPES, LaborItem } from "../../../data/db";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { MAX_NAME, NAME_COUNTER_FROM } from "../../NewLaborRateForm/rateMath";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";
import { LaborRateGeneral } from "../LaborRatePanel.types";

// The labor rate's "General" edit form (Figma 1-7284): a default Dialog titled
// "General" — the module's own name — with the two editable fields of that
// module, Name and Subtype, pre-filled.
//
// Its own annotation points at the "New labor rate" form for the inputs, so
// both share `rateMath`'s name rules and neither can drift.
//
// NO FormModule: the form has no sections, so a section header repeating the
// dialog's own title would be redundant (the panel forms' rule).

interface EditGeneralDialogProps {
  open: boolean;
  onClose: () => void;
  rate: LaborItem;
  /** Every OTHER labor rate's name — production's `description` is unique. */
  existingNames?: string[];
  /** The company requires a subtype: no "(optional)" tag, no clear row. */
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

  const [name, setName] = useState(rate.name);
  const [subtypeId, setSubtypeId] = useState<string | null>(rate.subtypeId);
  const [showErrors, setShowErrors] = useState(false);

  const subtypePop = useSelectPopover(mobile);

  // Re-read the record every time the form opens — the panel may have changed
  // underneath it.
  useEffect(() => {
    if (!open) return;
    setName(rate.name);
    setSubtypeId(rate.subtypeId);
    setShowErrors(false);
  }, [open, rate]);

  const nameLeft = Math.max(0, MAX_NAME - name.length);
  const missingName = name.trim() === "";
  const duplicateName =
    !missingName &&
    existingNames.some(
      (taken) => taken.trim().toLowerCase() === name.trim().toLowerCase() && taken.trim().toLowerCase() !== rate.name.trim().toLowerCase(),
    );
  // A company with no subtypes has no field to fill, so "required" cannot
  // block anything (production guards the same way).
  const missingSubtype = requireSubtypes && LABOR_SUBTYPES.length > 0 && subtypeId == null;

  const dirty = name !== rate.name || subtypeId !== rate.subtypeId;

  const save = async () => {
    if (missingName || duplicateName || missingSubtype) {
      setShowErrors(true);
      return;
    }

    if ((await onSave({ name: name.trim(), subtypeId })) === false) {
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

  const subtypeName = LABOR_SUBTYPES.find((row) => row.id === subtypeId)?.name;
  // Required + exactly one option: it is chosen for the user, with nothing to
  // do — the same read-only field the create form draws.
  const locked = requireSubtypes && LABOR_SUBTYPES.length === 1 ? LABOR_SUBTYPES[0] : undefined;

  return (
    <>
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
          {/* The counter appears only in the last 10 characters, and the cap
              never becomes an error — the field simply stops accepting input
              (the create form's two annotations). */}
          <Input label="Name" helpText={nameLeft <= NAME_COUNTER_FROM ? `${nameLeft} characters left` : undefined}>
            <TextField
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_NAME}
              isValid={!(showErrors && (missingName || duplicateName))}
              errorMessage={duplicateName ? "Labor rate with this name already exists" : undefined}
            />
          </Input>

          {/* A company with no subtypes has no field at all. */}
          {LABOR_SUBTYPES.length > 0 &&
            (locked != null ? (
              <Input label="Subtype">
                <SelectField value={locked.name} readOnly />
              </Input>
            ) : (
              <Input label="Subtype" labelCondition={requireSubtypes ? undefined : "optional"}>
                <SelectField
                  value={subtypeName}
                  open={subtypePop.open}
                  onClick={(event: MouseEvent<HTMLDivElement>) => subtypePop.toggle(event.currentTarget)}
                  isValid={!(showErrors && missingSubtype)}
                />
              </Input>
            ))}
        </>
      </Dialog>

      {/* "Sorted by name from A to Z" (the Select List's annotation). */}
      <SelectPopoverList
        pop={subtypePop}
        mobile={mobile}
        title="Subtype"
        searchable
        searchPlaceholder="Subtype..."
        noResultsState={<EmptyState caption="No matching subtypes" />}
      >
        <SelectListItemGroup>
          {/* "Only exists if subtype is NOT required by company settings. It
              allows the user to clear the selection. Always on top of the
              list." */}
          {!requireSubtypes && (
            <SelectListItem
              label="No subtype"
              selected={subtypeId == null}
              onClick={() => {
                setSubtypeId(null);
                subtypePop.close();
              }}
            />
          )}
          {[...LABOR_SUBTYPES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((subtype) => (
              <SelectListItem
                key={subtype.id}
                label={subtype.name}
                selected={subtype.id === subtypeId}
                onClick={() => {
                  setSubtypeId(subtype.id);
                  subtypePop.close();
                }}
              />
            ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
