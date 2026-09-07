/** The job's picked service location — a db row or one created in the flow. */
export interface SelectedLocation {
  /** db Location id; absent for a location created inside the flow. */
  id?: string;
  name?: string;
  /** One-line US address ("418 Mission St, Suite 200, San Francisco, CA 94105"). */
  address: string;
  /** db Client id — drives the client-issues warning. */
  clientId?: string;
  clientName: string;
}

export interface LocationModuleProps {
  value: SelectedLocation | null;
  onChange: (value: SelectedLocation) => void;
  /**
   * Filled dependent values a location change would clear — the names the
   * "Change location?" Prompt lists ("Equipment", "Job reporter", …). Empty
   * (default) = the change applies without asking, per the design.
   */
  wouldClear?: string[];
  /** false → the "Choose Location" error under the field. Default true. */
  isValid?: boolean;
  /** Mobile presentation (drawer lists). */
  mobile: boolean;
}
