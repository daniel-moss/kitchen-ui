import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../../components/IconButton/IconButton";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../../components/ValueDisplay/ValueDisplayGroup";
import { ChargeItem } from "../../../../data/db";
import { subtypeNameOf } from "../discountData";

// The Discount panel's "General" module (the SHARED module, Figma
// "↳ Shared Modules" → General 1-7275): the two values the edit form owns.
//
//   Name      always.
//   Subtype   "Only shown if a service company supports subtypes." Empty =
//             ValueDisplay's own "No Subtype" placeholder.
//
// Status, Created by, Created at and Last modified are the shared "Info"
// module at the bottom of the tab; the money fields are "Pricing" below.

interface GeneralModuleProps {
  discount: ChargeItem;
  onEdit: () => void;
  /** Hidden while the discount is inactive, or without the edit permission. */
  canEdit?: boolean;
  /** The company has subtypes. False drops the Subtype row. Default true. */
  hasSubtypes?: boolean;
  /**
   * The company requires a subtype and the discount has none — the module's
   * "Warning" state ("Only shown if Subtype is required and missing").
   */
  missingSubtype?: boolean;
  isLoading?: boolean;
}

export default function GeneralModule({
  discount,
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
      banner={warn ? { children: "This discount needs a subtype" } : undefined}
      // While loading there is nothing to edit yet, so the header loses its button.
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit general" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Name" value={discount.name} isLoading={isLoading} />
          {hasSubtypes && (
            <ValueDisplay label="Subtype" value={subtypeNameOf(discount)} isWarning={warn} isLoading={isLoading} />
          )}
        </ValueDisplayGroup>
      }
    />
  );
}
