import AvatarVendor from "../../components/Avatar/AvatarVendor";
import { VENDOR_LABELS, VENDORS } from "../../data/db";

import { FilterDef, FilterOption } from "./filterDefs";
import { countFilter, moneyFilter } from "./filterKinds";
import { billingAddressTemplate, createdAtTemplate, labelsTemplate, lastModifiedTemplate, paymentTermsTemplate } from "./filterTemplates";
import {
  PAYMENT_TERMS_IN_USE,
  VendorRow,
  billingAddressParts,
  commitmentsOf,
  currentPOsOf,
  payablesOf,
} from "./vendorsData";

// The VENDORS list's filter registry — ONE entry per row of its Filters menu
// (the menu node in section 14831-31010 on Daniel's "↳ Vendors" page
// 14831-30339, re-read 2026-09-15 after he settled the three new filters and
// fixed the row order, and again 2026-09-16 after he added Created at), in
// the menu's alphabetical order — NINE rows: Billing address, Bills via,
// Commitments, Created at, Current POs, Labels, Last modified, Payables,
// Payment terms.
//
// ONE registry for BOTH phases: there is no Status filter (a vendor has no
// status — the Active/Inactive phase is the `isActive` flag, page context
// like every branch) and nothing is phase-only.
//
// The standing Figma split:
//   - BILLING ADDRESS (section 14947-34564), BILLS VIA (14963-43879),
//     COMMITMENTS (14963-44960), CURRENT POS (14947-34881) and PAYABLES
//     (14963-45576) are object-specific and written out below;
//   - Labels, Last modified, Payment terms (its section 14944-4762 moved
//     onto the shared Filter Template page on 2026-09-15, when this list
//     became its second consumer) and Created at (added 2026-09-16 — Daniel:
//     "we do need 'Created at' on 'Vendors' and 'Clients'"; the menu node
//     draws the row, calendar-plus) are shared TEMPLATES, handed the one
//     thing that differs: how to read a VENDOR.
//
// The templates that are NOT here — Client, Location, Service, the document
// dates (Issued / Received / Due date / Status changed), Seen, Total — have
// nothing to read: a vendor is the supplier DIRECTORY, not a document. Its
// three numbers are the derived aggregates in vendorsData.

// ---- Billing address (the shared template) -----------------------------------

// The shared `billingAddressTemplate` since the 2026-09-16 Freeform
// reorganisation (its section 14947-34564, built on the Freeform kind
// 14100-36446) — this list carried an identical local copy before. The
// reader is the vendor's own `billing_*` parts (vendorsData).

// ---- Bills via (object-specific) ---------------------------------------------

/**
 * Bills via — who the bills arrive from (production
 * `default_billing_vendor`; Figma section 14963-43879, a Multi-Select
 * Filter). The Billing vendor shape — chipGroup + "Vendor..." search header
 * ("is" / "is not"), xs `AvatarVendor` rows A to Z, no counts, the chip's
 * value carrying the picked vendor's avatar — with ONE row of its own:
 * "SAME VENDOR" leads the list (the node's own first row, drawn WITHOUT an
 * avatar), the absence value — the vendors that bill directly, production's
 * null. "Is not Same vendor" therefore means "bills through someone", the
 * absence-row rule.
 *
 * ALL vendors are listed, deactivated ones included — the Client template's
 * rule. The chip's noun says "vendors" even when "Same vendor" is among the
 * picks — the near-enough word; FLAGGED with Daniel 2026-09-15, no ruling
 * asked.
 *
 * The icon is `money-bill-transfer` — a bill with transfer arrows, billing
 * routed through another vendor (settled 2026-09-15; the menu node draws it).
 */
function billsViaFilter(): FilterDef<VendorRow> {
  return {
    id: "billsVia",
    noun: { one: "vendor", many: "vendors" },
    label: "Bills via",
    icon: "money-bill-transfer",
    searchPlaceholder: "Vendor...",
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    options: [
      { id: "same", label: "Same vendor" },
      ...[...VENDORS]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((vendor) => ({
          id: vendor.id,
          label: vendor.name,
          slotLeft: <AvatarVendor size="xs" content="image" />,
        })),
    ],
    matches: (vendor, { ids }) => ids.includes(vendor.billsViaId ?? "same"),
  };
}

// ---- Commitments / Payables (object-specific) --------------------------------

/**
 * Commitments — the money committed on the vendor's current POs (Figma
 * section 14963-44960, an "Amount" filter — documentation 13874-10420): the
 * MONEY kind unchanged over the derived aggregate — the shared eight presets
 * over "Custom...", the chips-only at least / at most / is header, the "$"
 * Custom dialog. The FORMULA is Daniel's five-status ruling, not
 * production's — see vendorsData.
 *
 * The icon is `handshake` — a commitment is an agreement to honor (settled
 * 2026-09-15; the menu node draws it).
 */
function commitmentsFilter(): FilterDef<VendorRow> {
  return {
    id: "commitments",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Commitments",
    icon: "handshake",
    dsHeader: true,
    ...moneyFilter(commitmentsOf),
  };
}

/**
 * Payables — the money owed on the vendor's outstanding bills (Figma section
 * 14963-45576, the same "Amount" shape as Commitments over the other derived
 * aggregate — production's `outstanding_payables`, see vendorsData).
 *
 * The icon is `file-invoice-dollar` — the BILL semantic icon (the sidebar's
 * Bills item): the filter sums bills, so it wears the bill icon — the Open
 * jobs wears-the-object-icon precedent (settled 2026-09-15; the menu node
 * draws it).
 */
function payablesFilter(): FilterDef<VendorRow> {
  return {
    id: "payables",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Payables",
    icon: "file-invoice-dollar",
    dsHeader: true,
    ...moneyFilter(payablesOf),
  };
}

// ---- Current POs (object-specific) -------------------------------------------

/**
 * The Current POs ladder — the node's own steps (14947-34881, updated by
 * Daniel 2026-09-15): DENSER low numbers and no 50, because a vendor holds a
 * handful of open orders, not fifty. The first count filter with a ladder of
 * its own; the shared COUNT_PRESETS table resolves every id.
 */
const CURRENT_PO_LADDER = ["none", "1", "2", "3", "4", "5", "10", "15", "20"];

/**
 * Current POs — how many open purchase orders the vendor has (Figma section
 * 14947-34881; its annotation links the shared Amount documentation): the
 * COUNT kind — the Open jobs / Items machinery over its OWN ladder (above) —
 * "None" leading, "Custom...", the chips-only at least / at most / is
 * header, the bare-number Custom dialog. "None" is the COMPLETE row and its
 * chip renders without the condition box.
 *
 * The icon is `basket-shopping` — the PO object icon
 * (`semanticIcons.purchaseOrder`), the filter counts POs. The node writes
 * the glyph's alias "shopping-basket"; the DS ships it as `basket-shopping`.
 */
function currentPOsFilter(): FilterDef<VendorRow> {
  return {
    id: "currentPOs",
    kind: "count",
    noun: { one: "amount", many: "amounts" },
    label: "Current POs",
    icon: "basket-shopping",
    dsHeader: true,
    ...countFilter(currentPOsOf, CURRENT_PO_LADDER),
  };
}

// ---- the registry ----------------------------------------------------------

/**
 * ONE registry, both phases. The menu lists them alphabetically, the order
 * the node draws (after Daniel fixed the Bills via / Billing address swap on
 * 2026-09-15 and added Created at on 2026-09-16): Billing address, Bills
 * via, Commitments, Created at, Current POs, Labels, Last modified,
 * Payables, Payment terms.
 */
export const VENDOR_FILTERS: FilterDef<VendorRow>[] = [
  billingAddressTemplate(billingAddressParts),

  billsViaFilter(),

  commitmentsFilter(),

  // The shared template (calendar-plus) over the db's new `createdAt` —
  // every vendor has one, so no absence handling. The COLUMN pairs with it
  // since 2026-09-16 (Daniel: "Clients and Vendors should have a 'Created
  // at' column") — see vendorsTable.
  createdAtTemplate((vendor) => vendor.createdAt),

  currentPOsFilter(),

  // Vendors carry their OWN label table (production `VendorLabel` — see
  // VENDOR_LABELS in the db), which is exactly the parameter the template
  // takes.
  labelsTemplate(VENDOR_LABELS, (vendor) => vendor.labelIds),

  lastModifiedTemplate((vendor) => vendor.lastModifiedAt),

  payablesFilter(),

  // The PROMOTED template (2026-09-15 — its section 14944-4762 sits on the
  // shared Filter Template page now; the menu row's doc link points there).
  // Here the value is the row's OWN field, and every vendor contributes to
  // the values in use — both phases (see vendorsData).
  paymentTermsTemplate(PAYMENT_TERMS_IN_USE, (vendor) => vendor.paymentTerms),
];
