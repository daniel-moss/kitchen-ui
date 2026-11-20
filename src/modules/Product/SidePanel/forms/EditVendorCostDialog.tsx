import { useEffect, useState } from "react";

import AvatarVendor from "../../../../components/Avatar/AvatarVendor";
import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import TextField from "../../../../components/Fields/TextField/TextField";
import Input from "../../../../components/Input/Input";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import { toast } from "../../../../components/Toast/Toaster";
import { CostField } from "../../../shared/pricebookFields";
import { NewProductVendorCost } from "../../NewProductForm/NewProductForm.types";
import { isBlank, MAX_TEXT, NO_SUGGESTIONS, numberOf, overLimitError, padMoneyOnBlur } from "../../NewProductForm/productRules";

import styles from "../ProductPanel.module.scss";

// One vendor cost's edit form (Figma "Edit" 3212-58378: Desktop 3212-60860,
// Mobile 3212-60870, Preferred 3212-61857 / 3212-61997) — a default Dialog
// with the vendor's avatar and name in the header; "Preferred vendor" under
// the name and the crown on the avatar when it is the preferred one.
//
//   Cost             the shared Cost field: digits and a dot, 3 decimals, 7
//                    digits, no minus, padded to 2 on blur. Required.
//   Vendor part #    100 characters, counted while typing; autocorrect and
//                    capitalisation off. Required.
//   Make preferred   ghost, crown — hidden on the preferred vendor. It marks
//                    the DRAFT only: the crown and the caption appear at once,
//                    and the change applies on Save (Daniel, 2026-11-19).
//
// The same Dialog ADDS a vendor cost: the vendors list picks the vendor, and
// the form opens empty. The first vendor cost added is preferred by default.

interface EditVendorCostDialogProps {
  open: boolean;
  onClose: () => void;
  vendorName: string;
  /** The vendor cost being edited, or the empty one being added. */
  cost: NewProductVendorCost;
  /** True while adding: the fields open empty and the toast says "added". */
  isNew?: boolean;
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (cost: NewProductVendorCost) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

interface Draft {
  cost: string;
  partNumber: string;
  isPreferred: boolean;
}

const draftOf = (cost: NewProductVendorCost, isNew: boolean): Draft => ({
  cost: isNew ? "" : padMoneyOnBlur(String(cost.cost)),
  partNumber: isNew ? "" : cost.partNumber,
  isPreferred: cost.isPreferred,
});

export default function EditVendorCostDialog({
  open,
  onClose,
  vendorName,
  cost,
  isNew = false,
  onSave,
  breakpoint = "auto",
}: EditVendorCostDialogProps) {
  const [initial, setInitial] = useState<Draft>(() => draftOf(cost, isNew));
  const [draft, setDraft] = useState<Draft>(initial);
  const [showErrors, setShowErrors] = useState(false);

  // Re-read the vendor cost every time the form opens.
  useEffect(() => {
    if (!open) return;
    const next = draftOf(cost, isNew);
    setInitial(next);
    setDraft(next);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cost, isNew]);

  const missingPartNumber = draft.partNumber.trim() === "";
  const partNumberTooLong = overLimitError(draft.partNumber, MAX_TEXT);
  const dirty =
    draft.cost !== initial.cost || draft.partNumber !== initial.partNumber || draft.isPreferred !== initial.isPreferred;

  const save = async () => {
    if (isBlank(draft.cost) || missingPartNumber || partNumberTooLong) {
      setShowErrors(true);
      return;
    }
    const saved: NewProductVendorCost = {
      vendorId: cost.vendorId,
      cost: numberOf(draft.cost),
      partNumber: draft.partNumber.trim(),
      isPreferred: draft.isPreferred,
    };
    if ((await onSave(saved)) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: isNew ? "Couldn't add vendor cost" : "Couldn't update vendor cost",
        caption: "Something went wrong. Please try again.",
      });
      return;
    }
    toast({ type: "success", title: isNew ? "Vendor cost added" : "Vendor cost updated" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={vendorName}
      caption={draft.isPreferred ? "Preferred vendor" : undefined}
      avatar={<AvatarVendor size="xl" addOn={draft.isPreferred ? "preferred" : "none"} />}
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
          {!draft.isPreferred && (
            <Button
              size="lg"
              variant="ghost"
              leftIcon="crown"
              leftIconPack="solid"
              leftIconClassName={styles.preferredIcon}
              onClick={() => setDraft({ ...draft, isPreferred: true })}
            >
              Make preferred
            </Button>
          )}
          <Button size="lg" variant="solid" onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.fields}>
        <CostField value={draft.cost} onChange={(next) => setDraft((prev) => ({ ...prev, cost: next }))} showErrors={showErrors} />
        <Input label="Vendor part #">
          <TextField
            value={draft.partNumber}
            onChange={(event) => setDraft({ ...draft, partNumber: event.target.value })}
            {...NO_SUGGESTIONS}
            isValid={!(partNumberTooLong || (showErrors && missingPartNumber))}
            errorMessage={partNumberTooLong ?? "Enter Vendor part #"}
          />
        </Input>
      </div>
    </Dialog>
  );
}
