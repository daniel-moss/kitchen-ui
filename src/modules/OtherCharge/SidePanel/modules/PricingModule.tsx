import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../../components/IconButton/IconButton";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../../components/ValueDisplay/ValueDisplayGroup";
import { ChargeItem } from "../../../../data/db";
import { money } from "../../../Product/NewProductForm/productRules";
import { formatMarkup, priceStrategyOf, taxabilityOf } from "../otherChargeData";

// The Other charge panel's "Pricing" module (the SHARED module, Figma
// "↳ Shared Modules" → Pricing 3015-4365, frame "Other Charge"):
//
//   Cost            "$100.00".
//   Price strategy  Manual / Fixed markup / Percent markup.
//   Fixed markup    "$50.00" — only under Fixed markup.
//   Percent markup  "50.00%" — only under Percent markup.
//   Price           plain here even below the cost: "Price < Cost warning
//                   appears only when editing".
//   Taxability      only when the company uses taxes.
//
// No "Type" row ("Only shown for labor rates") and no "Cost strategy" ("Only
// shown for products"), so no "/hr" suffix either.

interface PricingModuleProps {
  charge: ChargeItem;
  onEdit: () => void;
  /** Hidden while the charge is inactive, or without the edit permission. */
  canEdit?: boolean;
  /** False drops the Taxability row — the company does not use taxes. */
  useTaxes?: boolean;
  isLoading?: boolean;
}

export default function PricingModule({ charge, onEdit, canEdit = true, useTaxes = true, isLoading = false }: PricingModuleProps) {
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
          <ValueDisplay label="Cost" value={money(charge.cost)} isLoading={isLoading} />
          <ValueDisplay label="Price strategy" value={priceStrategyOf(charge)} isLoading={isLoading} />
          {charge.priceStrategy === "fixedMarkup" && (
            <ValueDisplay label="Fixed markup" value={formatMarkup(charge)} isLoading={isLoading} />
          )}
          {charge.priceStrategy === "percentMarkup" && (
            <ValueDisplay label="Percent markup" value={formatMarkup(charge)} isLoading={isLoading} />
          )}
          <ValueDisplay label="Price" value={money(charge.price)} isLoading={isLoading} />
          {useTaxes && <ValueDisplay label="Taxability" value={taxabilityOf(charge)} isLoading={isLoading} />}
        </ValueDisplayGroup>
      }
    />
  );
}
