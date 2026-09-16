import Badge from "../../components/Badge/Badge";
import BadgePricebookStatus from "../../components/Badge/BadgePricebookStatus";
import { CellBody } from "../../components/Table/CellBody/CellBody";

import { formatPercent } from "./filterDefs";
import { formatDateTime } from "./listData";
import { TableColumnDef } from "./listTable";
import { PRICEBOOK_STATUS_RANK, PricebookPhase, pricebookSorter } from "./pricebookList";
import { TaxRateRow, labelsOf } from "./taxRatesData";

// The TAX RATES list's TABLE. The Figma canvas draws a placeholder content
// area, so the columns are PRODUCTION's own
// (`pricebook_items_tax_rates_table__*`) with the standing rulings applied —
// and production's tax config is the shortest of the five: NO subtype column
// (its form does not offer one for this type) and NO cost column.
//
// Its one amount is `default_price` held as a PERCENT: production heads the
// column "Tax Rate" and renders it through `NumericalDataCell
// type="percentage"`, which prints "8.63%".
//
// TWO deliberate divergences, both FLAGGED:
//
//   1. COLUMN ORDER — Status second, this prototype's order. Production's own
//      tax config puts Labels before the rate; the five pricebook lists here
//      share one shape instead.
//   2. The Tax rate column is 144, production's 128. Every other numeric
//      column in this prototype is 144, and the header carries a sort
//      affordance — the Est. duration precedent, where 112 clipped.

export const sortTaxRates = pricebookSorter<TaxRateRow>(
  {
    name: (item) => item.name,
    status: (item) => PRICEBOOK_STATUS_RANK[item.status],
    // A 0% rate is a real value, not an empty cell — the comparator's
    // empty-last rule keys on null and "", so zero sorts as the number it is.
    rate: (item) => item.rate,
    lastModified: (item) => item.lastModifiedAt,
  },
  (item) => item.name,
);

const COLUMNS = {
  name: 288,
  status: 176,
  summary: 288,
  rate: 144,
  labels: 240,
  lastModified: 192,
};

type TaxRateColumnDef = TableColumnDef<TaxRateRow>;

const ALL_COLUMNS: TaxRateColumnDef[] = [
  {
    key: "name", label: "Short description", width: COLUMNS.name, dataType: "alphabetical", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.name} {...pin}>
        {item.name}
      </CellBody>
    ),
  },
  // ACTIVE phase only (see the module note).
  {
    key: "status", label: "Status", width: COLUMNS.status, dataType: "other", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.status} content="badge" {...pin}>
        <BadgePricebookStatus status={item.status} />
      </CellBody>
    ),
  },
  {
    key: "summary", label: "Summary", width: COLUMNS.summary, dataType: "alphabetical", sortable: false,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.summary} {...pin}>
        {item.summary}
      </CellBody>
    ),
  },
  // Production `default_price` as a PERCENT, headed "Tax Rate" there and
  // "Tax rate" here (the sentence-case rule). RIGHT-aligned, cells and
  // header, like every numeric column. `formatPercent` is the chip's own
  // formatter, so a rate reads the same in both places.
  {
    key: "rate", label: "Tax rate", width: COLUMNS.rate, dataType: "numerical", sortable: true, align: "right",
    cell: (item, pin) => (
      <CellBody width={COLUMNS.rate} content="number" {...pin}>
        {formatPercent(item.rate)}
      </CellBody>
    ),
  },
  {
    key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.labels} content="badge" {...pin}>
        {labelsOf(item).map((label) => (
          <Badge key={label.id}>{label.name}</Badge>
        ))}
      </CellBody>
    ),
  },
  {
    key: "lastModified", label: "Last modified", width: COLUMNS.lastModified, dataType: "timing", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.lastModified} {...pin}>
        {formatDateTime(item.lastModifiedAt)}
      </CellBody>
    ),
  },
];

export const TABLE_COLUMNS: Record<PricebookPhase, TaxRateColumnDef[]> = {
  active: ALL_COLUMNS,
  inactive: ALL_COLUMNS.filter((def) => def.key !== "status"),
};
