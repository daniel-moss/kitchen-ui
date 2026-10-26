export interface EquipmentModuleProps {
  /** The picked equipment ids (db rows or ones created in the flow). */
  value: string[];
  onChange: (ids: string[]) => void;
  /**
   * "Make equipment required" — whether the "Equipment" step of the
   * "Complete job" form is required. Unchecked by default.
   */
  isEquipmentRequired: boolean;
  onEquipmentRequiredChange: (required: boolean) => void;
  /** The picked location's db id — its equipment pool feeds the list. */
  locationId?: string;
  /** The location's display name — the NewEquipmentForm's header caption. */
  locationLabel?: string;
  /** Mobile presentation (drawer lists). */
  mobile: boolean;
}
