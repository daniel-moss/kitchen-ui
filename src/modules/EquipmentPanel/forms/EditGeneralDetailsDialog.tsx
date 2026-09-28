import { MouseEvent, useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import DateField from "../../../components/Fields/DateField/DateField";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import TextField from "../../../components/Fields/TextField/TextField";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { toast } from "../../../components/Toast/Toaster";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_TYPES, Equipment, OWNERSHIP_TYPES } from "../../../data/db";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

// The "General details" edit form (Figma 17192-89328): the same nine fields
// the New-equipment form collects, pre-filled, in a default Dialog titled
// "Equipment general details". The design still draws the retired TextInput /
// SelectInput / DateInput — these are the current `Input` + field components.
//
// NO FormModule (Daniel, 2026-09-28): the form has no sections, so a section
// header repeating the dialog's own title is redundant. The fields are a plain
// list, 24px apart — the Dialog body's own gap.

/** What Save hands back — the editable half of an Equipment row. */
export type EquipmentEdits = Pick<
  Equipment,
  "displayName" | "category" | "type" | "manufacturer" | "modelNumber" | "serialNumber" | "ownership" | "physicalLocation" | "installationDate"
>;

interface EditGeneralDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  equipment: Equipment;
  onSave: (edits: EquipmentEdits) => void;
  breakpoint?: "auto" | "desktop" | "mobile";
}

const toDate = (iso: string | undefined): Date | null => (iso == null ? null : new Date(iso));
const toIso = (date: Date | null): string | undefined => (date == null ? undefined : date.toISOString().slice(0, 10));

export default function EditGeneralDetailsDialog({ open, onClose, equipment, onSave, breakpoint = "auto" }: EditGeneralDetailsDialogProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [name, setName] = useState(equipment.displayName);
  const [category, setCategory] = useState<string>(equipment.category);
  const [type, setType] = useState(equipment.type ?? "");
  const [manufacturer, setManufacturer] = useState(equipment.manufacturer ?? "");
  const [model, setModel] = useState(equipment.modelNumber ?? "");
  const [serial, setSerial] = useState(equipment.serialNumber ?? "");
  const [ownership, setOwnership] = useState<string>(equipment.ownership);
  const [area, setArea] = useState(equipment.physicalLocation ?? "");
  const [installDate, setInstallDate] = useState<Date | null>(toDate(equipment.installationDate));
  const [showErrors, setShowErrors] = useState(false);

  const categoryPop = useSelectPopover(mobile);
  const typePop = useSelectPopover(mobile);
  const ownershipPop = useSelectPopover(mobile);

  // Re-read the record every time the form opens — the panel may have changed
  // underneath it.
  useEffect(() => {
    if (!open) return;
    setName(equipment.displayName);
    setCategory(equipment.category);
    setType(equipment.type ?? "");
    setManufacturer(equipment.manufacturer ?? "");
    setModel(equipment.modelNumber ?? "");
    setSerial(equipment.serialNumber ?? "");
    setOwnership(equipment.ownership);
    setArea(equipment.physicalLocation ?? "");
    setInstallDate(toDate(equipment.installationDate));
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, equipment]);

  useEffect(() => {
    if (open) return;
    categoryPop.close();
    typePop.close();
    ownershipPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const categoryTypes = category === "" ? [] : (EQUIPMENT_TYPES[category] ?? []);

  // A type belongs to exactly one category, so a category change drops a type
  // that no longer fits (the New-equipment form's rule).
  const pickCategory = (next: string) => {
    setCategory(next);
    if (next !== category) setType("");
    categoryPop.close();
  };

  const missingName = name.trim() === "";
  const missingCategory = category === "";

  const dirty =
    name !== equipment.displayName ||
    category !== equipment.category ||
    type !== (equipment.type ?? "") ||
    manufacturer !== (equipment.manufacturer ?? "") ||
    model !== (equipment.modelNumber ?? "") ||
    serial !== (equipment.serialNumber ?? "") ||
    ownership !== equipment.ownership ||
    area !== (equipment.physicalLocation ?? "") ||
    toIso(installDate) !== equipment.installationDate;

  const save = () => {
    if (missingName || missingCategory) {
      setShowErrors(true);
      return;
    }
    onSave({
      displayName: name.trim(),
      category: category as Equipment["category"],
      type: type === "" ? undefined : type,
      manufacturer: manufacturer.trim() === "" ? undefined : manufacturer.trim(),
      modelNumber: model.trim() === "" ? undefined : model.trim(),
      serialNumber: serial.trim() === "" ? undefined : serial.trim(),
      ownership: ownership as Equipment["ownership"],
      physicalLocation: area.trim() === "" ? undefined : area.trim(),
      installationDate: toIso(installDate),
    });
    toast({ type: "success", title: '"General details" updated' });
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Equipment general details"
        breakpoint={breakpoint}
        confirmOnDismiss={dirty}
        footer={
          <PopoverFooter
            leadingButton={
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
          <Input label="Category">
            <SelectField
              value={category !== "" ? category : undefined}
              isValid={!(showErrors && missingCategory)}
              open={categoryPop.open}
              onClick={(event: MouseEvent<HTMLDivElement>) => categoryPop.toggle(event.currentTarget)}
            />
          </Input>
          {category !== "" && (
            <Input label="Type" labelCondition="optional">
              <SelectField
                value={type !== "" ? type : undefined}
                open={typePop.open}
                onClick={(event: MouseEvent<HTMLDivElement>) => typePop.toggle(event.currentTarget)}
              />
            </Input>
          )}
          <Input label="Manufacturer" labelCondition="optional">
            <TextField value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} />
          </Input>
          <Input label="Serial number" labelCondition="optional">
            <TextField value={serial} onChange={(event) => setSerial(event.target.value)} />
          </Input>
          <Input label="Model number" labelCondition="optional">
            <TextField value={model} onChange={(event) => setModel(event.target.value)} />
          </Input>
          <Input label="Ownership" labelCondition="optional">
            <SelectField
              value={ownership !== "" ? ownership : undefined}
              open={ownershipPop.open}
              onClick={(event: MouseEvent<HTMLDivElement>) => ownershipPop.toggle(event.currentTarget)}
            />
          </Input>
          <Input label="Area" labelCondition="optional">
            <TextField value={area} onChange={(event) => setArea(event.target.value)} />
          </Input>
          <Input label="Installation date" labelCondition="optional">
            <DateField value={installDate} onDateChange={setInstallDate} breakpoint={mobile ? "mobile" : "desktop"} />
          </Input>
        </>
      </Dialog>

      <SelectPopoverList pop={categoryPop} mobile={mobile} title="Category" searchable searchPlaceholder="Category...">
        <SelectListItemGroup>
          {EQUIPMENT_CATEGORIES.map((option) => (
            <SelectListItem key={option} label={option} selected={option === category} onClick={() => pickCategory(option)} />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <SelectPopoverList pop={typePop} mobile={mobile} title="Type" searchable searchPlaceholder="Type...">
        <SelectListItemGroup>
          {categoryTypes.map((option) => (
            <SelectListItem
              key={option}
              label={option}
              selected={option === type}
              onClick={() => {
                setType(option);
                typePop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <SelectPopoverList pop={ownershipPop} mobile={mobile} title="Ownership">
        <SelectListItemGroup>
          {OWNERSHIP_TYPES.map((option) => (
            <SelectListItem
              key={option}
              label={option}
              selected={option === ownership}
              onClick={() => {
                setOwnership(option);
                ownershipPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
