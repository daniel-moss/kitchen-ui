import { Page } from "./appShell";
import { chargeFilters } from "./chargeFilters";
import { chargeColumns, sortCharges } from "./chargesTable";
import { ChargeRow, OTHER, chargeSearch } from "./chargesData";
import { OTHER_NOUN } from "./listData";
import { PricebookListConfig, PricebookPage } from "./pricebookList";

// The OTHER list — added 2026-09-16 against Daniel's "↳ Other" canvas
// (15059-64482). Production calls the type "Miscellaneous" in its nav and
// "Other Charge" / "Miscellaneous Charge" on the model and in its form; the
// design renames the list **Other**, which is what the sidebar, the title and
// the Create menu already said.
//
// The charges a service company bills that are neither labor nor a part:
// travel, permits, rentals, disposal, subcontractors.
//
// Everything structural is the shared `PricebookPage` (see pricebookList.tsx).
// Its table and filters are shared with DISCOUNTS — one production shape, one
// identical menu — so what is left here is the config.

const OTHER_LIST: PricebookListConfig<ChargeRow> = {
  page: "other",
  title: "Other",
  noun: OTHER_NOUN,
  rows: OTHER.rows,
  isActive: (item) => item.isActive,
  statusOf: (item) => item.status,
  rowKey: (item) => item.id,
  filters: chargeFilters(OTHER, "other"),
  // WITH Cost: production's misc form offers the field and its table lists it.
  columns: chargeColumns(OTHER, { withCost: true, amountLabel: "Price" }),
  sortRows: sortCharges(OTHER),
  attributes: { active: ["status", "subtype", "price"], inactive: ["subtype", "price"] },
  search: chargeSearch(OTHER),
};

export interface OtherPageProps {
  breakpoint?: "auto" | "desktop" | "mobile";
  onNavigate: (next: Page) => void;
}

const OtherPage = ({ breakpoint = "auto", onNavigate }: OtherPageProps) => (
  <PricebookPage config={OTHER_LIST} breakpoint={breakpoint} onNavigate={onNavigate} />
);

export default OtherPage;
