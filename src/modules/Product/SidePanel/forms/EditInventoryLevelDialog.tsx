import { useEffect, useState } from "react";

import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import { Icon } from "../../../../components/Icon/Icon";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import { toast } from "../../../../components/Toast/Toaster";
import { InventoryLocation } from "../../../../data/db/types";
import { isNotStocked, LOCATION_TYPE_ICON, locationTitle, StockFigures } from "../../InventoryLevel/InventoryLevelCard";
import InventoryLevelFields, { draftChanged, draftErrors, draftOf, LevelDraft, levelOf } from "../../InventoryLevel/InventoryLevelFields";

// One location's edit form (Figma "Edit" 3187-42573: Desktop 3200-50081,
// Mobile 3200-50096) — a default Dialog titled after the location, with the
// card's type icon before the title ("Inherited from the card") and the plate
// only when it exists. The fields are the shared InventoryLevelFields.
//
// Save "validates the fields, applies the values, closes the Dialog". A "Not
// stocked" location opens with an EMPTY On hand, so the user types the count.

interface EditInventoryLevelDialogProps {
  open: boolean;
  onClose: () => void;
  location?: InventoryLocation;
  level: StockFigures;
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (level: StockFigures) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditInventoryLevelDialog({
  open,
  onClose,
  location,
  level,
  onSave,
  breakpoint = "auto",
}: EditInventoryLevelDialogProps) {
  const opening = () => draftOf(level, { emptyOnHand: isNotStocked(level) });
  const [initial, setInitial] = useState<LevelDraft>(opening);
  const [draft, setDraft] = useState<LevelDraft>(opening);
  const [showErrors, setShowErrors] = useState(false);

  // Re-read the level every time the form opens.
  useEffect(() => {
    if (!open) return;
    const next = opening();
    setInitial(next);
    setDraft(next);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, level]);

  const save = async () => {
    if (draftErrors(draft).any) {
      setShowErrors(true);
      return;
    }
    if ((await onSave(levelOf(draft))) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: "Couldn't update inventory level",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }
    toast({ type: "success", title: "Inventory level updated" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={location ? locationTitle(location) : ""}
      titleLeftSlot={location ? <Icon icon={LOCATION_TYPE_ICON[location.type]} size={14} container="square" /> : undefined}
      breakpoint={breakpoint}
      confirmOnDismiss={draftChanged(draft, initial)}
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
      <InventoryLevelFields draft={draft} onChange={setDraft} showErrors={showErrors} />
    </Dialog>
  );
}
