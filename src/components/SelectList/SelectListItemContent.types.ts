import { HTMLAttributes, ReactNode } from "react";

interface SelectListItemContentBaseProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Left slot — an Icon (use `container="square"`) or an Avatar. Any avatar type
   * is allowed; the size must be xs (20px). Sits before the copy with an 8px gap.
   */
  slotLeft?: ReactNode;

  /** The option label (truncates). */
  label?: ReactNode;

  className?: string;
}

/** Caption below OR a tag to the right — never both. */
export type SelectListItemContentProps = SelectListItemContentBaseProps &
  (
    | { caption?: ReactNode; tag?: never }
    | { tag?: ReactNode; caption?: never }
  );
