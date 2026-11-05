import { DISCOUNT_ITEMS, ESTIMATES, LABOR_ITEMS, OTHER_ITEMS, PRODUCT_ITEMS } from "./db";
import { historyOf } from "./jobHistory";
import { Job, LaborItem } from "./types";
import { semanticIcons } from "../../styles/semanticIcons";

// WHAT A JOB COST — its labour, its parts and its fees.
//
// Added 2026-09-28. The Charges tab and the Complete-job flow used to show one
// hardcoded set — a diagnostic, a compressor service, a 48-inch door gasket and
// three pounds of R-404A, $563.00 — on all 78 jobs, so an ice-machine descale
// billed for walk-in cooler parts.
//
// DERIVED from the job, like its history: the labour comes from the time
// actually tracked on it, the parts from the SERVICE it is (a descale needs a
// filter, a hood clean needs no parts at all), and the fees are the company's.
// Deterministic, so a demo reads the same way every time.

export type Charge = {
  id: string;
  title: string;
  caption: string;
  total: string;
  unit: string;
  /**
   * Labour lines only: the pricebook labor rate the line was billed from
   * (→ LABOR_ITEMS). It is what the Charges module opens the "Labor rate"
   * side panel on.
   */
  laborRateId?: string;
  /**
   * Labour lines only (2026-10-31, the "Labor rates" module doc, Figma
   * 27405-35295): the LINE's own copy of the rate. The edit form pre-fills it
   * from the pricebook rate and the user may change any of it, so the line
   * never reads these back off LABOR_ITEMS.
   */
  labor?: LaborLine;
  /**
   * Product lines only: the pricebook product the line was sold from
   * (→ PRODUCT_ITEMS) and how many. A part with no pricebook match has none.
   */
  productId?: string;
  qty?: number;
  /**
   * Product lines only (2026-11-03, the "Products" module doc, Figma
   * 27831-59168): the LINE's own fields, pre-filled from the pricebook
   * product and editable on the line.
   */
  product?: ProductLine;
  /**
   * Other-charge lines only (2026-11-03, the "Other charges" module doc,
   * Figma 27937-65412): the pricebook charge the line was billed from and the
   * LINE's own fields, pre-filled from it.
   */
  otherChargeId?: string;
  other?: OtherLine;
  /**
   * Discount lines only (2026-11-03, the "Discounts" module doc, Figma
   * 27940-66676): the pricebook discount and the LINE's own fields.
   */
  discountId?: string;
  discount?: DiscountLine;
};

/**
 * A discount line's own fields. A discount is a FIXED amount — never a
 * percent (Daniel, 2026-11-03) — and has no cost.
 */
export interface DiscountLine {
  /** → DISCOUNT_SUBTYPES. */
  subtypeId: string | null;
  /** The discount per unit, as a POSITIVE number; it is shown with a minus. Zero is allowed. */
  discount: number;
  /** Up to 3 decimals, more than 0. */
  quantity: number;
  equipmentId?: string;
  technicianId?: number;
  /** Pre-filled from the discount's summary. */
  description: string;
}

/** An other-charge line's own fields — production's JobLineItem for an "other" item. */
export interface OtherLine {
  /** → OTHER_SUBTYPES. */
  subtypeId: string | null;
  cost: number;
  price: number;
  /** Up to 3 decimals, more than 0. */
  quantity: number;
  equipmentId?: string;
  technicianId?: number;
  /** Pre-filled from the charge's summary. */
  description: string;
}

/** A product line's own fields — production's JobLineItem for a part. */
export interface ProductLine {
  /** Shown as "No Manufacturer" / "No Part #" when empty. */
  manufacturer: string;
  partNumber: string;
  /** → PRODUCT_SUBTYPES. */
  subtypeId: string | null;
  /** → INVENTORY_LOCATIONS. Only on a product tracked in inventory. */
  inventoryLocationId?: string;
  cost: number;
  price: number;
  /** Up to 3 decimals, more than 0. */
  quantity: number;
  equipmentId?: string;
  technicianId?: number;
  /** Pre-filled from the product's summary. */
  description: string;
}
/** A labour line's own fields — production's JobLineItem for a labor rate. */
export interface LaborLine {
  /** "Type" — Hourly bills Price × Hours; Flat bills the Price once. */
  type: "hourly" | "flat";
  /** → LABOR_SUBTYPES. Pre-filled from the rate when it has one. */
  subtypeId: string | null;
  cost: number;
  price: number;
  /** Hourly only: up to 3 decimals, more than 0. */
  hours?: number;
  /** "Service date(s)" — ISO days; the same day when the work took one. */
  serviceStart: string | null;
  serviceEnd: string | null;
  /** "Equipment attribution" — one of the job's equipment. Optional. */
  equipmentId?: string;
  /** "Technician attribution" — one of the job's assignees. Optional. */
  technicianId?: number;
  /** Pre-filled from the rate's description. No limit. */
  description: string;
}
export type ChargeGroup ={ key: string; label: string; icon: string; subtotal: string; items: Charge[] };

/** The first hour of every visit is billed on the diagnostic rate. */
const DIAGNOSTIC_RATE_ID = "diagnostic-labor";
/** The work itself — a job's service is not a rate any more (2026-10-28). */
const STANDARD_RATE_ID = "standard-labor";
/** Dispatch fee for an on-site visit — billed from the pricebook (2026-11-03). */
const TRIP_CHARGE_ID = "other-trip-charge";

const money = (n: number) => `$${n.toFixed(2)}`;
const sum = (items: Charge[]) => money(items.reduce((acc, item) => acc + Number(item.total.slice(1)), 0));

/** A part the work needs, with what the company charges for it. */
interface Part {
  title: string;
  caption: string;
  price: number;
  qty: number;
}

// Parts by SERVICE — the same shape of work needs the same parts, which is how
// a pricebook behaves. A service with nothing here is pure labour: a hood
// clean, an inspection, a consultation.
const PARTS_BY_SERVICE: Record<string, Part[]> = {
  "Walk-in cooler repair": [
    { title: 'Walk-in door gasket, 48"', caption: "Magnetic replacement gasket for a 48-inch walk-in door.", price: 86, qty: 1 },
    { title: "R-404A refrigerant", caption: "Low-temperature refrigerant, sold per pound.", price: 24, qty: 3 },
  ],
  "Walk-in cooler compressor replacement": [
    { title: "Replacement compressor", caption: "Matched to the unit's nameplate refrigerant and capacity.", price: 890, qty: 1 },
    { title: "R-404A refrigerant", caption: "Low-temperature refrigerant, sold per pound.", price: 24, qty: 4 },
  ],
  "Walk-in freezer door repair": [
    { title: "Freezer door gasket", caption: "Low-temperature gasket with a magnetic seal.", price: 94, qty: 1 },
    { title: "Hinge kit", caption: "Replacement hinges and fixings for a walk-in door.", price: 48, qty: 1 },
  ],
  "Walk-in freezer door assembly": [
    { title: "Door assembly", caption: "Complete walk-in freezer door with frame and latch.", price: 1240, qty: 1 },
  ],
  "Freezer door seal replacement": [
    { title: "Freezer door gasket", caption: "Low-temperature gasket cut to the unit's frame.", price: 94, qty: 1 },
  ],
  "Ice machine descale": [
    { title: "Water filter cartridge", caption: "Inline filter for an ice machine's water supply.", price: 62, qty: 1 },
    { title: "Descaling solution", caption: "Food-safe nickel-safe descaler.", price: 28, qty: 1 },
  ],
  "Espresso machine descale": [
    { title: "Descaling solution", caption: "Food-safe descaler for a commercial group head.", price: 28, qty: 1 },
    { title: "Group head gasket", caption: "Replacement gasket, one per group.", price: 18, qty: 2 },
  ],
  "Dishwasher inspection": [],
  "Dishwasher rinse-aid line replacement": [
    { title: "Rinse-aid line kit", caption: "Chemical-resistant line with fittings.", price: 54, qty: 1 },
  ],
  "Grill hood cleaning": [],
  "Hood deep cleaning": [],
  "Hood cleaning estimate visit": [],
  "Combi oven quarterly maintenance": [
    { title: "Door seal", caption: "Replacement oven door seal.", price: 76, qty: 1 },
  ],
  "Combi oven quarterly service": [
    { title: "Door seal", caption: "Replacement oven door seal.", price: 76, qty: 1 },
  ],
  "Combi oven annual contract": [
    { title: "Door seal", caption: "Replacement oven door seal.", price: 76, qty: 1 },
    { title: "Descaling solution", caption: "Food-safe descaler for the steam generator.", price: 28, qty: 2 },
  ],
  "Grease trap service": [],
  "Steam table thermostat swap": [
    { title: "Thermostat", caption: "Replacement well thermostat.", price: 132, qty: 1 },
  ],
  "Fryer service and calibration": [
    { title: "Fryer filter pads", caption: "Box of oil filter pads.", price: 42, qty: 1 },
  ],
  "Fryer preventive maintenance": [
    { title: "Fryer filter pads", caption: "Box of oil filter pads.", price: 42, qty: 1 },
  ],
  "Prep fridge compressor service": [
    { title: "Condenser fan motor", caption: "Replacement fan motor for a prep fridge condenser.", price: 118, qty: 1 },
  ],
  "Reach-in cooler diagnostic": [],
  "Range burner repair": [
    { title: "Burner head", caption: "Cast burner head for a commercial range.", price: 64, qty: 2 },
    { title: "Thermocouple", caption: "Replacement thermocouple.", price: 22, qty: 1 },
  ],
  "Range pilot relight": [],
  "Proofer thermostat replacement": [
    { title: "Thermostat", caption: "Replacement proofer thermostat.", price: 128, qty: 1 },
  ],
  "Proofer thermostat + calibration": [
    { title: "Thermostat", caption: "Replacement proofer thermostat.", price: 128, qty: 1 },
  ],
  "Kitchen build-out consultation": [],
};

// Which pricebook PRODUCT each part is sold from (2026-10-22) — it is what
// tells whether the part is tracked in inventory (`trackInventory`). Parts
// with no fitting product stay unlinked.
const PART_PRODUCT: Record<string, string> = {
  "R-404A refrigerant": "prod-r404a",
  'Walk-in door gasket, 48"': "prod-door-gasket-48",
  "Replacement compressor": "prod-compressor-2hp",
  "Freezer door gasket": "prod-door-gasket-36",
  "Hinge kit": "prod-door-hinge",
  "Water filter cartridge": "prod-ice-water-filter",
  "Descaling solution": "prod-descaler",
  "Door seal": "prod-combi-door-gasket",
  "Fryer filter pads": "prod-fryer-filter-paper",
  "Thermocouple": "prod-thermocouple",
};

const GENERIC_PART: Part = {
  title: "Service parts",
  caption: "Parts used on the visit.",
  price: 68,
  qty: 1,
};

/** The job's parts as product lines, each linked to its pricebook product. */
function productLines(job: Job): Charge[] {
  const parts = PARTS_BY_SERVICE[job.serviceName] ?? [GENERIC_PART];
  // Attributed like the labour: every part after the first goes to the job's
  // first equipment and to whoever logged the labour, so the demo shows both.
  const tech = historyOf(job).sessions.find((s) => s.category === "labor")?.userId ?? job.assigneeIds?.[0];
  return parts.map((part, index) => {
    const productId = PART_PRODUCT[part.title];
    const item = PRODUCT_ITEMS.find((row) => row.id === productId);
    const attributed = index > 0;
    return {
      id: `p${index + 1}`,
      title: part.title,
      caption: part.caption,
      total: money(part.price * part.qty),
      unit: `${money(part.price)} × ${part.qty}`,
      productId,
      qty: part.qty,
      product: {
        manufacturer: item?.manufacturer ?? "",
        partNumber: item?.partNumber ?? "",
        subtypeId: item?.subtypeId ?? null,
        // Every tracked part comes out of the main warehouse in the demo.
        inventoryLocationId: item?.trackInventory === true ? "inv-warehouse" : undefined,
        cost: item?.cost ?? 0,
        price: part.price,
        quantity: part.qty,
        equipmentId: attributed ? job.equipmentIds?.[0] : undefined,
        technicianId: attributed ? tech : undefined,
        description: item?.summary || part.caption,
      },
    };
  });
}

/**
 * The product lines whose pricebook product is tracked in inventory — the
 * ones cancelling the job returns to stock.
 */
export const inventoryProductsOf = (groups: ChargeGroup[]): Charge[] =>
  (groups.find((group) => group.key === "products")?.items ?? []).filter(
    (item) => item.productId != null && PRODUCT_ITEMS.find((product) => product.id === item.productId)?.trackInventory === true,
  );

/** Billable hours — the time actually tracked, or the estimate before any is. */
function billableHours(job: Job): number {
  const labor = historyOf(job)
    .sessions.filter((s) => s.category === "labor" && s.end != null)
    .reduce((acc, s) => acc + (new Date(s.end!).getTime() - new Date(s.start).getTime()) / 3600000, 0);
  const hours = labor > 0 ? labor : (job.durationMinutes ?? 60) / 60;
  // Billed to the quarter hour, the way a service company actually invoices.
  return Math.max(0.5, Math.round(hours * 4) / 4);
}

/**
 * The job's charges: labour, parts and fees.
 *
 * A job nobody has worked yet has none — there is nothing to bill for a visit
 * that has not happened, and an empty Charges tab is the honest state.
 */
export function chargesOf(job: Job): ChargeGroup[] {
  const worked = ["completed", "finalized", "active", "quickPaused", "onHoldExternal", "onHoldInternal"].includes(job.status);
  if (!worked) {
    // Line items can be on a job before the visit (Daniel, 2026-10-22): added
    // by hand when it was booked, or carried over from the estimate it was
    // made from. Before the visit that is only the PARTS — nothing has been
    // worked or driven to yet.
    const early = job.lineItemsAddedEarly === true || ESTIMATES.some((estimate) => estimate.jobId === job.id && estimate.status === "jobbed");
    if (!early) return [];
    const products = productLines(job);
    return products.length > 0 ? [{ key: "products", label: "Products", icon: "box-taped", subtotal: sum(products), items: products }] : [];
  }

  const hours = billableHours(job);
  // Every visit starts with an hour of diagnosis; the rest is the work itself.
  const diagnostic = Math.min(1, hours);
  const remaining = Math.round((hours - diagnostic) * 4) / 4;

  // Every labour line is billed from a REAL pricebook rate (2026-10-21), so a
  // row can open that rate's side panel: the diagnostic rate for the first
  // hour, then the standard rate. The job's SERVICE is no longer a labor rate
  // (the pricebook holds actual labor rates only since 2026-10-28), so it only
  // names the work in the caption. A flat rate is billed once.
  // The work line is attributed to the job's first equipment and to whoever
  // logged the labour on it; the diagnostic line carries no attribution, so
  // the demo shows both the filled and the empty case.
  const laborTech = historyOf(job).sessions.find((s) => s.category === "labor")?.userId ?? job.assigneeIds?.[0];
  const rateLine = (id: string, rate: LaborItem, hours: number, caption: string, attributed = false): Charge => {
    const hourly = rate.unitType === "hourly";
    const qty = hourly ? hours : 1;
    const description = rate.description !== "" ? rate.description : caption;
    return {
      id,
      title: rate.name,
      caption: description,
      total: money(qty * rate.rate),
      unit: hourly ? `${money(rate.rate)} × ${qty} hr` : `${money(rate.rate)} × 1`,
      laborRateId: rate.id,
      labor: {
        type: hourly ? "hourly" : "flat",
        subtypeId: rate.subtypeId ?? null,
        cost: rate.cost,
        price: rate.rate,
        hours: hourly ? qty : undefined,
        // Pre-selected from "Scheduled for": start and end on the same day.
        serviceStart: job.scheduledFor ?? null,
        serviceEnd: job.scheduledFor ?? null,
        equipmentId: attributed ? job.equipmentIds?.[0] : undefined,
        technicianId: attributed ? laborTech : undefined,
        description,
      },
    };
  };
  const rateById = (id: string) => LABOR_ITEMS.find((row) => row.id === id);
  const diagnosticRate = rateById(DIAGNOSTIC_RATE_ID)!;
  const workRate = rateById(STANDARD_RATE_ID)!;

  const labor: Charge[] = [
    rateLine("l1", diagnosticRate, diagnostic, `Inspected the unit and confirmed the fault before starting on the ${job.serviceName.toLowerCase()}.`),
  ];
  if (remaining > 0 || workRate.unitType === "flatRate") {
    labor.push(rateLine("l2", workRate, remaining, `${job.serviceName}, as logged on the timesheet.`, true));
  }

  const products = productLines(job);

  // One trip per visit, at the pricebook's Trip charge. Not attributed — a
  // dispatch fee belongs to the visit, not to a unit or a technician.
  const trip = OTHER_ITEMS.find((row) => row.id === TRIP_CHARGE_ID)!;
  const other: Charge[] = [
    {
      id: "o1",
      title: trip.name,
      caption: trip.summary,
      total: money(trip.price),
      unit: `${money(trip.price)} × 1`,
      otherChargeId: trip.id,
      other: {
        subtypeId: trip.subtypeId,
        cost: trip.cost,
        price: trip.price,
        quantity: 1,
        description: trip.summary,
      },
    },
  ];


  const groups: ChargeGroup[] = [
    { key: "labor", label: "Labor rates", icon: semanticIcons.laborRate, subtotal: sum(labor), items: labor },
  ];
  // A job that needed no parts shows no Products group, rather than an empty one.
  if (products.length > 0) groups.push({ key: "products", label: "Products", icon: semanticIcons.product, subtotal: sum(products), items: products });
  groups.push({ key: "other", label: "Other", icon: semanticIcons.other, subtotal: sum(other), items: other });
  return groups;
}

/** The job's total — what the Charges module and the Complete flow print. */
export const chargesTotal = (groups: ChargeGroup[]): string =>
  `$${groups.reduce((acc, group) => acc + Number(group.subtotal.slice(1)), 0).toFixed(2)}`;

// The jobs that carry a discount, by job id → pricebook discount ids. Kept
// OUT of `chargesOf` on purpose (2026-11-03): the Concept 1 Charges module,
// the Complete-job flow and `chargesTotal` read money strings that cannot
// hold a negative amount, so only the Charges Concept 2 reads discounts.
const DISCOUNTS_BY_JOB: Record<string, string[]> = {
  // Wildwood Downtown's walk-in repair — billed at the service-agreement rate.
  "JOB-1201": ["disc-contract-labor"],
};

/** The job's discount lines, pre-filled from their pricebook discounts. */
export function discountsOf(job: Job): Charge[] {
  return (DISCOUNTS_BY_JOB[job.id] ?? []).flatMap((id, index) => {
    const item = DISCOUNT_ITEMS.find((row) => row.id === id);
    if (item == null) return [];
    const amount = -item.price;
    return [
      {
        id: `d${index + 1}`,
        title: item.name,
        caption: item.summary,
        total: `−${money(amount)}`,
        unit: `−${money(amount)} × 1`,
        discountId: item.id,
        discount: { subtypeId: item.subtypeId, discount: amount, quantity: 1, description: item.summary },
      },
    ];
  });
}
