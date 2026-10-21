import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import { decimalText, isBlank, isMoneyText, numberOf, padMoneyOnBlur } from "../Product/NewProductForm/productRules";

import { LaborRateType } from "./NewLaborRateForm.types";

// The labor rate's own fields (Figma "Labor Rate" page → Fields): Rate type,
// Cost and Rate — shared by the "Create" form and the side panel's "Pricing"
// dialog, so the rules live once.
//
//   Rate type  Hourly / Flat. Required, no default. It "affects Cost and
//              Rate": they appear once a type is picked (in an edit form the
//              record always has one), and Hourly adds "per hour" to both.
//   Cost/Rate  Required ("Enter Cost" / "Enter Rate" on Create or Save). Only
//              digits and a dot — a typed comma becomes a dot. 3 decimals, 7
//              digits before the dot, no minus; "$100" → "$100.00" when the
//              field loses the focus.
//   Rate<Cost  a WARNING under Rate's label, "Lower than cost". It waits for
//              Rate to lose the focus once, then follows both fields live.

/** What the three fields hold while being edited. */
export interface LaborPricingValues {
  rateType: LaborRateType | null;
  cost: string;
  rate: string;
}

/** The money text a field opens with — the stored number, padded to two decimals. */
export const moneyText = (value: number | undefined) => (value == null ? "" : padMoneyOnBlur(String(value)));

export const laborPricingIssues = ({ rateType, cost, rate }: LaborPricingValues) => ({
  missingRateType: rateType == null,
  missingCost: rateType != null && isBlank(cost),
  missingRate: rateType != null && isBlank(rate),
});

interface LaborPricingFieldsProps {
  values: LaborPricingValues;
  onChange: (values: LaborPricingValues) => void;
  /** Create/Save was pressed — the missing-value errors show. */
  showErrors: boolean;
  /** Rate has lost the focus at least once — the warning may speak. */
  rateTouched: boolean;
  onRateTouched: () => void;
}

export default function LaborPricingFields({ values, onChange, showErrors, rateTouched, onRateTouched }: LaborPricingFieldsProps) {
  const { rateType, cost, rate } = values;
  const issues = laborPricingIssues(values);
  const unitSuffix = rateType === "hourly" ? "per hour" : undefined;
  const lowerThanCost = rateTouched && !isBlank(rate) && !isBlank(cost) && numberOf(rate) < numberOf(cost);

  const moneyChange = (key: "cost" | "rate") => (text: string) => {
    const next = decimalText(text);
    if (isMoneyText(next)) onChange({ ...values, [key]: next });
  };

  return (
    <>
      <Input label="Rate type">
        <RadioGroup
          orientation="horizontal"
          value={rateType ?? undefined}
          onChange={(value) => onChange({ ...values, rateType: value as LaborRateType })}
          isValid={!(showErrors && issues.missingRateType)}
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
              onChange={(event) => moneyChange("cost")(event.target.value)}
              onBlur={() => onChange({ ...values, cost: padMoneyOnBlur(cost) })}
              keyboard="decimal"
              prefix="$"
              suffix={unitSuffix}
              placeholder="0.00"
              isValid={!(showErrors && issues.missingCost)}
            />
          </Input>

          <Input label="Rate" helpText={lowerThanCost ? "Lower than cost" : undefined} helpTextStatus="warning">
            <TextField
              value={rate}
              onChange={(event) => moneyChange("rate")(event.target.value)}
              onBlur={() => {
                onChange({ ...values, rate: padMoneyOnBlur(rate) });
                onRateTouched();
              }}
              keyboard="decimal"
              prefix="$"
              suffix={unitSuffix}
              placeholder="0.00"
              isValid={!(showErrors && issues.missingRate)}
            />
          </Input>
        </>
      )}
    </>
  );
}
