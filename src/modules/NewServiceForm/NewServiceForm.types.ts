import { Service } from "../../data/db/types";

export interface NewServiceFormProps {
  open: boolean;
  /** Called on any dismissal (Cancel / X / scrim) AND after Create. */
  onClose: () => void;
  /** Called after Create; the caller adds the service to the list and selects it. */
  onCreated?: (service: Service) => void;
  /** Presentation, like Dialog: "auto" (default) / "desktop" / "mobile". */
  breakpoint?: "auto" | "desktop" | "mobile";
}
