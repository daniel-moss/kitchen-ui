import { COMPANY, DISCOUNT_SUBTYPES } from "../../../../data/db";
import type { ChargeItem, DiscountLine } from "../../../../data/db";
import { isBlank, numberOf } from "../../../Product/NewProductForm/productRules";
import { SubtypeField } from "../../../shared/pricebookFields";

import { MoneyInput, moneyText, numberText, NumberInput } from "./lineFormParts";

// A discount line's INPUTS, built once — the one-dialog form
// (./DiscountLineForm) and the side panel's per-module dialogs
// (../LinePanels/DiscountLinePanel) only group them differently. A discount is
// a FIXED amount with no cost (Daniel, 2026-11-03).
//
//   Discount  a money field with "−$" as the prefix — the typed number itself
//             has no minus ("Negative value IS NOT allowed"). 3 decimals, 7
//             digits before the dot, at least 2 decimals once the field loses
//             the focus. Required ("Enter Discount"); ZERO is allowed.
//   Quantity  required, more than 0; empty by default.

export interface DiscountValues {
  subtypeId: string | null;
  discount: string;
  quantity: string;
  description: string;
  equipmentId?: string;
  technicianId?: number;
}

/** What the inputs open with — the line's values, or the discount as a template. */
export const discountValuesOf = (discount: ChargeItem, line: DiscountLine | null | undefined): DiscountValues =>
  line != null
    ? {
        subtypeId: line.subtypeId,
        discount: moneyText(line.discount),
        quantity: numberText(line.quantity),
        description: line.description,
        equipmentId: line.equipmentId,
        technicianId: line.technicianId,
      }
    : {
        subtypeId: discount.subtypeId ?? null,
        // Stored negative in the pricebook; the field shows the amount after "−$".
        discount: moneyText(Math.abs(discount.price)),
        quantity: "",
        description: discount.summary,
      };

/** The line the inputs describe. */
export const discountLineOf = (values: DiscountValues): DiscountLine => ({
  subtypeId: values.subtypeId,
  discount: numberOf(values.discount),
  quantity: numberOf(values.quantity),
  equipmentId: values.equipmentId,
  technicianId: values.technicianId,
  description: values.description.trim(),
});

/** What blocks the pricing inputs from saving. */
export function discountProblems(values: DiscountValues) {
  const missingDiscount = isBlank(values.discount);
  const missingQuantity = isBlank(values.quantity);
  const zeroQuantity = !missingQuantity && numberOf(values.quantity) <= 0;
  return { missingDiscount, missingQuantity, zeroQuantity, pricing: missingDiscount || missingQuantity || zeroQuantity };
}

interface FieldsProps {
  values: DiscountValues;
  set: (patch: Partial<DiscountValues>) => void;
  /** The submit button was pressed — the missing-value errors show. */
  showErrors: boolean;
}

export function DiscountGeneralFields({
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
      subtypes={hasSubtypes ? DISCOUNT_SUBTYPES : []}
      required={COMPANY.requireSubtypes}
      value={values.subtypeId}
      onChange={(subtypeId) => set({ subtypeId })}
      showErrors={showErrors}
      mobile={mobile}
    />
  );
}

/** Discount + Quantity. */
export function DiscountPricingFields({ values, set, showErrors }: FieldsProps) {
  const problems = discountProblems(values);
  return (
    <>
      <MoneyInput
        label="Discount"
        value={values.discount}
        onChange={(discount) => set({ discount })}
        prefix="−$"
        isValid={!(showErrors && problems.missingDiscount)}
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
