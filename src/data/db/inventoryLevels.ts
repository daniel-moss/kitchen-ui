import { INVENTORY_LOCATIONS, PRODUCT_ITEMS } from "./db";

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
  onHand: number;
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

export const INVENTORY_LEVELS: InventoryLevel[] = [
  ...PRODUCT_ITEMS.filter((product) => product.trackInventory).map((product) => ({
    productId: product.id,
    locationId: WAREHOUSE_ID,
    onHand: product.quantity ?? 0,
  })),
  ...TRUCK_STOCK,
];

/** On hand of a product at a location — 0 where the location holds none. */
export const onHandAt = (productId: string, locationId: string) =>
  INVENTORY_LEVELS.find((level) => level.productId === productId && level.locationId === locationId)?.onHand ?? 0;

/** The locations a product line can be taken from: every active one. */
export const activeInventoryLocations = () =>
  INVENTORY_LOCATIONS.filter((location) => location.isActive).sort((a, b) => a.name.localeCompare(b.name));
