import Badge from "../../components/Badge/Badge";
import BadgePricebookStatus from "../../components/Badge/BadgePricebookStatus";
import { Icon } from "../../components/Icon/Icon";
import { CellBody } from "../../components/Table/CellBody/CellBody";
import { TableColumnDef } from "./listTable";
import { PRICEBOOK_STATUS_RANK, PricebookPhase, pricebookSorter } from "./pricebookList";
import { ProductRow, STOCK_LEVELS, STOCK_ORDER, labelsOf, levelsOf, subtypeNameOf } from "./productsData";
import { formatCurrency, formatDateTime } from "./listData";

// The PRODUCTS list's TABLE — the eleventh list's registry over the shared
// `listTable` (added 2026-09-16, the Labor pattern: ONE registry per phase).
// The Figma page's content area is a placeholder, so the columns are
// PRODUCTION's Parts & Materials view (PricebookTableView +
// defaultTableViewConfig's `pricebook_items_parts_&_materials_table__*`) with
// the standing rulings applied:
//
//   - the name column is PLAIN TEXT — no avatar (Daniel's Labor ruling,
//     2026-09-16: "Avatar is unnecessary") — and 288 wide, the width he
//     asked for there;
//   - production heads it "Short Description"; here "Short description",
//     the sentence-case rule;
//   - the STATUS column shows on every ACTIVE view and none of the Inactive
//     ones (his Labor ruling, which production does per TAB);
//   - empty Subtype / MFG / MFG part # / Stock / Levels cells use the DS "No
//     value" cell — an empty string child makes CellBody draw its own "—"
//     placeholder.
//
// TWO deliberate divergences from production's parts config, both FLAGGED:
//
//   1. COLUMN ORDER. Production's parts config runs description · subtype ·
//      status · labels · cost · price · MFG · MFG part # · stock · levels ·
//      last modified, where its SERVICES config puts status second and
//      labels late. Every list in this prototype — Jobs, Estimates,
//      Invoices, Bills, POs, Credit notes and Labor — puts Status right
//      after the name, so the two pricebook lists would read differently
//      side by side for no reason. The shared columns keep the LABOR order
//      here and the four part-only columns sit where production has them.
//      Say the word if production's own parts order should win.
//   2. NO SUMMARY column. Production's parts config leaves
//      `summary_template` out where its services config keeps it — a part is
//      identified by its manufacturer and part number, not by a sentence —
//      so this list has no Summary column. The FIELD is still there and the
//      keyword search still reads it, exactly as production's
//      `filter_keywords` does.

// ---- sorting ---------------------------------------------------------------

// The sortable columns are production's own (PricebookTableView's
// enableSorting + views.py's ordering whitelist): Labels does not sort there
// and does not sort here. The comparator, the Review-first status rank and
// the per-view defaults are the SHARED pricebook ones — only these readers
// differ.

// Fullest first, emptiest last — the shelf order the filter's rows use, so
// sorting Stock reads the way the column does. An UNTRACKED product has no
// stock at all and sorts with the other empty cells (last, either way).
const STOCK_RANK: Record<string, number> = Object.fromEntries(STOCK_ORDER.map((key, index) => [key, index]));

export const sortProducts = pricebookSorter<ProductRow>(
  {
    name: (item) => item.name,
    status: (item) => PRICEBOOK_STATUS_RANK[item.status],
    subtype: (item) => subtypeNameOf(item),
    price: (item) => item.price,
    cost: (item) => item.cost,
    manufacturer: (item) => (item.manufacturer === "" ? null : item.manufacturer),
    partNumber: (item) => (item.partNumber === "" ? null : item.partNumber),
    stock: (item) => (item.stock == null ? null : STOCK_RANK[item.stock]!),
    // The LEVELS column sorts by how full the shelf is against its target,
    // not by the raw count: "2/4" is a fuller shelf than "5/40". An untracked
    // row has no ratio and sorts with the empty cells.
    levels: (item) =>
      item.trackInventory && item.quantityDesired != null && item.quantityDesired > 0
        ? (item.quantity ?? 0) / item.quantityDesired
        : null,
    lastModified: (item) => item.lastModifiedAt,
  },
  (item) => item.name,
);

// ---- the column registry ---------------------------------------------------

// Widths: production's parts view, with the standing substitutions — the name
// 288 (Daniel's Labor width, and part names are longer still), Status 176
// (production's 128; "the width the other lists' Status already uses"), Last
// modified 192 (date + time), and STOCK 128 — the width Daniel's own CellBody
// examples are drawn at (15368-44651), over production's 112, which the
// widest cell ("Depleted" with its icon) would have crowded.
const COLUMNS = {
  name: 288,
  status: 176,
  subtype: 224,
  price: 144,
  cost: 144,
  manufacturer: 144,
  partNumber: 144,
  labels: 240,
  stock: 128,
  levels: 112,
  lastModified: 192,
};

type ProductColumnDef = TableColumnDef<ProductRow>;

const ALL_COLUMNS: ProductColumnDef[] = [
  // Production `description` — the item's name. PLAIN text, no avatar,
  // pinned (production's own).
  {
    key: "name", label: "Short description", width: COLUMNS.name, dataType: "alphabetical", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.name} {...pin}>
        {item.name}
      </CellBody>
    ),
  },
  // ACTIVE phase only (see the module note): the two-state review model's
  // badge — the amber Review dot is the point of the "All" view's default
  // sort.
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
        {subtypeNameOf(item) ?? ""}
      </CellBody>
    ),
  },
  // Production `cost` before `default_price` — the parts config's order, and
  // the Labor list's. Both RIGHT-aligned, cells and header, the money-column
  // rule. A part has no per-unit suffix (that is Labor's "/hr").
  {
    key: "cost", label: "Cost", width: COLUMNS.cost, dataType: "numerical", sortable: true, align: "right",
    cell: (item, pin) => (
      <CellBody width={COLUMNS.cost} content="number" {...pin}>
        {formatCurrency(item.cost)}
      </CellBody>
    ),
  },
  // Production `default_price` — headed "Price" on this list where the Labor
  // list heads the same field "Rate".
  {
    key: "price", label: "Price", width: COLUMNS.price, dataType: "numerical", sortable: true, align: "right",
    cell: (item, pin) => (
      <CellBody width={COLUMNS.price} content="number" {...pin}>
        {formatCurrency(item.price)}
      </CellBody>
    ),
  },
  // Production `manufacturer` and `part_number` — the pair that identifies a
  // physical part. Blank is a real state on both (production stores ""), and
  // draws the "No value" cell.
  {
    key: "manufacturer", label: "MFG", width: COLUMNS.manufacturer, dataType: "other", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.manufacturer} {...pin}>
        {item.manufacturer}
      </CellBody>
    ),
  },
  {
    key: "partNumber", label: "MFG part #", width: COLUMNS.partNumber, dataType: "other", sortable: true,
    // NOT tabular (the tabular-numerals rule): a part number is mixed text,
    // not a number column, and it is left-aligned like production's.
    cell: (item, pin) => (
      <CellBody width={COLUMNS.partNumber} {...pin}>
        {item.partNumber}
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
  // Production `lowest_inventory_status` — the worst level across the
  // locations holding the part. Daniel's CellBody examples (15368-44651) are
  // what this draws: the level's icon in the level's colour scheme, and for
  // an UNTRACKED product the "No value" cell — NOT production's "Untracked"
  // word (his 2026-09-16 ruling).
  {
    key: "stock", label: "Stock", width: COLUMNS.stock, dataType: "other", sortable: true,
    cell: (item, pin) => {
      const level = item.stock == null ? null : STOCK_LEVELS[item.stock];
      return (
        <CellBody
          width={COLUMNS.stock}
          colorScheme={level?.scheme}
          slotLeft={level == null ? undefined : <Icon icon={level.icon} pack="solid" size={14} container="square" />}
          {...pin}
        >
          {level?.label ?? ""}
        </CellBody>
      );
    },
  },
  // Production's `inventory_level` — on hand over target, drawn as one
  // string. Untracked → the "No value" cell, production's own null.
  {
    key: "levels", label: "Levels", width: COLUMNS.levels, dataType: "numerical", sortable: true,
    cell: (item, pin) => (
      <CellBody width={COLUMNS.levels} {...pin}>
        {levelsOf(item)}
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

/** The phase's own column set — the Status column exists on the Active
 *  phase alone (Daniel's Labor ruling; see the module note). */
export const TABLE_COLUMNS: Record<PricebookPhase, ProductColumnDef[]> = {
  active: ALL_COLUMNS,
  inactive: ALL_COLUMNS.filter((def) => def.key !== "status"),
};
