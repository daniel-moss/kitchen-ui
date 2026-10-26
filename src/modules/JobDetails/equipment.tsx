import { equipmentOf, jobById } from "../../data/db";
import { Equipment, toEquipment } from "../shared/equipmentRow";
import { JOB_ID } from "./jobData";

// The job's equipment data. HOW a piece is written (rows, select lists,
// toasts, activity logs) lives in ../shared/equipmentRow since 2026-10-26 —
// the New Job form writes it the same way — and is re-exported here so the
// Job Details files keep their imports.
export {
  EquipmentAvatar,
  equipmentCaption,
  equipmentCaptionText,
  equipmentIncomplete,
  equipmentLabel,
  equipmentSentenceName,
  equipmentTitle,
} from "../shared/equipmentRow";
export type { Equipment } from "../shared/equipmentRow";

// The location's equipment pool — the shared demo database's rows, sorted by
// name A→Z per the design annotation. The Dough Mixer is the database's
// created-in-a-hurry piece, so the missing-details states stay demonstrable.
// The equipment STATE lives in useJobShell, so the Service call form's
// chips/picker read the live module equipment.
/**
 * The equipment at ONE location — equipment belongs to a place, so the pool a
 * job can pick from is its location's.
 */
export const equipmentPoolOf = (locationId: string): Equipment[] =>
  equipmentOf(locationId)
    .map(toEquipment)
    .sort((a, b) => a.name.localeCompare(b.name));

/** The demo job's location pool — kept so the forms' own demo data still works. */
export const EQUIPMENT_POOL: Equipment[] = equipmentPoolOf("wildwood-downtown");

/** The database job's own equipment — Walk-in Cooler + Reach-in Freezer. */
export const INITIAL_JOB_EQUIPMENT: string[] = jobById(JOB_ID)!.equipmentIds;
