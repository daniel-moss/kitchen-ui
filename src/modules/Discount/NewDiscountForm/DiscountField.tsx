import TextField from "../../../components/Fields/TextField/TextField";
import Input from "../../../components/Input/Input";
import { decimalText, isBlank, isMoneyText, padMoneyOnBlur } from "../../Product/NewProductForm/productRules";

// The discount's own amount field (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Discount" → Fields → Discount 3251-79148), shared by the "Create" form
// and the side panel's "Pricing" dialog.
//
//   Applies when            always.
//   Must be filled in when  always ("Missing Value" — checked by Create or
//                           Save, not while typing). $0.00 is allowed
//                           (Daniel, 2026-11-23 — production allows it too).
//   Default                 none.
//   Input rules             only digits and a dot, a typed comma becomes a
//                           dot; up to 3 decimals and 7 digits before the dot;
//                           NO minus — the "−$" prefix carries the sign; "$100"
//                           → "$100.00" when the field loses the focus; the
//                           decimal keyboard on a phone.
//
// The user types a POSITIVE amount and the record stores it NEGATIVE, the way
// production's "Default Unit Price" does for a discount (its `credit` field).

interface DiscountFieldProps {
  /** The typed text, positive ("150", "150.00"). */
  value: string;
  onChange: (next: string) => void;
  /** Create/Save was pressed — an empty field shows "Enter Discount". */
  showErrors: boolean;
}

export default function DiscountField({ value, onChange, showErrors }: DiscountFieldProps) {
  return (
    <Input label="Discount">
      <TextField
        value={value}
        onChange={(event) => isMoneyText(decimalText(event.target.value)) && onChange(decimalText(event.target.value))}
        onBlur={() => onChange(padMoneyOnBlur(value))}
        keyboard="decimal"
        prefix="−$"
        placeholder="0.00"
        isValid={!(showErrors && isBlank(value))}
      />
    </Input>
  );
}

/** A stored (negative or zero) discount as the field edits it: −150 → "150.00". */
export const discountText = (price: number) => padMoneyOnBlur(String(Math.abs(price)));
