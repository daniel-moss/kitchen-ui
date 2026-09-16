import { STATUS } from "../../components/Badge/BadgePricebookStatus";
import { PricebookStatus, TAX_RATE_ITEMS, TAX_RATE_LABELS, TaxRateItem } from "../../data/db";

// The TAX RATES list's data door — a READER over the shared demo database.
// The table lives in src/data/db (`TAX_RATE_ITEMS`), and its first four rows
// are the SAME records the Clients list already reads for its "Default tax
// rate" filter (`TAX_RATES`), joined by id — the LABOR_ITEMS ⊇ SERVICES
// arrangement, so a rate can never disagree between the two places.
//
// The leanest pricebook type: production gives a tax item NO cost, NO
// taxability and NO subtype, and its one amount (`default_price`) is a
// PERCENT it validates at 100 or below.

/** The db row itself — the list renders it directly. */
export type TaxRateRow = TaxRateItem;

/** Every tax rate, sorted name A-Z — the neutral base. */
export const TAX_RATE_ROWS: TaxRateRow[] = [...TAX_RATE_ITEMS].sort((a, b) => a.name.localeCompare(b.name));

/** The status's own label, straight from BadgePricebookStatus. */
export const taxRateStatusLabel = (status: PricebookStatus) => STATUS[status].label;

const LABEL_BY_ID = new Map(TAX_RATE_LABELS.map((label) => [label.id, label]));

export const labelsOf = (item: TaxRateRow) => item.labelIds.map((id) => LABEL_BY_ID.get(id)!);
