import { MouseEvent, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import SelectField from "../../components/Fields/SelectField/SelectField";
import IconButton from "../../components/IconButton/IconButton";
import Input from "../../components/Input/Input";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ListItem from "../../components/ListItem/ListItem";
import MenuItem from "../../components/Menu/MenuItem";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import NewEquipmentForm from "../../forms/NewEquipmentForm/NewEquipmentForm";
import { NewEquipment } from "../../forms/NewEquipmentForm/NewEquipmentForm.types";
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";
import {
  Equipment,
  EquipmentAvatar,
  equipmentCaption,
  equipmentCaptionText,
  equipmentLabel,
  equipmentTitle,
} from "./equipment";
import { slot } from "./shared";

import styles from "./EquipmentForm.module.scss";

/** The Equipment module's answer — mandatory, so there is no unset value. */
export type EquipmentInvolved = "yes" | "no";

export interface EquipmentFormValues {
  involved: EquipmentInvolved;
  equipmentIds: number[];
}

interface EquipmentFormProps {
  open: boolean;
  onClose: () => void;
  /** The saved values the draft starts from. */
  initial: EquipmentFormValues;
  /** The location's equipment — the picker's options. */
  equipmentPool: Equipment[];
  /** Commits the draft — the Equipment module re-renders from it. */
  onSave: (next: EquipmentFormValues) => void;
  /**
   * Creates a piece in the location's pool and RETURNS it, so the form can tick
   * it in the draft (annotation: "Creating equipment from here, automatically
   * selects it, when created"). It lands on the job only when the form is saved.
   */
  onCreateEquipment: (values: NewEquipment) => Equipment;
  /** The job's service location — the New-equipment form's header caption. */
  locationName: string;
  mobile?: boolean;
}

/**
 * The "Equipment" edit form (Figma 24465-35321), opened by the module's pencil.
 *
 * Two fields, both required (no "(optional)" on either label):
 *   Is equipment involved? — a horizontal No / Yes radio pair. The job always
 *     carries an answer (it is mandatory when the job is created), so this can
 *     never be empty and its missing-value error is unreachable here.
 *   Equipment — only while "Yes": a multi-select field over the location's
 *     equipment, with the picked pieces listed below in a body-only
 *     DisplayModule (each row's × takes it back out of the draft).
 *
 * Nothing is applied until Save: it commits the answer + the picked ids in one
 * change, so a session of edits produces ONE activity log.
 */
export default function EquipmentForm({
  open,
  onClose,
  initial,
  equipmentPool,
  onSave,
  onCreateEquipment,
  locationName,
  mobile = false,
}: EquipmentFormProps) {
  const [involved, setInvolved] = useState<EquipmentInvolved>(initial.involved);
  const [selectedIds, setSelectedIds] = useState<number[]>(initial.equipmentIds);
  const [showErrors, setShowErrors] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const pop = useSelectPopover(mobile);

  // A fresh open resets the draft to the saved values.
  useEffect(() => {
    if (!open) return;
    setInvolved(initial.involved);
    setSelectedIds(initial.equipmentIds);
    setShowErrors(false);
    setCreateOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (open) return;
    pop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The picker lists the whole pool A→Z (the design annotation); the rows below
  // keep the pool's order too, so nothing jumps when a piece is unticked.
  const options = [...equipmentPool].sort((a, b) => a.name.localeCompare(b.name));
  const selected = equipmentPool.filter((e) => selectedIds.includes(e.id));
  // The rows below the field follow the layout-freeze rule: they only appear
  // once the picker closes, so the growing dialog never moves the field out
  // from under the open card. The field's counter still updates live.
  const listed = pop.freeze(selected);

  const toggle = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // "Add equipment" (picker footer / empty state) leaves the list for the
  // New-equipment form; the created piece comes back ticked.
  const openCreate = () => {
    pop.close();
    setCreateOpen(true);
  };
  const createEquipment = (values: NewEquipment) => {
    const equipment = onCreateEquipment(values);
    setSelectedIds((prev) => [...prev, equipment.id]);
  };

  const sameIds =
    selectedIds.length === initial.equipmentIds.length && selectedIds.every((id) => initial.equipmentIds.includes(id));
  const dirty = involved !== initial.involved || !sameIds;

  // "No" wipes the job's equipment (Daniel, 2026-08-03: no extra confirm — the
  // Dialog's discard warning already guards an accidental close).
  const save = () => {
    if (involved === "yes" && selectedIds.length === 0) {
      setShowErrors(true);
      return;
    }
    onSave({ involved, equipmentIds: involved === "yes" ? selectedIds : [] });
    toast({ type: "success", title: '"Equipment" module updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Equipment"
      breakpoint={mobile ? "mobile" : "desktop"}
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
      <div className={styles.form}>
        <Input label="Is equipment involved?">
          <RadioGroup orientation="horizontal" value={involved} onChange={(v) => setInvolved(v as EquipmentInvolved)}>
            <RadioItem value="no" label="No" />
            <RadioItem value="yes" label="Yes" />
          </RadioGroup>
        </Input>

        {involved === "yes" && (
          <div className={styles.equipment}>
            <Input label="Equipment">
              <SelectField
                multiSelect
                count={selected.length}
                // One piece → its own name; several → the counter + this copy.
                value={selected.length === 1 ? equipmentLabel(selected[0]) : undefined}
                multiSelectLabel="Equipment selected"
                onClearSelection={() => setSelectedIds([])}
                isValid={!(showErrors && selectedIds.length === 0)}
                open={pop.open}
                onClick={(e: MouseEvent<HTMLDivElement>) => pop.toggle(e.currentTarget)}
              />
            </Input>

            {/* The picked equipment — a header-less module whose rows carry only
                the × that takes a piece back out of the draft (24465-36006). */}
            {listed.length > 0 && (
              <DisplayModule
                variant="bodyOnly"
                bodyPadded={false}
                content={
                  <ItemGroup>
                    {listed.map((e) => (
                      <ListItem
                        key={e.id}
                        variant="titleCaption"
                        title={equipmentTitle(e)}
                        caption={equipmentCaptionText(e)}
                        avatar={<EquipmentAvatar equipment={e} />}
                        slotRight={
                          <HoverTooltip text="Remove">
                            <IconButton
                              icon="xmark"
                              variant="muted"
                              size="md"
                              aria-label={`Remove ${equipmentLabel(e)}`}
                              onClick={() => toggle(e.id)}
                            />
                          </HoverTooltip>
                        }
                      />
                    ))}
                  </ItemGroup>
                }
              />
            )}
          </div>
        )}
      </div>

      {/* The equipment picker (Figma 17189-78623): searchable, multi-select,
          A→Z, with an "Add equipment" footer. A location with NO equipment at
          all shows the empty state instead — which drops the search header and
          the footer, per the node. */}
      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title="Equipment"
        multiSelect
        searchable={options.length > 0}
        searchPlaceholder="Search by equipment name..."
        noResultsCaption="Try a different search or add a new equipment"
        state={options.length === 0 ? "empty" : "default"}
        emptyState={{
          icon: "cube",
          title: "No equipment here yet",
          caption: "Add equipment to see it here",
          actionLabel: "Add equipment",
          onAction: openCreate,
        }}
        footer={
          options.length > 0 ? (
            <SelectListFooter>
              <MenuItem label="Add equipment" slotLeft={slot("plus")} onClick={openCreate} />
            </SelectListFooter>
          ) : undefined
        }
      >
        <SelectListItemGroup>
          {options.map((e) => (
            <SelectListItem
              key={e.id}
              variant="object"
              multiSelect
              label={equipmentTitle(e)}
              searchText={`${equipmentLabel(e)} ${equipmentCaption(e)}`}
              caption={equipmentCaptionText(e)}
              avatar={<EquipmentAvatar equipment={e} />}
              selected={selectedIds.includes(e.id)}
              onClick={() => toggle(e.id)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* New equipment (Figma 21897-7658) — the created piece joins the
          location's pool and is ticked here; it reaches the job on Save. */}
      <NewEquipmentForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        location={locationName}
        onCreated={createEquipment}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </Dialog>
  );
}
