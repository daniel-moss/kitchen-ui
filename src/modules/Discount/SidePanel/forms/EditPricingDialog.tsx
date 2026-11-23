import { useEffect, useState } from "react";

import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import { toast } from "../../../../components/Toast/Toaster";
import { ChargeItem } from "../../../../data/db";
import { isBlank, numberOf } from "../../../Product/NewProductForm/productRules";
import DiscountField, { discountText } from "../../NewDiscountForm/DiscountField";
import { DiscountPricing } from "../DiscountPanel.types";

import styles from "../DiscountPanel.module.scss";

// The discount's "Pricing" edit form (Figma "↳ Shared Modules" → Pricing →
// Edit → "Discount / Desktop" 3251-79528 and "/ Mobile" 3251-79530): a default
// Dialog titled "Pricing" with the one Discount field, pre-filled with the
// stored amount as a positive number.
//
// Save "applies the changes, closes the Dialog, triggers the Toast"
// ('"Pricing" module updated').

interface EditPricingDialogProps {
  open: boolean;
  onClose: () => void;
  discount: ChargeItem;
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (edits: DiscountPricing) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditPricingDialog({ open, onClose, discount, onSave, breakpoint = "auto" }: EditPricingDialogProps) {
  const [amount, setAmount] = useState(discountText(discount.price));
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(discountText(discount.price));
    setShowErrors(false);
  }, [open, discount]);

  const missingAmount = isBlank(amount);
  // Typed positive, stored negative ($0.00 stays 0).
  const price = -numberOf(amount) || 0;
  const dirty = price !== discount.price;

  const save = async () => {
    if (missingAmount) {
      setShowErrors(true);
      return;
    }

    if ((await onSave({ price })) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Couldn\'t update "Pricing" module',
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    toast({ type: "success", title: '"Pricing" module updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Pricing"
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
      <div className={styles.fields}>
        <DiscountField value={amount} onChange={setAmount} showErrors={showErrors} />
      </div>
    </Dialog>
  );
}
