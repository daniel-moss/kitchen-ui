import { useState } from "react";

import Button from "../../components/Button/Button";
import Dialog from "../../components/Dialog/Dialog";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";
import { NewEquipment } from "../NewEquipmentForm/NewEquipmentForm.types";
import DismissCancelButton from "../shared/DismissCancelButton";
import EquipmentPicker from "../shared/EquipmentPicker";
import { Equipment } from "./equipment";

/**
 * The "Equipment" edit form — REBUILT 2026-10-26 to the "Next Update" design
 * (Figma 21760-11304, "Edit" section). Opened by the module's pen ("Opens the
 * Dialog").
 *
 * A default Dialog (desktop card / mobile drawer) whose content is the SHARED
 * EquipmentPicker — the same build as the "New Job" form's Equipment module:
 * the "Make equipment required" checkbox, the optional equipment field with
 * its list, and the picked rows. Cancel / Save; Save toasts '"Equipment"
 * module updated'. Everything is a DRAFT until Save, and leaving with changes
 * asks "Discard changes?".
 *
 * WHAT WENT: the 2026-09-28 version was a bare SelectList (dialog / drawer)
 * with a Cancel · "Add equipment" · Save footer.
 */

/** What Save hands back. */
export interface EquipmentFormValues {
  equipmentIds: string[];
  isEquipmentRequired: boolean;
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
   * Creates a piece in the location's pool and RETURNS it, so the picker can
   * tick it in the draft. It lands on the job only when the form is saved.
   */
  onCreateEquipment: (values: NewEquipment) => Equipment;
  /** The job's service location — the New-equipment form's header caption. */
  locationName: string;
  mobile?: boolean;
}

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

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
  const [draft, setDraft] = useState<EquipmentFormValues>(initial);

  // A fresh open resets the draft to the saved values — seeded on the
  // closed→open transition, never keyed on `initial` (callers rebuild it).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(initial);
  }

  const dirty = draft.isEquipmentRequired !== initial.isEquipmentRequired || !sameIds(draft.equipmentIds, initial.equipmentIds);

  const save = () => {
    onSave(draft);
    toast({ type: "success", title: '"Equipment" module updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Equipment"
      breakpoint={mobile ? "mobile" : "desktop"}
      // Mobile: grab handle above the title, no close button (node
      // 27284-70781) — dismissed by dragging, the scrim or Cancel.
      drawerHeader="default"
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter slotLeft={<DismissCancelButton />}>
          <Button size="lg" variant="solid" onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <EquipmentPicker
        value={draft.equipmentIds}
        onChange={(equipmentIds) => setDraft((prev) => ({ ...prev, equipmentIds }))}
        isEquipmentRequired={draft.isEquipmentRequired}
        onEquipmentRequiredChange={(isEquipmentRequired) => setDraft((prev) => ({ ...prev, isEquipmentRequired }))}
        options={equipmentPool}
        onCreate={onCreateEquipment}
        locationLabel={locationName}
        mobile={mobile}
      />
    </Dialog>
  );
}
