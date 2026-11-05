import { LaborItem } from "../../data/db";

export interface LaborRateSelectListProps {
  /** Controls the open/close animation and mounting, like SelectList. */
  open: boolean;
  /** Any dismissal: the close button, the scrim, Escape, the swipe — and a pick. */
  onClose: () => void;
  /**
   * The pricebook's labor rates. The list keeps only the CONFIRMED, active
   * ones and sorts them by name — pass the whole table.
   */
  rates: LaborItem[];
  /** A row was picked. The list closes by itself right after. */
  onSelect: (rate: LaborItem) => void;
  /** The rate already picked, shown with the single-select check. */
  selectedId?: string;
  /**
   * The footer's "Add labor rate" — opens the "New labor rate" form. Leave it
   * out for a user without the pricebook permission: the footer is then not
   * shown at all ("Only shown if a user has required permissions").
   */
  onAddLaborRate?: () => void;
  /** False drops the taxability caption — the company does not use taxes. Default true. */
  useTaxes?: boolean;
  /** Presentation: "auto" (default) picks the dialog ≥ 1024px, else the drawer. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
