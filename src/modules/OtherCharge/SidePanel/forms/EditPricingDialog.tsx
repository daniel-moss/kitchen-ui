import { useEffect, useState } from "react";

import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import Input from "../../../../components/Input/Input";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import RadioGroup from "../../../../components/Radio/RadioGroup";
import RadioItem from "../../../../components/Radio/RadioItem";
import { toast } from "../../../../components/Toast/Toaster";
import { ChargeItem } from "../../../../data/db";
import { isBlank, numberOf } from "../../../Product/NewProductForm/productRules";
import PriceStrategyField, { PriceStrategyValues, priceStrategyBlocks, usePriceStrategy } from "../../../shared/PriceStrategyField";
import { CostField } from "../../../shared/pricebookFields";
import { moneyText } from "../otherChargeData";
import { OtherChargePricing } from "../OtherChargePanel.types";

import styles from "../OtherChargePanel.module.scss";

// The other charge's "Pricing" edit form (the SHARED Pricing module's edit
// form, Figma "↳ Shared Modules" → Pricing → Other Charge): a default Dialog
// titled "Pricing", pre-filled.
//
//   Cost            the shared field. Required: a charge always has a cost.
//   Price strategy  the shared field — "Less than cost" and the other
//                   verdicts are its own.
//   Taxability      the shared field — only when the company uses taxes.
//
// Save "applies the changes, closes the Dialog, triggers the Toast"
// ('"Pricing" module updated').

interface EditPricingDialogProps {
  open: boolean;
  onClose: () => void;
  charge: ChargeItem;
  useTaxes?: boolean;
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (edits: OtherChargePricing) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

const priceValuesOf = (charge: ChargeItem): PriceStrategyValues => ({
  strategy: charge.priceStrategy ?? "manual",
  price: moneyText(charge.price),
  fixedMarkup: moneyText(charge.fixedMarkup),
  percentMarkup: moneyText(charge.percentMarkup),
});

export default function EditPricingDialog({ open, onClose, charge, useTaxes = true, onSave, breakpoint = "auto" }: EditPricingDialogProps) {
  const [cost, setCost] = useState(moneyText(charge.cost));
  const [isTaxable, setIsTaxable] = useState(charge.taxable);
  const [showErrors, setShowErrors] = useState(false);
  const pricing = usePriceStrategy(numberOf(cost), priceValuesOf(charge));

  useEffect(() => {
    if (!open) return;
    setCost(moneyText(charge.cost));
    pricing.reset(priceValuesOf(charge));
    setIsTaxable(charge.taxable);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, charge]);

  const { values, check } = pricing;
  const missingCost = isBlank(cost);
  const blocked = missingCost || priceStrategyBlocks(check);

  const dirty =
    numberOf(cost) !== charge.cost ||
    values.strategy !== (charge.priceStrategy ?? "manual") ||
    check.price !== charge.price ||
    isTaxable !== charge.taxable;

  const save = async () => {
    pricing.judge();
    if (blocked) {
      setShowErrors(true);
      return;
    }

    // Only the chosen strategy's markup travels; the other is cleared.
    const edits: OtherChargePricing = {
      cost: numberOf(cost),
      priceStrategy: values.strategy,
      price: check.price,
      fixedMarkup: values.strategy === "fixedMarkup" ? numberOf(values.fixedMarkup) : undefined,
      percentMarkup: values.strategy === "percentMarkup" ? numberOf(values.percentMarkup) : undefined,
      taxable: useTaxes ? isTaxable : charge.taxable,
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
        <CostField value={cost} onChange={setCost} onBlur={pricing.judge} showErrors={showErrors && missingCost} />

        <PriceStrategyField state={pricing} showErrors={showErrors} />

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
