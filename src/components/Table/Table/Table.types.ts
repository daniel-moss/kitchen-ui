import { ReactNode } from "react";

export interface TableProps {
  /**
   * The header row — one `TableRow` with `variant="header"`. A table always has
   * exactly one, which is why it is a named prop and not part of `children`.
   */
  header: ReactNode;
  /** The body rows — `TableRow` with `variant="body"`. */
  children: ReactNode;
  className?: string;
}
