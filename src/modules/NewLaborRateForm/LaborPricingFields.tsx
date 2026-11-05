import { useState } from "react";

import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import { LaborItem } from "../../data/db";
import { decimalText, isBlank, isMoneyText, numberOf, padMoneyOnBlur, PriceStrategy } from "../Product/NewProductForm/productRules";
import PriceStrategyField, {
  EMPTY_PRICE_STRATEGY,
  PriceStrategyValues,
  priceStrategyBlocks,
  usePriceStrategy,
} from "../shared/PriceStrategyField";

import { LaborRateType } from "./NewLaborRateForm.types";

// The labor rate's pricing fields (Figma "Labor Rate" page → Fields, plus the
// shared "Price strategy"): Type, Cost and Price strategy — shared by the
// "Create" form and the side panel's "Pricing" dialog, so the rules live once.
//
//   Type            Hourly / Flat. Required, no default. "Picking an option
//                   shows the Cost and the Price strategy inputs below it" (in
//                   an edit form the record always has one), and Hourly adds
//                   "per hour" to the typed money.
//   Cost            Required ("Missing Value" on Create or Save). Only digits
//                   and a dot — a typed comma becomes a dot. 3 decimals, 7
//                   digits before the dot, no minus; "$100" → "$100.00" when the
//                   field loses the focus.
//   Price strategy  the pricebook's shared field (shared/PriceStrategyField):
//                   Manual / Fixed markup / Percent markup, default Manual.
//                   Cost's blur takes its price verdict too.

/** The db's spelling of a price strategy (LaborItem) ↔ the field's (production's). */
const STRATEGY_OF_DB: Record<LaborItem["priceStrategy"], PriceStrategy> = {
  manual: "manual",
  fixed: "fixedMarkup",
  percent: "percentMarkup",
};
const DB_OF_STRATEGY: Record<PriceStrategy, LaborItem["priceStrategy"]> = {
  manual: "manual",
  fixedMarkup: "fixed",
  percentMarkup: "percent",
};

/** The money text a field opens with — the stored number, padded to two decimals. */
export const moneyText = (value: number | undefined) => (value == null ? "" : padMoneyOnBlur(String(value)));

/** What a saved rate opens the fields with. Both markups keep their own value. */
export const pricingOf = (rate: LaborItem) => ({
  rateType: (rate.unitType === "hourly" ? "hourly" : "flat") as LaborRateType,
  cost: moneyText(rate.cost),
  strategy: {
    strategy: STRATEGY_OF_DB[rate.priceStrategy],
    price: rate.priceStrategy === "manual" ? moneyText(rate.rate) : "",
    fixedMarkup: moneyText(rate.priceAdjustmentAmount),
    percentMarkup: moneyText(rate.priceAdjustmentPercent),
  } satisfies PriceStrategyValues,
});

interface LaborPricingStart {
  rateType: LaborRateType | null;
  cost: string;
  strategy: PriceStrategyValues;
}

const EMPTY: LaborPricingStart = { rateType: null, cost: "", strategy: EMPTY_PRICE_STRATEGY };

/**
 * The three fields' state for their owner — the values, what blocks Create /
 * Save, and what the record saves.
 */
export function useLaborPricing(initial: LaborPricingStart = EMPTY) {
  const [rateType, setRateType] = useState<LaborRateType | null>(initial.rateType);
  const [cost, setCost] = useState(initial.cost);
  // "If the Cost doesn't have value, assumes that it equals to 0.00."
  const strategy = usePriceStrategy(numberOf(cost), initial.strategy);

  const missingRateType = rateType == null;
  const missingCost = rateType != null && isBlank(cost);
  // Price strategy only applies once a Type is picked.
  const blocked = missingRateType || missingCost || priceStrategyBlocks(strategy.check);

  const reset = (next: LaborPricingStart = EMPTY) => {
    setRateType(next.rateType);
    setCost(next.cost);
    strategy.reset(next.strategy);
  };

  /** The record's pricing, as the db stores it. */
  const saved = () => {
    const { values } = strategy;
    return {
      unitType: rateType === "hourly" ? ("hourly" as const) : ("flatRate" as const),
      cost: numberOf(cost),
      rate: strategy.check.price,
      priceStrategy: DB_OF_STRATEGY[values.strategy],
      priceAdjustmentAmount: values.strategy === "fixedMarkup" ? numberOf(values.fixedMarkup) : undefined,
      priceAdjustmentPercent: values.strategy === "percentMarkup" ? numberOf(values.percentMarkup) : undefined,
    };
  };

  return { rateType, setRateType, cost, setCost, strategy, missingRateType, missingCost, blocked, reset, saved };
}

export type LaborPricingState = ReturnType<typeof useLaborPricing>;

interface LaborPricingFieldsProps {
  state: LaborPricingState;
  /** Create/Save was pressed — the missing-value errors show. */
  showErrors: boolean;
}

export default function LaborPricingFields({ state, showErrors }: LaborPricingFieldsProps) {
  const { rateType, setRateType, cost, setCost, strategy, missingRateType, missingCost } = state;
  const hourly = rateType === "hourly";

  return (
    <>
      <Input label="Type">
        <RadioGroup
          orientation="horizontal"
          value={rateType ?? undefined}
          onChange={(value) => setRateType(value as LaborRateType)}
          isValid={!(showErrors && missingRateType)}
        >
          <RadioItem value="hourly" label="Hourly" />
          <RadioItem value="flat" label="Flat" />
        </RadioGroup>
      </Input>

      {rateType != null && (
        <>
          <Input label="Cost">
            <TextField
              value={cost}
              onChange={(event) => isMoneyText(decimalText(event.target.value)) && setCost(decimalText(event.target.value))}
              onBlur={() => {
                setCost(padMoneyOnBlur(cost));
                strategy.judge();
              }}
              keyboard="decimal"
              prefix="$"
              suffix={hourly ? "per hour" : undefined}
              placeholder="0.00"
              isValid={!(showErrors && missingCost)}
            />
          </Input>

          <PriceStrategyField state={strategy} showErrors={showErrors} perHour={hourly} />
        </>
      )}
    </>
  );
}
