import { ReactNode } from "react";

export interface SubPage {
  id: string;
  label: string;
}

export interface TopBarNavTitleProps {
  /** The title — `heading-h3` (Semibold 16/24) `--text-strong`, truncates with an ellipsis. */
  title: string;
  /**
   * Left slot: an Avatar element. The slot is fixed at 36px (`xl`) — any
   * avatar type can be inserted. Sits `--size-2_5` (10px) before the title.
   */
  slotLeft?: ReactNode;
  /** Right slot: the dropdown (`angles-up-down`) icon, `--size-2` (8px) from the title. */
  dropdown?: boolean;
  /**
   * The sibling pages of the same navigation stack. When set, the dropdown
   * icon shows automatically and CLICKING THE TITLE opens a SelectList with
   * them (inline on mobile too — the doc's Sub-pages rule).
   */
  subPages?: SubPage[];
  /** Selected subpage id. Controlled or uncontrolled. */
  subPage?: string;
  defaultSubPage?: string;
  onSubPageChange?: (id: string) => void;
  className?: string;
}
