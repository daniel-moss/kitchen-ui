import AvatarDiscount from "../../../components/Avatar/AvatarDiscount";
import EmptyState from "../../../components/EmptyState/EmptyState";
import MenuItem from "../../../components/Menu/MenuItem";
import SelectList from "../../../components/SelectList/SelectList";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { ChargeItem } from "../../../data/db";
import { money } from "../../NewLaborRateForm/rateMath";
import { slot } from "../../shared/helpers";

import { DiscountSelectListProps } from "./DiscountSelectList.types";

// The "Discounts" SelectList (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "Discount" → SelectList 3149-7787) — THE list a discount is picked from,
// wherever one is added (a job's charges, an estimate, an invoice). The twin
// of the Labor rates, Products and Other charges lists.
//
//   Dialog on desktop / drawer on mobile, titled "Discounts", with a search
//   ("Discount..."). Single-select; CONFIRMED discounts only, A → Z.
//   A row: AvatarDiscount (no status) · the name alone, and the discount on
//   the right — no cost under it, a discount has none. Its amount is
//   negative, so it reads "−$25.00" (the true minus sign, from `money`).
//   Footer: "Add discount" — "Only shown if a user has required
//   permissions", and it opens the "New discount" form. It stays in every
//   state: no discounts at all (caption "No discounts", no search) and no
//   match (caption "No discounts match").
//
// Picking a row hands the discount to the caller and closes the list. The
// caller decides what a pick does.

/** "Confirmed discounts only. Sorted by name from A to Z." */
export const pickableDiscounts = (discounts: ChargeItem[]) =>
  discounts.filter((discount) => discount.isActive && discount.status === "active").sort((a, b) => a.name.localeCompare(b.name));

export default function DiscountSelectList({
  open,
  onClose,
  discounts,
  onSelect,
  selectedId,
  onAddDiscount,
  breakpoint = "auto",
}: DiscountSelectListProps) {
  const options = pickableDiscounts(discounts);
  const isEmpty = options.length === 0;

  // The form is a dialog of its own, so the list closes first.
  const footer =
    onAddDiscount == null ? undefined : (
      <SelectListFooter variant="menuItem">
        <MenuItem
          label="Add discount"
          slotLeft={slot("plus")}
          onClick={() => {
            onClose();
            onAddDiscount();
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
      title="Discounts"
      // No discounts at all: nothing to search (the node drops the header).
      searchable={!isEmpty}
      searchPlaceholder="Discount..."
      state={isEmpty ? "empty" : "default"}
      emptyState={{ caption: "No discounts" }}
      noResultsState={<EmptyState caption="No discounts match" />}
      footer={footer}
    >
      <SelectListItemGroup>
        {options.map((discount) => (
          <SelectListItem
            key={discount.id}
            variant="object"
            avatar={<AvatarDiscount size="xl" />}
            label={discount.name}
            // The discount alone — a discount has no cost (Daniel, 2026-11-03).
            rightTitle={money(discount.price)}
            selected={discount.id === selectedId}
            onClick={() => {
              onSelect(discount);
              onClose();
            }}
          />
        ))}
      </SelectListItemGroup>
    </SelectList>
  );
}

export type { DiscountSelectListProps } from "./DiscountSelectList.types";
