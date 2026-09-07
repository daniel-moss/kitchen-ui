import { Job } from "../../../data/db/types";

export type JobType = "new" | "recall";

export interface JobTypeSelection {
  /** null until the user picks (no default in the design). */
  type: JobType | null;
  /** The recalled job — only meaningful for type "recall". */
  recallJobId: string | null;
}

export interface TypeModuleProps {
  value: JobTypeSelection;
  onChange: (value: JobTypeSelection) => void;
  /**
   * Picking a recall job ADDS its equipment to the job's picks — it never
   * clears what is already selected (the dev notes).
   */
  onAddEquipment: (equipmentIds: string[]) => void;
  /**
   * Picking a recall job pre-fills the Job contacts — EMPTY fields only,
   * never overwriting silently (the dev notes).
   */
  onPrefillContacts?: (job: Job) => void;
  /** The picked location's db id — recall candidates live there. */
  locationId?: string;
  /** The picked service's name — one half of the possible-recalls match. */
  serviceName?: string;
  /** The current equipment picks — the other half of the match. */
  equipmentIds: string[];
  /** Mobile presentation (drawer list; Set-as-recall becomes an IconButton). */
  mobile: boolean;
}
