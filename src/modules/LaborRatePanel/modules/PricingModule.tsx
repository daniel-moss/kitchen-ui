import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { LaborItem } from "../../../data/db";
import { formatAmount, rateTypeOf, taxabilityOf } from "../laborRateData";

// The Labor rate panel's "Pricing" module (Figma 3015-4365) — the money half
// of the record, which the Tax rate panel has no equivalent of.
//
//   Rate type   Hourly / Flat. It decides the "/hr" suffix below.
//   Cost        what the work costs the company — "$100.00/hr".
//   Rate        what the client is charged. Plain here even when it is lower
//               than the cost: that warning "only appears when editing".
//   Taxability  "Only shown when a service company uses taxes".
//
// No price strategy any more (2026-10-21): the rate is always typed.

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
          <ValueDisplay label="Rate type" value={rateTypeOf(rate)} isLoading={isLoading} />
          <ValueDisplay label="Cost" value={formatAmount(rate.cost, rate)} isLoading={isLoading} />
          <ValueDisplay label="Rate" value={formatAmount(rate.rate, rate)} isLoading={isLoading} />
          {useTaxes && <ValueDisplay label="Taxability" value={taxabilityOf(rate)} isLoading={isLoading} />}
        </ValueDisplayGroup>
      }
    />
  );
}
