import { ReactNode } from "react";

export interface SubPage {
  id: string;
  label: string;
}

export interface NavTopBarTitleProps {
  /** The title — body-500-compact strong, truncates with an ellipsis. */
  title: string;
  /**
   * Left slot: an `Icon` (14px, solid, gray-12) or ANY avatar — the size
   * must be md (28px). An icon sits 8px from the title, an avatar 10px.
   */
  slotLeft?: ReactNode;
  /** Right slot: the dropdown (`angles-up-down`) icon, 8px from the title. */
  dropdown?: boolean;
  /**
   * The sibling lists of the same navigation item stack. When set, the
   * dropdown icon shows automatically and CLICKING THE TITLE opens a
   * SelectList with them (a regular select list on mobile too — the doc).
   */
  subPages?: SubPage[];
  /** Selected subpage id. Controlled or uncontrolled. */
  subPage?: string;
  defaultSubPage?: string;
  onSubPageChange?: (id: string) => void;
  className?: string;
}
