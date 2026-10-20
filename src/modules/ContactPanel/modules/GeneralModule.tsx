import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { semanticIcons } from "../../../styles/semanticIcons";
import { PanelContact } from "../ContactPanel.types";

// The "General" module (Figma section 17002-47705): Name and Position, plus the
// edit button. A missing NAME is the module's warning state ("Shown if contact
// name is missing", 23815-12735): amber ring, "Key details missing!" banner
// whose Edit opens the form, and the Name value in its warning look. A missing
// Position is only the plain "No Position" placeholder.

interface GeneralModuleProps {
  contact: PanelContact;
  onEdit: () => void;
  isLoading?: boolean;
  /**
   * False hides the edit button AND the warning state — the public view ("No
   * editing") and an inactive client's contact ("No warning if a contact
   * belongs to an inactive client", 23914-4795). Default true.
   */
  canEdit?: boolean;
}

export default function GeneralModule({ contact, onEdit, isLoading = false, canEdit = true }: GeneralModuleProps) {
  const missingName = contact.name == null || contact.name === "";
  const warning = canEdit && !isLoading && missingName;

  return (
    <DisplayModule
      title="General"
      status={warning ? "warning" : "none"}
      banner={warning ? { children: "Key details missing!", ctaLabel: "Edit", ctaOnClick: onEdit } : undefined}
      // While loading there is nothing to edit yet (the Loading frame draws the
      // header with no right slot).
      slotRight={isLoading || !canEdit ? undefined : <IconButton icon={semanticIcons.edit} variant="ghost" size="md" aria-label="Edit general" onClick={onEdit} />}
      content={
        <ValueDisplayGroup>
          {/* An empty Name is ValueDisplay's own "No Name" placeholder — amber
              with the triangle in the warning state. */}
          <ValueDisplay label="Name" value={contact.name} isWarning={warning} isLoading={isLoading} />
          <ValueDisplay label="Position" value={contact.position} isLoading={isLoading} />
        </ValueDisplayGroup>
      }
    />
  );
}
