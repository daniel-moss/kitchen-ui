import Avatar from "../../components/Avatar/Avatar";
import { AvatarSize } from "../../components/Avatar/Avatar.types";
import AvatarEquipment from "../../components/Avatar/AvatarEquipment";
import TruncatingText from "../../components/Tooltip/TruncatingText";

import styles from "./equipment.module.scss";

// The job's equipment data + the way a piece is written everywhere in the
// prototype (module rows, select lists, toasts, activity logs). Kept OUT of
// ServicePanel so the Equipment edit form can use it without an import cycle
// (ServicePanel imports the form).

// The location's equipment pool (Figma 21760-11304 demo values + realistic
// kitchen items; every list is sorted by equipment name A→Z per the design
// annotation). The job starts with two of them added — the equipment STATE
// lives in useJobShell, so the Service call form's chips/picker read the live
// module equipment.
export interface Equipment {
  id: number;
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
export const EQUIPMENT_POOL: Equipment[] = [
  { id: 1, name: "Air Handler", manufacturer: "American Range", model: "01234", serial: "56789" },
  { id: 2, name: "Griddle", manufacturer: "American Range", model: "GR-2436", serial: "AR55102" },
  { id: 3, name: "Ice Machine", manufacturer: "Hoshizaki", model: "KM-660", serial: "HK43307" },
  { id: 4, name: "Oven", manufacturer: "Bosch", model: "HBL8451", serial: "BS90781" },
  { id: 5, name: "Walk-in Cooler", manufacturer: "True Manufacturing", model: "T-23F-2", serial: "TM88213" },
];
export const INITIAL_JOB_EQUIPMENT = [1, 5]; // Air Handler + Walk-in Cooler

// The design's "・" separator (same char the recall rows use).
//
// A missing part is NEVER dropped (DS "ListItem Template / Equipment", node
// 27171-15212): it reads "No <Field>" in the placeholder color, and the row's
// avatar switches to the warning state. `equipmentLabel` / `equipmentCaption`
// are the PLAIN-TEXT forms (search text, toasts, tooltips); `equipmentTitle` /
// `equipmentCaptionText` are the rendered ones, with the colored placeholders.
// This is prototype-local for now (Daniel, 2026-08-03) — the DS ListItem
// templates are not built.
export const equipmentLabel = (e: Equipment) => `${e.name} ・ ${e.manufacturer !== "" ? e.manufacturer : "No Manufacturer"}`;
export const equipmentCaption = (e: Equipment) =>
  `${e.model !== "" ? `Model: ${e.model}` : "No Model number"} ・ ${e.serial !== "" ? `Serial: ${e.serial}` : "No Serial number"}`;

/**
 * How a piece is named in a SENTENCE — the activity logs join several with
 * commas, so the manufacturer goes in parentheses instead of the rows'
 * "Name ・ Manufacturer" (Figma 24450-60498). Created equipment may have no
 * manufacturer — then the name stands alone.
 */
export const equipmentSentenceName = (e: Equipment) => (e.manufacturer !== "" ? `${e.name} (${e.manufacturer})` : e.name);

/** Any of manufacturer / model number / serial number missing (node 27171-48494). */
export const equipmentIncomplete = (e: Equipment) => e.manufacturer === "" || e.model === "" || e.serial === "";

const Missing = ({ children }: { children: string }) => <span className={styles.missingValue}>{children}</span>;

export const equipmentTitle = (e: Equipment) => (
  <TruncatingText tooltipText={equipmentLabel(e)}>
    {`${e.name} ・ `}
    {e.manufacturer !== "" ? e.manufacturer : <Missing>No Manufacturer</Missing>}
  </TruncatingText>
);

export const equipmentCaptionText = (e: Equipment) => (
  <TruncatingText tooltipText={equipmentCaption(e)}>
    {e.model !== "" ? `Model: ${e.model}` : <Missing>No Model number</Missing>}
    {" ・ "}
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
