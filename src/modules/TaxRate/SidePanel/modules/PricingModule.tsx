import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../../components/IconButton/IconButton";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../../components/ValueDisplay/ValueDisplayGroup";
import { TaxRateItem } from "../../../../data/db";
import { formatPercent } from "../../NewTaxRateForm/PercentageField";

// The Tax rate panel's "Pricing" module (the SHARED module, Figma "↳ Shared
// Modules" → Pricing → "Tax Rate" 3254-81611): ONE row, "Percentage" —
// "10.00%", two to three decimals.

interface PricingModuleProps {
  rate: TaxRateItem;
  onEdit: () => void;
  /** Hidden while the rate is inactive, or without the edit permission. */
  canEdit?: boolean;
  isLoading?: boolean;
}

export default function PricingModule({ rate, onEdit, canEdit = true, isLoading = false }: PricingModuleProps) {
  return (
    <DisplayModule
      title="Pricing"
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit pricing" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Percentage" value={formatPercent(rate.rate)} isLoading={isLoading} />
        </ValueDisplayGroup>
      }
    />
  );
}
