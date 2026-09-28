import { useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectList from "../../components/SelectList/SelectList";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import NewEquipmentForm from "../NewEquipmentForm/NewEquipmentForm";
import { NewEquipment } from "../NewEquipmentForm/NewEquipmentForm.types";
import { Equipment, EquipmentAvatar, equipmentCaption, equipmentLabel } from "./equipment";

/**
 * The "Equipment" edit form — REBUILT 2026-09-28 to the updated design (Figma
 * 24465-35321, desktop 24737-112875 / mobile 24737-112866).
 *
 * It is a multi-select **SelectList** over the location's equipment: a dialog
 * on desktop, a drawer on mobile, with a "Equipment..." search, object rows
 * (avatar + "Name · Manufacturer" over "Serial: … · Model: …") and a footer of
 * Cancel · "Add equipment" · Save.
 *
 * WHAT WENT (Daniel, 2026-09-28: "it's an outdated version"): the
 * "Is equipment involved?" No/Yes radio pair, the SelectField + the list of
 * picked rows below it, and the whole `Dialog` wrapper. Involvement is DERIVED
 * now — no equipment means "Equipment is not involved", which is exactly what
 * the module's empty state says (node 21760-11307).
 */

/** What Save hands back — just the job's equipment, by pool id. */
export interface EquipmentFormValues {
  equipmentIds: string[];
}

interface EquipmentFormProps {
  open: boolean;
  onClose: () => void;
  /** The saved values the draft starts from. */
  initial: EquipmentFormValues;
  /** The location's equipment — the list's options. */
  equipmentPool: Equipment[];
  /** Commits the draft — the Equipment module re-renders from it. */
  onSave: (next: EquipmentFormValues) => void;
  /**
   * Creates a piece in the location's pool and RETURNS it, so the form can tick
   * it in the draft (the "Add equipment" annotation: "creating the equipment
   * from here brings the user back to the SelectList with the equipment being
   * selected"). It lands on the job only when the form is saved.
   */
  onCreateEquipment: (values: NewEquipment) => Equipment;
  /** The job's service location — the New-equipment form's header caption. */
  locationName: string;
  mobile?: boolean;
}

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
  const [selectedIds, setSelectedIds] = useState<string[]>(initial.equipmentIds);
  const [createOpen, setCreateOpen] = useState(false);

  // A fresh open resets the draft to the saved values.
  useEffect(() => {
    if (!open) return;
    setSelectedIds(initial.equipmentIds);
    setCreateOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The list shows the whole pool A→Z (the design annotation).
  const options = [...equipmentPool].sort((a, b) => a.name.localeCompare(b.name));

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // "Add equipment" leaves the list for the New-equipment form; the created
  // piece comes back ticked.
  const createEquipment = (values: NewEquipment) => {
    const equipment = onCreateEquipment(values);
    setSelectedIds((prev) => [...prev, equipment.id]);
  };

  const save = () => {
    onSave({ equipmentIds: selectedIds });
    toast({ type: "success", title: '"Equipment" module updated' });
    onClose();
  };

  return (
    <>
      <SelectList
        variant={mobile ? "drawer" : "dialog"}
        title="Equipment"
        open={open && !createOpen}
        onClose={onClose}
        multiSelect
        searchable
        searchPlaceholder="Equipment..."
        breakpoint={mobile ? "mobile" : "desktop"}
        emptyState={{ icon: "cube", title: "No equipment here yet", caption: "Add equipment to this location to pick it" }}
        footer={
          <PopoverFooter
            slotLeft={
              <Button size="lg" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            }
          >
            {/* Ghost, with the plus on the left — the node's second action,
                between Cancel and Save. */}
            <Button size="lg" variant="ghost" leftIcon="plus" onClick={() => setCreateOpen(true)}>
              Add equipment
            </Button>
            <Button size="lg" variant="solid" onClick={save}>
              Save
            </Button>
          </PopoverFooter>
        }
      >
        <SelectListItemGroup>
          {options.map((equipment) => (
            <SelectListItem
              key={equipment.id}
              variant="object"
              multiSelect
              selected={selectedIds.includes(equipment.id)}
              avatar={<EquipmentAvatar equipment={equipment} />}
              label={equipmentLabel(equipment)}
              caption={equipmentCaption(equipment)}
              onClick={() => toggle(equipment.id)}
            />
          ))}
        </SelectListItemGroup>
      </SelectList>

      {/* Creating a piece returns to the list with it ticked, so the list is
          hidden (not closed) while this is open — the draft must survive. */}
      <NewEquipmentForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        location={locationName}
        onCreated={createEquipment}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </>
  );
}
