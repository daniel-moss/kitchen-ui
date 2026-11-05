import { ChargeItem } from "../../../data/db";

export interface OtherChargeSelectListProps {
  /** Controls the open/close animation and mounting, like SelectList. */
  open: boolean;
  /** Any dismissal: the close button, the scrim, Escape, the swipe — and a pick. */
  onClose: () => void;
  /**
   * The pricebook's other charges. The list keeps only the CONFIRMED, active
   * ones and sorts them by name — pass the whole table.
   */
  charges: ChargeItem[];
  /** A row was picked. The list closes by itself right after. */
  onSelect: (charge: ChargeItem) => void;
  /** The charge already picked, shown with the single-select check. */
  selectedId?: string;
  /**
   * The footer's "Add charge" — opens the "New charge" form. Leave it out for
   * a user without the pricebook permission: the footer is then not shown at
   * all ("Only shown if a user has required permissions").
   */
  onAddCharge?: () => void;
  /** Presentation: "auto" (default) picks the dialog ≥ 1024px, else the drawer. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
