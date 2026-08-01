/** The values the form produces on Create. Empty strings = not filled. */
export interface NewLocation {
  /** The location's own name (optional field). */
  name: string;
  street: string;
  suite: string;
  city: string;
  state: string;
  postal: string;
  labels: string[];
  notes: string;
}

export interface NewLocationFormProps {
  open: boolean;
  /** Called on any dismissal (Cancel / X / scrim) AND after Create. */
  onClose: () => void;
  /**
   * The client the location will belong to — the header caption (the flow
   * that opens the form always knows the client already).
   */
  client: string;
  /**
   * Called after Create with the new location's values. The CALLER decides
   * the follow-up (select it as the job's location, just close, …) — the form
   * itself only shows the "Location created" toast.
   */
  onCreated?: (location: NewLocation) => void;
  /** Presentation, like Dialog: "auto" (default) / "desktop" / "mobile". */
  breakpoint?: "auto" | "desktop" | "mobile";
}
