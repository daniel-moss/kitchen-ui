import { MouseEvent, useState } from "react";

import Button from "../../components/Button/Button";
import CheckboxItem from "../../components/Checkbox/CheckboxItem";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import SelectField from "../../components/Fields/SelectField/SelectField";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import Input from "../../components/Input/Input";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ListItem from "../../components/ListItem/ListItem";
import MenuItem from "../../components/Menu/MenuItem";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import SelectListSelectFooter from "../../components/SelectList/SelectListSelectFooter";
import { useSelectionDraft } from "../../components/SelectList/useSelectionDraft";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import NewEquipmentForm from "../NewEquipmentForm/NewEquipmentForm";
import { NewEquipment } from "../NewEquipmentForm/NewEquipmentForm.types";
import { Equipment, EquipmentAvatar, equipmentCaptionText, equipmentIncomplete, equipmentLabel, equipmentSearchText, equipmentTitle } from "./equipmentRow";
import { SelectPopoverList, useSelectPopover } from "./selectPopover";

import styles from "./EquipmentPicker.module.scss";

// The job's equipment picker — ONE build for the "New Job" form's Equipment
// module (Figma 17189-78592) and the Job Details Equipment edit Dialog (Figma
// 21760-11304, "Edit" section). The caller supplies the frame (FormModule /
// Dialog); this is the content:
//
// 1. "Make equipment required" card checkbox — the "Complete job" form's
//    Equipment step needs at least one piece. Picking equipment NOW stays
//    optional either way, which is what its caption says.
// 2. "Equipment (optional)" multi-select over the location's pool, and the
//    picked rows below it (12px apart), each with a Remove (×). A pick missing
//    manufacturer / model / serial turns the rows' module into the warning
//    treatment — ring + "Key details are missing". It never blocks anything.
// 3. The list (Figma 17189-78623) — the STANDARD multi-select SelectList
//    behaviour (`useSelectionDraft`, Daniel 2026-10-26): ticks are a draft,
//    closing the list applies them (outside click, Escape, the field, swipe,
//    a footer action); no Cancel, no "Discard changes?". Footer:
//    - desktop: the "Add equipment" MenuItem.
//    - mobile: ghost "Add equipment" (plus) on the left + solid "Select N";
//      with no equipment at all, a full-width ghost "Add equipment" alone.
//    Caption-only "No equipment" / "No equipment match".
// 4. "Add equipment" closes the list (so the ticks so far are applied) and
//    opens the New-equipment form; the created piece joins the pool (the
//    caller's `onCreate`) and comes back ticked.
//
// The picked rows are clickable no-ops here (they would open the Equipment
// side panel — out of scope inside a form).

export interface EquipmentPickerProps {
  /** The picked equipment ids. */
  value: string[];
  onChange: (ids: string[]) => void;
  /** "Make equipment required". */
  isEquipmentRequired: boolean;
  onEquipmentRequiredChange: (required: boolean) => void;
  /** The location's equipment — the list's options (sorted A→Z here). */
  options: Equipment[];
  /** Creates a piece in the location's pool and returns it, so it can be ticked. */
  onCreate: (values: NewEquipment) => Equipment;
  /** The location's display name — the New-equipment form's header caption. */
  locationLabel: string;
  /** Mobile presentation (drawer lists). */
  mobile: boolean;
}

export default function EquipmentPicker({
  value,
  onChange,
  isEquipmentRequired,
  onEquipmentRequiredChange,
  options: pool,
  onCreate,
  locationLabel,
  mobile,
}: EquipmentPickerProps) {
  const pop = useSelectPopover(mobile);
  const [createOpen, setCreateOpen] = useState(false);

  const options = [...pool].sort((a, b) => a.name.localeCompare(b.name));
  const selected = options.filter((row) => value.includes(row.id));
  const hasIssues = selected.some(equipmentIncomplete);

  const draft = useSelectionDraft(pop.open, value, onChange);

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  // Closing the list applies its draft; the New-equipment form opens after.
  const openCreate = () => {
    pop.close();
    setCreateOpen(true);
  };

  const addEquipmentButton = (
    <Button size="lg" variant="ghost" leftIcon="plus" onClick={openCreate}>
      Add equipment
    </Button>
  );

  // The created piece joins the pool (the caller) and is ticked. `value` is
  // fresh here: the list's draft was applied when it closed.
  const handleCreated = (values: NewEquipment) => {
    const created = onCreate(values);
    onChange([...value, created.id]);
  };

  return (
    <>
      <CheckboxItem
        variant="card"
        label="Make equipment required"
        caption="At least one piece of equipment will be required to complete the job. You don’t have to add it now."
        checked={isEquipmentRequired}
        onChange={(event) => onEquipmentRequiredChange(event.target.checked)}
      />
      <div className={styles.stack}>
        <Input label="Equipment" labelCondition="optional">
          <SelectField
            multiSelect
            count={value.length}
            // One pick reads "Name · Manufacturer", more read the label (node 24336-13708).
            value={selected.length === 1 ? equipmentLabel(selected[0]) : undefined}
            multiSelectLabel="Pieces of equipment selected"
            onClearSelection={() => onChange([])}
            open={pop.open}
            onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
          />
        </Input>
        {selected.length > 0 && (
          <DisplayModule
            variant="bodyOnly"
            bodyPadded={false}
            status={hasIssues ? "warning" : "none"}
            banner={hasIssues ? { children: "Key details are missing" } : undefined}
            content={
              <ItemGroup>
                {selected.map((row) => (
                  <ListItem
                    key={row.id}
                    variant="titleCaption"
                    title={equipmentTitle(row)}
                    caption={equipmentCaptionText(row)}
                    avatar={<EquipmentAvatar equipment={row} />}
                    isClickable
                    onClick={() => {}}
                    slotRight={
                      <HoverTooltip text="Remove">
                        <IconButton icon="close" variant="muted" size="md" aria-label={`Remove ${row.name}`} onClick={() => remove(row.id)} />
                      </HoverTooltip>
                    }
                  />
                ))}
              </ItemGroup>
            }
          />
        )}
      </div>

      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title="Equipment"
        multiSelect
        searchable={options.length > 0}
        searchPlaceholder="Equipment..."
        noResultsState={<EmptyState caption="No equipment match" />}
        state={options.length === 0 ? "empty" : "default"}
        emptyState={{ caption: "No equipment" }}
        footer={
          !mobile ? (
            <SelectListFooter>
              <MenuItem label="Add equipment" slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />} onClick={openCreate} />
            </SelectListFooter>
          ) : options.length > 0 ? (
            <SelectListSelectFooter count={draft.selection.length} onSelect={pop.close} slotLeft={addEquipmentButton} />
          ) : (
            <SelectListFooter variant="actionBar" stretch>
              {addEquipmentButton}
            </SelectListFooter>
          )
        }
      >
        <SelectListItemGroup>
          {options.map((row) => (
            <SelectListItem
              key={row.id}
              variant="object"
              multiSelect
              label={equipmentTitle(row)}
              caption={equipmentCaptionText(row)}
              avatar={<EquipmentAvatar equipment={row} />}
              searchText={equipmentSearchText(row)}
              selected={draft.isSelected(row.id)}
              onClick={() => draft.toggle(row.id)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <NewEquipmentForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        location={locationLabel}
        onCreated={handleCreated}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </>
  );
}
