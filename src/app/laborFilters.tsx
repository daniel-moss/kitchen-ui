import { LABOR_LABELS, LABOR_SUBTYPES, PricebookStatus } from "../data/db";

import { FilterDef } from "./filterDefs";
import { moneyFilter } from "./filterKinds";
import {
  costTemplate,
  labelsTemplate,
  lastModifiedTemplate,
  pricebookStatusTemplate,
  subtypeTemplate,
  taxabilityTemplate,
} from "./filterTemplates";
import { LaborRow, UNIT_TYPE_LABELS } from "./laborData";
import { PricebookPhase } from "./pricebookList";

// The LABOR list's filter registry — ONE entry per row of its Filters menu
// (node 15044-67466 on Daniel's "↳ Labor" canvas 15044-66760, re-read
// 2026-09-16 after his icon and Status updates), in the menu's alphabetical
// order: Cost, Labels, Last modified, Rate, Status, Subtype, Taxability,
// Unit type. Est. duration is GONE (Daniel, 2026-10-28): in the new model a
// labor rate has no duration — the Service carries it.
//
// TWO kinds of entry, the standing Figma split — re-drawn on 2026-09-16 when
// the PRODUCTS list arrived and four of these turned out to be the same
// filter on both pricebook types:
//   - TWO are object-specific, and stay here: Rate (15056:60150) on the
//     Amount kind and Unit type (15049:71097);
//   - SIX are shared TEMPLATES, handed how to read a LABOR item — Labels and
//     Last modified as before, plus Cost, Status, Subtype and Taxability,
//     PROMOTED into `filterTemplates` when the Products menu's rows linked
//     to these same four sections (the promotion precedent; their Figma
//     sections still sit on this canvas).
//
// STATUS is ACTIVE-phase only (the menu row's own annotation: "Only shown on
// the 'Active' phase views") — an inactive item has no status to filter, the
// Bills Status-changed arrangement. The templates that are NOT here —
// Client, Location, Location address, Service, the date trio, Seen, Total — have
// nothing to read: a pricebook item belongs to nothing, has no lifecycle
// dates beyond Last modified, and its two amounts have their own names.

/**
 * The statuses each ACTIVE-phase view lists — and locks. They are the same
 * sets the view tabs group by — see `BRANCHES` in LaborPage.tsx. The
 * Inactive phase has no statuses at all (one "All" view, nothing locked).
 */
export const LABOR_PHASE_STATUSES: Record<PricebookPhase, PricebookStatus[]> = {
  active: ["review", "active"],
  inactive: [],
};

// ---- Rate (object-specific, the Amount kind) ---------------------------------

/**
 * Rate — the billed price (production `default_price`). The MONEY kind over
 * the same shared ladder (section 15056:60150). Icon `money-bill` — the
 * node's own: the standing Amount glyph, and Rate is this list's primary
 * amount (it has no "Total").
 */
function rateFilter(): FilterDef<LaborRow> {
  return {
    id: "rate",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Rate",
    icon: "money-bill",
    dsHeader: true,
    ...moneyFilter((item) => item.rate),
  };
}

// ---- Unit type (object-specific) ---------------------------------------------

/**
 * Unit type — production `default_unit_type` (`LineItemUnitType`: Hourly ·
 * Flat Rate; REQUIRED for services there, so the list needs no absence row).
 * Single-select (section 15049:71097's annotation), bare rows in the node's
 * order and casing: Hourly · Flat rate. Icon `shapes` — the node's own, the
 * standing Type-filter glyph.
 */
function unitTypeFilter(): FilterDef<LaborRow> {
  return {
    id: "unitType",
    noun: { one: "type", many: "types" },
    label: "Unit type",
    icon: "shapes",
    hideCounts: true,
    dsHeader: true,
    singleSelect: true,
    options: (["hourly", "flatRate"] as const).map((key) => ({
      id: key,
      label: UNIT_TYPE_LABELS[key],
    })),
    matches: (item, { ids }) => ids.includes(item.unitType),
  };
}

// ---- the registry ----------------------------------------------------------

/**
 * ONE registry per BRANCH, the other pages' rule: Status exists on the
 * Active phase alone (its menu-row annotation), and everything else is the
 * same object on both. The menu lists them alphabetically, the order its own
 * node draws (15044:67466): Cost, Labels, Last modified, Rate, Status (Active only — it keeps its alphabetical slot between Rate
 * and Subtype), Subtype, Taxability, Unit type.
 */
const buildLaborFilters = (phase: PricebookPhase): FilterDef<LaborRow>[] => [
  costTemplate((item) => item.cost),

  // Labor items carry their OWN label table (production `PriceBookItemLabel`
  // — see LABOR_LABELS in the db), the template's parameter.
  labelsTemplate(LABOR_LABELS, (item) => item.labelIds),

  lastModifiedTemplate((item) => item.lastModifiedAt),

  rateFilter(),

  // Only where an item HAS a status — see the module note.
  ...(phase === "active"
    ? [pricebookStatusTemplate<LaborRow>(LABOR_PHASE_STATUSES.active, (item) => item.status)]
    : []),

  // The LABOR subtypes, production's per-type scoping.
  subtypeTemplate(LABOR_SUBTYPES, (item) => item.subtypeId),

  taxabilityTemplate((item) => item.taxable),

  unitTypeFilter(),
];

export const LABOR_FILTERS: Record<PricebookPhase, FilterDef<LaborRow>[]> = {
  active: buildLaborFilters("active"),
  inactive: buildLaborFilters("inactive"),
};
