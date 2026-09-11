import { SearchFieldProps } from "../Fields/SearchField/SearchField.types";

/**
 * MenuHeader — the header of a Menu. For now it is exactly a SearchField bar,
 * so it takes the SearchField props except `type` (fixed to "bar" internally).
 * More header variants may be added later.
 */
export interface MenuHeaderProps extends Omit<SearchFieldProps, "type"> {
  /**
   * When the header takes focus, so the menu opens ready to type.
   *
   * Left UNSET, the component's own default applies: it focuses on mount
   * EXCEPT in the two DS exclusions (the pair SelectList's search follows) —
   * a DRAWER, and any device without a real pointer, where focusing throws
   * the on-screen keyboard over the list you were about to read.
   *
   * `true` is the EXPLICIT opt-in that bypasses both exclusions — the same
   * meaning `autoFocusSearch` has on SelectList: the consumer states that
   * typing is the whole point of the menu. (Daniel, 2026-09-09: the mobile
   * Filters menu opens with its search focused.) `false` never focuses.
   */
  autoFocusSearch?: boolean;
}
