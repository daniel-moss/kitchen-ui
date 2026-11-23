import { ReactNode } from "react";

/**
 * Which row this is. The two differ in height and in what they may contain:
 * a header row holds CellHeader cells, a body row holds CellBody cells.
 */
export type TableRowVariant = "header" | "body";

export interface TableRowProps {
  /** Default "body". */
  variant?: TableRowVariant;
  /** The row's cells — CellHeader for a header row, CellBody for a body row. */
  children: ReactNode;
  /**
   * Whether this body row opens a record. Only a clickable row is interactive:
   * it gets hover, pressed and focus states and is keyboard-focusable. A static
   * row has none of that, so it never suggests an action it cannot perform.
   *
   * Ignored on a header row, which is never interactive.
   */
  isClickable?: boolean;
  /** Called when a clickable row is clicked or activated by keyboard. */
  onClick?: () => void;
  /**
   * Keeps a clickable row in its PRESSED look while what it opened stays open
   * — the pricebook lists' row while its side panel shows (Daniel,
   * 2026-11-23: "the row should stay pressed while the side panel is open").
   * The existing press fill, held. Default false.
   */
  isPressed?: boolean;
  className?: string;
}
