import { STATUS } from "../../components/Badge/BadgePricebookStatus";
import { PRODUCT_ITEMS, PRODUCT_LABELS, PRODUCT_SUBTYPES, PricebookStatus, ProductItem, StockStatus } from "../../data/db";

// The PRODUCTS list's data door — a READER over the shared demo database,
// like the other lists' (Daniel, 2026-09-11: "each row gets the data from the
// db"). The products table lives in src/data/db (`PRODUCT_ITEMS` — the
// tracked warehouse catalog, the untracked special-order shelf, the Review
// inbox and the inactive legacy rows); this module derives the display values
// and keeps the lookups.
//
// PRODUCTS ARE THE PRICEBOOK'S PART TYPE — production `PriceBookItem` with
// the "PART" item-code type, production's "Parts & Materials", which the
// design renames "Products". The rows hang off nothing: no client, no vendor,
// no location — the Labor list's arrangement, with its own reference tables
// (subtypes and labels, both scoped to this pricebook type in production).
//
// STATUS — the same two-state review model the Labor list reads, shared as
// `PricebookStatus` since this list arrived: "review" = confirmed false, an
// item the system minted (from a free-text line item, or from a part typed
// onto a purchase order); "active" = confirmed. Nothing is clock-derived, and
// the status is an ACTIVE-phase concept only.

/** The db row itself — the list renders it directly. */
export type ProductRow = ProductItem;

/**
 * Every product in the database, sorted name A-Z — the neutral base; each
 * view applies its own default on top (the All Active view leads with the
 * Review items, production's `confirmed,description`).
 */
export const PRODUCT_ROWS: ProductRow[] = [...PRODUCT_ITEMS].sort((a, b) => a.name.localeCompare(b.name));

// ---- derivations -----------------------------------------------------------

/** The status's own label, straight from BadgePricebookStatus — never a second copy. */
export const productStatusLabel = (status: PricebookStatus) => STATUS[status].label;

/**
 * How the Stock column and the Stock filter word and colour each level —
 * production's `InventoryStatus` labels with the icons and schemes Daniel's
 * CellBody examples draw (frame 15368-44651, read node by node): Full a jade
 * `circle-check`, Limited an amber `circle-half-stroke`, Low an orange
 * `circle-quarter-stroke`, Depleted a red `ban`. The four fill progressively
 * less of their circle as the shelf empties, and `ban` breaks the pattern on
 * purpose — nothing left is not "a smaller amount", it is a stop.
 *
 * The CELL takes its colour from the `scheme` (a CellBody colour scheme,
 * which paints the icon with the text); the filter's rows take the same icon
 * in the same colour, so a level cannot be drawn two ways.
 */
export const STOCK_LEVELS: Record<StockStatus, { label: string; icon: string; scheme: "success" | "warning" | "caution" | "error" }> = {
  full: { label: "Full", icon: "circle-check", scheme: "success" },
  limited: { label: "Limited", icon: "circle-half-stroke", scheme: "warning" },
  low: { label: "Low", icon: "circle-quarter-stroke", scheme: "caution" },
  depleted: { label: "Depleted", icon: "ban", scheme: "error" },
};

/** The four levels in shelf order — fullest first, the node's own row order. */
export const STOCK_ORDER: StockStatus[] = ["full", "limited", "low", "depleted"];

/**
 * "24/40" — the Levels cell (production's `total_quantity` /
 * `total_quantity_desired`). Empty on an untracked product, which has no
 * levels at all: the cell then draws the DS "No value" placeholder, the same
 * answer its Stock cell gives.
 */
export const levelsOf = (item: ProductRow): string =>
  item.trackInventory ? `${item.quantity ?? 0}/${item.quantityDesired ?? 0}` : "";

/** The Inventory filter's two option labels — production's "Part Type" pair,
 *  worded as Daniel settled them (2026-09-16): Tracked · Not tracked. */
export const INVENTORY_LABELS: Record<"tracked" | "notTracked", string> = {
  tracked: "Tracked",
  notTracked: "Not tracked",
};

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const SUBTYPE_BY_ID = byId(PRODUCT_SUBTYPES);
const LABEL_BY_ID = byId(PRODUCT_LABELS);

/** The subtype's name, or null — the cell shows the DS "No value" placeholder. */
export const subtypeNameOf = (item: ProductRow): string | null =>
  item.subtypeId == null ? null : (SUBTYPE_BY_ID.get(item.subtypeId)?.name ?? null);

export const labelsOf = (item: ProductRow) => item.labelIds.map((id) => LABEL_BY_ID.get(id)!);
