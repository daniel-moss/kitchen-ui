export interface SelectedContact {
  /** db contact id; absent for an ephemeral contact (e.g. from a recall). */
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  /** Portrait path (db contacts); ephemeral contacts show initials. */
  avatar?: string;
  isPrimary?: boolean;
}

export interface JobContactsSelection {
  reporter: SelectedContact | null;
  siteSupervisor: SelectedContact | null;
}

export interface JobContactsModuleProps {
  value: JobContactsSelection;
  onChange: (value: JobContactsSelection) => void;
  /** The picked location's db id — its and its client's contacts feed the lists. */
  locationId?: string;
  /** The service client's db id. */
  clientId?: string;
  /**
   * The billing client (only when "Bill to different client") — its contacts
   * form the third group of the JOB REPORTER list only.
   */
  billingClientId?: string | null;
  /** Mobile presentation (drawer lists). */
  mobile: boolean;
}
