import { Page } from "./appShell";
import { TAX_RATE_NOUN } from "./listData";
import { PricebookListConfig, PricebookPage } from "./pricebookList";
import { TAX_RATE_FILTERS } from "./taxRateFilters";
import { TABLE_COLUMNS, sortTaxRates } from "./taxRatesTable";
import { TAX_RATE_ROWS, TaxRateRow, labelsOf, taxRateStatusLabel } from "./taxRatesData";

// The TAX RATES list — added 2026-09-16 against Daniel's "↳ Tax Rates" canvas
// (15059-64984). Production's tax type, the leanest of the five: no cost, no
// taxability, no subtype, and one amount held as a PERCENT.
//
// Its four workspace rates are the SAME records the Clients list reads for
// its "Default tax rate" filter — see taxRatesData.ts.
//
// Everything structural is the shared `PricebookPage` (pricebookList.tsx).

// The row's readable text — the name, the summary, the label names and (on
// active rates) the status label. The RATE is not in it: a person searching
// "8" means a name, and the Tax rate filter is the way to ask about numbers.
// FLAGGED like every list's field set.
const searchHaystack = (item: TaxRateRow) =>
  [
    item.name,
    item.summary,
    ...labelsOf(item).map((label) => label.name),
    item.isActive ? taxRateStatusLabel(item.status) : "",
  ]
    .join(" ")
    .toLowerCase();

const TAX_RATES_LIST: PricebookListConfig<TaxRateRow> = {
  page: "taxRates",
  title: "Tax rates",
  noun: TAX_RATE_NOUN,
  rows: TAX_RATE_ROWS,
  isActive: (item) => item.isActive,
  statusOf: (item) => item.status,
  rowKey: (item) => item.id,
  filters: TAX_RATE_FILTERS,
  columns: TABLE_COLUMNS,
  sortRows: sortTaxRates,
  // No subtype on this type, so the rate takes the second featured slot.
  attributes: { active: ["status", "rate", "labels"], inactive: ["rate", "labels"] },
  search: searchHaystack,
};

export interface TaxRatesPageProps {
  breakpoint?: "auto" | "desktop" | "mobile";
  onNavigate: (next: Page) => void;
}

const TaxRatesPage = ({ breakpoint = "auto", onNavigate }: TaxRatesPageProps) => (
  <PricebookPage config={TAX_RATES_LIST} breakpoint={breakpoint} onNavigate={onNavigate} />
);

export default TaxRatesPage;
