import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { chargesOf, INVOICES, inventoryLevelsOf, jobById as seedJobById, LABOR_LABELS, PRODUCT_LABELS, StockStatus, TAX_RATE_LABELS } from "../../data/db";
import type { InventoryLevel } from "../../data/db";
import type { Charge } from "../../data/db";
import { users } from "../../data/users";
import { Job, JOBS as SEED_JOBS } from "../jobsData";
import { LABOR_ROWS as SEED_LABOR_RATES, LaborRow } from "../laborData";
import { PRODUCT_ROWS as SEED_PRODUCTS, ProductRow } from "../productsData";
import type { ModuleFile } from "../../modules/FilesModule/FilesModule.types";
import { NewProduct, NewProductVendorCost } from "../../modules/Product/NewProductForm/NewProductForm.types";
import { NewOtherCharge } from "../../modules/OtherCharge/NewOtherChargeForm/NewOtherChargeForm.types";
import { NewDiscount } from "../../modules/Discount/NewDiscountForm/NewDiscountForm.types";
import { ChargeRow, DISCOUNTS, OTHER } from "../chargesData";
import { vendorCostRowsOf } from "../../modules/Product/SidePanel/vendorCostRules";
import { HistorySources } from "../../modules/shared/pricebookHistory";
import { stockLevel } from "../../modules/Product/NewProductForm/productRules";
import { TAX_RATE_ROWS as SEED_TAX_RATES, TaxRateRow } from "../taxRatesData";

// THE APP'S WRITABLE LAYER — what a demo changes, and what every screen reads.
//
// It is ADDITIVE to `src/data/db`, never a replacement: the database stays the
// frozen set of `export const` arrays it has always been (the Filters
// prototype imports it in 31 places and is under live user testing — see
// MODULES.md). This store seeds itself FROM those arrays and keeps the edits
// on top as patches.
//
// IN MEMORY, not localStorage — deliberately (Daniel, 2026-09-26). Every demo
// starts from the same clean database, so nobody inherits the previous
// session's mess. A reload is the reset button.
//
// Patches, not copies: only the fields a demo can actually change are stored,
// so seeding stays cheap and the untouched 78 jobs keep their identity (which
// matters — the list table is memoised on its rows).

/** The fields a demo can change on a job. Grows as modules are wired up. */
export type JobPatch = Partial<
  Pick<Job, "scheduledFor" | "durationMinutes" | "assigneeIds" | "status" | "priority" | "lastModifiedAt">
>;

/**
 * The fields the "Tax rate" side panel can change: the two General-details
 * fields, the accounting agency, the three text/label modules, and the two
 * status flags its actions flip (Confirm → `status`, Deactivate / Reactivate →
 * `isActive`).
 */
export type TaxRatePatch = Partial<
  Pick<
    TaxRateRow,
    "name" | "rate" | "quickbooksVendorId" | "labelIds" | "summary" | "notes" | "status" | "isActive" | "lastModifiedAt"
  >
>;

/** What the "New tax rate" form collects, before the store gives it an id. */
export interface NewTaxRateInput {
  name: string;
  rate: number;
  quickbooksVendorId?: string;
  /** Label NAMES, as the picker hands them back. */
  labels: string[];
  summary: string;
  notes: string;
}

/**
 * The fields the "Labor rate" side panel can change: the General pair, the
 * whole Pricing module, the accounting account, the three text/label modules,
 * and the two status flags its actions flip.
 */
export type LaborRatePatch = Partial<
  Pick<
    LaborRow,
    | "name"
    | "subtypeId"
    | "unitType"
    | "cost"
    | "rate"
    | "taxable"
    | "priceStrategy"
    | "priceAdjustmentAmount"
    | "priceAdjustmentPercent"
    | "quickbooksAccountId"
    | "labelIds"
    | "description"
    | "notes"
    | "status"
    | "isActive"
    | "lastModifiedAt"
  >
>;

/**
 * The fields the "Other charge" side panel can change (2026-11-23): the
 * General and Pricing modules, accounting, labels, the two texts and the
 * status flags.
 */
export type OtherChargePatch = Partial<
  Pick<
    ChargeRow,
    | "name"
    | "subtypeId"
    | "cost"
    | "priceStrategy"
    | "price"
    | "fixedMarkup"
    | "percentMarkup"
    | "taxable"
    | "labelIds"
    | "summary"
    | "notes"
    | "status"
    | "isActive"
    | "quickbooksAccountId"
  >
>;

/** The fields the "Discount" side panel can change (2026-11-23). */
export type DiscountPatch = Partial<
  Pick<ChargeRow, "name" | "subtypeId" | "price" | "labelIds" | "summary" | "notes" | "status" | "isActive" | "quickbooksAccountId">
>;

/**
 * The fields the "Product" side panel can change (its Details tab, 2026-11-17):
 * the General and Pricing modules, labels, the two texts and the status flags.
 */
export type ProductPatch = Partial<
  Pick<
    ProductRow,
    | "name"
    | "subtypeId"
    | "manufacturer"
    | "partNumber"
    | "barcode"
    | "trackInventory"
    | "costStrategy"
    | "cost"
    | "priceStrategy"
    | "price"
    | "fixedMarkup"
    | "percentMarkup"
    | "taxable"
    | "labelIds"
    | "summary"
    | "notes"
    | "status"
    | "isActive"
    | "lastModifiedAt"
    | "stock"
    | "quantity"
    | "quantityDesired"
    | "manualCost"
    | "imageUrl"
    | "quickbooksAccountId"
    | "quickbooksCogsAccountId"
    | "quickbooksAssetAccountId"
    | "length"
    | "width"
    | "height"
    | "dimensionUnit"
    | "weight"
    | "weightUnit"
    | "preferredVendorId"
  >
>;

/** What the "New labor rate" form collects, before the store gives it an id. */
export interface NewLaborRateInput {
  name: string;
  subtypeId?: string;
  unitType: "hourly" | "flat";
  cost: number;
  priceStrategy: "manual" | "fixed" | "percent";
  rate: number;
  fixedMarkup?: number;
  percentMarkup?: number;
  isTaxable: boolean;
  quickbooksAccountId?: string;
  /** Label NAMES, as the picker hands them back. */
  labels: string[];
  description: string;
  notes: string;
}

interface AppStoreValue {
  /** Every job, with edits applied — the list reads this. */
  jobs: Job[];
  jobById: Map<string, Job>;
  /** Applies a change to one job. Also stamps `lastModifiedAt`, like the app would. */
  updateJob: (id: string, patch: JobPatch) => void;

  /** Every tax rate — the seed plus anything created in this session, edits applied. */
  taxRates: TaxRateRow[];
  taxRateById: Map<string, TaxRateRow>;
  updateTaxRate: (id: string, patch: TaxRatePatch) => void;
  /** Adds a rate and returns its id, so the caller can open it. */
  createTaxRate: (input: NewTaxRateInput) => string;
  /** Removes a rate. Only a rate in Review can be deleted — the panel enforces that. */
  deleteTaxRate: (id: string) => void;

  /** Every labor rate — the seed plus anything created in this session, edits applied. */
  laborRates: LaborRow[];
  laborRateById: Map<string, LaborRow>;
  updateLaborRate: (id: string, patch: LaborRatePatch) => void;
  createLaborRate: (input: NewLaborRateInput) => string;
  deleteLaborRate: (id: string) => void;

  /** Every product — the seed plus anything created in this session. */
  products: ProductRow[];
  productById: Map<string, ProductRow>;
  updateProduct: (id: string, patch: ProductPatch) => void;
  /** Adds a product from the "New product" form and returns its id. */
  createProduct: (input: NewProduct) => string;
  /** Removes a product. Only a product in Review can be deleted — the panel enforces that. */
  deleteProduct: (id: string) => void;
  /**
   * A product's inventory levels — the demo database's rows until a demo
   * edits one (the side panel's "Inventory levels" tab, 2026-11-18) or creates
   * the product with some.
   */
  inventoryLevelsOf: (productId: string) => InventoryLevel[];
  /** Saves one location's level and re-derives the list's Stock / Quantity columns. */
  setInventoryLevel: (productId: string, level: InventoryLevel) => void;
  /**
   * A product's vendor costs — the demo database's rows until a demo edits
   * them (the side panel's "Vendor costs" tab, 2026-11-19) or creates the
   * product with some.
   */
  vendorCostsOf: (productId: string) => NewProductVendorCost[];
  /**
   * The LIVE sources of a pricebook item's "History" tab (2026-11-20): every
   * job as it is in this session (a status changed on Job Details counts,
   * dated when it changed) and its charge lines as edited, else as seeded.
   */
  historySources: HistorySources;

  /** Every other charge — the seed plus anything created in this session, edits applied. */
  otherCharges: ChargeRow[];
  otherChargeById: Map<string, ChargeRow>;
  updateOtherCharge: (id: string, patch: OtherChargePatch) => void;
  /** Adds a charge from the "New other charge" form and returns its id. */
  createOtherCharge: (input: NewOtherCharge) => string;
  /** Removes a charge. Only a charge in Review can be deleted — the panel enforces that. */
  deleteOtherCharge: (id: string) => void;

  /** Every discount — the seed plus anything created in this session, edits applied. */
  discounts: ChargeRow[];
  discountById: Map<string, ChargeRow>;
  updateDiscount: (id: string, patch: DiscountPatch) => void;
  /** Adds a discount from the "New discount" form and returns its id. */
  createDiscount: (input: NewDiscount) => string;
  /** Removes a discount. Only a discount in Review can be deleted — the panel enforces that. */
  deleteDiscount: (id: string) => void;
  /** Saves a product's whole vendor cost list, with the Pricing module and preferred vendor it leads to. */
  setVendorCosts: (productId: string, costs: NewProductVendorCost[], patch: ProductPatch) => void;

  /**
   * The Charges lines a demo has changed, by job id (Daniel, 2026-11-13: "they
   * can be saved"). A job that is not here still shows its derived lines
   * (db/jobCharges) — the Charges segment seeds itself from those.
   */
  chargeLines: Record<string, JobChargeLines>;
  setChargeLines: (jobId: string, lines: JobChargeLines) => void;

  /**
   * A job's Work summary and Notes to dispatcher(s), once a demo changed them
   * (2026-11-14). Lifted out of the Summary tab so the "Hold job" Detailed flow
   * can write them too. A job that is not here shows its db summary.
   */
  jobTexts: Record<string, JobTexts>;
  /** Changes some of a job's texts; the others keep their value. */
  setJobTexts: (jobId: string, patch: JobTexts) => void;
  /** A job's Files list, once a demo changed it (2026-11-14, same reason). */
  jobFiles: Record<string, ModuleFile[]>;
  /** Updates a job's files from their current value (`seed` until it has one). */
  updateJobFiles: (jobId: string, seed: ModuleFile[], update: (files: ModuleFile[]) => ModuleFile[]) => void;
}

/** A job's two free-text properties. Unset = not changed in this session. */
export interface JobTexts {
  summary?: string;
  notes?: string;
}

/** One job's charge lines, per type, in the order the user put them in. */
export interface JobChargeLines {
  labor: Charge[];
  products: Charge[];
  other: Charge[];
  discounts: Charge[];
}

/**
 * ONE editable table: the frozen seed, plus this session's patches, additions
 * and removals. Both pricebook lists work exactly this way, so the mechanics
 * live here once (2026-10-08, with the labor rates) — including the rule that
 * matters for performance: while nothing has been touched it hands back the
 * SEED ARRAY ITSELF, so the memoised table sees the very same row objects.
 *
 * `sort` keeps a created row where it belongs instead of at the end; both
 * pricebook lists sort by name.
 */
function useEditableTable<T extends { id: string }>(seed: T[], sort: (a: T, b: T) => number) {
  const [patches, setPatches] = useState<Record<string, Partial<T>>>({});
  const [added, setAdded] = useState<T[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);

  const rows = useMemo(() => {
    if (Object.keys(patches).length === 0 && removed.length === 0 && added.length === 0) return seed;
    return [...seed, ...added]
      .filter((row) => !removed.includes(row.id))
      .map((row) => (patches[row.id] == null ? row : { ...row, ...patches[row.id] }))
      .sort(sort);
  }, [seed, sort, patches, added, removed]);

  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);

  // Every edit stamps `lastModifiedAt`, like the app would. The cast is the
  // one place this helper has to trust its callers: both row types carry it.
  const update = useCallback((id: string, patch: Partial<T>) => {
    setPatches((current) => ({
      ...current,
      [id]: { ...current[id], ...patch, lastModifiedAt: new Date().toISOString() } as Partial<T>,
    }));
  }, []);

  const create = useCallback((row: T) => {
    setAdded((current) => [...current, row]);
    return row.id;
  }, []);

  const remove = useCallback((id: string) => {
    setRemoved((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  return { rows, byId, update, create, remove };
}

/** The lists' neutral order, and where a newly created row lands. */
const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

/** Human-readable and unique within a session — this is a demo, not a backend. */
const newId = (prefix: string) => `${prefix}-new-${Date.now().toString(36)}`;

const LABEL_ID_OF = new Map(TAX_RATE_LABELS.map((label) => [label.name, label.id]));
const LABOR_LABEL_ID_OF = new Map(LABOR_LABELS.map((label) => [label.name, label.id]));

/**
 * A new rate, as production would store it: CONFIRMED (someone here typed it,
 * so it is not in Review), active, created by the signed-in user, and NOT yet
 * synced — it reaches QuickBooks on the next run, which is exactly why the
 * create form warns about it.
 *
 * A label the picker INVENTED has no id in the demo database, so it is dropped
 * here rather than faked. Flagged: a real app would create the label too.
 */
const seedNewTaxRate = (input: NewTaxRateInput, id: string): TaxRateRow => ({
  id,
  name: input.name,
  status: "active",
  isActive: true,
  rate: input.rate,
  summary: input.summary,
  notes: input.notes,
  labelIds: input.labels.map((name) => LABEL_ID_OF.get(name)).filter((value): value is string => value != null),
  createdAt: new Date().toISOString(),
  createdById: users[0].id,
  lastModifiedAt: new Date().toISOString(),
  quickbooksVendorId: input.quickbooksVendorId,
  needsSyncing: true,
});

/**
 * A new labor rate, as production would store it: CONFIRMED (someone here
 * typed it), active, created by the signed-in user, and NOT yet synced — it
 * reaches QuickBooks on the next run, which is what the create form warns
 * about. It has no duration: that field belongs to the new Service object
 * (ROO-3222).
 */
const seedNewLaborRate = (input: NewLaborRateInput, id: string): LaborRow => ({
  id,
  name: input.name,
  status: "active",
  isActive: true,
  subtypeId: input.subtypeId ?? null,
  description: input.description,
  notes: input.notes,
  cost: input.cost,
  rate: input.rate,
  unitType: input.unitType === "hourly" ? "hourly" : "flatRate",
  taxable: input.isTaxable,
  priceStrategy: input.priceStrategy,
  priceAdjustmentAmount: input.fixedMarkup,
  priceAdjustmentPercent: input.percentMarkup,
  labelIds: input.labels.map((name) => LABOR_LABEL_ID_OF.get(name)).filter((value): value is string => value != null),
  createdAt: new Date().toISOString(),
  createdById: users[0].id,
  lastModifiedAt: new Date().toISOString(),
  quickbooksAccountId: input.quickbooksAccountId,
  needsSyncing: true,
});

const PRODUCT_LABEL_ID_OF = new Map(PRODUCT_LABELS.map((label) => [label.name, label.id]));

/** Worst first — production's `lowest_inventory_status` keeps the worst level. */
const STOCK_WORST: StockStatus[] = ["depleted", "low", "limited", "full"];

type StockNumbers = Pick<InventoryLevel, "onHand" | "onOrder" | "target" | "alertAt">;

/** "Not stocked": nothing on hand or on order, no target, no alert. */
const isStocked = (level: StockNumbers) => level.onHand !== 0 || (level.onOrder ?? 0) !== 0 || !!level.target || !!level.alertAt;

/** The list's three stock columns, derived from the levels the product is stocked at. */
const stockColumnsOf = (allLevels: StockNumbers[]): Pick<ProductRow, "stock" | "quantity" | "quantityDesired"> => {
  const levels = allLevels.filter(isStocked);
  const statuses = levels.map((level) => stockLevel(level.onHand, level.onOrder ?? 0, level.target, level.alertAt) ?? "full");
  const targets = levels.map((level) => level.target).filter((value): value is number => value != null);
  return {
    stock: statuses.length === 0 ? null : (STOCK_WORST.find((level) => statuses.includes(level)) ?? null),
    quantity: levels.length === 0 ? null : levels.reduce((sum, level) => sum + level.onHand, 0),
    quantityDesired: targets.length === 0 ? null : targets.reduce((sum, value) => sum + value, 0),
  };
};

/**
 * A new product, as production would store it: CONFIRMED (someone here typed
 * it, so it is not in Review), active, and its list columns derived from what
 * the form collected:
 *
 *   stock            the WORST level across its locations (a location with no
 *                    target counts as full, production's rule); null when the
 *                    product is not tracked or is stocked nowhere yet
 *   quantity         on hand summed over the locations
 *   quantityDesired  the targets summed (null when none is set)
 *
 * The inventory rows are kept beside the table (`levelEdits`), for the side
 * panel's "Inventory levels" tab. The vendor costs and QuickBooks accounts
 * are not list columns and have no panel tab yet, so they are not kept.
 * A label the picker INVENTED has no id in the demo database and is dropped,
 * like on the rates.
 */
/** A new other charge as the lists and the panel read it. */
export const seedNewOtherCharge = (input: NewOtherCharge, id: string): ChargeRow => ({
  id,
  name: input.name,
  status: "active",
  isActive: true,
  subtypeId: input.subtypeId ?? null,
  summary: "",
  notes: "",
  cost: input.cost,
  price: input.price,
  priceStrategy: input.priceStrategy,
  fixedMarkup: input.fixedMarkup,
  percentMarkup: input.percentMarkup,
  taxable: input.isTaxable,
  labelIds: [],
  // QuickBooks: the form's account; a new item waits for its first sync.
  quickbooksAccountId: input.quickbooksAccountId,
  needsSyncing: true,
  lastModifiedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  // The viewer — Lorne Riddle — created it.
  createdById: 1,
});

/** A new discount as the lists and the panel read it. Never taxable, no cost, always Manual. */
export const seedNewDiscount = (input: NewDiscount, id: string): ChargeRow => ({
  id,
  name: input.name,
  status: "active",
  isActive: true,
  subtypeId: input.subtypeId ?? null,
  summary: "",
  notes: "",
  cost: 0,
  price: input.price,
  priceStrategy: "manual",
  taxable: false,
  labelIds: [],
  quickbooksAccountId: input.quickbooksAccountId,
  needsSyncing: true,
  lastModifiedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  createdById: 1,
});

export const seedNewProduct = (input: NewProduct, id: string): ProductRow => {
  const levels = input.trackInventory ? input.inventoryLevels : [];
  return {
    id,
    name: input.name,
    status: "active",
    isActive: true,
    subtypeId: input.subtypeId ?? null,
    summary: input.description,
    notes: input.notes,
    cost: input.cost,
    price: input.price,
    taxable: input.isTaxable,
    manufacturer: input.manufacturer,
    partNumber: input.partNumber,
    barcode: input.barcode || undefined,
    imageUrl: input.imageUrl || undefined,
    weight: input.weight,
    weightUnit: input.weightUnit,
    length: input.length,
    width: input.width,
    height: input.height,
    dimensionUnit: input.dimensionUnit,
    costStrategy: input.costStrategy,
    priceStrategy: input.priceStrategy,
    fixedMarkup: input.fixedMarkup,
    percentMarkup: input.percentMarkup,
    trackInventory: input.trackInventory,
    // QuickBooks: the form's accounts; a new item waits for its first sync.
    quickbooksAccountId: input.revenueAccountId,
    quickbooksCogsAccountId: input.cogsAccountId,
    quickbooksAssetAccountId: input.assetAccountId,
    needsSyncing: true,
    ...stockColumnsOf(levels),
    labelIds: input.labels.map((name) => PRODUCT_LABEL_ID_OF.get(name)).filter((value): value is string => value != null),
    lastModifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    // The viewer — Lorne Riddle — created it.
    createdById: 1,
  };
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [patches, setPatches] = useState<Record<string, JobPatch>>({});

  const jobs = useMemo(() => {
    // Nothing edited yet: hand back the seed array itself, so the memoised
    // table sees the very same row objects it saw before.
    if (Object.keys(patches).length === 0) return SEED_JOBS;
    return SEED_JOBS.map((job) => (patches[job.id] == null ? job : { ...job, ...patches[job.id] }));
  }, [patches]);

  const jobById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);

  const updateJob = useCallback((id: string, patch: JobPatch) => {
    setPatches((current) => ({
      ...current,
      [id]: { ...current[id], ...patch, lastModifiedAt: new Date().toISOString() },
    }));
  }, []);

  // ---- the two pricebook lists --------------------------------------------
  //
  // Same shape as the jobs above, with two differences: a demo can CREATE a
  // rate (the "New …" forms) and DELETE one (a rate in Review), so each table
  // keeps an added list and a removed set next to the patches. Both run on
  // `useEditableTable`.

  const taxRateTable = useEditableTable(SEED_TAX_RATES, byName);
  const { rows: taxRates, byId: taxRateById, update: updateTaxRate } = taxRateTable;

  const createTaxRate = useCallback(
    (input: NewTaxRateInput) => taxRateTable.create(seedNewTaxRate(input, newId("tax"))),
    [taxRateTable],
  );
  const deleteTaxRate = taxRateTable.remove;

  const laborRateTable = useEditableTable(SEED_LABOR_RATES, byName);
  const { rows: laborRates, byId: laborRateById, update: updateLaborRate } = laborRateTable;

  const createLaborRate = useCallback(
    (input: NewLaborRateInput) => laborRateTable.create(seedNewLaborRate(input, newId("labor"))),
    [laborRateTable],
  );
  const deleteLaborRate = laborRateTable.remove;

  const productTable = useEditableTable(SEED_PRODUCTS, byName);
  const { rows: products, byId: productById, update: updateProduct } = productTable;
  // A product's levels once a demo touched them (edited in the panel, or
  // created with the product); every other product reads the database.
  const [levelEdits, setLevelEdits] = useState<Record<string, InventoryLevel[]>>({});
  const levelsOfProduct = useCallback(
    (productId: string) => levelEdits[productId] ?? inventoryLevelsOf(productId),
    [levelEdits],
  );

  // The same for vendor costs.
  const [costEdits, setCostEdits] = useState<Record<string, NewProductVendorCost[]>>({});
  const vendorCostsOfProduct = useCallback(
    (productId: string) => {
      const product = productTable.byId.get(productId);
      return costEdits[productId] ?? (product ? vendorCostRowsOf(product) : []);
    },
    [costEdits, productTable.byId],
  );

  const createProduct = useCallback(
    (input: NewProduct) => {
      const id = productTable.create(seedNewProduct(input, newId("product")));
      if (input.trackInventory && input.inventoryLevels.length > 0) {
        setLevelEdits((current) => ({ ...current, [id]: input.inventoryLevels.map((level) => ({ productId: id, ...level })) }));
      }
      if (input.vendorCosts.length > 0) {
        setCostEdits((current) => ({ ...current, [id]: input.vendorCosts }));
        const preferred = input.vendorCosts.find((cost) => cost.isPreferred)?.vendorId;
        productTable.update(id, { preferredVendorId: preferred, ...(input.costStrategy === "manual" ? { manualCost: input.cost } : {}) });
      }
      return id;
    },
    [productTable],
  );

  const setVendorCosts = useCallback(
    (productId: string, costs: NewProductVendorCost[], patch: ProductPatch) => {
      setCostEdits((current) => ({ ...current, [productId]: costs }));
      updateProduct(productId, patch);
    },
    [updateProduct],
  );
  const deleteProduct = productTable.remove;

  const setInventoryLevel = useCallback(
    (productId: string, level: InventoryLevel) => {
      const next = [...levelsOfProduct(productId).filter((row) => row.locationId !== level.locationId), level];
      setLevelEdits((current) => ({ ...current, [productId]: next }));
      updateProduct(productId, stockColumnsOf(next));
    },
    [levelsOfProduct, updateProduct],
  );

  const otherChargeTable = useEditableTable(OTHER.rows, byName);
  const { rows: otherCharges, byId: otherChargeById, update: updateOtherCharge } = otherChargeTable;
  const createOtherCharge = useCallback(
    (input: NewOtherCharge) => otherChargeTable.create(seedNewOtherCharge(input, newId("other"))),
    [otherChargeTable],
  );
  const deleteOtherCharge = otherChargeTable.remove;

  const discountTable = useEditableTable(DISCOUNTS.rows, byName);
  const { rows: discounts, byId: discountById, update: updateDiscount } = discountTable;
  const createDiscount = useCallback(
    (input: NewDiscount) => discountTable.create(seedNewDiscount(input, newId("disc"))),
    [discountTable],
  );
  const deleteDiscount = discountTable.remove;

  // ---- the Job Details Charges lines ------------------------------------------
  const [chargeLines, setAllChargeLines] = useState<Record<string, JobChargeLines>>({});
  const setChargeLines = useCallback((jobId: string, lines: JobChargeLines) => {
    setAllChargeLines((current) => ({ ...current, [jobId]: lines }));
  }, []);

  // The pricebook History tab reads the jobs and charges AS THEY ARE NOW.
  const historySources = useMemo<HistorySources>(() => {
    const live = [];
    for (const row of jobs) {
      const seed = seedJobById(row.id);
      if (seed == null) continue; // a job created this session has no charges to bill yet
      live.push(
        row.status === seed.status
          ? seed
          : { ...seed, status: row.status, statusChangedAt: row.lastModifiedAt ?? seed.statusChangedAt },
      );
    }
    return {
      jobs: live,
      linesOf: (job) => {
        const edited = chargeLines[job.id];
        return edited != null
          ? [...edited.labor, ...edited.products, ...edited.other, ...edited.discounts]
          : chargesOf(job).flatMap((group) => group.items);
      },
      invoices: INVOICES,
    };
  }, [jobs, chargeLines]);

  // ---- the Job Details texts and files (2026-11-14) ------------------------------
  const [jobTexts, setAllJobTexts] = useState<Record<string, JobTexts>>({});
  const setJobTexts = useCallback((jobId: string, patch: JobTexts) => {
    setAllJobTexts((current) => ({ ...current, [jobId]: { ...current[jobId], ...patch } }));
  }, []);
  const [jobFiles, setAllJobFiles] = useState<Record<string, ModuleFile[]>>({});
  const updateJobFiles = useCallback(
    (jobId: string, seed: ModuleFile[], update: (files: ModuleFile[]) => ModuleFile[]) => {
      setAllJobFiles((current) => ({ ...current, [jobId]: update(current[jobId] ?? seed) }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      chargeLines,
      setChargeLines,
      historySources,
      jobTexts,
      setJobTexts,
      jobFiles,
      updateJobFiles,
      jobs,
      jobById,
      updateJob,
      taxRates,
      taxRateById,
      updateTaxRate,
      createTaxRate,
      deleteTaxRate,
      laborRates,
      laborRateById,
      updateLaborRate,
      createLaborRate,
      deleteLaborRate,
      products,
      productById,
      updateProduct,
      createProduct,
      deleteProduct,
      inventoryLevelsOf: levelsOfProduct,
      setInventoryLevel,
      vendorCostsOf: vendorCostsOfProduct,
      setVendorCosts,
      otherCharges,
      otherChargeById,
      updateOtherCharge,
      createOtherCharge,
      deleteOtherCharge,
      discounts,
      discountById,
      updateDiscount,
      createDiscount,
      deleteDiscount,
    }),
    [
      otherCharges,
      otherChargeById,
      updateOtherCharge,
      createOtherCharge,
      deleteOtherCharge,
      discounts,
      discountById,
      updateDiscount,
      createDiscount,
      deleteDiscount,
      vendorCostsOfProduct,
      setVendorCosts,
      levelsOfProduct,
      setInventoryLevel,
      jobs,
      jobById,
      updateJob,
      taxRates,
      taxRateById,
      updateTaxRate,
      createTaxRate,
      deleteTaxRate,
      laborRates,
      laborRateById,
      updateLaborRate,
      createLaborRate,
      deleteLaborRate,
      products,
      productById,
      updateProduct,
      createProduct,
      deleteProduct,
      historySources,
      chargeLines,
      setChargeLines,
      jobTexts,
      setJobTexts,
      jobFiles,
      updateJobFiles,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const value = useContext(AppStoreContext);
  if (value == null) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return value;
}

/**
 * The store, or null outside the demo app — for a module that also renders in
 * a story of its own (Job Details' Charges keeps its lines locally there).
 */
export const useOptionalAppStore = (): AppStoreValue | null => useContext(AppStoreContext);

/** Every job, edits applied. */
export const useJobs = (): Job[] => useAppStore().jobs;

/** One job by id, edits applied — undefined when the id is not in the database. */
export const useJob = (id: string): Job | undefined => useAppStore().jobById.get(id);

/** Every tax rate, edits applied — the list reads this. */
export const useTaxRates = (): TaxRateRow[] => useAppStore().taxRates;

/** One tax rate by id — undefined once it is deleted, or for an id that never existed. */
export const useTaxRate = (id: string | null): TaxRateRow | undefined => {
  const { taxRateById } = useAppStore();
  return id == null ? undefined : taxRateById.get(id);
};

/** Every labor rate, edits applied — the list reads this. */
export const useLaborRates = (): LaborRow[] => useAppStore().laborRates;

/** One labor rate by id — undefined once it is deleted, or for an id that never existed. */
export const useLaborRate = (id: string | null): LaborRow | undefined => {
  const { laborRateById } = useAppStore();
  return id == null ? undefined : laborRateById.get(id);
};

/** Every product, with this session's new ones — the Products list reads this. */
export const useProducts = (): ProductRow[] => useAppStore().products;

/** One product by id — undefined once it is deleted, or for an id that never existed. */
export const useProduct = (id: string | null): ProductRow | undefined => {
  const { productById } = useAppStore();
  return id == null ? undefined : productById.get(id);
};

/** Every other charge, with this session's new ones — the Other charges list reads this. */
export const useOtherCharges = (): ChargeRow[] => useAppStore().otherCharges;

/** One other charge by id — undefined once it is deleted, or for an id that never existed. */
export const useOtherCharge = (id: string | null): ChargeRow | undefined => {
  const { otherChargeById } = useAppStore();
  return id == null ? undefined : otherChargeById.get(id);
};

/** Every discount, with this session's new ones — the Discounts list reads this. */
export const useDiscounts = (): ChargeRow[] => useAppStore().discounts;

/** One discount by id — undefined once it is deleted, or for an id that never existed. */
export const useDiscount = (id: string | null): ChargeRow | undefined => {
  const { discountById } = useAppStore();
  return id == null ? undefined : discountById.get(id);
};
