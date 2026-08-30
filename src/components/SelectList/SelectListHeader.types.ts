import { ReactNode } from "react";

import { SearchFieldProps } from "../Fields/SearchField/SearchField.types";

/**
 * SelectListHeader — the header of a select menu: an optional chip row, an
 * optional search bar, and the Divider that closes the header. It takes the
 * SearchField props except `type` (fixed to "bar" internally); `className`
 * reaches the SearchField, not the header as a whole.
 */
export interface SelectListHeaderProps extends Omit<SearchFieldProps, "type"> {
  /**
   * Show the search bar. Default true. Set it to false for a chips-only
   * header. A header with neither the search nor `chips` draws only the
   * Divider — not a combination Figma has.
   */
  search?: boolean;
  /**
   * The chip row above the search. Pass the **Chips**; the header wraps them
   * in a <a href="/?path=/docs/components-chip-chipgroup--docs">ChipGroup</a>
   * itself. Omit it for the plain search header.
   */
  chips?: ReactNode;
}
