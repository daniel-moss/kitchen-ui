import { ReactNode } from "react";

import { ListItemTextLeftProps } from "./ListItemTextLeft.types";

/**
 * The combined text region of a ListItem: the left text block (its props are
 * flattened here — it is the primary text and truncates first) plus an
 * optional right block, 16px apart.
 */
export interface ListItemTextProps extends ListItemTextLeftProps {
  /** Right block — a ListItemTextRight. Hugs its content, never truncates. */
  right?: ReactNode;
}
