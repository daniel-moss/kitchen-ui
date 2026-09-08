// The Schedule step's "Details" module state.

export interface ScheduleSelection {
  /** "Schedule now" is the default; "later" leaves the job Unscheduled. */
  mode: "now" | "later";
  /** The visit date ("Schedule now" only). */
  date: Date | null;
  /** The visit time as the option label ("9:00 AM"); null = not chosen. */
  time: string | null;
  /** Total minutes; null = not set (the shared DurationField value). */
  durationMinutes: number | null;
  /**
   * The duration was pre-filled from the picked service's default and not
   * touched yet — the Duration Input shows its "Pre-filled…" help text while
   * true. Any user change clears it (Figma 17241-70803, "Adjusted Duration").
   */
  durationInherited: boolean;
}

export interface ScheduleDetailsModuleProps {
  value: ScheduleSelection;
  onChange: (next: ScheduleSelection) => void;
  /** Flipped by a blocked "Create" — the missing values show their errors. */
  showErrors: boolean;
  mobile: boolean;
}
