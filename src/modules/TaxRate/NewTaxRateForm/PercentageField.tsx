import TextField from "../../../components/Fields/TextField/TextField";
import Input from "../../../components/Input/Input";
import { decimalText, isBlank, padMoneyOnBlur } from "../../Product/NewProductForm/productRules";

// The tax rate's own field (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Tax Rate" → Fields → Percentage 3254-80186), shared by the "Create" form
// and the side panel's "Pricing" dialog.
//
//   Applies when            always.
//   Must be filled in when  always ("Missing Value" — checked by Create or
//                           Save, "Enter Percentage").
//   Default                 none.
//   Input rules             only digits and a dot, a typed comma becomes a
//                           dot; up to 3 decimals ("10%" → "10.00%" when the
//                           field loses the focus); up to 3 digits before the
//                           dot; no minus; 0.00% IS allowed; the decimal
//                           keyboard on a phone.
//   ">100%"                 "Can't be greater than 100%" — checked when the
//                           field loses the focus, then live.
//
// Production stores it as `default_price` (DECIMAL(10,3)) and refuses a tax
// rate over 100 ("This value may not exceed 100%.").

export const MAX_PERCENT = 100;

/** "", "8", "8.875", "100" — the text the field may hold. */
const isPercentText = (value: string) => /^\d{0,3}(\.\d{0,3})?$/.test(value);

/** Over 100 — the field's one error besides the empty one. */
export const isOverMax = (value: string) => !isBlank(value) && Number(value) > MAX_PERCENT;

/** A stored percent as the field edits it: 8.875 → "8.875", 10 → "10.00". */
export const percentText = (rate: number) => padMoneyOnBlur(String(rate));

/** "10.00%", "8.875%" — the percent as the panel prints it. */
export const formatPercent = (rate: number) =>
  `${rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}%`;

interface PercentageFieldProps {
  value: string;
  onChange: (next: string) => void;
  /** The field lost the focus once — the over-100 error shows from then on. */
  touched: boolean;
  onTouched: () => void;
  /** Create/Save was pressed — an empty field shows "Enter Percentage". */
  showErrors: boolean;
}

export default function PercentageField({ value, onChange, touched, onTouched, showErrors }: PercentageFieldProps) {
  const over = isOverMax(value) && (touched || showErrors);
  const empty = showErrors && isBlank(value);

  return (
    <Input label="Percentage">
      <TextField
        value={value}
        onChange={(event) => isPercentText(decimalText(event.target.value)) && onChange(decimalText(event.target.value))}
        onBlur={() => {
          onChange(padMoneyOnBlur(value));
          onTouched();
        }}
        keyboard="decimal"
        suffix="%"
        placeholder="0.00"
        isValid={!(over || empty)}
        errorMessage={over ? "Can't be greater than 100%" : undefined}
      />
    </Input>
  );
}
