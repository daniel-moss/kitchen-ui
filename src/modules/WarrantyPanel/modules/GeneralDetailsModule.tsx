import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { Warranty, warrantyStateOf } from "../../../data/db";
import { formatLongDate } from "../../shared/dates";
import { WARRANTY_STATUS } from "../warrantyData";

// The Warranty panel's "General details" module (Figma section 21864-11898).
// Four label–value pairs; unlike the Equipment panel's module none of them is
// copyable (no value carries a right-slot button in the node), and the last one
// — Status — is DERIVED from the dates, not stored.

interface GeneralDetailsModuleProps {
  warranty: Warranty;
  onEdit: () => void;
  isLoading?: boolean;
}

export default function GeneralDetailsModule({ warranty, onEdit, isLoading = false }: GeneralDetailsModuleProps) {
  const status = WARRANTY_STATUS[warrantyStateOf(warranty)];

  return (
    <DisplayModule
      title="General details"
      // While loading there is nothing to edit yet, so the header loses its
      // button (the Loading frame draws the header with no right slot).
      slotRight={isLoading ? undefined : <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit general details" onClick={onEdit} />}
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
