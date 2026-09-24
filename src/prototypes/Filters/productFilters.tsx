import { Icon } from "../../components/Icon/Icon";
import { PRODUCT_LABELS, PRODUCT_SUBTYPES, PricebookStatus } from "../../data/db";

import { FilterDef } from "./filterDefs";
import { freeformFilter } from "./filterKinds";
import {
  costTemplate,
  labelsTemplate,
  lastModifiedTemplate,
  priceTemplate,
  pricebookStatusTemplate,
  subtypeTemplate,
  taxabilityTemplate,
} from "./filterTemplates";
import { INVENTORY_LABELS, ProductRow, STOCK_LEVELS, STOCK_ORDER } from "./productsData";
import { PricebookPhase } from "./pricebookList";

// The PRODUCTS list's filter registry — ONE entry per row of its Filters menu
// (node 15058-61588 on Daniel's "↳ Products" canvas 15058-61566, read
// 2026-09-16 after his icon round), in the menu's alphabetical order: Cost,
// Inventory, Labels, Last modified, MFG, MFG part #, Price, Status, Stock,
// Subtype, Taxability.
//
// FOUR are object-specific — the canvas's own "Object-Specific Filters"
// section: Inventory (15339:3869), MFG (15339:34571) and MFG part #
// (15339:34948) on the FREEFORM kind, and Stock (15348:38255).
//
// SEVEN are shared: Labels and Last modified (the long-standing templates),
// plus Cost, Status, Subtype and Taxability — the four the menu's own rows
// link to the LABOR canvas's sections, which is the design saying "the same
// filter" — and PRICE, whose section (15339:3946) is on THIS canvas but which
// the Other and Discounts menus both link to, so it was promoted with them
// later the same day.
//
// STATUS is ACTIVE-phase only (the menu row's own annotation: "Only shown on
// the 'Active' phase views") — an inactive product has no status to filter,
// the Labor arrangement. The templates that are NOT here — Client, Location,
// Location address, Service, the date trio, Seen, Total — have nothing to read: a
// pricebook item belongs to nothing and has no lifecycle dates beyond Last
// modified.
//
// NOT built, and nothing asks for it: a "Levels" filter. The column exists
// (production's `inventory_level`), but it is a compound of two numbers and
// the menu node draws no row for it — Stock is the question a person asks.

/**
 * The statuses each ACTIVE-phase view lists — and locks. They are the same
 * sets the view tabs group by — see `BRANCHES` in ProductsPage.tsx. The
 * Inactive phase has no statuses at all (one "All" view, nothing locked).
 */
export const PRODUCT_PHASE_STATUSES: Record<PricebookPhase, PricebookStatus[]> = {
  active: ["review", "active"],
  inactive: [],
};

// ---- Inventory (object-specific) ---------------------------------------------

/**
 * Inventory — production's `track_inventory` boolean, which its own form
 * calls "Part Type" (Inventory / Non-Inventory). SINGLE-select (the frame's
 * annotation: "Single-select. Only one selected option at a time"), the DS
 * SelectListHeader in its chips-only variant ("is" / "is not"), no search, no
 * counts, bare rows.
 *
 * The VALUES are "Tracked" / "Not tracked" (Daniel, 2026-09-16, over the
 * node's first wording): "Inventory is Inventory" said the same word twice,
 * and tracked / not tracked is what the flag actually decides — whether the
 * company counts this product in stock. Icon `shelves`, the node's own, and
 * Font Awesome's own alias for it is `inventory`.
 *
 * It is the question BEHIND the Stock filter: an untracked product has no
 * stock level at all, which is why Stock carries its own "Not tracked" row.
 */
function inventoryFilter(): FilterDef<ProductRow> {
  return {
    id: "inventory",
    noun: { one: "option", many: "options" },
    label: "Inventory",
    icon: "shelves",
    hideCounts: true,
    dsHeader: true,
    singleSelect: true,
    options: [
      { id: "tracked", label: INVENTORY_LABELS.tracked },
      { id: "notTracked", label: INVENTORY_LABELS.notTracked },
    ],
    matches: (item, { ids }) => ids.includes(item.trackInventory ? "tracked" : "notTracked"),
  };
}

// ---- Stock (object-specific) -------------------------------------------------

/**
 * The Radix scale behind each CellBody colour scheme. A LIST row paints its
 * own icon — it has no cell to inherit a colour from — and the node draws
 * those icons on the **a9** step (jade-a9 / amber-a9 / orange-a9 /
 * tomato-a9, read off 15348:38267) where the CELL uses the semantic
 * `--text-*` tokens on a11. One map, so a level's colour is written once;
 * the pairing is the DS's own, the Labor Status rows' arrangement.
 */
const SCHEME_SCALE: Record<(typeof STOCK_LEVELS)[keyof typeof STOCK_LEVELS]["scheme"], string> = {
  success: "jade",
  warning: "amber",
  caution: "orange",
  error: "tomato",
};

/**
 * Stock — production's `lowest_inventory_status`, the worst level across the
 * locations holding the part. A MULTI-select (section 15348:38255 links the
 * Multi-Select documentation): "is" / "is not" chips, no search, no counts.
 *
 * FIVE rows, the node's order: "Not tracked" leads — the ABSENCE row, the
 * products with no stock level at all (production's untracked parts, whose
 * Stock cell is the "No value" dash) — then the four levels fullest-first
 * with their own icons and colours, read from `STOCK_LEVELS` so the rows and
 * the column can never disagree.
 *
 * The absence row carries NO ICON (Daniel, 2026-09-16 — he took the `minus`
 * off both the desktop and the mobile node, the same day he took the icon
 * off the Estimates list's "Not required"): an absence row names a missing
 * value, not a value, so it has nothing to draw.
 *
 * The menu row's icon is `boxes-stacked` (his pick the same day): the goods
 * on the shelf, next to Inventory's `shelves` for the shelf itself.
 */
function stockFilter(): FilterDef<ProductRow> {
  return {
    id: "stock",
    noun: { one: "level", many: "levels" },
    label: "Stock",
    icon: "boxes-stacked",
    hideCounts: true,
    dsHeader: true,
    options: [
      { id: "notTracked", label: INVENTORY_LABELS.notTracked },
      ...STOCK_ORDER.map((key) => ({
        id: key,
        label: STOCK_LEVELS[key].label,
        slotLeft: (
          <Icon
            icon={STOCK_LEVELS[key].icon}
            pack="solid"
            size={14}
            container="square"
            style={{ color: `var(--${SCHEME_SCALE[STOCK_LEVELS[key].scheme]}-a9)` }}
          />
        ),
      })),
    ],
    matches: (item, { ids }) =>
      (ids.includes("notTracked") && !item.trackInventory) || (item.stock != null && ids.includes(item.stock)),
  };
}

// ---- MFG + MFG part # (object-specific, the FREEFORM kind) -------------------

/**
 * What the two manufacturer filters share — everything but the id, the
 * label, the icon and the reader. Both are FREEFORM filters (the kind's
 * section 14100-36446; their own sections 15339:34571 and 15339:34948 draw
 * the generic one-field dialog): "contains" / "does not contain" over a
 * SINGLE unlabelled input — the dialog's title already names the field, and
 * both nodes draw their Input with no header — matched case-insensitively,
 * which is what their Input annotations say ("Not case-sensitive") and what
 * the kind does anyway.
 *
 * No option list: a workspace's manufacturers and part numbers are free
 * text, so the menu row opens the dialog straight away (the Address
 * arrangement, and why neither row draws a chevron in the menu).
 *
 * The chip prints the typed text alone — one field, so the default
 * filled-fields summary is already exactly that.
 */
const manufacturerFreeform = (key: string, read: (item: ProductRow) => string) => ({
  kind: "freeform" as const,
  noun: { one: "value", many: "values" },
  options: [],
  ...freeformFilter<ProductRow>([{ key, read }]),
});

/**
 * MFG — production `manufacturer`, the brand that made the part. Icon
 * `industry-windows` (Daniel's pick, 2026-09-16): the factory, and the
 * windowed variant keeps the plain `industry` glyph free for the Clients
 * list's own Industry filter.
 */
function manufacturerFilter(): FilterDef<ProductRow> {
  return {
    id: "manufacturer",
    label: "MFG",
    icon: "industry-windows",
    ...manufacturerFreeform("manufacturer", (item) => item.manufacturer),
  };
}

/**
 * MFG part # — production `part_number`, the MANUFACTURER's number for the
 * part (not the company's own). Icon `hashtag` (Daniel's pick, 2026-09-16) —
 * it mirrors the "#" in the label.
 */
function partNumberFilter(): FilterDef<ProductRow> {
  return {
    id: "partNumber",
    label: "MFG part #",
    icon: "hashtag",
    ...manufacturerFreeform("partNumber", (item) => item.partNumber),
  };
}

// ---- the registry ----------------------------------------------------------

/**
 * ONE registry per BRANCH, the other pages' rule: Status exists on the Active
 * phase alone (its menu-row annotation), and everything else is the same
 * object on both. The menu lists them alphabetically, the order its own node
 * draws (15058:61588): Cost, Inventory, Labels, Last modified, MFG, MFG part
 * #, Price, Status (Active only — it keeps its alphabetical slot between
 * Price and Stock), Stock, Subtype, Taxability.
 */
const buildProductFilters = (phase: PricebookPhase): FilterDef<ProductRow>[] => [
  costTemplate((item) => item.cost),

  inventoryFilter(),

  // Products carry their OWN label table (production `PriceBookItemLabel`
  // scoped to the part type — see PRODUCT_LABELS in the db).
  labelsTemplate(PRODUCT_LABELS, (item) => item.labelIds),

  lastModifiedTemplate((item) => item.lastModifiedAt),

  manufacturerFilter(),

  partNumberFilter(),

  priceTemplate((item) => item.price),

  // Only where a product HAS a status — see the module note.
  ...(phase === "active"
    ? [pricebookStatusTemplate<ProductRow>(PRODUCT_PHASE_STATUSES.active, (item) => item.status)]
    : []),

  stockFilter(),

  // The PRODUCT subtypes, production's per-type scoping.
  subtypeTemplate(PRODUCT_SUBTYPES, (item) => item.subtypeId),

  taxabilityTemplate((item) => item.taxable),
];

export const PRODUCT_FILTERS: Record<PricebookPhase, FilterDef<ProductRow>[]> = {
  active: buildProductFilters("active"),
  inactive: buildProductFilters("inactive"),
};
