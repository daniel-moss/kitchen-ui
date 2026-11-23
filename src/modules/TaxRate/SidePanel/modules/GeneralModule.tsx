import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../../components/IconButton/IconButton";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../../components/ValueDisplay/ValueDisplayGroup";
import { TaxRateItem } from "../../../../data/db";

// The Tax rate panel's "General" module (the SHARED module, Figma "↳ Shared
// Modules" → General 1-7275): the Name alone — a tax rate has no subtype, so
// the shared module's Subtype row is not drawn (Daniel, 2026-11-23).

interface GeneralModuleProps {
  rate: TaxRateItem;
  onEdit: () => void;
  /** Hidden while the rate is inactive, or without the edit permission. */
  canEdit?: boolean;
  isLoading?: boolean;
}

export default function GeneralModule({ rate, onEdit, canEdit = true, isLoading = false }: GeneralModuleProps) {
  return (
    <DisplayModule
      title="General"
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit general" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Name" value={rate.name} isLoading={isLoading} />
        </ValueDisplayGroup>
      }
    />
  );
}
