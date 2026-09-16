import { PricebookStatus } from "../../data/db";

import { ChargeList, ChargeRow } from "./chargesData";
import { FilterDef } from "./filterDefs";
import { discountFilter } from "./filterKinds";
import {
  costTemplate,
  labelsTemplate,
  lastModifiedTemplate,
  priceTemplate,
  pricebookStatusTemplate,
  subtypeTemplate,
  taxabilityTemplate,
} from "./filterTemplates";
import { PricebookPhase } from "./pricebookList";

// The OTHER and DISCOUNTS lists' filter registries — one module, because the
// two are one production shape and four of their rows are the same filter.
// Nodes 15368-42620 (Other) and 15368-43302 (Discounts), re-read 2026-09-16
// after Daniel acted on the design review.
//
// They were IDENTICAL when first built, which is what produced three of the
// review's flags; he pruned the Discounts menu and gave it an amount filter
// of its own, so the two now differ exactly where production does:
//
//   OTHER      Cost · Labels · Last modified · Price · Status · Subtype ·
//              Taxability — seven rows, every one a shared TEMPLATE. The
//              first pricebook list with nothing of its own.
//   DISCOUNTS  Discount · Labels · Last modified · Status · Subtype — five
//              rows. **Cost and Taxability are gone** (production offers a
//              discount neither: no cost field on its form, and "Discount
//              items cannot be taxable"), and the shared Price template is
//              replaced by the list's OWN **Discount** filter, which reads
//              the negative ladder.
//
// Both menus are alphabetical, and Status is ACTIVE-phase only on both (the
// row's own annotation).

/**
 * The statuses each ACTIVE-phase view lists — and locks. The same sets the
 * view tabs group by; the Inactive phase has no statuses at all.
 */
export const CHARGE_PHASE_STATUSES: Record<PricebookPhase, PricebookStatus[]> = {
  active: ["review", "active"],
  inactive: [],
};

/**
 * Discount — the Discounts list's OWN amount filter (section 15416-61777,
 * added by Daniel on 2026-09-16 when he renamed the row from "Price"). The
 * DISCOUNT kind: the node's ten negative presets (-$100 through -$5,000),
 * the chips-only at least / at most / is header, and a Custom dialog whose
 * field carries a "– $" prefix.
 *
 * It compares MAGNITUDES, so "at least -$500" means a discount of $500 or
 * more — see `DISCOUNT_PRESETS` for why the signed reading would say the
 * opposite of what the words do. Icon `money-bill`, the node's own, and the
 * same glyph the Price template uses on the other lists (the two never
 * appear on one menu).
 */
function discountAmountFilter(): FilterDef<ChargeRow> {
  return {
    id: "discount",
    kind: "discount",
    noun: { one: "amount", many: "amounts" },
    label: "Discount",
    icon: "money-bill",
    dsHeader: true,
    ...discountFilter((item) => item.price),
  };
}

/** Which of the two lists this registry is for — they differ in three rows. */
export type ChargeVariant = "other" | "discount";

/**
 * ONE registry per BRANCH, every list's rule. `list` carries the type's own
 * subtype and label tables (production scopes both per
 * `pricebook_item_type`), and `variant` picks the rows the two do not share.
 */
export function chargeFilters(
  list: ChargeList,
  variant: ChargeVariant,
): Record<PricebookPhase, FilterDef<ChargeRow>[]> {
  const build = (phase: PricebookPhase): FilterDef<ChargeRow>[] => [
    // Alphabetically first on either list: "Cost" on Other, "Discount" on
    // Discounts.
    ...(variant === "other" ? [costTemplate<ChargeRow>((item) => item.cost)] : [discountAmountFilter()]),

    labelsTemplate(list.labels, (item) => item.labelIds),

    lastModifiedTemplate((item) => item.lastModifiedAt),

    // OTHER only — a discount's amount is its own filter, above.
    ...(variant === "other" ? [priceTemplate<ChargeRow>((item) => item.price)] : []),

    // Only where an item HAS a status.
    ...(phase === "active"
      ? [pricebookStatusTemplate<ChargeRow>(CHARGE_PHASE_STATUSES.active, (item) => item.status)]
      : []),

    subtypeTemplate(list.subtypes, (item) => item.subtypeId),

    // OTHER only — production forbids a taxable discount.
    ...(variant === "other" ? [taxabilityTemplate<ChargeRow>((item) => item.taxable)] : []),
  ];

  return { active: build("active"), inactive: build("inactive") };
}
