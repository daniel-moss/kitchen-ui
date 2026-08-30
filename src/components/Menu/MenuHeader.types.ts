import { SearchFieldProps } from "../Fields/SearchField/SearchField.types";

/**
 * MenuHeader — the header of a Menu. For now it is exactly a SearchField bar,
 * so it takes the SearchField props except `type` (fixed to "bar" internally).
 * More header variants may be added later.
 */
export interface MenuHeaderProps extends Omit<SearchFieldProps, "type"> {
  /**
   * Take focus when the header mounts, so the menu opens ready to type.
   * Default TRUE — it is the component's own behaviour, not the consumer's.
   *
   * Two cases never auto-focus, whatever this is set to (the DS rule already
   * used by SelectList): a DRAWER, and any device without a real pointer.
   * Focusing an input on touch opens the on-screen keyboard immediately, which
   * covers the list you were about to read. Set this to false to opt out of the
   * remaining case.
   */
  autoFocusSearch?: boolean;
}
