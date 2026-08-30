import { forwardRef } from "react";
import clsx from "clsx";

import SearchField from "../Fields/SearchField/SearchField";
import ChipGroup from "../Chip/ChipGroup";
import { Divider } from "../Divider/Divider";

import styles from "./SelectListHeader.module.scss";
import { SelectListHeaderProps } from "./SelectListHeader.types";

// SelectListHeader — the header of a select menu. Three variants, per Figma
// (node 29520-33028): the search bar alone (41px), the chip row alone (65px),
// and the chip row over the search bar (97px). All three close with the Divider
// that separates the header from the list — that line belongs to THIS
// component, not to the SearchField.
//
// The blocks render as SIBLINGS, with no wrapper of the component's own: the
// consumer's header slot is the column that stacks them. So `className` reaches
// the SearchField, as it always has.
const SelectListHeader = forwardRef<HTMLInputElement, SelectListHeaderProps>(function SelectListHeader(
  { search = true, chips, ...rest },
  ref,
) {
  return (
    <>
      {chips != null && (
        <div className={clsx(styles.chips, !search && styles.chipsOnly)}>
          <ChipGroup>{chips}</ChipGroup>
        </div>
      )}
      {search && <SearchField ref={ref} type="bar" {...rest} />}
      {/* `medium` (--gray-a4), not Divider's own `low` default — the node draws
          this line one step stronger. */}
      <Divider contrast="medium" />
    </>
  );
});

export default SelectListHeader;
