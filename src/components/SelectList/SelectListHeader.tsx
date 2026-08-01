import { forwardRef } from "react";

import SearchField from "../Fields/SearchField/SearchField";

import { SelectListHeaderProps } from "./SelectListHeader.types";

// SelectListHeader — the header of a select menu. Currently a single variant:
// a SearchField in the "bar" type (36px filled row + bottom divider). No styles
// of its own. See Figma "SelectListHeader".
const SelectListHeader = forwardRef<HTMLInputElement, SelectListHeaderProps>(function SelectListHeader(props, ref) {
  return <SearchField ref={ref} type="bar" {...props} />;
});

export default SelectListHeader;
