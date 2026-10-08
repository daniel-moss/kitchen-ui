import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { LaborItem } from "../../../data/db";
import { formatAmount, markupRowOf, taxabilityOf, unitTypeOf } from "../laborRateData";

// The Labor rate panel's "Pricing" module (Figma 3015-4365) — the money half
// of the record, which the Tax rate panel has no equivalent of.
//
// Four rows, plus one that depends on the price strategy:
//   Unit type       Hourly / Flat rate. It decides the "/hr" suffix below.
//   Cost            what the work costs the company. Never empty: production
//                   defaults the column to 0, so "no value" reads "$0.00".
//   Fixed markup    ONLY under that strategy — "$50.00".
//   Percent markup  ONLY under that strategy — "50.00%".
//   Rate            what the client is charged. Under a markup it is
//                   DERIVED (a database trigger recomputes it), so the three
//                   money rows are always one consistent sum.
//   Taxability      "Only shown when a company uses taxes" (its annotation).

interface PricingModuleProps {
  rate: LaborItem;
  onEdit: () => void;
  /** Hidden while the rate is inactive or in Review, or without the edit permission. */
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
  const markup = markupRowOf(rate);

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
          <ValueDisplay label="Unit type" value={unitTypeOf(rate)} isLoading={isLoading} />
          <ValueDisplay label="Cost" value={formatAmount(rate.cost, rate)} isLoading={isLoading} />
          {markup != null && <ValueDisplay label={markup.label} value={markup.value} isLoading={isLoading} />}
          <ValueDisplay label="Rate" value={formatAmount(rate.rate, rate)} isLoading={isLoading} />
          {useTaxes && <ValueDisplay label="Taxability" value={taxabilityOf(rate)} isLoading={isLoading} />}
        </ValueDisplayGroup>
      }
    />
  );
}
