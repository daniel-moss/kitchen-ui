import { useEffect, useState } from "react";

import Button from "../../../../components/Button/Button";
import Dialog from "../../../../components/Dialog/Dialog";
import Input from "../../../../components/Input/Input";
import PopoverFooter from "../../../../components/Popover/PopoverFooter";
import RadioGroup from "../../../../components/Radio/RadioGroup";
import RadioItem from "../../../../components/Radio/RadioItem";
import { toast } from "../../../../components/Toast/Toaster";
import { ProductItem } from "../../../../data/db";
import PriceStrategyField, { PriceStrategyValues, priceStrategyBlocks, usePriceStrategy } from "../../../shared/PriceStrategyField";
import { CostField } from "../../../shared/pricebookFields";
import { CostStrategy, isBlank, money, numberOf, resolveCost } from "../../NewProductForm/productRules";
import { moneyText, percentText } from "../productData";
import { manualCostOf } from "../vendorCostRules";
import { ProductPricing } from "../ProductPanel.types";

import styles from "../ProductPanel.module.scss";

// The product's "Pricing" edit form (Figma 3167-22934: Desktop 3167-22935,
// Mobile 3167-22954): a default Dialog titled "Pricing", pre-filled.
//
//   Cost strategy   Manual (with its "Cost" field inside the card) · Min ·
//                   Max · Avg vendor cost. The three vendor options are
//                   disabled with "Add vendor cost to enable Min, Max and Avg
//                   vendor cost options" while the product has no vendor
//                   costs; with costs, each one's caption is its value.
//   Price strategy  the shared field (3114-24472) — "Less than cost" and the
//                   other verdicts are its own.
//   Taxability      the shared field — only when the company uses taxes.
//
// Save "applies the changes, closes the Dialog, triggers the Toast"
// ('"Pricing" module updated').

interface EditPricingDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductItem;
  /** What each vendor charges for this product. */
  vendorCosts?: number[];
  useTaxes?: boolean;
  /** Return `false` to say the save FAILED: the error toast shows and the form stays open. */
  onSave: (edits: ProductPricing) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

const priceValuesOf = (product: ProductItem): PriceStrategyValues => ({
  strategy: product.priceStrategy ?? "manual",
  price: moneyText(product.price),
  fixedMarkup: moneyText(product.fixedMarkup),
  percentMarkup: percentText(product.percentMarkup),
});

export default function EditPricingDialog({
  open,
  onClose,
  product,
  vendorCosts = [],
  useTaxes = true,
  onSave,
  breakpoint = "auto",
}: EditPricingDialogProps) {
  const hasVendorCosts = vendorCosts.length > 0;

  const [costStrategy, setCostStrategy] = useState<CostStrategy>(product.costStrategy ?? "manual");
  const [cost, setCost] = useState(moneyText(manualCostOf(product)));
  const [isTaxable, setIsTaxable] = useState(product.taxable);
  const [showErrors, setShowErrors] = useState(false);

  // The cost the price strategy builds on: the typed one, or the vendor
  // costs' min / max / average. "A missing Cost counts as $0.00."
  const resolvedCost = resolveCost(costStrategy, numberOf(cost), vendorCosts);
  const pricing = usePriceStrategy(resolvedCost, priceValuesOf(product));

  useEffect(() => {
    if (!open) return;
    setCostStrategy(product.costStrategy ?? "manual");
    // Under a vendor strategy the Manual field holds the LAST manual cost —
    // what choosing Manual again restores (production).
    setCost(moneyText(manualCostOf(product)));
    pricing.reset(priceValuesOf(product));
    setIsTaxable(product.taxable);
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  const { values, check } = pricing;
  const missingCost = costStrategy === "manual" && isBlank(cost);
  const blocked = missingCost || priceStrategyBlocks(check);

  const dirty =
    costStrategy !== (product.costStrategy ?? "manual") ||
    (costStrategy === "manual" && numberOf(cost) !== product.cost) ||
    values.strategy !== (product.priceStrategy ?? "manual") ||
    check.price !== product.price ||
    isTaxable !== product.taxable;

  const save = async () => {
    pricing.judge();
    if (blocked) {
      setShowErrors(true);
      return;
    }

    // Only the chosen strategy's markup travels; the other is cleared.
    const edits: ProductPricing = {
      costStrategy,
      cost: resolvedCost,
      priceStrategy: values.strategy,
      price: check.price,
      fixedMarkup: values.strategy === "fixedMarkup" ? numberOf(values.fixedMarkup) : undefined,
      percentMarkup: values.strategy === "percentMarkup" ? numberOf(values.percentMarkup) : undefined,
      taxable: useTaxes ? isTaxable : product.taxable,
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

  const vendorOption = (value: CostStrategy, label: string) => (
    <RadioItem
      value={value}
      label={label}
      caption={hasVendorCosts ? money(resolveCost(value, 0, vendorCosts)) : undefined}
      disabled={!hasVendorCosts}
    />
  );

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
        <Input
          label="Cost strategy"
          helpText={hasVendorCosts ? undefined : "Add vendor cost to enable Min, Max and Avg vendor cost options"}
        >
          <RadioGroup orientation="vertical" value={costStrategy} onChange={(value) => setCostStrategy(value as CostStrategy)}>
            <RadioItem
              value="manual"
              label="Manual"
              content={<CostField value={cost} onChange={setCost} onBlur={pricing.judge} showErrors={showErrors} />}
            />
            {vendorOption("minVendorCost", "Min vendor cost")}
            {vendorOption("maxVendorCost", "Max vendor cost")}
            {vendorOption("avgVendorCost", "Avg vendor cost")}
          </RadioGroup>
        </Input>

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
