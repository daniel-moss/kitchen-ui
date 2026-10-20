import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { Warranty, warrantyStateOf } from "../../../data/db";
import { formatLongDate } from "../../shared/dates";
import { WARRANTY_STATUS } from "../warrantyData";

// The Warranty panel's "General" module (Figma section 21864-11898; the module
// was called "General details" until the 2026-10-20 update). Four label–value
// pairs; unlike the Equipment panel's module none of them is copyable (no value
// carries a right-slot button in the node), and the last one — Status — is
// DERIVED from the dates, not stored.

interface GeneralDetailsModuleProps {
  warranty: Warranty;
  onEdit: () => void;
  isLoading?: boolean;
  /**
   * False hides the edit button — the PUBLIC view's "General" module ("No
   * editing", node 22148-2141). Default true.
   */
  canEdit?: boolean;
}

export default function GeneralDetailsModule({ warranty, onEdit, isLoading = false, canEdit = true }: GeneralDetailsModuleProps) {
  const status = WARRANTY_STATUS[warrantyStateOf(warranty)];

  return (
    <DisplayModule
      title="General"
      // While loading there is nothing to edit yet, so the header loses its
      // button (the Loading frame draws the header with no right slot).
      slotRight={isLoading || !canEdit ? undefined : <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit general" onClick={onEdit} />}
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Name" value={warranty.name} isLoading={isLoading} />
          <ValueDisplay label="Start date" value={formatLongDate(warranty.startDate)} isLoading={isLoading} />
          {/* "No End date" — an unset end date means the warranty never
              expires, and the status then follows the START date alone (the
              "No End Date" frame's annotation, node 21869-12456). That string
              is ValueDisplay's own "No [Label]" placeholder, so no override. */}
          <ValueDisplay
            label="End date"
            value={warranty.endDate == null ? undefined : formatLongDate(warranty.endDate)}
            isLoading={isLoading}
          />
          <ValueDisplay
            label="Status"
            value={status.label}
            valueColor={status.color}
            slotLeft={<Icon icon={status.icon} pack="solid" size={14} />}
            isLoading={isLoading}
          />
        </ValueDisplayGroup>
      }
    />
  );
}
