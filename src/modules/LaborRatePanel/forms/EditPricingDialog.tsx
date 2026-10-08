import { useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import TextField from "../../../components/Fields/TextField/TextField";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import RadioGroup from "../../../components/Radio/RadioGroup";
import RadioItem from "../../../components/Radio/RadioItem";
import { toast } from "../../../components/Toast/Toaster";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import { LaborItem } from "../../../data/db";
import {
  computeRate,
  formatOnBlur,
  isAmountText,
  isSignedText,
  MAX_PERCENT,
  money,
  numberOf,
  PriceStrategy,
} from "../../NewLaborRateForm/rateMath";
import { LaborRatePricing } from "../LaborRatePanel.types";

import styles from "../LaborRatePanel.module.scss";

// The labor rate's "Pricing" edit form (Figma 3015-4375): a default Dialog
// titled "Pricing" holding the whole money module — the same four inputs the
// "New labor rate" form's Pricing group has, pre-filled, and sharing its
// `rateMath` rules so the two can not drift.
//
// The one difference from the create form: nothing is hidden behind a missing
// unit type here. An existing labor rate always has one (production requires
// it on every service item), so Cost and Price strategy are always drawn.
//
// The whole module saves together: the unit type decides the suffix on both
// money fields and the price strategy decides whether the rate was typed or
// derived, so saving one without the others could leave the three disagreeing.

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

/** The money text a field opens with: the stored number in the stored format. */
const amountText = (value: number | undefined) => (value == null ? "" : value.toFixed(2));

export default function EditPricingDialog({ open, onClose, rate, useTaxes = true, onSave, breakpoint = "auto" }: EditPricingDialogProps) {
  const [unitType, setUnitType] = useState<"hourly" | "flat">(rate.unitType === "hourly" ? "hourly" : "flat");
  const [cost, setCost] = useState(amountText(rate.cost));
  const [strategy, setStrategy] = useState<PriceStrategy>(rate.priceStrategy);
  const [rateText, setRateText] = useState(amountText(rate.rate));
  const [fixedMarkup, setFixedMarkup] = useState(amountText(rate.priceAdjustmentAmount));
  const [percentMarkup, setPercentMarkup] = useState(amountText(rate.priceAdjustmentPercent));
  const [isTaxable, setIsTaxable] = useState(rate.taxable);
  const [showErrors, setShowErrors] = useState(false);
  const [touched, setTouched] = useState({ rate: false, fixed: false, percent: false });

  useEffect(() => {
    if (!open) return;
    setUnitType(rate.unitType === "hourly" ? "hourly" : "flat");
    setCost(amountText(rate.cost));
    setStrategy(rate.priceStrategy);
    setRateText(amountText(rate.rate));
    setFixedMarkup(amountText(rate.priceAdjustmentAmount));
    setPercentMarkup(amountText(rate.priceAdjustmentPercent));
    setIsTaxable(rate.taxable);
    setShowErrors(false);
    setTouched({ rate: false, fixed: false, percent: false });
  }, [open, rate]);

  // ---- the live numbers ----------------------------------------------------

  const costValue = numberOf(cost);
  const percentValue = numberOf(percentMarkup);
  const rateValue = computeRate(strategy, costValue, numberOf(fixedMarkup), percentValue);

  // "Only shown if 'Hourly' unit type is selected" — the suffix of every money
  // field in the module, and of the calculated Rate. The form spells it out;
  // the panel's rows use the compact "/hr".
  const perHour = unitType === "hourly" ? " per hour" : "";
  const unitSuffix = unitType === "hourly" ? "per hour" : undefined;

  const markupText = strategy === "fixed" ? fixedMarkup : percentMarkup;
  const markupEmpty = markupText.trim() === "" || markupText.trim() === "-";

  // Negative is an ERROR ("can not be less than $0"), below cost a WARNING.
  const negativeRate = strategy !== "manual" && !markupEmpty && rateValue < 0;
  const belowCost = !markupEmpty && rateValue >= 0 && rateValue < costValue;
  const percentTooHigh = strategy === "percent" && percentValue > MAX_PERCENT;
  const manualBelowCost = strategy === "manual" && rateText.trim() !== "" && numberOf(rateText) < costValue;

  const missingRate = strategy === "manual" && rateText.trim() === "";
  const missingMarkup = strategy !== "manual" && markupEmpty;

  // A money field stays quiet while it is being typed in and speaks when it is
  // left (the create form's rule, Daniel 2026-10-07).
  const rateChecked = showErrors || touched.rate;
  const fixedChecked = showErrors || touched.fixed;
  const percentChecked = showErrors || touched.percent;
  const markupChecked = strategy === "fixed" ? fixedChecked : percentChecked;
  const showNegativeRate = negativeRate && markupChecked;
  const showBelowCost = belowCost && markupChecked;
  const showManualBelowCost = manualBelowCost && rateChecked;

  const blocked = missingRate || missingMarkup || negativeRate || percentTooHigh;

  const dirty =
    (unitType === "hourly") !== (rate.unitType === "hourly") ||
    costValue !== rate.cost ||
    strategy !== rate.priceStrategy ||
    isTaxable !== rate.taxable ||
    (strategy === "manual" ? numberOf(rateText) !== rate.rate : rateValue !== rate.rate);

  const save = async () => {
    if (blocked) {
      setShowErrors(true);
      return;
    }

    const edits: LaborRatePricing = {
      unitType: unitType === "hourly" ? "hourly" : "flatRate",
      cost: costValue,
      rate: strategy === "manual" ? numberOf(rateText) : rateValue,
      taxable: isTaxable,
      priceStrategy: strategy,
      // BOTH markups travel, whichever strategy is on: production stores them
      // in separate columns and keeps each, so switching strategy and back
      // does not lose the value that was typed.
      priceAdjustmentAmount: fixedMarkup.trim() === "" ? undefined : numberOf(fixedMarkup),
      priceAdjustmentPercent: percentMarkup.trim() === "" ? undefined : percentValue,
    };

    if ((await onSave(edits)) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Could not update "Pricing" module',
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    toast({ type: "success", title: '"Pricing" module updated' });
    onClose();
  };

  // The calculated Rate under a markup — one ValueDisplay, three states.
  const rateValueDisplay = (
    <ValueDisplay
      label="Rate"
      emptyText={strategy === "fixed" ? "Enter Fixed markup" : "Enter Percent markup"}
      value={
        markupEmpty
          ? undefined
          : showNegativeRate
            ? `${money(rateValue)}${perHour} — must be $0 or more`
            : showBelowCost
              ? `${money(rateValue)}${perHour} — less than cost`
              : `${money(rateValue)}${perHour}`
      }
      valueColor={showNegativeRate ? "var(--text-error)" : undefined}
      isWarning={showBelowCost}
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
      <>
        <Input label="Unit type">
          <RadioGroup orientation="horizontal" value={unitType} onChange={(value) => setUnitType(value as "hourly" | "flat")}>
            <RadioItem value="hourly" label="Hourly" />
            <RadioItem value="flat" label="Flat rate" />
          </RadioGroup>
        </Input>

        <Input label="Cost" labelCondition="optional">
          <TextField
            value={cost}
            onChange={(event) => isAmountText(event.target.value) && setCost(event.target.value)}
            onBlur={() => setCost(formatOnBlur(cost))}
            keyboard="decimal"
            prefix="$"
            suffix={unitSuffix}
            // "No value = $0" — the placeholder says so while the field is empty.
            placeholder="0"
          />
        </Input>

        <Input label="Price strategy">
          <RadioGroup orientation="vertical" value={strategy} onChange={(value) => setStrategy(value as PriceStrategy)}>
            <RadioItem
              value="manual"
              label="Manual"
              // Scoped to the OPEN card: the other two are collapsed, and a
              // collapsed card has nothing to be wrong about.
              error={strategy === "manual" && rateChecked && missingRate}
              content={
                // The warning rides the Input's own help text, so it sits
                // under the LABEL with the status icon.
                <Input label="Rate" helpText={showManualBelowCost ? "Less than cost" : undefined} helpTextStatus="warning">
                  <TextField
                    value={rateText}
                    onChange={(event) => isAmountText(event.target.value) && setRateText(event.target.value)}
                    onBlur={() => {
                      setRateText(formatOnBlur(rateText));
                      setTouched((prev) => ({ ...prev, rate: true }));
                    }}
                    keyboard="decimal"
                    prefix="$"
                    suffix={unitSuffix}
                    isValid={!(rateChecked && missingRate)}
                  />
                </Input>
              }
            />

            <RadioItem
              value="fixed"
              label="Fixed markup"
              error={strategy === "fixed" && fixedChecked && (missingMarkup || negativeRate)}
              // The markup cards carry their own padding: 12px at the BOTTOM,
              // 16px elsewhere (the node's content slot).
              contentPadded={false}
              content={
                <div className={styles.cardContent}>
                  <Input label="Fixed markup">
                    <TextField
                      value={fixedMarkup}
                      onChange={(event) => isSignedText(event.target.value) && setFixedMarkup(event.target.value)}
                      onBlur={() => {
                        setFixedMarkup(formatOnBlur(fixedMarkup));
                        setTouched((prev) => ({ ...prev, fixed: true }));
                      }}
                      keyboard="decimal"
                      prefix="$"
                      isValid={!(fixedChecked && (missingMarkup || negativeRate))}
                      // The negative rate's own message is the Rate row below,
                      // so the field turns red without one.
                      errorMessage={showNegativeRate ? "" : undefined}
                    />
                  </Input>
                  {rateValueDisplay}
                </div>
              }
            />

            <RadioItem
              value="percent"
              label="Percent markup"
              error={strategy === "percent" && percentChecked && (missingMarkup || negativeRate || percentTooHigh)}
              contentPadded={false}
              content={
                <div className={styles.cardContent}>
                  <Input label="Percent markup">
                    <TextField
                      value={percentMarkup}
                      onChange={(event) => isSignedText(event.target.value) && setPercentMarkup(event.target.value)}
                      onBlur={() => {
                        setPercentMarkup(formatOnBlur(percentMarkup));
                        setTouched((prev) => ({ ...prev, percent: true }));
                      }}
                      keyboard="decimal"
                      suffix="%"
                      isValid={!(percentChecked && (missingMarkup || negativeRate || percentTooHigh))}
                      errorMessage={
                        percentChecked && percentTooHigh ? `Must be ${MAX_PERCENT}% or less` : showNegativeRate ? "" : undefined
                      }
                    />
                  </Input>
                  {rateValueDisplay}
                </div>
              }
            />
          </RadioGroup>
        </Input>

        {/* Production hides the whole field when the company does not use
            taxes, and otherwise it always holds one of the two values — so it
            has no error state. */}
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
      </>
    </Dialog>
  );
}
