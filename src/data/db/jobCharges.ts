import { historyOf } from "./jobHistory";
import { Job } from "./types";

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

export type Charge = { id: string; title: string; caption: string; total: string; unit: string };
export type ChargeGroup = { key: string; label: string; icon: string; subtotal: string; items: Charge[] };

/** The company's standard labour rate, per hour. */
const LABOR_RATE = 110;
/** Dispatch fee for an on-site visit. */
const TRIP_CHARGE = 75;

const money = (n: number) => `$${n.toFixed(2)}`;

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

const GENERIC_PART: Part = {
  title: "Service parts",
  caption: "Parts used on the visit.",
  price: 68,
  qty: 1,
};

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
  if (!worked) return [];

  const hours = billableHours(job);
  // Every visit starts with an hour of diagnosis; the rest is the work itself.
  const diagnostic = Math.min(1, hours);
  const remaining = Math.round((hours - diagnostic) * 4) / 4;

  const labor: Charge[] = [
    {
      id: "l1",
      title: "Diagnostic & inspection",
      caption: `Inspected the unit and confirmed the fault before starting on the ${job.serviceName.toLowerCase()}.`,
      total: money(diagnostic * LABOR_RATE),
      unit: `${money(LABOR_RATE)} x ${diagnostic} hr`,
    },
  ];
  if (remaining > 0) {
    labor.push({
      id: "l2",
      title: job.serviceName,
      caption: "The work itself, as logged on the timesheet.",
      total: money(remaining * LABOR_RATE),
      unit: `${money(LABOR_RATE)} x ${remaining} hr`,
    });
  }

  const parts = PARTS_BY_SERVICE[job.serviceName] ?? [GENERIC_PART];
  const products: Charge[] = parts.map((part, index) => ({
    id: `p${index + 1}`,
    title: part.title,
    caption: part.caption,
    total: money(part.price * part.qty),
    unit: `${money(part.price)} x ${part.qty}`,
  }));

  const other: Charge[] = [
    {
      id: "o1",
      title: "Trip charge",
      caption: "Standard dispatch fee for an on-site service visit.",
      total: money(TRIP_CHARGE),
      unit: `${money(TRIP_CHARGE)} x 1`,
    },
  ];

  const sum = (items: Charge[]) => money(items.reduce((acc, item) => acc + Number(item.total.slice(1)), 0));

  const groups: ChargeGroup[] = [
    { key: "labor", label: "Labor", icon: "tag", subtotal: sum(labor), items: labor },
  ];
  // A job that needed no parts shows no Products group, rather than an empty one.
  if (products.length > 0) groups.push({ key: "products", label: "Products", icon: "box-taped", subtotal: sum(products), items: products });
  groups.push({ key: "other", label: "Other", icon: "tag", subtotal: sum(other), items: other });
  return groups;
}

/** The job's total — what the Charges module and the Complete flow print. */
export const chargesTotal = (groups: ChargeGroup[]): string =>
  `$${groups.reduce((acc, group) => acc + Number(group.subtotal.slice(1)), 0).toFixed(2)}`;
