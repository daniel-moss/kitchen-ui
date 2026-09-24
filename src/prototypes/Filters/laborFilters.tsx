import { LABOR_LABELS, LABOR_SUBTYPES, PricebookStatus } from "../../data/db";

import { FilterDef } from "./filterDefs";
import { durationFilter, moneyFilter } from "./filterKinds";
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
// order: Cost, Est. duration, Labels, Last modified, Rate, Status, Subtype,
// Taxability, Unit type.
//
// TWO kinds of entry, the standing Figma split — re-drawn on 2026-09-16 when
// the PRODUCTS list arrived and four of these turned out to be the same
// filter on both pricebook types:
//   - THREE are object-specific, and stay here: Rate (15056:60150) on the
//     Amount kind, Est. duration (15339:20649 — the list's OWN, distinct
//     from the Jobs template: a pricebook duration is optional, so "No est.
//     duration" leads) and Unit type (15049:71097);
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

// ---- Est. duration (object-specific — the list's OWN, not the Jobs template) --

/**
 * Est. duration — production `default_job_duration`, which is OPTIONAL here
 * (unlike a job's), so the Labor list has its own filter section
 * (15339:20649, added by Daniel 2026-09-16 after the review): the duration
 * kind's list led by the ABSENT "No est. duration" row over the four hour
 * presets and "Custom..." (hr + min, at least / at most / is / within). The
 * chip prints a preset as written ("1 hour") and a custom value in the
 * compact format ("1h 30m" — units only when > 0), the section's own
 * annotation, which is exactly what the shared chip copy already does.
 */
function estDurationFilter(): FilterDef<LaborRow> {
  return {
    id: "duration",
    kind: "duration",
    noun: { one: "duration", many: "durations" },
    label: "Est. duration",
    icon: "hourglass",
    dsHeader: true,
    ...durationFilter((item) => item.estDurationMinutes, ["noDuration", "1h", "2h", "3h", "4h"]),
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
 * node draws (15044:67466): Cost, Est. duration, Labels, Last modified,
 * Rate, Status (Active only — it keeps its alphabetical slot between Rate
 * and Subtype), Subtype, Taxability, Unit type.
 */
const buildLaborFilters = (phase: PricebookPhase): FilterDef<LaborRow>[] => [
  costTemplate((item) => item.cost),

  estDurationFilter(),

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
