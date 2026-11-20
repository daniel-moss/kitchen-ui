import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { LaborItem } from "../../../data/db";
import { subtypeNameOf } from "../laborRateData";

// The Labor rate panel's "General" module (Figma 1-7275, Overview 1-7276):
// the two values the edit form owns.
//
//   Name      always.
//   Subtype   "Only shown if a service company supports subtypes." Empty =
//             ValueDisplay's own "No Subtype" placeholder.
//
// Status, Created by, Created at and Last modified moved to the SHARED "Info"
// module at the bottom of the tab (Figma 3091-20086, 2026-11-20). The money
// fields are the "Pricing" module below.

interface GeneralModuleProps {
  rate: LaborItem;
  onEdit: () => void;
  /** Hidden while the rate is inactive, or without the edit permission. */
  canEdit?: boolean;
  /** The company has subtypes. False drops the Subtype row. Default true. */
  hasSubtypes?: boolean;
  /**
   * The company requires a subtype and the rate has none — the module's
   * "Warning" state ("Only shown if Subtype is required and missing").
   */
  missingSubtype?: boolean;
  isLoading?: boolean;
}

export default function GeneralModule({
  rate,
  onEdit,
  canEdit = true,
  hasSubtypes = true,
  missingSubtype = false,
  isLoading = false,
}: GeneralModuleProps) {
  const warn = missingSubtype && !isLoading;

  return (
    <DisplayModule
      title="General"
      status={warn ? "warning" : "none"}
      banner={warn ? { children: "This labor rate needs a subtype" } : undefined}
      // While loading there is nothing to edit yet, so the header loses its button.
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit general" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Name" value={rate.name} isLoading={isLoading} />
          {hasSubtypes && (
            <ValueDisplay label="Subtype" value={subtypeNameOf(rate)} isWarning={warn} isLoading={isLoading} />
          )}
        </ValueDisplayGroup>
      }
    />
  );
}
