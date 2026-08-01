import { ReactNode } from "react";

import { ListItemTextProps } from "./ListItemText.types";

/**
 * The content region of a ListItem: an optional left slot before the text.
 * The text props (left block + `right` slot) are flattened here.
 */
export interface ListItemContentProps extends ListItemTextProps {
  /**
   * Left slot — an Avatar (any type; for now the slot supports avatars only).
   * The only strict parameter: the size must be xl (36px).
   */
  avatar?: ReactNode;
}
