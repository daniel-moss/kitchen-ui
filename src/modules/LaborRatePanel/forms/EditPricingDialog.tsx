import { useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import RadioGroup from "../../../components/Radio/RadioGroup";
import RadioItem from "../../../components/Radio/RadioItem";
import { toast } from "../../../components/Toast/Toaster";
import { LaborItem } from "../../../data/db";
import LaborPricingFields, { pricingOf, useLaborPricing } from "../../NewLaborRateForm/LaborPricingFields";
import { LaborRatePricing } from "../LaborRatePanel.types";

import styles from "../LaborRatePanel.module.scss";

// The labor rate's "Pricing" edit form (Figma 3015-4375): a default Dialog
// titled "Pricing" with Type, Cost, Price strategy and Taxability, pre-filled —
// the same pricing fields the "Create" form uses, so the two can not drift.
//
// A saved labor rate always has a type, so Cost and Price strategy are always
// drawn here. The whole module saves together: the type decides the suffix on
// the money, and the strategy decides whether the price was typed or derived
// from the cost.

interface EditPricingDialogProps {
  open: boolean;
  onClose: () => void;
  rate: LaborItem;
  /** False drops the Taxability field — the company does not use taxes. */
  useTaxes?: boolean;
  /**
   * Save. Return `false` (or a Promise of it) to say the save FAILED: the form
   * shows the designed error toast and stays open with the values intact.
   */
  onSave: (edits: LaborRatePricing) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditPricingDialog({ open, onClose, rate, useTaxes = true, onSave, breakpoint = "auto" }: EditPricingDialogProps) {
  const pricing = useLaborPricing(pricingOf(rate));
  const [isTaxable, setIsTaxable] = useState(rate.taxable);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    pricing.reset(pricingOf(rate));
    setIsTaxable(rate.taxable);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rate]);

  const saved = pricing.saved();
  const dirty =
    saved.unitType !== rate.unitType ||
    saved.cost !== rate.cost ||
    saved.priceStrategy !== rate.priceStrategy ||
    saved.rate !== rate.rate ||
    saved.priceAdjustmentAmount !== (rate.priceStrategy === "fixed" ? rate.priceAdjustmentAmount : undefined) ||
    saved.priceAdjustmentPercent !== (rate.priceStrategy === "percent" ? rate.priceAdjustmentPercent : undefined) ||
    isTaxable !== rate.taxable;

  const save = async () => {
    pricing.strategy.judge();
    if (pricing.blocked) {
      setShowErrors(true);
      return;
    }

    // Only the chosen strategy's markup travels; the other is cleared.
    const edits: LaborRatePricing = { ...saved, taxable: isTaxable };

    if ((await onSave(edits)) === false) {
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
        <LaborPricingFields state={pricing} showErrors={showErrors} />

        {useTaxes && (
          <Input label="Taxability">
            <RadioGroup
              orientation="horizontal"
              value={isTaxable ? "taxable" : "non-taxable"}
              onChange={(value) => setIsTaxable(value === "taxable")}
            >
              <RadioItem value="non-taxable" label="Non-taxable" />
              <RadioItem value="taxable" label="Taxable" />
            </RadioGroup>
          </Input>
        )}
      </div>
    </Dialog>
  );
}
