import { useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import RadioGroup from "../../../components/Radio/RadioGroup";
import RadioItem from "../../../components/Radio/RadioItem";
import { toast } from "../../../components/Toast/Toaster";
import { LaborItem } from "../../../data/db";
import LaborPricingFields, {
  LaborPricingValues,
  laborPricingIssues,
  moneyText,
} from "../../NewLaborRateForm/LaborPricingFields";
import { numberOf } from "../../Product/NewProductForm/productRules";
import { LaborRatePricing } from "../LaborRatePanel.types";

import styles from "../LaborRatePanel.module.scss";

// The labor rate's "Pricing" edit form (Figma 3015-4375): a default Dialog
// titled "Pricing" with Rate type, Cost, Rate and Taxability, pre-filled —
// the same labor-rate Fields the "Create" form uses, so the two can not drift.
//
// A saved labor rate always has a rate type, so Cost and Rate are always
// drawn here. The whole module saves together: the rate type decides the
// suffix on both money fields.

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

const valuesOf = (rate: LaborItem): LaborPricingValues => ({
  rateType: rate.unitType === "hourly" ? "hourly" : "flat",
  cost: moneyText(rate.cost),
  rate: moneyText(rate.rate),
});

export default function EditPricingDialog({ open, onClose, rate, useTaxes = true, onSave, breakpoint = "auto" }: EditPricingDialogProps) {
  const [pricing, setPricing] = useState<LaborPricingValues>(() => valuesOf(rate));
  const [rateTouched, setRateTouched] = useState(false);
  const [isTaxable, setIsTaxable] = useState(rate.taxable);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPricing(valuesOf(rate));
    setRateTouched(false);
    setIsTaxable(rate.taxable);
    setShowErrors(false);
  }, [open, rate]);

  const issues = laborPricingIssues(pricing);
  const blocked = issues.missingRateType || issues.missingCost || issues.missingRate;

  const dirty =
    (pricing.rateType === "hourly") !== (rate.unitType === "hourly") ||
    numberOf(pricing.cost) !== rate.cost ||
    numberOf(pricing.rate) !== rate.rate ||
    isTaxable !== rate.taxable;

  const save = async () => {
    if (blocked) {
      setShowErrors(true);
      return;
    }

    // The rate is always typed now — any old markup is cleared with it.
    const edits: LaborRatePricing = {
      unitType: pricing.rateType === "hourly" ? "hourly" : "flatRate",
      cost: numberOf(pricing.cost),
      rate: numberOf(pricing.rate),
      taxable: isTaxable,
      priceStrategy: "manual",
      priceAdjustmentAmount: undefined,
      priceAdjustmentPercent: undefined,
    };

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
        <LaborPricingFields
          values={pricing}
          onChange={setPricing}
          showErrors={showErrors}
          rateTouched={rateTouched}
          onRateTouched={() => setRateTouched(true)}
        />

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
