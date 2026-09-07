import Avatar from "../../components/Avatar/Avatar";
import { AvatarSize } from "../../components/Avatar/Avatar.types";
import AvatarEquipment from "../../components/Avatar/AvatarEquipment";
import TruncatingText from "../../components/Tooltip/TruncatingText";
import { TEXT_SEPARATOR } from "../../utils/textSeparator";

import { equipmentOf, jobById } from "../../data/db";
import { JOB_ID } from "./jobData";

import styles from "./equipment.module.scss";

// The job's equipment data + the way a piece is written everywhere in the
// prototype (module rows, select lists, toasts, activity logs). Kept OUT of
// ServicePanel so the Equipment edit form can use it without an import cycle
// (ServicePanel imports the form).

// The location's equipment pool — MIGRATED to the shared demo database on
// 2026-09-04: the pieces are Wildwood Downtown's database rows (browse them
// under Data → Database), sorted by name A→Z per the design annotation; ids
// are the DATABASE ids now (strings — they were 1…5). The Dough Mixer is the
// database's created-in-a-hurry piece, so the missing-details states stay
// demonstrable. The job starts with the database job's own equipment — the
// equipment STATE lives in useJobShell, so the Service call form's
// chips/picker read the live module equipment. FLAGGED: the Figma demo pieces
// (Air Handler, Bosch Oven…) no longer match.
export interface Equipment {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serial: string;
  // Set on equipment CREATED in the prototype (the New-equipment form). The
  // five demo pieces keep their details in CompleteJobForm's EQUIPMENT_DETAILS.
  category?: string;
  type?: string;
  ownership?: string;
  area?: string;
  installDate?: string;
  notes?: string;
  labels?: string[];
}
export const EQUIPMENT_POOL: Equipment[] = equipmentOf("wildwood-downtown")
  .map((piece) => ({
    id: piece.id,
    name: piece.displayName,
    manufacturer: piece.manufacturer ?? "",
    model: piece.modelNumber ?? "",
    serial: piece.serialNumber ?? "",
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
/** The database job's own equipment — Walk-in Cooler + Reach-in Freezer. */
export const INITIAL_JOB_EQUIPMENT: string[] = jobById(JOB_ID)!.equipmentIds;

// Joined by the shared TEXT_SEPARATOR (Daniel, 2026-09-04 — was the Figma
// nodes' "・", which Inter does not contain; the nodes still draw it. FLAGGED).
//
// A missing part is NEVER dropped (DS "ListItem Template / Equipment", node
// 27171-15212): it reads "No <Field>" in the placeholder color, and the row's
// avatar switches to the warning state. `equipmentLabel` / `equipmentCaption`
// are the PLAIN-TEXT forms (search text, toasts, tooltips); `equipmentTitle` /
// `equipmentCaptionText` are the rendered ones, with the colored placeholders.
// This is prototype-local for now (Daniel, 2026-08-03) — the DS ListItem
// templates are not built.
export const equipmentLabel = (e: Equipment) => `${e.name}${TEXT_SEPARATOR}${e.manufacturer !== "" ? e.manufacturer : "No Manufacturer"}`;
export const equipmentCaption = (e: Equipment) =>
  `${e.model !== "" ? `Model: ${e.model}` : "No Model number"}${TEXT_SEPARATOR}${e.serial !== "" ? `Serial: ${e.serial}` : "No Serial number"}`;

/**
 * How a piece is named in a SENTENCE — the activity logs join several with
 * commas, so the manufacturer goes in parentheses instead of the rows'
 * "Name  ·  Manufacturer" (Figma 24450-60498). Created equipment may have no
 * manufacturer — then the name stands alone.
 */
export const equipmentSentenceName = (e: Equipment) => (e.manufacturer !== "" ? `${e.name} (${e.manufacturer})` : e.name);

/** Any of manufacturer / model number / serial number missing (node 27171-48494). */
export const equipmentIncomplete = (e: Equipment) => e.manufacturer === "" || e.model === "" || e.serial === "";

const Missing = ({ children }: { children: string }) => <span className={styles.missingValue}>{children}</span>;

export const equipmentTitle = (e: Equipment) => (
  <TruncatingText tooltipText={equipmentLabel(e)}>
    {`${e.name}${TEXT_SEPARATOR}`}
    {e.manufacturer !== "" ? e.manufacturer : <Missing>No Manufacturer</Missing>}
  </TruncatingText>
);

export const equipmentCaptionText = (e: Equipment) => (
  <TruncatingText tooltipText={equipmentCaption(e)}>
    {e.model !== "" ? `Model: ${e.model}` : <Missing>No Model number</Missing>}
    {TEXT_SEPARATOR}
    {e.serial !== "" ? `Serial: ${e.serial}` : <Missing>No Serial number</Missing>}
  </TruncatingText>
);

/**
 * The row avatar: the equipment avatar, or the WARNING avatar while any of the
 * three properties is missing (the warranty status is then not shown). The
 * warning look is built from the DS Avatar — it is not an AvatarEquipment
 * status (Daniel, 2026-08-03: prototype-local for now).
 */
export const EquipmentAvatar = ({ equipment, size = "xl" }: { equipment: Equipment; size?: AvatarSize }) =>
  equipmentIncomplete(equipment) ? (
    <Avatar
      shape="square"
      content="icon"
      icon="triangle-exclamation"
      size={size}
      backgroundColor="var(--amber-a3)"
      iconColor="var(--amber-10)"
    />
  ) : (
    <AvatarEquipment size={size} />
  );
