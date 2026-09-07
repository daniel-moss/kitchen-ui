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
}

export interface ScheduleDetailsModuleProps {
  value: ScheduleSelection;
  onChange: (next: ScheduleSelection) => void;
  /** Flipped by a blocked "Create" — the missing values show their errors. */
  showErrors: boolean;
  mobile: boolean;
}
