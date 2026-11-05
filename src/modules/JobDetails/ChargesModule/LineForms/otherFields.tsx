import { COMPANY, OTHER_SUBTYPES } from "../../../../data/db";
import type { ChargeItem, OtherLine } from "../../../../data/db";
import { isBlank, numberOf } from "../../../Product/NewProductForm/productRules";
import { SubtypeField } from "../../../shared/pricebookFields";

import { costMismatchHelp, MoneyInput, moneyText, numberText, NumberInput } from "./lineFormParts";

// An other charge line's INPUTS, built once — the one-dialog form
// (./OtherLineForm) and the side panel's per-module dialogs
// (../LinePanels/OtherLinePanel) only group them differently. Cost / Price
// follow the "New labor rate" form; Quantity is required and more than 0, empty
// by default. The Cost help text's "Click here" has no charge side panel to
// open yet.

export interface OtherValues {
  subtypeId: string | null;
  cost: string;
  price: string;
  quantity: string;
  description: string;
  equipmentId?: string;
  technicianId?: number;
}

/** What the inputs open with — the line's values, or the charge as a template. */
export const otherValuesOf = (charge: ChargeItem, line: OtherLine | null | undefined): OtherValues =>
  line != null
    ? {
        subtypeId: line.subtypeId,
        cost: moneyText(line.cost),
        price: moneyText(line.price),
        quantity: numberText(line.quantity),
        description: line.description,
        equipmentId: line.equipmentId,
        technicianId: line.technicianId,
      }
    : {
        subtypeId: charge.subtypeId ?? null,
        cost: moneyText(charge.cost),
        price: moneyText(charge.price),
        quantity: "",
        description: charge.summary,
      };

/** The line the inputs describe. */
export const otherLineOf = (values: OtherValues): OtherLine => ({
  subtypeId: values.subtypeId,
  cost: numberOf(values.cost),
  price: numberOf(values.price),
  quantity: numberOf(values.quantity),
  equipmentId: values.equipmentId,
  technicianId: values.technicianId,
  description: values.description.trim(),
});

/** What blocks the pricing inputs from saving. */
export function otherProblems(values: OtherValues) {
  const missingCost = isBlank(values.cost);
  const missingPrice = isBlank(values.price);
  const missingQuantity = isBlank(values.quantity);
  const zeroQuantity = !missingQuantity && numberOf(values.quantity) <= 0;
  return { missingCost, missingPrice, missingQuantity, zeroQuantity, pricing: missingCost || missingPrice || missingQuantity || zeroQuantity };
}

interface FieldsProps {
  values: OtherValues;
  set: (patch: Partial<OtherValues>) => void;
  /** The submit button was pressed — the missing-value errors show. */
  showErrors: boolean;
}

export function OtherGeneralFields({
  values,
  set,
  showErrors,
  mobile,
  hasSubtypes = true,
}: FieldsProps & {
  mobile: boolean;
  /** False: the company does not use subtypes, so the field is not drawn. */
  hasSubtypes?: boolean;
}) {
  return (
    <SubtypeField
      subtypes={hasSubtypes ? OTHER_SUBTYPES : []}
      required={COMPANY.requireSubtypes}
      value={values.subtypeId}
      onChange={(subtypeId) => set({ subtypeId })}
      showErrors={showErrors}
      mobile={mobile}
    />
  );
}

interface PricingFieldsProps extends FieldsProps {
  charge: ChargeItem;
  /** The user typed in Cost since the inputs opened. */
  costChanged: boolean;
  onCostChanged: () => void;
}

/** Cost + Price + Quantity. */
export function OtherPricingFields({ charge, values, set, showErrors, costChanged, onCostChanged }: PricingFieldsProps) {
  const problems = otherProblems(values);
  const costMismatch = costChanged && !problems.missingCost && numberOf(values.cost) !== charge.cost;
  const belowCost = !problems.missingCost && !problems.missingPrice && numberOf(values.price) < numberOf(values.cost);

  return (
    <>
      <MoneyInput
        label="Cost"
        value={values.cost}
        onChange={(cost) => {
          if (cost !== values.cost) onCostChanged();
          set({ cost });
        }}
        isValid={!(showErrors && problems.missingCost)}
        helpText={costMismatch ? costMismatchHelp() : undefined}
        helpTextStatus="info"
      />

      <MoneyInput
        label="Price"
        value={values.price}
        onChange={(price) => set({ price })}
        isValid={!(showErrors && problems.missingPrice)}
        helpText={belowCost ? "Less than cost" : undefined}
        helpTextStatus="warning"
      />

      <NumberInput
        label="Quantity"
        value={values.quantity}
        onChange={(quantity) => set({ quantity })}
        isValid={!(showErrors && (problems.missingQuantity || problems.zeroQuantity))}
        errorMessage={problems.zeroQuantity ? "Must be greater than 0" : undefined}
      />
    </>
  );
}
