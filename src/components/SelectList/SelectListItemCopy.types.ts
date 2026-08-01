import { HTMLAttributes, ReactNode } from "react";

interface SelectListItemCopyBaseProps extends HTMLAttributes<HTMLDivElement> {
  /** The option label (truncates with an ellipsis). */
  label?: ReactNode;
  className?: string;
}

/**
 * A copy row has a caption below OR a tag to the right — never both.
 */
export type SelectListItemCopyProps = SelectListItemCopyBaseProps &
  (
    | { caption?: ReactNode; tag?: never }
    | { tag?: ReactNode; caption?: never }
  );
