import { ProductItem } from "../../../data/db";

export interface ProductSelectListProps {
  /** Controls the open/close animation and mounting, like SelectList. */
  open: boolean;
  /** Any dismissal: the close button, the scrim, Escape, the swipe — and a pick. */
  onClose: () => void;
  /**
   * The pricebook's products. The list keeps only the CONFIRMED, active ones
   * and sorts them by name — pass the whole table.
   */
  products: ProductItem[];
  /** A row was picked. The list closes by itself right after. */
  onSelect: (product: ProductItem) => void;
  /** The product already picked, shown with the single-select check. */
  selectedId?: string;
  /**
   * The footer's "Add product" — opens the "New product" form. Leave it out
   * for a user without the pricebook permission: the footer is then not shown
   * at all ("Only shown if a user has required permissions").
   */
  onAddProduct?: () => void;
  /** Presentation: "auto" (default) picks the dialog ≥ 1024px, else the drawer. */
  breakpoint?: "auto" | "desktop" | "mobile";
}
