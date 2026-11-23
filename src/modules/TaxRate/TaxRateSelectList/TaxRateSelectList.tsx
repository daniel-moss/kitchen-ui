import AvatarTaxRate from "../../../components/Avatar/AvatarTaxRate";
import EmptyState from "../../../components/EmptyState/EmptyState";
import MenuItem from "../../../components/Menu/MenuItem";
import SelectList from "../../../components/SelectList/SelectList";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { TaxRateItem } from "../../../data/db";
import { slot } from "../../shared/helpers";
import { formatPercent } from "../NewTaxRateForm/PercentageField";

import { TaxRateSelectListProps } from "./TaxRateSelectList.types";

// The "Tax rates" SelectList (Figma file XBFKW2ThcuVxPbQQHw1XY2, page
// "↳ Tax Rates" 12996-6395) — THE list a tax rate is picked from. The twin of
// the Labor rates, Products, Other charges and Discounts lists.
//
//   Dialog on desktop / drawer on mobile, titled "Tax rates", with a search
//   ("Tax rate..."). Single-select; CONFIRMED tax rates only, A → Z.
//   A row (SelectListItem 12996-6409): AvatarTaxRate (no status) · the rate's
//   name, and its percentage on the right — "8.63%".
//   Footer: "Add tax rate" — "Only shown if a user has permissions to create
//   a tax rate", and it opens the "New tax rate" form. It stays in every
//   state: no tax rates at all (caption "No tax rates", no search) and no
//   match (caption "No tax rates match").
//
// Picking a row hands the rate to the caller and closes the list. The caller
// decides what a pick does.

/** "Confirmed tax rates only. Sorted by name from A to Z." */
export const pickableTaxRates = (rates: TaxRateItem[]) =>
  rates.filter((rate) => rate.isActive && rate.status === "active").sort((a, b) => a.name.localeCompare(b.name));

export default function TaxRateSelectList({
  open,
  onClose,
  rates,
  onSelect,
  selectedId,
  onAddTaxRate,
  breakpoint = "auto",
}: TaxRateSelectListProps) {
  const options = pickableTaxRates(rates);
  const isEmpty = options.length === 0;

  // The form is a dialog of its own, so the list closes first.
  const footer =
    onAddTaxRate == null ? undefined : (
      <SelectListFooter variant="menuItem">
        <MenuItem
          label="Add tax rate"
          slotLeft={slot("plus")}
          onClick={() => {
            onClose();
            onAddTaxRate();
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
      title="Tax rates"
      // No tax rates at all: nothing to search (the node drops the header).
      searchable={!isEmpty}
      searchPlaceholder="Tax rate..."
      state={isEmpty ? "empty" : "default"}
      emptyState={{ caption: "No tax rates" }}
      noResultsState={<EmptyState caption="No tax rates match" />}
      footer={footer}
    >
      <SelectListItemGroup>
        {options.map((rate) => (
          <SelectListItem
            key={rate.id}
            variant="object"
            avatar={<AvatarTaxRate size="xl" />}
            label={rate.name}
            rightTitle={formatPercent(rate.rate)}
            selected={rate.id === selectedId}
            onClick={() => {
              onSelect(rate);
              onClose();
            }}
          />
        ))}
      </SelectListItemGroup>
    </SelectList>
  );
}

export type { TaxRateSelectListProps } from "./TaxRateSelectList.types";
