import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { LaborItem } from "../../../data/db";
import { formatAmount, formatMarkup, priceStrategyOf, rateTypeOf, taxabilityOf } from "../laborRateData";

// The Labor rate panel's "Pricing" module (Figma 3015-4365) — the money half
// of the record, which the Tax rate panel has no equivalent of.
//
//   Type            Hourly / Flat. It decides the "/hr" suffix on Cost and Price.
//   Cost            what the work costs the company — "$100.00/hr".
//   Price strategy  Manual / Fixed markup / Percent markup.
//   Fixed markup    "$50.00" — only under the Fixed markup strategy.
//   Percent markup  "50.00%" — only under the Percent markup strategy.
//   Price           what the client is charged. Plain here even when it is
//                   lower than the cost: that warning "appears when editing
//                   only".
//   Taxability      "Only shown when a service company uses taxes".

interface PricingModuleProps {
  rate: LaborItem;
  onEdit: () => void;
  /** Hidden while the rate is inactive, or without the edit permission. */
  canEdit?: boolean;
  /** False drops the Taxability row — the company does not use taxes. */
  useTaxes?: boolean;
  isLoading?: boolean;
}

export default function PricingModule({
  rate,
  onEdit,
  canEdit = true,
  useTaxes = true,
  isLoading = false,
}: PricingModuleProps) {
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
          <ValueDisplay label="Type" value={rateTypeOf(rate)} isLoading={isLoading} />
          <ValueDisplay label="Cost" value={formatAmount(rate.cost, rate)} isLoading={isLoading} />
          <ValueDisplay label="Price strategy" value={priceStrategyOf(rate)} isLoading={isLoading} />
          {rate.priceStrategy === "fixed" && (
            <ValueDisplay label="Fixed markup" value={formatMarkup(rate)} isLoading={isLoading} />
          )}
          {rate.priceStrategy === "percent" && (
            <ValueDisplay label="Percent markup" value={formatMarkup(rate)} isLoading={isLoading} />
          )}
          <ValueDisplay label="Price" value={formatAmount(rate.rate, rate)} isLoading={isLoading} />
          {useTaxes && <ValueDisplay label="Taxability" value={taxabilityOf(rate)} isLoading={isLoading} />}
        </ValueDisplayGroup>
      }
    />
  );
}
