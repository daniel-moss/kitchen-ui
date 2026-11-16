import { createContext, ReactNode, useContext } from "react";

import { equipmentById, locationById } from "../../../data/db";
import type { Job } from "../../../data/db";
import { NewEquipment } from "../../NewEquipmentForm/NewEquipmentForm.types";
import { Equipment, toEquipment } from "../../shared/equipmentRow";

// The equipment a line item can be ATTRIBUTED to — the job's own equipment.
//
// Job Details keeps the job's equipment LIVE (the Service tab's Equipment
// module adds and removes pieces), so it hands that list to the Charges
// segment, together with a way to create a piece from the "Equipment
// attribution" list's "Add equipment" action (Figma 29380-43809, 2026-11-16).
// The line forms and the open rows read it from here instead of the database.
//
// Outside Job Details (a story of its own, the Hold-job flow) nothing provides
// it, so the job's equipment comes from the database and there is no "Add
// equipment".

export interface LineEquipment {
  /** The job's equipment. */
  equipment: Equipment[];
  /**
   * Creates a piece and ADDS IT TO THE JOB, returning it so the list can select
   * it. Unset → the list has no "Add equipment" action.
   */
  onCreate?: (values: NewEquipment) => Equipment;
  /** The job's location — the New-equipment form's header caption. */
  locationLabel: string;
}

const LineEquipmentContext = createContext<LineEquipment | null>(null);

export function LineEquipmentProvider({ value, children }: { value: LineEquipment; children: ReactNode }) {
  return <LineEquipmentContext.Provider value={value}>{children}</LineEquipmentContext.Provider>;
}

/** The job's equipment as the database has it — no create action. */
function databaseEquipment(job: Job): LineEquipment {
  return {
    equipment: (job.equipmentIds ?? [])
      .map((id) => equipmentById(id))
      .filter((row): row is NonNullable<typeof row> => row != null)
      .map(toEquipment),
    locationLabel: locationById(job.locationId)?.name ?? "",
  };
}

/** The equipment a line of `job` can be attributed to (A → Z), and how to add one. */
export function useLineEquipment(job: Job): LineEquipment {
  const provided = useContext(LineEquipmentContext);
  const value = provided ?? databaseEquipment(job);
  return { ...value, equipment: [...value.equipment].sort((a, b) => a.name.localeCompare(b.name)) };
}
