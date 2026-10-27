import { AvatarSize } from "../../components/Avatar/Avatar.types";
import AvatarEquipment from "../../components/Avatar/AvatarEquipment";
import { AvatarEquipmentStatus } from "../../components/Avatar/AvatarEquipment.types";
import AvatarWarning from "../../components/Avatar/AvatarWarning";
import TruncatingText from "../../components/Tooltip/TruncatingText";
import { warrantyCoverageOf } from "../../data/db";
import { Equipment as EquipmentRecord } from "../../data/db/types";
import { TEXT_SEPARATOR } from "../../utils/textSeparator";

import styles from "./equipmentRow.module.scss";

// How a piece of equipment is WRITTEN everywhere — module rows, select lists,
// toasts, activity logs — in the New Job form and on Job Details alike (moved
// here from JobDetails/equipment.tsx on 2026-10-26, when the two forms started
// sharing one EquipmentPicker; JobDetails re-exports it all).
//
// Joined by the shared TEXT_SEPARATOR. A missing part is NEVER dropped (DS
// "ListItem Template / Equipment", node 27171-15212): it reads "No <Field>" in
// the placeholder color, and the row's avatar switches to the warning state.
// `equipmentLabel` / `equipmentCaption` are the PLAIN-TEXT forms (search text,
// toasts, tooltips); `equipmentTitle` / `equipmentCaptionText` are the rendered
// ones, with the colored placeholders.

/** One piece as the rows read it. An empty string = the value is missing. */
export interface Equipment {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serial: string;
  // Set on equipment CREATED in a flow (the New-equipment form).
  category?: string;
  type?: string;
  ownership?: string;
  area?: string;
  installDate?: string;
  notes?: string;
  labels?: string[];
}

/** A database equipment row → the shape the rows read. */
export const toEquipment = (piece: EquipmentRecord): Equipment => ({
  id: piece.id,
  name: piece.displayName,
  manufacturer: piece.manufacturer ?? "",
  model: piece.modelNumber ?? "",
  serial: piece.serialNumber ?? "",
});

export const equipmentLabel = (e: Equipment) => `${e.name}${TEXT_SEPARATOR}${e.manufacturer !== "" ? e.manufacturer : "No Manufacturer"}`;
// SERIAL FIRST, then model (the doc page).
export const equipmentCaption = (e: Equipment) =>
  `${e.serial !== "" ? `Serial: ${e.serial}` : "No Serial number"}${TEXT_SEPARATOR}${e.model !== "" ? `Model: ${e.model}` : "No Model number"}`;

/**
 * How a piece is named in a SENTENCE — the activity logs join several with
 * commas, so the manufacturer goes in parentheses instead of the rows'
 * "Name  ·  Manufacturer" (Figma 24450-60498). Created equipment may have no
 * manufacturer — then the name stands alone.
 */
export const equipmentSentenceName = (e: Equipment) => (e.manufacturer !== "" ? `${e.name} (${e.manufacturer})` : e.name);

/** Any of manufacturer / model number / serial number missing (node 27171-48494). */
export const equipmentIncomplete = (e: Equipment) => e.manufacturer === "" || e.model === "" || e.serial === "";

/** Everything a list search should match. */
export const equipmentSearchText = (e: Equipment) => [e.name, e.manufacturer, e.model, e.serial].filter(Boolean).join(" ");

const Missing = ({ children }: { children: string }) => <span className={styles.missingValue}>{children}</span>;

export const equipmentTitle = (e: Equipment) => (
  <TruncatingText tooltipText={equipmentLabel(e)}>
    {`${e.name}${TEXT_SEPARATOR}`}
    {e.manufacturer !== "" ? e.manufacturer : <Missing>No Manufacturer</Missing>}
  </TruncatingText>
);

export const equipmentCaptionText = (e: Equipment) => (
  <TruncatingText tooltipText={equipmentCaption(e)}>
    {e.serial !== "" ? `Serial: ${e.serial}` : <Missing>No Serial number</Missing>}
    {TEXT_SEPARATOR}
    {e.model !== "" ? `Model: ${e.model}` : <Missing>No Model number</Missing>}
  </TruncatingText>
);

/** The piece's warranty coverage → the AvatarEquipment corner status. No warranties = no status. */
export const equipmentAvatarStatus = (e: Equipment): AvatarEquipmentStatus => {
  const coverage = warrantyCoverageOf(e.id);
  return coverage === "partial" ? "partiallyCovered" : coverage;
};

/**
 * The row avatar: the equipment avatar carrying the warranty status (Figma
 * 17189-78592 / 21760-11304, 2026-10-27), or the DS `AvatarWarning` while any
 * of the three properties is missing. A named DS component must BE that
 * component — never a hand-built warning look (Daniel, 2026-10-06).
 */
export const EquipmentAvatar = ({ equipment, size = "xl" }: { equipment: Equipment; size?: AvatarSize }) =>
  equipmentIncomplete(equipment) ? <AvatarWarning size={size} /> : <AvatarEquipment size={size} status={equipmentAvatarStatus(equipment)} />;
