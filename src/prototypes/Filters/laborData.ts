import { STATUS } from "../../components/Badge/BadgePricebookStatus";
import { LABOR_ITEMS, LABOR_LABELS, LABOR_SUBTYPES, LaborItem, PricebookStatus } from "../../data/db";

// The Labor list's data door — a READER over the shared demo database, like
// the other lists' (Daniel, 2026-09-11: "each row gets the data from the
// db"). The labor table lives in src/data/db (`LABOR_ITEMS` — the 12
// `SERVICES` rows seen from the pricebook side, plus the rest of the catalog,
// the Review inbox and the inactive shelf); this module derives the display
// values and keeps the lookups.
//
// LABOR IS THE PRICEBOOK'S SERVICE TYPE — production `PriceBookItem` with
// `pricebook_item_type = 1`, the design's "Labor" page under Pricebook. The
// rows hang off nothing: no client, no vendor, no location — the first list
// whose lookups are only its own reference tables (subtypes and labels).
//
// STATUS — the two-state review model over production's boolean `confirmed`
// (Daniel, 2026-09-16: the status is CALLED "Active", the view tab stays
// "Confirmed"): "review" = confirmed false, an item the system minted from a
// free-text line item; "active" = confirmed. NOTHING is clock-derived, and
// the status is an ACTIVE-phase concept only — the Inactive phase is one
// bucket, its rows keep their stored value but no column, filter or view
// reads it (the standing decision: the UI cannot create a "review +
// inactive" item, and a reactivated item always comes back confirmed).

/** The db row itself — the list renders it directly. */
export type LaborRow = LaborItem;

/**
 * Every labor item in the database, sorted name A-Z — the neutral base; each
 * view applies its own default on top (the All Active view leads with the
 * Review items, production's `confirmed,description`).
 */
export const LABOR_ROWS: LaborRow[] = [...LABOR_ITEMS].sort((a, b) => a.name.localeCompare(b.name));

// ---- derivations -----------------------------------------------------------

/** The status's own label, straight from BadgePricebookStatus — never a second copy. */
export const laborStatusLabel = (status: PricebookStatus) => STATUS[status].label;

/**
 * "$165.00/hr" / "$260.00" — the Cost and Rate cells' print: the shared
 * currency format with production's own "/hr" suffix when the item's unit
 * type is Hourly (production `NumericalDataCell type="value-hour"`, which
 * appends it exactly when `default_unit_type_label === "Hourly"`).
 */
export const perUnitSuffix = (item: LaborRow) => (item.unitType === "hourly" ? "/hr" : "");

/** The Unit type filter's two option labels — production `LineItemUnitType`. */
export const UNIT_TYPE_LABELS: Record<LaborRow["unitType"], string> = {
  hourly: "Hourly",
  flatRate: "Flat rate",
};

// ---- lookups ---------------------------------------------------------------

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

const SUBTYPE_BY_ID = byId(LABOR_SUBTYPES);
const LABEL_BY_ID = byId(LABOR_LABELS);

/** The subtype's name, or null — the cell shows the DS "No value" placeholder. */
export const subtypeNameOf = (item: LaborRow): string | null =>
  item.subtypeId == null ? null : (SUBTYPE_BY_ID.get(item.subtypeId)?.name ?? null);

export const labelsOf = (item: LaborRow) => item.labelIds.map((id) => LABEL_BY_ID.get(id)!);
