import AvatarVendor from "../../components/Avatar/AvatarVendor";
import { STATUS } from "../../components/Badge/BadgePOStatus";
import { Icon } from "../../components/Icon/Icon";
import { PO_LABELS, POStatus, VENDORS } from "../../data/db";
import { semanticIcons } from "../../styles/semanticIcons";

import { DateWindowPreset, FilterDef } from "./filterDefs";
import { countFilter, dateFilter, forwardWindows, moneyFilter } from "./filterKinds";
import {
  issuedTemplate,
  labelsTemplate,
  lastModifiedTemplate,
  paymentTermsTemplate,
  seenTemplate,
  statusChangedTemplate,
} from "./filterTemplates";
import {
  CARRIER_OPTIONS,
  METHOD_OPTIONS,
  PAYMENT_TERMS_IN_USE,
  PORow,
  carrierKeyOf,
  methodKeyOf,
  paymentTermsOf,
  vendorOf,
} from "./posData";

// The POs list's filter registry — ONE entry per row of its Filters menu
// (node 14824-29890 on Daniel's POs page section 14817-88566; re-read once
// more on 2026-09-15 after the Shipping split and Est. arrival landed), in
// the menu's alphabetical order — SIXTEEN rows: Amount, Associated
// estimates, Associated invoices, Associated jobs, Est. arrival, Issued,
// Items, Labels, Last modified, Payment terms, Purchasing vendor, Seen,
// Shipping carrier, Shipping method, Status, Status changed.
//
// The standing Figma split:
//   - STATUS (section 14817-91233), PURCHASING VENDOR (14825-8429),
//     SHIPPING CARRIER (14936-42471) and SHIPPING METHOD (14954-37900 —
//     the pair that REPLACED the single combined Shipping filter),
//     EST. ARRIVAL (14951-37533), the three ASSOCIATED filters (14944-5951
//     / 14944-6209 / 14944-6307), AMOUNT (14825-18855) and ITEMS
//     (14854-31182) are object-specific and written out below;
//   - Issued, Labels, Last modified, Payment terms (PROMOTED 2026-09-15 —
//     Daniel moved its section 14944-4762 onto the shared Filter Template
//     page when the Vendors list became its second consumer), Seen and
//     Status changed are shared TEMPLATES, handed the one thing that
//     differs: how to read a PO.
//
// STATUS CHANGED is on BOTH phases (Daniel, 2026-09-15) — unlike Bills: a
// PO's status moves through the whole open phase (send → acknowledge → ship
// → deliver → stock), so the column and the filter have data everywhere.
// It also REPLACES production's seven per-status date columns (Sent /
// Acknowledged / In Transit / Delivered / Stocked / Paid / Cancelled dates)
// — Daniel: "Per-status columns are 'Status changed' data. All those columns
// should be replaced with the 'Status changed' column and filter."
//
// The templates that are NOT here — Address, Client, Location, Service, Due
// date, Received, Created at, Total, Amount due — have nothing to read: a PO
// belongs to a VENDOR (no client, location or service), has no due date and
// no received date (receiving is the Delivered → Stocked pair), and its one
// amount is named "Amount" below.

// ---- Status (object-specific) ----------------------------------------------

/** The two branches (phases) the POs page switches between. */
export type POsPhase = "open" | "closed";

/**
 * The statuses each PHASE offers, read off the two list nodes (Open
 * 14817-91234: Draft · Unsent · Sent · Acknowledged · In transit · Unstocked
 * · Unpaid, Closed 14817-91246: Paid · Cancelled) in their order — which is
 * also BadgePOStatus's own lifecycle order.
 *
 * They are the same sets the view tabs group by — see `BRANCHES` in
 * POsPage.tsx, whose views partition exactly these lists. Both come from the
 * same design; if one changes, change the other.
 */
export const PO_PHASE_STATUSES: Record<POsPhase, POStatus[]> = {
  open: ["draft", "unsent", "sent", "acknowledged", "inTransit", "unstocked", "unpaid"],
  closed: ["paid", "cancelled"],
};

/**
 * Status — the POs list's own filter (Figma section 14817-91233, a
 * Multi-Select Filter — pattern documentation 14038-14033). The invoices
 * shape exactly: the DS `SelectListHeader` in its CHIPS-ONLY variant ("is" /
 * "is not"), NO search on either phase, and rows that are a checkbox, the
 * status icon and the label, with no count.
 *
 * The icons, their colors, their rotations and the labels all come from
 * BadgePOStatus's own STATUS map — the same source the table's badges use,
 * so a status can never be spelled or coloured two ways. The nodes agree
 * with it row for row (read 2026-09-15): Draft/Unsent circle-dashed ·
 * Sent/Acknowledged circle-quarter-stroke · In transit circle-half-stroke ·
 * Unstocked/Unpaid circle-three-quarters-stroke · Paid circle-check ·
 * Cancelled circle-xmark — the progress circles, a quarter per stage.
 *
 * The menu row's own icon is a plain `circle-dashed` with NO rotation — the
 * settled rule (Daniel, 2026-09-12).
 */
function statusFilter(phase: POsPhase): FilterDef<PORow> {
  return {
    id: "status",
    noun: { one: "status", many: "statuses" },
    label: "Status",
    icon: "circle-dashed",
    hideCounts: true,
    dsHeader: true,
    options: PO_PHASE_STATUSES[phase].map((key) => ({
      id: key,
      label: STATUS[key].label,
      slotLeft: (
        <Icon
          icon={STATUS[key].icon}
          pack="solid"
          size={14}
          container="square"
          rotate={"rotate" in STATUS[key] ? (STATUS[key] as { rotate?: number }).rotate : undefined}
          style={{ color: `var(--${STATUS[key].scheme}-a9)` }}
        />
      ),
    })),
    // The stored status IS the badge — no derivation on this list.
    matches: (po, { ids }) => ids.includes(po.status),
  };
}

// ---- Purchasing vendor (object-specific) ------------------------------------

/**
 * Purchasing vendor — the supplier the order goes to (Figma section
 * 14825-8429, a Multi-Select Filter). The Bills list's Billing vendor shape
 * one for one — the Client template's header (chipGroup + "Vendor..."
 * search), xs `AvatarVendor` rows sorted A to Z, no counts, the chip's value
 * carrying the picked vendor's avatar — over the same VENDORS table. Only
 * the NAME differs: production's field is `vendor`, verbose name
 * "Purchasing Vendor", and every column, filter and chip here says so.
 *
 * The icon is `store` — the menu node's own, and the product's vendor icon
 * (`semanticIcons.vendor`).
 *
 * ALL vendors are listed, deactivated ones included — the Client template's
 * rule (Presidio Fire is deactivated and still a row): old POs point at
 * them, and a filter is for finding rows, not for creating new links.
 */
function purchasingVendorFilter(): FilterDef<PORow> {
  return {
    id: "vendor",
    noun: { one: "vendor", many: "vendors" },
    label: "Purchasing vendor",
    icon: "store",
    searchPlaceholder: "Vendor...",
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    options: [...VENDORS]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((vendor) => ({
        id: vendor.id,
        label: vendor.name,
        slotLeft: <AvatarVendor size="xs" content="image" />,
      })),
    matches: (po, { ids }) => ids.includes(vendorOf(po).id),
  };
}

// ---- Shipping carrier / Shipping method (object-specific) -------------------

/**
 * Shipping carrier and Shipping method — the SPLIT that replaced the single
 * combined "Shipping" filter (Daniel, 2026-09-15: carrier and method answer
 * different questions — "everything UPS" vs "everything expedited" — and
 * the combined values grew multiplicatively). Two Multi-Select filters of
 * the same shape (sections 14936-42471 Carrier / 14954-37900 Method): the
 * chipGroup + search header ("is" / "is not" over a "Carrier..." /
 * "Method..." search), bare checkbox rows, no counts, and the absence row
 * leading — "No carrier" / "No method".
 *
 * The rows are ALL the preset options plus the user's custom "Other" names
 * in use — both sections' own annotation — merged A to Z (see
 * `shippingFilterOptions` in posData for the ordering and empty-Other
 * rules). Production stores each half as an enum + `*_other_name` pair; the
 * COLUMN keeps printing the one combined string.
 *
 * The icons: `truck` for the carrier (the company doing the hauling) and
 * `route` for the method (the way it travels — not a speed: "Ground" is a
 * mode) — both settled 2026-09-15 after the icon strips, and both on the
 * menu node.
 */
function shippingCarrierFilter(): FilterDef<PORow> {
  return {
    id: "shippingCarrier",
    noun: { one: "carrier", many: "carriers" },
    label: "Shipping carrier",
    icon: "truck",
    searchPlaceholder: "Carrier...",
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    options: [{ id: "none", label: "No carrier" }, ...CARRIER_OPTIONS],
    matches: (po, { ids }) => ids.includes(carrierKeyOf(po)),
  };
}

function shippingMethodFilter(): FilterDef<PORow> {
  return {
    id: "shippingMethod",
    noun: { one: "method", many: "methods" },
    label: "Shipping method",
    icon: "route",
    searchPlaceholder: "Method...",
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    options: [{ id: "none", label: "No method" }, ...METHOD_OPTIONS],
    matches: (po, { ids }) => ids.includes(methodKeyOf(po)),
  };
}

// ---- Est. arrival (object-specific) -----------------------------------------

/**
 * Est. arrival — when the shipment should land (production
 * `estimated_arrival_time`; section 14951-37533, added 2026-09-15): a
 * FORWARD-window Timeframe, the Scheduled for shape — "No arrival date"
 * leads (the ABSENCE row: a PO can have no ETA), then "Late" (the past
 * window, worded for a shipment — the copy settled with Daniel: an arrival
 * is not "due", it is late; the same date-only nuance as the Overdue
 * window — it also lists past-ETA orders that already arrived, where the
 * red Est. arrival CELL shows only while In transit), then the six shared
 * future windows over "Custom...". A preset chip renders without the
 * condition box; a custom value is a regular Timeframe (the section's two
 * annotations, the Due date ones word for word).
 *
 * The icon is `arrow-down-to-line` — coming down onto the line = arriving
 * (settled 2026-09-15 from the icon strip; `truck-clock` lost to the
 * two-trucks problem, `calendar-clock` to the family look).
 */
const EST_ARRIVAL_WINDOWS: DateWindowPreset[] = [
  { id: "noDate", label: "No arrival date", absent: true },
  ...forwardWindows("Late"),
];

function estArrivalFilter(): FilterDef<PORow> {
  return {
    id: "estArrival",
    kind: "date",
    noun: { one: "date", many: "dates" },
    label: "Est. arrival",
    icon: "arrow-down-to-line",
    dateWindows: EST_ARRIVAL_WINDOWS,
    ...dateFilter((po) => po.estimatedArrivalAt, EST_ARRIVAL_WINDOWS),
  };
}

// ---- Amount (object-specific) -----------------------------------------------

/**
 * Amount — the order's money (Figma section 14825-18855, an "Amount" filter —
 * pattern documentation 13874-10420): the MONEY kind unchanged over the PO's
 * `amount` (production `subtotal`, the line items' rollup and a PO's only
 * money field) — the shared eight presets over "Custom...", the chips-only
 * at least / at most / is header, the "$" Custom dialog. One preset table,
 * one formatter, no new branch — what the machinery is shared for. Only the
 * NAME is this list's own: the column heads "Amount", so the filter does too
 * (the Estimates/Invoices twin is "Total").
 *
 * The icon is `money-bill` — the menu node's own, the plain-amount glyph.
 */
function amountFilter(): FilterDef<PORow> {
  return {
    id: "amount",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Amount",
    icon: "money-bill",
    dsHeader: true,
    ...moneyFilter((po) => po.amount),
  };
}

// ---- Items (object-specific) ------------------------------------------------

/**
 * Items — how many line items the order carries (Figma section 14854-31182,
 * an "Amount" filter — its annotation links the shared Amount documentation):
 * the COUNT kind, the Series list's Open jobs machinery one for one — "None"
 * over the 1 · 2 · 5 · 10 · 20 · 50 ladder and "Custom...", the chips-only
 * at least / at most / is header, the bare-number Custom dialog. "None" is
 * the COMPLETE row (a just-created draft holds nothing yet) and its chip
 * renders without the condition box.
 *
 * The icon is `box-taped` — the menu node's own, and the DS PRODUCT icon
 * (`semanticIcons.product`): every PO line item is a part or material, so
 * the filter wears the icon the system already uses for that object.
 */
function itemsFilter(): FilterDef<PORow> {
  return {
    id: "items",
    kind: "count",
    noun: { one: "amount", many: "amounts" },
    label: "Items",
    icon: semanticIcons.product,
    dsHeader: true,
    ...countFilter((po) => po.itemCount),
  };
}

// ---- the Associated trio (object-specific) ----------------------------------

/**
 * Associated estimates / jobs / invoices — is the order linked to any
 * (Figma sections 14944-5951 / 14944-6209 / 14944-6307, added 2026-09-15
 * after the design review settled the shape): PRESENCE, not identity. In
 * production the links live on the PO's line items (M2M per line), so one
 * order can point at many of each and the option list would be every object
 * in the workspace — the wrong shape for a filter. The real question is
 * "which orders are job-driven and which are stock" — so the list is two
 * rows, None · Has any, SINGLE-select, with NO conditions anywhere: no
 * header chips in the list and no condition box on the chip (each row is a
 * complete answer and the other's opposite — see `FilterDef.noConditions`).
 * Finding the orders OF one specific job stays a search question — the
 * keyword search matches associated ids (see POsPage).
 *
 * Each filter wears its OBJECT's own icon — `clock` / `wrench-simple` /
 * `circle-dollar`, the DS entity icons, the menu node's own rows.
 */
function associatedFilter(
  id: "associatedEstimates" | "associatedInvoices" | "associatedJobs",
  label: string,
  icon: string,
  idsOf: (po: PORow) => string[],
): FilterDef<PORow> {
  return {
    id,
    noun: { one: "option", many: "options" },
    label,
    icon,
    hideCounts: true,
    singleSelect: true,
    noConditions: true,
    options: [
      { id: "none", label: "None" },
      { id: "any", label: "Has any" },
    ],
    matches: (po, { ids }) => ids.includes(idsOf(po).length === 0 ? "none" : "any"),
  };
}

// ---- the registry ----------------------------------------------------------

/**
 * ONE registry per BRANCH, the other pages' rule: the Status filter's
 * options differ between them. Everything else — Status changed included
 * (both phases, Daniel's ruling) — is the same object on both.
 *
 * The menu lists them alphabetically, the order its own node draws
 * (14824-29890): Amount, Associated estimates, Associated invoices,
 * Associated jobs, Issued, Items, Labels, Last modified, Payment terms,
 * Purchasing vendor, Seen, Shipping, Status, Status changed.
 */
const buildPOFilters = (phase: POsPhase): FilterDef<PORow>[] => [
  amountFilter(),

  associatedFilter(
    "associatedEstimates",
    "Associated estimates",
    semanticIcons.estimate,
    (po) => po.associatedEstimateIds,
  ),
  associatedFilter(
    "associatedInvoices",
    "Associated invoices",
    semanticIcons.invoice,
    (po) => po.associatedInvoiceIds,
  ),
  associatedFilter("associatedJobs", "Associated jobs", semanticIcons.job, (po) => po.associatedJobIds),

  estArrivalFilter(),

  issuedTemplate((po) => po.issuedAt),

  itemsFilter(),

  // POs carry their OWN label table (production `PurchaseOrderLabel` — see
  // PO_LABELS in the db), which is exactly the parameter the template takes.
  labelsTemplate(PO_LABELS, (po) => po.labelIds),

  lastModifiedTemplate((po) => po.lastModifiedAt),

  // The PROMOTED template (2026-09-15 — Daniel moved its section onto the
  // shared page; the Vendors list is its second consumer). The value is the
  // VENDOR's property (the section's own annotation): nothing is stored on
  // the PO, so this filter effectively groups the list by its vendors'
  // terms — which is also why the values in use count only the vendors that
  // HAVE orders (see posData).
  paymentTermsTemplate(PAYMENT_TERMS_IN_USE, paymentTermsOf),

  purchasingVendorFilter(),

  // The VENDOR opened the sent order — production's `last_viewed`, the same
  // field the Seen column reads.
  seenTemplate((po) => po.lastViewedAt ?? null),

  shippingCarrierFilter(),

  shippingMethodFilter(),

  statusFilter(phase),

  statusChangedTemplate((po) => po.statusChangedAt),
];

export const PO_FILTERS: Record<POsPhase, FilterDef<PORow>[]> = {
  open: buildPOFilters("open"),
  closed: buildPOFilters("closed"),
};
