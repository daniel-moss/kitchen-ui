import { useState } from "react";

import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import {
  computePrice,
  decimalText,
  isBlank,
  isMoneyText,
  isPercentText,
  isSignedMoneyText,
  MAX_PERCENT,
  money,
  NO_SUGGESTIONS,
  numberOf,
  padMoneyOnBlur,
  PriceStrategy,
} from "../Product/NewProductForm/productRules";

import styles from "./PriceStrategyField.module.scss";

// The pricebook's "Price strategy" field — ONE build for every item that has
// a price (Figma file qhebbfbPHDVnv8IF1EC7Zg, page "Shared Fields" → Price
// Strategy 3114-24472). The Product form, the Labor rate "Create" form and the
// Labor rate "Pricing" dialog all render this, so the rules cannot drift.
//
//   Manual          a typed "Price". "Less than cost" is a warning under its
//                   label.
//   Fixed markup    a signed "$" amount; Price = Cost + markup, shown live in a
//                   "Price" ValueDisplay ("Enter Fixed markup" while empty).
//   Percent markup  a signed "%"; Price = Cost × (1 + percent / 100).
//
// "Applies when a Type is selected, for any item type except Discount and Tax
// rate. Default: Manual." Every value is required under its own option
// ("Missing Value", checked by Create / Save only).
//
// The price checks — less than cost, a negative price, a percent over the top
// value — "validate only when the field loses the focus": they are a VERDICT
// taken at that moment (blur of Cost, Price or a markup, or Create), not a
// live reading, so typing never flips them on or off. The verdict is kept
// with the strategy it was taken under, so another option's card does not
// inherit it. A missing Cost counts as $0.00.
//
// The owner holds the values and the verdict (`usePriceStrategy`), because its
// own Cost field and its Create / Save button take the verdict too.

/** What the field holds while being edited. */
export interface PriceStrategyValues {
  strategy: PriceStrategy;
  price: string;
  fixedMarkup: string;
  percentMarkup: string;
}

export const EMPTY_PRICE_STRATEGY: PriceStrategyValues = {
  strategy: "manual",
  price: "",
  fixedMarkup: "",
  percentMarkup: "",
};

/** Everything the field's rules decide, read off the values and the cost. */
export function priceStrategyCheck(values: PriceStrategyValues, cost: number) {
  const { strategy, price, fixedMarkup, percentMarkup } = values;
  const percentValue = numberOf(percentMarkup);
  const markupEmpty = isBlank(strategy === "fixedMarkup" ? fixedMarkup : percentMarkup);
  const computedPrice = computePrice(strategy, cost, numberOf(fixedMarkup), percentValue);
  return {
    /** The price the item saves: the typed one, or the markup's result. */
    price: strategy === "manual" ? numberOf(price) : computedPrice,
    computedPrice,
    markupEmpty,
    missingPrice: strategy === "manual" && isBlank(price),
    missingMarkup: strategy !== "manual" && markupEmpty,
    negativePrice: strategy !== "manual" && !markupEmpty && computedPrice < 0,
    percentTooHigh: strategy === "percentMarkup" && percentValue > MAX_PERCENT,
    belowCost:
      strategy === "manual"
        ? !isBlank(price) && numberOf(price) < cost
        : !markupEmpty && computedPrice >= 0 && computedPrice < cost,
  };
}

export type PriceStrategyCheck = ReturnType<typeof priceStrategyCheck>;

/** True when the field stops Create / Save. "Less than cost" never does. */
export const priceStrategyBlocks = (check: PriceStrategyCheck) =>
  check.missingPrice || check.missingMarkup || check.negativePrice || check.percentTooHigh;

interface Verdict {
  strategy: PriceStrategy;
  belowCost: boolean;
  negative: boolean;
  tooHigh: boolean;
}

/**
 * The field's state for its owner: the values, the live check, and the
 * blur-time verdict. Call `judge` from the owner's Cost blur and from Create /
 * Save; the field calls it from its own blurs. `reset` re-opens a form.
 */
export function usePriceStrategy(cost: number, initial: PriceStrategyValues = EMPTY_PRICE_STRATEGY) {
  const [values, setValues] = useState<PriceStrategyValues>(initial);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const check = priceStrategyCheck(values, cost);

  const judge = () =>
    setVerdict({
      strategy: values.strategy,
      belowCost: check.belowCost,
      negative: check.negativePrice,
      tooHigh: check.percentTooHigh,
    });

  const reset = (next: PriceStrategyValues = EMPTY_PRICE_STRATEGY) => {
    setValues(next);
    setVerdict(null);
  };

  return {
    values,
    setValues,
    check,
    verdict: verdict?.strategy === values.strategy ? verdict : null,
    judge,
    reset,
  };
}

export type PriceStrategyState = ReturnType<typeof usePriceStrategy>;

interface PriceStrategyFieldProps {
  state: PriceStrategyState;
  /** Create / Save was pressed — the missing-value errors show. */
  showErrors: boolean;
  /**
   * An HOURLY item (a labor rate): "per hour" after the Manual price and
   * "/hr" after the calculated one. Default false.
   */
  perHour?: boolean;
}

export default function PriceStrategyField({ state, showErrors, perHour = false }: PriceStrategyFieldProps) {
  const { values, setValues, check, verdict, judge } = state;
  const { strategy, price, fixedMarkup, percentMarkup } = values;

  const showBelowCost = verdict?.belowCost === true;
  const showNegativePrice = verdict?.negative === true;
  const showPercentTooHigh = verdict?.tooHigh === true;
  // An EMPTY value marks the input alone — the card turns red only for a
  // negative price or a percent over the top value.
  const showMissingPrice = showErrors && check.missingPrice;
  const showMissingMarkup = showErrors && check.missingMarkup;

  const set = (patch: Partial<PriceStrategyValues>) => setValues({ ...values, ...patch });
  const unit = perHour ? "/hr" : "";

  // The calculated Price under a markup — one ValueDisplay, three states.
  const calculated = money(check.computedPrice) + unit;
  const priceValueDisplay = (
    <ValueDisplay
      label="Price"
      emptyText={strategy === "fixedMarkup" ? "Enter Fixed markup" : "Enter Percent markup"}
      value={
        check.markupEmpty
          ? undefined
          : showNegativePrice
            ? `${calculated} — must be $0.00 or more`
            : showBelowCost
              ? `${calculated} — less than cost`
              : calculated
      }
      valueColor={showNegativePrice ? "var(--text-error)" : undefined}
      isWarning={showBelowCost}
    />
  );

  return (
    <Input label="Price strategy">
      <RadioGroup
        orientation="vertical"
        value={strategy}
        onChange={(value) => set({ strategy: value as PriceStrategy })}
      >
        <RadioItem
          value="manual"
          label="Manual"
          content={
            <Input label="Price" helpText={showBelowCost ? "Less than cost" : undefined} helpTextStatus="warning">
              <TextField
                value={price}
                onChange={(event) => isMoneyText(decimalText(event.target.value)) && set({ price: decimalText(event.target.value) })}
                onBlur={() => {
                  set({ price: padMoneyOnBlur(price) });
                  judge();
                }}
                keyboard="decimal"
                prefix="$"
                suffix={perHour ? "per hour" : undefined}
                placeholder="0.00"
                isValid={!showMissingPrice}
              />
            </Input>
          }
        />

        <RadioItem
          value="fixedMarkup"
          label="Fixed markup"
          error={strategy === "fixedMarkup" && showNegativePrice}
          contentPadded={false}
          content={
            <div className={styles.cardContent}>
              <Input label="Fixed markup">
                <TextField
                  value={fixedMarkup}
                  onChange={(event) =>
                    isSignedMoneyText(decimalText(event.target.value)) && set({ fixedMarkup: decimalText(event.target.value) })
                  }
                  onBlur={() => {
                    set({ fixedMarkup: padMoneyOnBlur(fixedMarkup) });
                    judge();
                  }}
                  {...NO_SUGGESTIONS}
                  prefix="$"
                  placeholder="0.00"
                  isValid={!(showMissingMarkup || showNegativePrice)}
                  // The negative price's own message is the Price row below,
                  // so the field turns red without one.
                  errorMessage={showNegativePrice ? "" : undefined}
                />
              </Input>
              {priceValueDisplay}
            </div>
          }
        />

        <RadioItem
          value="percentMarkup"
          label="Percent markup"
          error={strategy === "percentMarkup" && (showNegativePrice || showPercentTooHigh)}
          contentPadded={false}
          content={
            <div className={styles.cardContent}>
              <Input label="Percent markup">
                <TextField
                  value={percentMarkup}
                  onChange={(event) =>
                    isPercentText(decimalText(event.target.value)) && set({ percentMarkup: decimalText(event.target.value) })
                  }
                  onBlur={() => {
                    set({ percentMarkup: padMoneyOnBlur(percentMarkup) });
                    judge();
                  }}
                  {...NO_SUGGESTIONS}
                  suffix="%"
                  placeholder="0.00"
                  isValid={!(showMissingMarkup || showNegativePrice || showPercentTooHigh)}
                  errorMessage={showPercentTooHigh ? `Must be ${MAX_PERCENT}% or less` : showNegativePrice ? "" : undefined}
                />
              </Input>
              {priceValueDisplay}
            </div>
          }
        />
      </RadioGroup>
    </Input>
  );
}
