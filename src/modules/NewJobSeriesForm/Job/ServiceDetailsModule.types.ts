/** The Service-step details the module owns (the reason itself is lifted). */
export interface ServiceDetails {
  serviceId: string | null;
  /** Pre-filled from the service's default; null = the "No priority" option. */
  priority: 1 | 2 | 3 | 4 | null;
  /** True once the user changed the priority — hides the pre-fill help text. */
  priorityAdjusted: boolean;
  techInstructions: string;
}

export interface ServiceDetailsModuleProps {
  /**
   * The "Reason for call" text — lifted to the form because the action bar's
   * Save-as-draft gate reads it.
   */
  reason: string;
  onReasonChange: (reason: string) => void;
  value: ServiceDetails;
  onChange: (value: ServiceDetails) => void;
  /** The picked location's db id — feeds the Similar-jobs match. */
  locationId?: string;
  /** Show the missing-value errors. Default false — flipped by step validation. */
  showErrors?: boolean;
  /** Mobile presentation (drawer lists). */
  mobile: boolean;
}
