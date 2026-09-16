import Badge from "../../components/Badge/Badge";
import BadgePricebookStatus from "../../components/Badge/BadgePricebookStatus";
import { CellBody } from "../../components/Table/CellBody/CellBody";

import { ChargeList, ChargeRow } from "./chargesData";
import { formatCurrency, formatDateTime } from "./listData";
import { TableColumnDef } from "./listTable";
import { PRICEBOOK_STATUS_RANK, PricebookPhase, pricebookSorter } from "./pricebookList";

// The OTHER and DISCOUNTS lists' TABLE — one registry for both, because
// production gives the two types the same columns but one: an "other charge"
// has a Cost, a discount does not (its form does not offer the field and its
// table config has no such column).
//
// The Figma canvases draw a placeholder content area, so the columns are
// PRODUCTION's own (`pricebook_items_miscellaneous_table__*` and
// `pricebook_items_discounts_table__*`) with the standing rulings applied:
//
//   - the name column is PLAIN TEXT, no avatar, and 288 wide (Daniel's Labor
//     ruling, 2026-09-16);
//   - production heads it "Short Description"; here "Short description", the
//     sentence-case rule;
//   - the STATUS column shows on every ACTIVE view and none of the Inactive
//     ones (his Labor ruling, which production does per TAB);
//   - empty Subtype / Summary cells draw the DS "No value" cell.
//
// TWO deliberate divergences, both FLAGGED:
//
//   1. COLUMN ORDER — Status second, the order every list in this prototype
//      uses. Production's own two configs disagree with each other here
//      (misc puts Subtype before Status, discounts the other way round, and
//      both put Labels before the amounts), so there is no single production
//      order to follow.
//   2. (CLOSED 2026-09-16 — the discount amount column is headed
//      "Discount", production's own header. Daniel renamed the FILTER from
//      "Price" to "Discount" and made it the list's own object-specific
//      filter, so the column follows it and the design, the build and
//      production all agree now.)

export const sortCharges = (list: ChargeList) =>
  pricebookSorter<ChargeRow>(
    {
      name: (item) => item.name,
      status: (item) => PRICEBOOK_STATUS_RANK[item.status],
      subtype: (item) => list.subtypeNameOf(item),
      cost: (item) => item.cost,
      price: (item) => item.price,
      lastModified: (item) => item.lastModifiedAt,
    },
    (item) => item.name,
  );

// Widths: the Labor list's, which are production's own for these columns.
const COLUMNS = {
  name: 288,
  status: 176,
  subtype: 224,
  summary: 288,
  cost: 144,
  price: 144,
  labels: 240,
  lastModified: 192,
};

type ChargeColumnDef = TableColumnDef<ChargeRow>;

/**
 * One list's column registry, per phase. `withCost` is the one structural
 * difference between the two types; `list` supplies the subtype and label
 * lookups, which read different tables per type.
 */
export function chargeColumns(
  list: ChargeList,
  { withCost, amountLabel }: { withCost: boolean; amountLabel: string },
): Record<PricebookPhase, ChargeColumnDef[]> {
  const all: ChargeColumnDef[] = [
    // Production `description` — the item's name. Pinned (production's own).
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
    // Production `subtype`. Null → "" → the cell's own "—" placeholder.
    {
      key: "subtype", label: "Subtype", width: COLUMNS.subtype, dataType: "alphabetical", sortable: true,
      cell: (item, pin) => (
        <CellBody width={COLUMNS.subtype} {...pin}>
          {list.subtypeNameOf(item) ?? ""}
        </CellBody>
      ),
    },
    // Production `summary_template` — not sortable there either.
    {
      key: "summary", label: "Summary", width: COLUMNS.summary, dataType: "alphabetical", sortable: false,
      cell: (item, pin) => (
        <CellBody width={COLUMNS.summary} {...pin}>
          {item.summary}
        </CellBody>
      ),
    },
    // OTHER charges only — production's discounts config has no Cost column,
    // and its form does not offer the field.
    ...(withCost
      ? [
          {
            key: "cost", label: "Cost", width: COLUMNS.cost, dataType: "numerical" as const, sortable: true, align: "right" as const,
            cell: (item: ChargeRow, pin: Parameters<ChargeColumnDef["cell"]>[1]) => (
              <CellBody width={COLUMNS.cost} content="number" {...pin}>
                {formatCurrency(item.cost)}
              </CellBody>
            ),
          },
        ]
      : []),
    // Production `default_price` — currency on both types, and headed as
    // production heads it: "Price" on an other charge, "Discount" on a
    // discount, whose value is NEGATIVE so its cells read "-$25.00".
    {
      key: "price", label: amountLabel, width: COLUMNS.price, dataType: "numerical", sortable: true, align: "right",
      cell: (item, pin) => (
        <CellBody width={COLUMNS.price} content="number" {...pin}>
          {formatCurrency(item.price)}
        </CellBody>
      ),
    },
    {
      key: "labels", label: "Labels", width: COLUMNS.labels, dataType: "other", sortable: false,
      cell: (item, pin) => (
        <CellBody width={COLUMNS.labels} content="badge" {...pin}>
          {list.labelsOf(item).map((label) => (
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

  return { active: all, inactive: all.filter((def) => def.key !== "status") };
}
