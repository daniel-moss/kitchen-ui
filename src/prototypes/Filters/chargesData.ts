import { STATUS } from "../../components/Badge/BadgePricebookStatus";
import {
  ChargeItem,
  DISCOUNT_ITEMS,
  DISCOUNT_LABELS,
  DISCOUNT_SUBTYPES,
  OTHER_ITEMS,
  OTHER_LABELS,
  OTHER_SUBTYPES,
  PricebookLabel,
  PricebookStatus,
  PricebookSubtype,
} from "../../data/db";

// The OTHER and DISCOUNTS lists' data door — ONE module, because the two are
// one production shape (`ChargeItem`, PriceBookItem types 3 and 4) and the
// design's two Filters menus are identical row for row. Each list brings its
// own tables; everything else is written once.
//
// Added 2026-09-16 with the two lists. The rows hang off nothing — no client,
// no vendor, no location — like every pricebook list.
//
// The two DIFFER in their data, and the rules are production's: a discount's
// price is zero or NEGATIVE, and it carries neither a cost nor a taxable flag
// (production's form offers neither, and its import rejects a taxable
// discount). Those fields still exist on the shared model, held at their
// defaults — see `ChargeItem` in the db.

/** The db row itself — the lists render it directly. */
export type ChargeRow = ChargeItem;

/** The status's own label, straight from BadgePricebookStatus. */
export const chargeStatusLabel = (status: PricebookStatus) => STATUS[status].label;

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

/**
 * One list's lookups over its OWN reference tables — production scopes both
 * subtypes and labels to a single `pricebook_item_type`, so Other and
 * Discounts pass different tables into the same three functions.
 */
function chargeLookups(subtypes: PricebookSubtype[], labels: PricebookLabel[]) {
  const subtypeById = byId(subtypes);
  const labelById = byId(labels);
  return {
    subtypes,
    labels,
    /** The subtype's name, or null — the cell shows the DS "No value" placeholder. */
    subtypeNameOf: (item: ChargeRow): string | null =>
      item.subtypeId == null ? null : (subtypeById.get(item.subtypeId)?.name ?? null),
    labelsOf: (item: ChargeRow) => item.labelIds.map((id) => labelById.get(id)!),
  };
}

/** Sorted name A-Z — the neutral base; each view applies its own default. */
const sortedByName = (rows: ChargeRow[]) => [...rows].sort((a, b) => a.name.localeCompare(b.name));

export const OTHER = {
  rows: sortedByName(OTHER_ITEMS),
  ...chargeLookups(OTHER_SUBTYPES, OTHER_LABELS),
};

export const DISCOUNTS = {
  rows: sortedByName(DISCOUNT_ITEMS),
  ...chargeLookups(DISCOUNT_SUBTYPES, DISCOUNT_LABELS),
};

/** What one of the two lists brings — its rows and its own lookups. */
export type ChargeList = typeof OTHER;

/**
 * The row's readable text, lower-cased — what the keyword search matches:
 * the name, the subtype, the summary, the label names and (on active items)
 * the status label. Production's `filter_keywords` covers description,
 * summary and label names; the extras are my choice, FLAGGED like every
 * list's.
 */
export const chargeSearch = (list: ChargeList) => (item: ChargeRow) =>
  [
    item.name,
    list.subtypeNameOf(item) ?? "",
    item.summary,
    ...list.labelsOf(item).map((label) => label.name),
    item.isActive ? chargeStatusLabel(item.status) : "",
  ]
    .join(" ")
    .toLowerCase();
