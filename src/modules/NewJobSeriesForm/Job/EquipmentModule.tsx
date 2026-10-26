import FormModule from "../../../components/FormModule/FormModule";
import { EQUIPMENT_LABELS, equipmentOf } from "../../../data/db";
import { Equipment } from "../../../data/db/types";
import { NewEquipment } from "../../NewEquipmentForm/NewEquipmentForm.types";
import EquipmentPicker from "../../shared/EquipmentPicker";
import { toEquipment } from "../../shared/equipmentRow";

import { EquipmentModuleProps } from "./EquipmentModule.types";

// The "Equipment" module of the "New Job" form (Figma 17189-78592): the shared
// EquipmentPicker (the "Make equipment required" checkbox, the optional
// equipment field, the picked rows and the list — also the Job Details
// Equipment edit Dialog's content) inside the form's module frame. This file
// only owns the data: the picked LOCATION's database equipment plus any piece
// created in this flow.

// Equipment created in the flow, per location — module scope.
const sessionEquipment: Equipment[] = [];

/** Resolve a picked equipment row (db or session) — e.g. for required forms. */
export const equipmentRowOf = (id: string): Equipment | undefined =>
  sessionEquipment.find((row) => row.id === id);

export default function EquipmentModule({
  value,
  onChange,
  isEquipmentRequired,
  onEquipmentRequiredChange,
  locationId,
  locationLabel,
  mobile,
}: EquipmentModuleProps) {
  const pool = [
    ...(locationId ? equipmentOf(locationId) : []),
    ...sessionEquipment.filter((row) => row.locationId === (locationId ?? "created")),
  ].map(toEquipment);

  // A piece created in the flow joins the location's pool (the picker ticks it).
  const createEquipment = (created: NewEquipment) => {
    const row: Equipment = {
      id: `created-${Date.now()}`,
      locationId: locationId ?? "created",
      displayName: created.name,
      category: created.category as Equipment["category"],
      manufacturer: created.manufacturer || undefined,
      modelNumber: created.model || undefined,
      serialNumber: created.serial || undefined,
      type: created.type || undefined,
      physicalLocation: created.area || undefined,
      installationDate: created.installDate?.toISOString().slice(0, 10),
      ownership: (created.ownership || "Unknown") as Equipment["ownership"],
      // The form hands back label NAMES; only the ones that exist in the db's
      // EQUIPMENT_LABELS become ids (a label invented in the form is not a row).
      labelIds: EQUIPMENT_LABELS.filter((label) => created.labels.includes(label.name)).map((label) => label.id),
    };
    sessionEquipment.push(row);
    return toEquipment(row);
  };

  return (
    <FormModule title="Equipment">
      <EquipmentPicker
        value={value}
        onChange={onChange}
        isEquipmentRequired={isEquipmentRequired}
        onEquipmentRequiredChange={onEquipmentRequiredChange}
        options={pool}
        onCreate={createEquipment}
        locationLabel={locationLabel ?? ""}
        mobile={mobile}
      />
    </FormModule>
  );
}
