import { useEffect, useState } from "react";

import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import { toast } from "../../../../components/Toast/Toaster";
import { TaxRateItem } from "../../../../data/db";
import { isBlank, numberOf } from "../../../Product/NewProductForm/productRules";
import PercentageField, { isOverMax, percentText } from "../../NewTaxRateForm/PercentageField";
import { TaxRatePricing } from "../TaxRatePanel.types";

import styles from "../TaxRatePanel.module.scss";

// The tax rate's "Pricing" edit form (Figma "↳ Shared Modules" → Pricing →
// Edit → "Tax Rate / Desktop" 3254-81650 and "/ Mobile" 3254-81652): a default
// Dialog titled "Pricing" with the one Percentage field, pre-filled.

interface EditPricingDialogProps {
  open: boolean;
  onClose: () => void;
  rate: TaxRateItem;
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (edits: TaxRatePricing) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditPricingDialog({ open, onClose, rate, onSave, breakpoint = "auto" }: EditPricingDialogProps) {
  const [value, setValue] = useState(percentText(rate.rate));
  const [touched, setTouched] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(percentText(rate.rate));
    setTouched(false);
    setShowErrors(false);
  }, [open, rate]);

  const dirty = numberOf(value) !== rate.rate;

  const save = async () => {
    if (isBlank(value) || isOverMax(value)) {
      setShowErrors(true);
      return;
    }
    if ((await onSave({ rate: numberOf(value) })) === false) {
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
        <PercentageField value={value} onChange={setValue} touched={touched} onTouched={() => setTouched(true)} showErrors={showErrors} />
      </div>
    </Dialog>
  );
}
