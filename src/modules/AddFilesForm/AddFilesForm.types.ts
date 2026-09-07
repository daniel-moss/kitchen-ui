import { ManagedFile } from "./files";

export interface AddFilesFormProps {
  open: boolean;
  /** Called on any dismissal (Cancel / X / scrim) AND after Upload. */
  onClose: () => void;
  /**
   * Called by Upload with the added files; the form also shows the "Files
   * uploaded" toast. The caller decides the follow-up.
   */
  onUploaded?: (files: ManagedFile[]) => void;
  /** Presentation, like Dialog: "auto" (default) / "desktop" / "mobile". */
  breakpoint?: "auto" | "desktop" | "mobile";
}
