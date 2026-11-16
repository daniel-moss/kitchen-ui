import { DISCOUNT_ITEMS, jobById, LABOR_ITEMS, OTHER_ITEMS, PRODUCT_ITEMS } from "../../data/db";
import type { Charge } from "../../data/db";
import type { ChargesTestSetup } from "../../modules/JobDetails/Charges/ChargesSegment";

// THE "LINE ITEMS" USER TEST'S JOB (Daniel, 2026-11-16): a COMPLETED walk-in
// cooler repair that already carries its charges —
//
//   1 labor rate · 2 products (both tracked in inventory) · 2 other charges ·
//   1 discount — and ONE line someone else is editing.
//
// The job is a real db job, so the page around the Charges segment (top bar,
// details sidebar, status) is the db's. Only its LINES are set here, built from
// real pricebook items, so they read like the ones the forms would make.

export const TEST_JOB_ID = "JOB-1079";

const job = jobById(TEST_JOB_ID)!;
const find = <T extends { id: string }>(rows: T[], id: string): T => {
  const row = rows.find((item) => item.id === id);
  if (row == null) throw new Error(`Line-items test: no pricebook item "${id}"`);
  return row;
};

const money = (n: number) => `$${n.toFixed(2)}`;
const EQUIPMENT = job.equipmentIds?.[0];
const [TECH_A, TECH_B] = job.assigneeIds ?? [];

// ---- labor ----------------------------------------------------------------
const standard = find(LABOR_ITEMS, "standard-labor");
const HOURS = 2.5;
const labor: Charge = {
  id: "l1",
  title: standard.name,
  caption: standard.description,
  total: money(standard.rate * HOURS),
  unit: `${money(standard.rate)} × ${HOURS} hr`,
  laborRateId: standard.id,
  labor: {
    type: "hourly",
    subtypeId: standard.subtypeId ?? null,
    cost: standard.cost,
    price: standard.rate,
    hours: HOURS,
    serviceStart: job.scheduledFor ?? null,
    serviceEnd: job.scheduledFor ?? null,
    equipmentId: EQUIPMENT,
    technicianId: TECH_A,
    description: standard.description || "Walk-in cooler repair, as logged on the timesheet.",
  },
};

// ---- products (both tracked in inventory) ------------------------------------
const productLine = (id: string, productId: string, inventoryLocationId: string, technicianId?: number): Charge => {
  const item = find(PRODUCT_ITEMS, productId);
  return {
    id,
    title: item.name,
    caption: item.summary,
    total: money(item.price),
    unit: `${money(item.price)} × 1`,
    productId: item.id,
    qty: 1,
    product: {
      manufacturer: item.manufacturer,
      partNumber: item.partNumber,
      subtypeId: item.subtypeId,
      inventoryLocationId,
      cost: item.cost,
      price: item.price,
      quantity: 1,
      equipmentId: EQUIPMENT,
      technicianId,
      description: item.summary,
    },
  };
};
const products = [
  productLine("p1", "prod-evap-fan-motor", "inv-warehouse", TECH_A),
  // The line another user is editing (see EDITING_LOCKS).
  productLine("p2", "prod-door-gasket-36", "inv-truck-mike", TECH_B),
];

// ---- other charges -----------------------------------------------------------
const otherLine = (id: string, chargeId: string): Charge => {
  const item = find(OTHER_ITEMS, chargeId);
  return {
    id,
    title: item.name,
    caption: item.summary,
    total: money(item.price),
    unit: `${money(item.price)} × 1`,
    otherChargeId: item.id,
    other: { subtypeId: item.subtypeId, cost: item.cost, price: item.price, quantity: 1, description: item.summary },
  };
};
const other = [otherLine("o1", "other-trip-charge"), otherLine("o2", "other-refrigerant-reclaim")];

// ---- discount ----------------------------------------------------------------
const contract = find(DISCOUNT_ITEMS, "disc-contract-labor");
const amount = Math.abs(contract.price);
const discounts: Charge[] = [
  {
    id: "d1",
    title: contract.name,
    caption: contract.summary,
    total: `−${money(amount)}`,
    unit: `−${money(amount)} × 1`,
    discountId: contract.id,
    discount: { subtypeId: contract.subtypeId, discount: amount, quantity: 1, description: contract.summary },
  },
];

/**
 * The door gasket is being edited by the job's second technician — never the
 * viewer (Lorne Riddle, user 1).
 */
const EDITING_LOCKS: Record<string, number> = { p2: TECH_B };

export const LINE_ITEMS_TEST: ChargesTestSetup = {
  lines: { labor: [labor], products, other, discounts },
  editingLocks: EDITING_LOCKS,
};
