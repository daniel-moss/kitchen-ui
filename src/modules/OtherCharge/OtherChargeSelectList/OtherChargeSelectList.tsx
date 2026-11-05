import AvatarOther from "../../../components/Avatar/AvatarOther";
import EmptyState from "../../../components/EmptyState/EmptyState";
import MenuItem from "../../../components/Menu/MenuItem";
import SelectList from "../../../components/SelectList/SelectList";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { ChargeItem } from "../../../data/db";
import { money } from "../../NewLaborRateForm/rateMath";
import { slot } from "../../shared/helpers";

import { OtherChargeSelectListProps } from "./OtherChargeSelectList.types";

// The "Other charges" SelectList (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "Other Charge" → SelectList 3147-7140) — THE list an other charge is picked
// from, wherever one is added (a job's charges, an estimate, an invoice). The
// Labor rates and Products lists' twin.
//
//   Dialog on desktop / drawer on mobile, titled "Other charges", with a
//   search. Single-select; CONFIRMED other charges only, A → Z.
//   A row: AvatarOther (no status) · the name alone — an other charge has no
//   manufacturer or part # (the SelectListItem frame draws no caption) — and
//   the price on the right with "Cost: $…" under it.
//   Footer: "Add charge" — "Only shown if a user has required permissions",
//   and it opens the "New charge" form. It stays in every state: no charges
//   at all (caption "No charges", no search) and no match (caption "No
//   charges match").
//
// Picking a row hands the charge to the caller and closes the list. The
// caller decides what a pick does.

/** "Confirmed other charges only. Sorted by name from A to Z." */
export const pickableOtherCharges = (charges: ChargeItem[]) =>
  charges.filter((charge) => charge.isActive && charge.status === "active").sort((a, b) => a.name.localeCompare(b.name));

export default function OtherChargeSelectList({
  open,
  onClose,
  charges,
  onSelect,
  selectedId,
  onAddCharge,
  breakpoint = "auto",
}: OtherChargeSelectListProps) {
  const options = pickableOtherCharges(charges);
  const isEmpty = options.length === 0;

  // The form is a dialog of its own, so the list closes first.
  const footer =
    onAddCharge == null ? undefined : (
      <SelectListFooter variant="menuItem">
        <MenuItem
          label="Add charge"
          slotLeft={slot("plus")}
          onClick={() => {
            onClose();
            onAddCharge();
          }}
        />
      </SelectListFooter>
    );

  return (
    <SelectList
      variant="dialog"
      breakpoint={breakpoint}
      open={open}
      onClose={onClose}
      title="Other charges"
      // No charges at all: nothing to search (the node drops the header).
      searchable={!isEmpty}
      searchPlaceholder="Charge..."
      state={isEmpty ? "empty" : "default"}
      emptyState={{ caption: "No charges" }}
      noResultsState={<EmptyState caption="No charges match" />}
      footer={footer}
    >
      <SelectListItemGroup>
        {options.map((charge) => (
          <SelectListItem
            key={charge.id}
            variant="object"
            avatar={<AvatarOther size="xl" />}
            label={charge.name}
            rightTitle={money(charge.price)}
            rightCaption={`Cost: ${money(charge.cost)}`}
            selected={charge.id === selectedId}
            onClick={() => {
              onSelect(charge);
              onClose();
            }}
          />
        ))}
      </SelectListItemGroup>
    </SelectList>
  );
}

export type { OtherChargeSelectListProps } from "./OtherChargeSelectList.types";
