import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import DateField from "../../components/Fields/DateField/DateField";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import useIsDesktop from "../../hooks/useIsDesktop";
import LabelsField from "../shared/LabelsField";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_TYPES, LABEL_POOL, OWNERSHIP_TYPES } from "./data";
import { NewEquipmentFormProps } from "./NewEquipmentForm.types";

// NewEquipmentForm — the reusable "New equipment" form (Figma 21897-7658):
// a Dialog titled "New equipment" with the owning location in the header
// caption, three FormModules (General details / Label / Notes) and a Create
// footer. Name and Category are the only required fields (23824-9178).
//
// Category, Type and Ownership are single-select lists anchored under their
// field (mobile: drawer). The TYPE list follows the chosen CATEGORY — every
// type belongs to one category — so changing the category clears the type.
// Labels are the shared LabelsField (field + dismissible badges + the shared
// "Labels" SelectList), like every other form.
export default function NewEquipmentForm({
  open,
  onClose,
  location,
  onCreated,
  breakpoint = "auto",
}: NewEquipmentFormProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const mobile = !isDesktop;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [ownership, setOwnership] = useState("");
  const [area, setArea] = useState("");
  const [installDate, setInstallDate] = useState<Date | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const categoryPop = useSelectPopover(mobile);
  const typePop = useSelectPopover(mobile);
  const ownershipPop = useSelectPopover(mobile);

  // Fresh form every open.
  useEffect(() => {
    if (!open) return;
    setName("");
    setCategory("");
    setType("");
    setManufacturer("");
    setModel("");
    setSerial("");
    setOwnership("");
    setArea("");
    setInstallDate(null);
    setLabels([]);
    setNotes("");
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) return;
    categoryPop.close();
    typePop.close();
    ownershipPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A type belongs to exactly one category, so a category change drops a type
  // that no longer fits.
  const pickCategory = (next: string) => {
    setCategory(next);
    if (next !== category) setType("");
    categoryPop.close();
  };

  const categoryTypes = category === "" ? [] : (EQUIPMENT_TYPES[category] ?? []);

  // Only Name and Category are required (Figma 23824-9178: "These fields can
  // not be empty"); "Enter Name" / "Choose Category" are the field defaults.
  const missingName = name.trim() === "";
  const missingCategory = category === "";

  const dirty =
    name !== "" || category !== "" || type !== "" || manufacturer !== "" || model !== "" || serial !== "" ||
    ownership !== "" || area !== "" || installDate != null || labels.length > 0 || notes !== "";

  const create = () => {
    if (missingName || missingCategory) {
      setShowErrors(true);
      return;
    }
    onCreated?.({
      name: name.trim(),
      category,
      type,
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      serial: serial.trim(),
      ownership,
      area: area.trim(),
      installDate,
      labels,
      notes: notes.trim(),
    });
    // The "Preview" CTA opens the Equipment side panel — a separate design,
    // display-only for now.
    toast({
      type: "success",
      variant: "detailed",
      title: "Equipment created",
      caption: name.trim(),
      cta: { children: "Preview" },
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New equipment"
      caption={location}
      captionLeftSlot={<Icon icon="location-dot" pack="regular" size={14} />}
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
          <Button size="lg" variant="solid" onClick={create}>
            Create
          </Button>
        </PopoverFooter>
      }
    >
      <FormModuleGroup>
        <FormModule title="General details">
          <Input label="Name">
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              isValid={!(showErrors && missingName)}
            />
          </Input>
          <Input label="Category">
            <SelectField
              value={category !== "" ? category : undefined}
              isValid={!(showErrors && missingCategory)}
              open={categoryPop.open}
              onClick={(e: MouseEvent<HTMLDivElement>) => categoryPop.toggle(e.currentTarget)}
            />
          </Input>
          {/* Type shows only once a Category is chosen — its options belong to
              that category (Figma: the empty form has no Type row). */}
          {category !== "" && (
            <Input label="Type" labelCondition="optional">
              <SelectField
                value={type !== "" ? type : undefined}
                open={typePop.open}
                onClick={(e: MouseEvent<HTMLDivElement>) => typePop.toggle(e.currentTarget)}
              />
            </Input>
          )}
          <Input label="Manufacturer" labelCondition="optional">
            <TextField value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          </Input>
          <Input label="Model number" labelCondition="optional">
            <TextField value={model} onChange={(e) => setModel(e.target.value)} />
          </Input>
          <Input label="Serial number" labelCondition="optional">
            <TextField value={serial} onChange={(e) => setSerial(e.target.value)} />
          </Input>
          <Input label="Ownership" labelCondition="optional">
            <SelectField
              value={ownership !== "" ? ownership : undefined}
              open={ownershipPop.open}
              onClick={(e: MouseEvent<HTMLDivElement>) => ownershipPop.toggle(e.currentTarget)}
            />
          </Input>
          <Input label="Area" labelCondition="optional">
            <TextField value={area} onChange={(e) => setArea(e.target.value)} />
          </Input>
          <Input label="Installation date" labelCondition="optional">
            <DateField
              value={installDate}
              onDateChange={setInstallDate}
              breakpoint={mobile ? "mobile" : "desktop"}
            />
          </Input>
        </FormModule>

        {/* Label (Figma writes the title in the singular) — the multi-select
            field with its counter, and the picked labels as dismissible
            badges below it. */}
        <FormModule title="Label" titleCondition="optional">
          <LabelsField value={labels} onChange={setLabels} pool={LABEL_POOL} mobile={mobile} />
        </FormModule>

        <FormModule title="Notes" titleCondition="optional">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} clearable onClear={() => setNotes("")} />
        </FormModule>
      </FormModuleGroup>

      <SelectPopoverList
        pop={categoryPop}
        mobile={mobile}
        title="Category"
        searchable
        searchPlaceholder="Search by category..."
      >
        <SelectListItemGroup>
          {EQUIPMENT_CATEGORIES.map((c) => (
            <SelectListItem key={c} label={c} selected={c === category} onClick={() => pickCategory(c)} />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* The Type list holds the chosen category's types only (the field is
          hidden until a category is picked, so the list is never empty-by-
          default — only a category without types can be). */}
      <SelectPopoverList
        pop={typePop}
        mobile={mobile}
        title="Type"
        searchable={categoryTypes.length > 0}
        searchPlaceholder="Search by type..."
        state={categoryTypes.length === 0 ? "empty" : "default"}
        emptyState={{ icon: "cube", title: "No types here yet", caption: "This category has no types" }}
      >
        <SelectListItemGroup>
          {categoryTypes.map((t) => (
            <SelectListItem
              key={t}
              label={t}
              selected={t === type}
              onClick={() => {
                setType(t);
                typePop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <SelectPopoverList pop={ownershipPop} mobile={mobile} title="Ownership">
        <SelectListItemGroup>
          {OWNERSHIP_TYPES.map((o) => (
            <SelectListItem
              key={o}
              label={o}
              selected={o === ownership}
              onClick={() => {
                setOwnership(o);
                ownershipPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

    </Dialog>
  );
}
