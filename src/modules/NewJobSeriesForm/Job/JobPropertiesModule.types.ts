export interface JobProperties {
  /** The custom Job ID (shown only when the company's mode is "manual"). */
  jobId: string;
  /** null with several branches until picked; auto-set with exactly one. */
  branchId: string | null;
  /** A db JobSource id, or a source created in the flow. Defaults to Direct. */
  sourceId: string;
  /** The "Source ID" input (shown only when the source requires one). */
  sourceRef: string;
  /** Auto-populated with the current day. */
  dateReceived: Date | null;
  /** Defaults to the current user. */
  receivedById: number | null;
}

export interface JobPropertiesModuleProps {
  value: JobProperties;
  onChange: (value: JobProperties) => void;
  /** Show the missing-value errors. Default false — flipped by step validation. */
  showErrors?: boolean;
  /** Mobile presentation (drawer lists, stacked date/received-by row). */
  mobile: boolean;
}
