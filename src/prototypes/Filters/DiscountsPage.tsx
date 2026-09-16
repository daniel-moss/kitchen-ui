import { Page } from "./appShell";
import { chargeFilters } from "./chargeFilters";
import { chargeColumns, sortCharges } from "./chargesTable";
import { ChargeRow, DISCOUNTS, chargeSearch } from "./chargesData";
import { DISCOUNT_NOUN } from "./listData";
import { PricebookListConfig, PricebookPage } from "./pricebookList";

// The DISCOUNTS list — added 2026-09-16 against Daniel's "↳ Discounts" canvas
// (15058-63980). Production's discount type ("DISC"), whose one rule is the
// SIGN: a discount's price is zero or negative, because it takes money off
// the invoice.
//
// Everything structural is the shared `PricebookPage`, and it shares its
// table and filter module with OTHER — one production shape. Where it
// DIFFERS, it differs the way production does: no Cost column, the amount
// column headed "Discount", and a five-row menu with its own Discount filter
// instead of the shared Price template.
//
// All three of the review's mismatches on this list are CLOSED (Daniel,
// 2026-09-16): he removed the Cost and Taxability rows — production offers a
// discount neither — and replaced "Price" with the list's own **Discount**
// filter over the negative ladder (section 15416-61777).

const DISCOUNTS_LIST: PricebookListConfig<ChargeRow> = {
  page: "discounts",
  title: "Discounts",
  noun: DISCOUNT_NOUN,
  rows: DISCOUNTS.rows,
  isActive: (item) => item.isActive,
  statusOf: (item) => item.status,
  rowKey: (item) => item.id,
  filters: chargeFilters(DISCOUNTS, "discount"),
  // NO Cost: production's discount form does not offer the field and its
  // table config has no such column.
  columns: chargeColumns(DISCOUNTS, { withCost: false, amountLabel: "Discount" }),
  sortRows: sortCharges(DISCOUNTS),
  attributes: { active: ["status", "subtype", "price"], inactive: ["subtype", "price"] },
  search: chargeSearch(DISCOUNTS),
};

export interface DiscountsPageProps {
  breakpoint?: "auto" | "desktop" | "mobile";
  onNavigate: (next: Page) => void;
}

const DiscountsPage = ({ breakpoint = "auto", onNavigate }: DiscountsPageProps) => (
  <PricebookPage config={DISCOUNTS_LIST} breakpoint={breakpoint} onNavigate={onNavigate} />
);

export default DiscountsPage;
