import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { Equipment, WarrantyCoverage } from "../../../data/db";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { copyText } from "../../shared/helpers";
import { formatLongDate } from "../equipmentData";

// The "General details" module (Figma 17192-89308). Ten label–value pairs; the
// five copyable ones carry a copy IconButton in the value's right slot, and the
// tenth ("Warranty") is derived, not stored.

/** Warranty coverage → the value's icon, text and color (Figma 21958-10447). */
const COVERAGE: Record<Exclude<WarrantyCoverage, "none">, { icon: string; label: string; color: string }> = {
  covered: { icon: "shield-halved", label: "Covered", color: "var(--text-success)" },
  partial: { icon: "shield-exclamation", label: "Partially covered", color: "var(--text-warning)" },
  expired: { icon: "shield-xmark", label: "Expired", color: "var(--text-placeholder)" },
};

/**
 * The three fields whose absence turns the whole module into its warning
 * state (the module's own annotation, node 21958-9105). Everything else that
 * is missing renders the normal "No [Label]" placeholder.
 */
export const KEY_FIELDS = ["manufacturer", "modelNumber", "serialNumber"] as const;

/** True when any key detail is missing — drives the banner, ring and Details tab. */
export const hasMissingKeyDetails = (equipment: Equipment): boolean =>
  KEY_FIELDS.some((field) => equipment[field] == null || equipment[field] === "");

interface GeneralDetailsModuleProps {
  equipment: Equipment;
  coverage: WarrantyCoverage;
  onEdit: () => void;
  isLoading?: boolean;
}

export default function GeneralDetailsModule({ equipment, coverage, onEdit, isLoading = false }: GeneralDetailsModuleProps) {
  const warning = !isLoading && hasMissingKeyDetails(equipment);

  // One copy button — `lg` (36px) and muted, the size the value slot takes.
  // While loading there is nothing to copy, so the slot is empty — the Loading
  // frame sets `slotRight=false` on every value (node 22012-19762).
  const copyButton = (label: string, value: string | undefined) =>
    isLoading || value == null || value === "" ? undefined : (
      <HoverTooltip text="Copy">
        <IconButton icon="copy" variant="muted" size="lg" aria-label={`Copy ${label.toLowerCase()}`} onClick={() => copyText(value, label)} />
      </HoverTooltip>
    );

  const coverageValue = coverage === "none" ? undefined : COVERAGE[coverage];

  return (
    <DisplayModule
      title="General details"
      status={warning ? "warning" : "none"}
      banner={warning ? { children: "Key details missing", ctaLabel: "Edit", ctaOnClick: onEdit } : undefined}
      // While loading there is nothing to edit yet, so the header loses its
      // button (Figma's Loading frame draws the header with no right slot).
      slotRight={
        isLoading ? undefined : <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit general details" onClick={onEdit} />
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Name" value={equipment.displayName} slotRight={copyButton("Name", equipment.displayName)} isLoading={isLoading} />
          <ValueDisplay
            label="Manufacturer"
            value={equipment.manufacturer}
            isWarning={warning && (equipment.manufacturer == null || equipment.manufacturer === "")}
            slotRight={copyButton("Manufacturer", equipment.manufacturer)}
            isLoading={isLoading}
          />
          <ValueDisplay
            label="Serial number"
            value={equipment.serialNumber}
            isWarning={warning && (equipment.serialNumber == null || equipment.serialNumber === "")}
            slotRight={copyButton("Serial number", equipment.serialNumber)}
            isLoading={isLoading}
          />
          <ValueDisplay
            label="Model number"
            value={equipment.modelNumber}
            isWarning={warning && (equipment.modelNumber == null || equipment.modelNumber === "")}
            slotRight={copyButton("Model number", equipment.modelNumber)}
            isLoading={isLoading}
          />
          <ValueDisplay label="Category" value={equipment.category} isLoading={isLoading} />
          <ValueDisplay label="Type" value={equipment.type} isLoading={isLoading} />
          <ValueDisplay label="Ownership" value={equipment.ownership} isLoading={isLoading} />
          <ValueDisplay label="Area" value={equipment.physicalLocation} isLoading={isLoading} />
          <ValueDisplay
            label="Installation date"
            value={equipment.installationDate == null ? undefined : formatLongDate(equipment.installationDate)}
            slotRight={copyButton("Installation date", equipment.installationDate == null ? undefined : formatLongDate(equipment.installationDate))}
            isLoading={isLoading}
          />
          <ValueDisplay
            label="Warranty"
            value={coverageValue?.label}
            valueColor={coverageValue?.color}
            slotLeft={coverageValue == null ? undefined : <Icon icon={coverageValue.icon} pack="solid" size={14} />}
            isLoading={isLoading}
          />
        </ValueDisplayGroup>
      }
    />
  );
}
