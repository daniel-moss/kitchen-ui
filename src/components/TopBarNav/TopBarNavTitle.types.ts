import { ReactNode } from "react";

export interface TopBarNavTitleProps {
  /** The title — `heading-h3` (Semibold 16/24) `--text-strong`, truncates with an ellipsis. */
  title: string;
  /**
   * Left slot: an Avatar element, shown when the page is about one object. The
   * slot is `md` (28px) — any avatar type can be inserted — and sits
   * `--size-3` (12px) before the title.
   */
  slotLeft?: ReactNode;
  className?: string;
}
