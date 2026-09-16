import { PricebookStatus, TAX_RATE_LABELS } from "../../data/db";

import { FilterDef } from "./filterDefs";
import { percentFilter } from "./filterKinds";
import { labelsTemplate, lastModifiedTemplate, pricebookStatusTemplate } from "./filterTemplates";
import { PricebookPhase } from "./pricebookList";
import { TaxRateRow } from "./taxRatesData";

// The TAX RATES list's filter registry — ONE entry per row of its Filters
// menu (node 15368-46476 on Daniel's "↳ Tax Rates" canvas 15059-64984,
// re-read 2026-09-16 after he acted on the design review): Labels, Last
// modified, Status, Tax rate.
//
// ONE is object-specific — **Tax rate** (its own section 15368-50064, whose
// frame annotation links the shared Amount documentation) — and the other
// three are shared templates. The shortest pricebook menu, and rightly:
// production gives a tax item no cost, no taxability, no subtype and no
// price in dollars.
//
// BOTH of the review's flags on this list are CLOSED: the menu is
// alphabetical in the node now (it drew Tax rate third), and the SUBTYPE row
// is gone — production guards subtypes out for this type in both its form
// and its table, so the filter could only ever have answered "No subtype".

/**
 * The statuses each ACTIVE-phase view lists — and locks. The Inactive phase
 * has no statuses at all.
 */
export const TAX_RATE_PHASE_STATUSES: Record<PricebookPhase, PricebookStatus[]> = {
  active: ["review", "active"],
  inactive: [],
};

/**
 * Tax rate — production `default_price` held as a PERCENT (section
 * 15368-50064). The FIFTH amount kind: the node's nine rows (0% through 20%)
 * over "Custom...", the chips-only at least / at most / is header, and a
 * Custom dialog whose field carries a "%" suffix where the money one carries
 * a "$" prefix.
 *
 * Icon `percent` — the node's own, and the same glyph the Taxability filter
 * uses on the other pricebook lists (the two never appear on one menu).
 */
function taxRateFilter(): FilterDef<TaxRateRow> {
  return {
    id: "taxRate",
    kind: "percent",
    noun: { one: "rate", many: "rates" },
    label: "Tax rate",
    icon: "percent",
    dsHeader: true,
    ...percentFilter((item) => item.rate),
  };
}

/** ONE registry per BRANCH, every list's rule: Status is Active-phase only. */
const build = (phase: PricebookPhase): FilterDef<TaxRateRow>[] => [
  labelsTemplate(TAX_RATE_LABELS, (item) => item.labelIds),

  lastModifiedTemplate((item) => item.lastModifiedAt),

  ...(phase === "active"
    ? [pricebookStatusTemplate<TaxRateRow>(TAX_RATE_PHASE_STATUSES.active, (item) => item.status)]
    : []),

  taxRateFilter(),
];

export const TAX_RATE_FILTERS: Record<PricebookPhase, FilterDef<TaxRateRow>[]> = {
  active: build("active"),
  inactive: build("inactive"),
};
