import { TaxRateItem } from "../../../data/db";

export interface TaxRateSelectListProps {
  /** Controls the open/close animation and mounting, like SelectList. */
  open: boolean;
  /** Any dismissal: the close button, the scrim, Escape, the swipe — and a pick. */
  onClose: () => void;
  /**
   * The pricebook's tax rates. The list keeps only the CONFIRMED, active ones
   * and sorts them by name — pass the whole table.
   */
  rates: TaxRateItem[];
  /** A row was picked. The list closes by itself right after. */
  onSelect: (rate: TaxRateItem) => void;
  /** The rate already picked, shown with the single-select check. */
  selectedId?: string;
  /**
   * The footer's "Add tax rate" — opens the "New tax rate" form. Leave it out
   * for a user who may not create tax rates: the footer is then not shown at
   * all ("Only shown if a user has permissions to create a tax rate").
   */
  onAddTaxRate?: () => void;
  /** Presentation: "auto" (default) picks the dialog ≥ 1024px, else the drawer. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
