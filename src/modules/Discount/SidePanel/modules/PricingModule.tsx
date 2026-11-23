import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../../components/IconButton/IconButton";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../../components/ValueDisplay/ValueDisplayGroup";
import { ChargeItem } from "../../../../data/db";
import { money } from "../../../Product/NewProductForm/productRules";

// The Discount panel's "Pricing" module (the SHARED module, Figma
// "↳ Shared Modules" → Pricing 3015-4365, frame "Discount" 3251-79474): ONE
// row, "Discount" ("Only shown for discounts"), with the stored negative
// amount — "−$150.00". No cost, price strategy, price or taxability: a
// discount has none of them.

interface PricingModuleProps {
  discount: ChargeItem;
  onEdit: () => void;
  /** Hidden while the discount is inactive, or without the edit permission. */
  canEdit?: boolean;
  isLoading?: boolean;
}

export default function PricingModule({ discount, onEdit, canEdit = true, isLoading = false }: PricingModuleProps) {
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
          <ValueDisplay label="Discount" value={money(discount.price)} isLoading={isLoading} />
        </ValueDisplayGroup>
      }
    />
  );
}
