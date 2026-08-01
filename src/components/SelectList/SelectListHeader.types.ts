import { SearchFieldProps } from "../Fields/SearchField/SearchField.types";

/**
 * SelectListHeader — the header of a select menu. For now it is exactly a
 * SearchField bar, so it takes the SearchField props except `type` (fixed to
 * "bar" internally). More header variants may be added later.
 */
export type SelectListHeaderProps = Omit<SearchFieldProps, "type">;
