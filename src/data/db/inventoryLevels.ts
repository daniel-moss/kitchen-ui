import { COMPANY, INVENTORY_LOCATIONS, PRODUCT_ITEMS } from "./db";

// HOW MUCH OF A PRODUCT EACH LOCATION HOLDS — production's `InventoryLevel`
// (one row per product × location, `quantity_on_hand`). Added 2026-11-03 for
// the job line item's stock warning ("Only X left in [location]…"), which
// compares a quantity with ONE location's on-hand count.
//
// The main warehouse holds the product's own `quantity` (the pricebook's
// single stock number, which is what the Products list shows); the trucks
// carry the few parts a technician keeps on board. Only tracked products have
// levels — an untracked one has no stock at all.

export interface InventoryLevel {
  productId: string;
  locationId: string;
  /** May be negative. */
  onHand: number;
  /** Production `quantity_on_order`; 0 when the seed leaves it out. */
  onOrder?: number;
  /** Production `quantity_desired` — the "Target". Greater than 0 when set. */
  target?: number;
  /** Production `quantity_low_alert_threshold` — "Alert at", only with a target. */
  alertAt?: number;
  /** Production `bin_location`; "" / unset = none. */
  binLocation?: string;
}

const WAREHOUSE_ID = "inv-warehouse";

/** Truck stock — the parts the technicians keep on board. */
const TRUCK_STOCK: InventoryLevel[] = [
  { productId: "prod-door-gasket-36", locationId: "inv-truck-mike", onHand: 2 },
  { productId: "prod-r404a", locationId: "inv-truck-mike", onHand: 2 },
  { productId: "prod-start-relay", locationId: "inv-truck-mike", onHand: 1 },
  { productId: "prod-contactor-30a", locationId: "inv-truck-ana", onHand: 3 },
  { productId: "prod-thermocouple", locationId: "inv-truck-ana", onHand: 4 },
  { productId: "prod-run-capacitor", locationId: "inv-truck-spare", onHand: 1 },
];

/**
 * The rest of each row — on order, target, alert, bin — for the product side
 * panel's "Inventory levels" tab (2026-11-18), plus a few rows that exist ONLY
 * for it. Keyed "product|location"; a key the rows above do not have adds a
 * row. Chosen so the demo products show every card state:
 *
 *   prod-r404a          Limited warehouse · Full truck · Depleted truck ·
 *                       stocked without a target (on order only) · Not stocked
 *   prod-start-relay    Low · no target
 *   prod-door-closer    Depleted with nothing anywhere else
 *   prod-combi-door-gasket   a NEGATIVE on hand
 *   prod-oven-door-spring / prod-dish-wash-pump   not stocked anywhere
 */
const LEVEL_DETAILS: Record<string, Omit<InventoryLevel, "productId" | "locationId" | "onHand"> & { onHand?: number }> = {
  "prod-r404a|inv-warehouse": { onOrder: 2, target: 4, alertAt: 1, binLocation: "Gas cage" },
  "prod-r404a|inv-truck-mike": { target: 2, binLocation: "Rear shelf" },
  "prod-r404a|inv-truck-ana": { onHand: 0, target: 2, alertAt: 1, binLocation: "Rear shelf" },
  "prod-r404a|inv-drop-oakland": { onHand: 0, onOrder: 1 },
  "prod-door-gasket-36|inv-warehouse": { target: 10, alertAt: 4, binLocation: "A-3" },
  "prod-door-gasket-36|inv-truck-mike": { target: 2, binLocation: "Door kit bin" },
  "prod-start-relay|inv-warehouse": { onOrder: 0, target: 6, alertAt: 2, binLocation: "C-7" },
  "prod-door-closer|inv-warehouse": { target: 3, alertAt: 1, binLocation: "A-5" },
  "prod-thermocouple|inv-warehouse": { target: 20, alertAt: 8, binLocation: "B-12" },
  "prod-thermocouple|inv-truck-ana": { target: 6, alertAt: 2 },
  "prod-contactor-30a|inv-warehouse": { target: 10, binLocation: "E-2" },
  "prod-contactor-30a|inv-truck-ana": { target: 4, alertAt: 1, binLocation: "Electrical drawer" },
  "prod-run-capacitor|inv-warehouse": { onOrder: 0, target: 8, alertAt: 3, binLocation: "E-4" },
  "prod-combi-door-gasket|inv-truck-mike": { onHand: -1, target: 1, binLocation: "Door kit bin" },
  "prod-ice-water-filter|inv-warehouse": { onOrder: 12, target: 30, alertAt: 10, binLocation: "D-1" },
};

const BASE_LEVELS: InventoryLevel[] = [
  ...PRODUCT_ITEMS.filter((product) => product.trackInventory).map((product) => ({
    productId: product.id,
    locationId: WAREHOUSE_ID,
    onHand: product.quantity ?? 0,
  })),
  ...TRUCK_STOCK,
];

const keyOf = (productId: string, locationId: string) => `${productId}|${locationId}`;

export const INVENTORY_LEVELS: InventoryLevel[] = [
  ...BASE_LEVELS.map((level) => ({ ...level, ...LEVEL_DETAILS[keyOf(level.productId, level.locationId)] })),
  ...Object.entries(LEVEL_DETAILS)
    .filter(([key]) => !BASE_LEVELS.some((level) => keyOf(level.productId, level.locationId) === key))
    .map(([key, details]) => {
      const [productId, locationId] = key.split("|");
      return { productId, locationId, onHand: 0, ...details };
    }),
];

/** Every row of one product — the side panel's "Inventory levels" tab. */
export const inventoryLevelsOf = (productId: string) => INVENTORY_LEVELS.filter((level) => level.productId === productId);

/** On hand of a product at a location — 0 where the location holds none. */
export const onHandAt = (productId: string, locationId: string) =>
  INVENTORY_LEVELS.find((level) => level.productId === productId && level.locationId === locationId)?.onHand ?? 0;

/**
 * The company's inventory locations, active and inactive — the LIVE list the
 * Demo settings page edits (`COMPANY.inventoryLocations`). Read it when it is
 * used, never into a module constant.
 */
export const inventoryLocations = () => COMPANY.inventoryLocations;

/**
 * One location by id. Falls back to the seed so a line that points at a
 * location the settings no longer list still shows its name.
 */
export const inventoryLocationOf = (id: string | null | undefined) =>
  id == null
    ? undefined
    : (COMPANY.inventoryLocations.find((row) => row.id === id) ?? INVENTORY_LOCATIONS.find((row) => row.id === id));

/** The locations a product line can be taken from: every active one. */
export const activeInventoryLocations = () =>
  inventoryLocations()
    .filter((location) => location.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));
