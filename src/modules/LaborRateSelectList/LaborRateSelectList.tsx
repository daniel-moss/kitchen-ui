import AvatarLaborRate from "../../components/Avatar/AvatarLaborRate";
import EmptyState from "../../components/EmptyState/EmptyState";
import MenuItem from "../../components/Menu/MenuItem";
import SelectList from "../../components/SelectList/SelectList";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { LaborItem } from "../../data/db";
import { formatAmount, taxabilityOf } from "../LaborRatePanel/laborRateData";
import { slot } from "../shared/helpers";

import { LaborRateSelectListProps } from "./LaborRateSelectList.types";

// The "Labor rates" SelectList (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "Labor Rate" → SelectList 3114-4910) — THE list a labor rate is picked from,
// wherever one is added (a job's charges, an estimate, an invoice).
//
//   Dialog on desktop / drawer on mobile, titled "Labor rates", with a search
//   ("Labor rate..."). Single-select; CONFIRMED labor rates only, A → Z.
//   A row: AvatarLaborRate (no status) · name · taxability on the left, the
//   price on the right with "Cost: $…" under it — both with "/hr" on an
//   hourly rate (the "Hourly" Type row, 3125-6577).
//   Footer: "Add labor rate" — "Only shown if a user has required
//   permissions", and it opens the "New labor rate" form. It stays in every
//   state: no rates at all (caption "No labor rates", no search) and no
//   match (caption "No labor rates match").
//
// Picking a row hands the rate to the caller and closes the list. The caller
// decides what a pick does — it is a template, not a link to the record.

/** "Confirmed labor rates only. Sorted by name from A to Z." */
export const pickableLaborRates = (rates: LaborItem[]) =>
  rates.filter((rate) => rate.isActive && rate.status === "active").sort((a, b) => a.name.localeCompare(b.name));

export default function LaborRateSelectList({
  open,
  onClose,
  rates,
  onSelect,
  selectedId,
  onAddLaborRate,
  useTaxes = true,
  breakpoint = "auto",
}: LaborRateSelectListProps) {
  const options = pickableLaborRates(rates);
  const isEmpty = options.length === 0;

  // The form is a dialog of its own, so the list closes first.
  const footer =
    onAddLaborRate == null ? undefined : (
      <SelectListFooter variant="menuItem">
        <MenuItem
          label="Add labor rate"
          slotLeft={slot("plus")}
          onClick={() => {
            onClose();
            onAddLaborRate();
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
      title="Labor rates"
      // No rates at all: nothing to search (the node drops the header).
      searchable={!isEmpty}
      searchPlaceholder="Labor rate..."
      state={isEmpty ? "empty" : "default"}
      emptyState={{ caption: "No labor rates" }}
      noResultsState={<EmptyState caption="No labor rates match" />}
      footer={footer}
    >
      <SelectListItemGroup>
        {options.map((rate) => (
          <SelectListItem
            key={rate.id}
            variant="object"
            avatar={<AvatarLaborRate size="xl" />}
            label={rate.name}
            caption={useTaxes ? taxabilityOf(rate) : undefined}
            rightTitle={formatAmount(rate.rate, rate)}
            rightCaption={`Cost: ${formatAmount(rate.cost, rate)}`}
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

export type { LaborRateSelectListProps } from "./LaborRateSelectList.types";
