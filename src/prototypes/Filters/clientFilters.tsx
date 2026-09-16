import AvatarClient from "../../components/Avatar/AvatarClient";
import { Icon } from "../../components/Icon/Icon";
import { IconPack } from "../../components/Icon/Icon.types";
import { CLIENT_LABELS, IndustryType, TAX_RATES } from "../../data/db";
import { semanticIcons } from "../../styles/semanticIcons";

import { FilterDef, FilterOption, MONEY_LADDER } from "./filterDefs";
import { countFilter, moneyFilter } from "./filterKinds";
import { billingAddressTemplate, createdAtTemplate, labelsTemplate, lastModifiedTemplate } from "./filterTemplates";
import {
  CLIENT_ROWS,
  ClientRow,
  ESTIMATE_NETS_IN_USE,
  INVOICE_NETS_IN_USE,
  billingAddressParts,
  billingIntentionOf,
  creditBalanceOf,
  creditLimitOf,
  formatEstimateNet,
  locationsCountOf,
  outstandingBalanceOf,
  taxRateOf,
} from "./clientsData";
import { formatPaymentTerms } from "./listData";

// The CLIENTS list's filter registry — ONE entry per row of its Filters menu
// (the menu node on Daniel's "↳ Clients" page 14947-35514, re-read 2026-09-16
// after he settled the four icons, the Industry "No industry" row and the
// Clients-own Default payment terms section), in the menu's alphabetical
// order — FOURTEEN rows: Available invoice credit, Billing address, Bills to,
// Created at, Credit limit, Default estimate expiration, Default payment
// terms, Default tax rate, Industry, Labels, Last modified, Locations,
// Outstanding balance, Type.
//
// ONE registry for BOTH phases: there is no Status filter (a client has no
// status — the Active/Inactive phase is the `isActive` flag, page context
// like Vendors) and nothing is phase-only.
//
// The standing Figma split:
//   - AVAILABLE INVOICE CREDIT (section 14970-61844), BILLING ADDRESS
//     (the shared Address section 14947-34564), BILLS TO (14970-59620),
//     CREDIT LIMIT (14970-58966), DEFAULT ESTIMATE EXPIRATION (14970-60678),
//     DEFAULT PAYMENT TERMS (15047-67829 — the CLIENTS-OWN section Daniel
//     split off the shared Payment Terms template: the label says "Default",
//     the absence row "No default" where the template's says "No terms"),
//     DEFAULT TAX RATE (14970-60917), INDUSTRY (14970-46445), LOCATIONS
//     (14970-59990), OUTSTANDING BALANCE (14970-61205) and TYPE (14970-46189)
//     are object-specific and written out below;
//   - Created at, Labels and Last modified are shared TEMPLATES, handed the
//     one thing that differs: how to read a CLIENT.
//
// The templates that are NOT here — Client, Location, Service, the document
// dates (Issued / Received / Due date / Status changed), Seen, Total — have
// nothing to read: a client is the customer DIRECTORY, not a document. Its
// outstanding balance is the derived aggregate in clientsData.

const icon = (name: string, pack: IconPack = "regular") => <Icon icon={name} pack={pack} size={14} container="square" />;

// ---- Type (object-specific) --------------------------------------------------

/**
 * Type — Business or Individual (production `client_type`, a required
 * two-value field; Figma section 14970-46189, annotated "Single-select. Only
 * one selected option at a time" — the Jobs Type arrangement). The chips-only
 * DS header ("is" / "is not", no search — two rows need none), and the rows
 * KEEP their icons: the node draws the CLIENT TYPE tokens' own glyphs —
 * `building` (--client-business) and `user` (--client-individual).
 *
 * The menu icon is `shapes` — Daniel's established Type glyph (the Jobs and
 * Credit notes lists' rows wear it too).
 */
function typeFilter(): FilterDef<ClientRow> {
  return {
    id: "type",
    noun: { one: "type", many: "types" },
    label: "Type",
    icon: "shapes",
    hideCounts: true,
    dsHeader: true,
    singleSelect: true,
    options: [
      { id: "business", label: "Business", slotLeft: icon(semanticIcons.clientBusiness) },
      { id: "individual", label: "Individual", slotLeft: icon(semanticIcons.clientIndividual) },
    ],
    matches: (client, { ids }) => ids.includes(client.clientType === "Business" ? "business" : "individual"),
  };
}

// ---- Industry (object-specific) ----------------------------------------------

/**
 * Industry — the client's sector (production `industry_type`, a FIXED enum:
 * the same four options for every company, NOT company-written like labels
 * or tax rates — so the list never needs the values-in-use rule). A
 * MULTI-select since Daniel's 2026-09-16 update (section 14970-46445): the
 * chips-only header, no search, and "NO INDUSTRY" leading — the field is
 * optional in production, so the absence is a pickable answer.
 *
 * The icon is `industry` — the `--client-industry` token Daniel added for it
 * (2026-09-16).
 */
const INDUSTRY_OPTIONS: { id: string; industry: IndustryType }[] = [
  { id: "commercial", industry: "Commercial" },
  { id: "government", industry: "Government" },
  { id: "industrial", industry: "Industrial" },
  { id: "residential", industry: "Residential" },
];

function industryFilter(): FilterDef<ClientRow> {
  return {
    id: "industry",
    noun: { one: "industry", many: "industries" },
    label: "Industry",
    icon: semanticIcons.clientIndustry,
    hideCounts: true,
    dsHeader: true,
    // "No industry" FIRST, then the four fixed values in the node's A-to-Z
    // order.
    options: [
      { id: "none", label: "No industry" },
      ...INDUSTRY_OPTIONS.map((option) => ({ id: option.id, label: option.industry })),
    ],
    matches: (client, { ids }) => {
      if (client.industryType == null) return ids.includes("none");
      const id = INDUSTRY_OPTIONS.find((option) => option.industry === client.industryType)?.id;
      return id != null && ids.includes(id);
    },
  };
}

// ---- Bills to (object-specific) ----------------------------------------------

/**
 * Bills to — who receives the client's invoices (production
 * `default_billing_intention` + `default_billing_client`; Figma section
 * 14970-59620, a Multi-Select Filter — its annotation: "The list contains
 * all the existing clients"). The Client template's shape — chipGroup +
 * "Client..." search header, xs `AvatarClient` rows A to Z, no counts — with
 * TWO rows of its own leading the list, drawn WITHOUT avatars:
 *
 *   "SAME CLIENT" — the client bills itself (production's SERVICE_CLIENT,
 *   the legacy copy "This Client");
 *   "LOCATION" — each service location is billed (production's
 *   SERVICE_LOCATION, the field's own default — production leaves this CELL
 *   blank, which is the Bills-via lesson: the filter gives the value words).
 *
 * Then every client A to Z (deactivated included — the Client template's
 * rule): picking one lists the clients billed to THAT client
 * (production's DIFFERENT_CLIENT + the named `default_billing_client`).
 *
 * The icon is `money-bill-transfer` — billing routed elsewhere, the Vendors
 * list's "Bills via" pair (Daniel picked the reuse 2026-09-16; the two
 * filters never appear on one list).
 */
function billsToFilter(): FilterDef<ClientRow> {
  return {
    id: "billsTo",
    noun: { one: "option", many: "options" },
    label: "Bills to",
    icon: "money-bill-transfer",
    searchPlaceholder: "Client...",
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    options: [
      { id: "same", label: "Same client" },
      { id: "location", label: "Location" },
      ...[...CLIENT_ROWS].map((client) => ({
        id: client.id,
        label: client.name,
        // The node's rows draw the `building` GLYPH avatar (icon content) —
        // NOT the shared Client template's generic company IMAGE; the two
        // nodes differ and each build follows its own.
        slotLeft: <AvatarClient size="xs" />,
      })),
    ],
    matches: (client, { ids }) => {
      const intention = billingIntentionOf(client);
      if (intention === "client") return ids.includes("same");
      if (intention === "location") return ids.includes("location");
      return client.defaultBillingClientId != null && ids.includes(client.defaultBillingClientId);
    },
  };
}

// ---- Billing address (object-specific) ---------------------------------------

// Billing address is the shared `billingAddressTemplate` since the
// 2026-09-16 Freeform reorganisation (its section 14947-34564, built on the
// Freeform kind 14100-36446) — this list carried an identical local copy
// before. The reader is the client's own `billing_*` parts (clientsData).

// ---- the money trio (object-specific) ----------------------------------------

/**
 * Credit limit — the client's configured ceiling (production `credit_limit`;
 * Figma section 14970-58966, an "Amount" filter — documentation 13874-10420):
 * the MONEY kind over the shared eight presets, led by "NO CREDIT LIMIT" —
 * the first ABSENT amount row (see `AmountPreset.absent`): production allows
 * a client with no limit at all, which is not a client with a $0 limit. No
 * condition applies to it and its chip renders without the condition box,
 * the "None" arrangement.
 *
 * The icon is `gauge-high` — the `--credit-limit` token Daniel added for it
 * (2026-09-16): a capacity dial near its top.
 */
function creditLimitFilter(): FilterDef<ClientRow> {
  return {
    id: "creditLimit",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Credit limit",
    icon: semanticIcons.creditLimit,
    dsHeader: true,
    ...moneyFilter(creditLimitOf, ["noLimit", ...MONEY_LADDER]),
  };
}

/**
 * Outstanding balance — what the client currently owes (production computes
 * it on request; see clientsData's derivation). Figma section 14970-61205,
 * the same Amount shape, led by "NO BALANCE" — a COMPLETE row: exactly zero
 * owed (every client HAS a balance; zero is its empty).
 *
 * The icon is `scale-unbalanced` (Daniel picked it 2026-09-16) — a tipped
 * scale, a balance not settled.
 */
function outstandingBalanceFilter(): FilterDef<ClientRow> {
  return {
    id: "outstandingBalance",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Outstanding balance",
    icon: "scale-unbalanced",
    dsHeader: true,
    ...moneyFilter(outstandingBalanceOf, ["noBalance", ...MONEY_LADDER]),
  };
}

/**
 * Available invoice credit — production's `credit_balance` ("Available
 * Credit" in the legacy card), the money the client can put toward invoices.
 * Figma section 14970-61844, the same Amount shape, led by "NO CREDIT" — a
 * COMPLETE zero row like "No balance".
 *
 * The icon is `circle-dollar` — the node's own: the INVOICE object icon
 * (`--invoice`), and this is invoice credit. The two never collide: no other
 * row of THIS menu wears it.
 */
function availableCreditFilter(): FilterDef<ClientRow> {
  return {
    id: "availableCredit",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Available invoice credit",
    icon: semanticIcons.invoice,
    dsHeader: true,
    ...moneyFilter(creditBalanceOf, ["noCredit", ...MONEY_LADDER]),
  };
}

// ---- Locations (object-specific) ---------------------------------------------

/**
 * The Locations ladder — the node's own steps (14970-59990): the Current POs
 * ladder again — DENSER low numbers and no 50, because a client holds a
 * handful of sites, not fifty. The shared COUNT_PRESETS table resolves every
 * id; "None" is the COMPLETE row (Marisol's Kitchen Truck has no location
 * yet).
 */
const LOCATIONS_LADDER = ["none", "1", "2", "3", "4", "5", "10", "15", "20"];

/**
 * Locations — how many service locations the client has (production
 * annotates `location_count`; Figma section 14970-59990, an Amount filter):
 * the COUNT kind over its own ladder, the Current POs machinery unchanged.
 *
 * The icon is `location-dot` — the LOCATION object's own, the node's pick.
 */
function locationsFilter(): FilterDef<ClientRow> {
  return {
    id: "locations",
    kind: "count",
    noun: { one: "amount", many: "amounts" },
    label: "Locations",
    icon: "location-dot",
    dsHeader: true,
    ...countFilter(locationsCountOf, LOCATIONS_LADDER),
  };
}

// ---- the three defaults (object-specific) ------------------------------------

/**
 * Default estimate expiration — how long the client's estimates stay valid
 * (production `default_estimate_net`, bare days; Figma section 14970-60678,
 * a Multi-Select whose options are "Only the actual values that exist on the
 * list" — the node's own annotation). Chips-only header, no search — the
 * values are few — bare rows led by "NO DEFAULT": an empty field falls back
 * to the company default. The chip counts "N options".
 *
 * The icon is `clock` — the ESTIMATE object icon (`--estimate`), which
 * Daniel confirmed is exactly why it fits here (2026-09-16): the estimate
 * object, and time running out, in one glyph.
 */
function estimateExpirationFilter(): FilterDef<ClientRow> {
  return {
    id: "estimateExpiration",
    noun: { one: "option", many: "options" },
    label: "Default estimate expiration",
    icon: semanticIcons.estimate,
    hideCounts: true,
    dsHeader: true,
    options: [
      { id: "none", label: "No default" },
      ...ESTIMATE_NETS_IN_USE.map((days) => ({ id: String(days), label: formatEstimateNet(days) })),
    ],
    matches: (client, { ids }) => {
      const days = client.defaultEstimateNet;
      return ids.includes(days == null ? "none" : String(days));
    },
  };
}

/**
 * Default payment terms — the client's net-days terms (production
 * `default_invoice_net`; the legacy column heads it "Terms"). The CLIENTS-OWN
 * section 15047-67829 — Daniel split it off the shared Payment Terms
 * template on 2026-09-16: the same Multi-Select over the values in use,
 * worded by the same `formatPaymentTerms`, but the label says "Default
 * payment terms" and the absence row "NO DEFAULT" — on a client an empty
 * field falls back to the company default, where a vendor's empty field
 * simply has no terms. The chip counts "N options" (the node's own copy).
 *
 * The icon is `square-n` — the Payment terms glyph everywhere (the "N" of
 * "Net N").
 */
function paymentTermsFilter(): FilterDef<ClientRow> {
  return {
    id: "paymentTerms",
    noun: { one: "option", many: "options" },
    label: "Default payment terms",
    icon: "square-n",
    hideCounts: true,
    dsHeader: true,
    options: [
      { id: "none", label: "No default" },
      ...INVOICE_NETS_IN_USE.map((terms) => ({ id: String(terms), label: formatPaymentTerms(terms) })),
    ],
    matches: (client, { ids }) => {
      const terms = client.defaultInvoiceNet;
      return ids.includes(terms == null ? "none" : String(terms));
    },
  };
}

/**
 * Default tax rate — the client's default tax (production
 * `default_pricebook_tax`, an FK onto a tax-type pricebook item; Figma
 * section 14970-60917, a Multi-Select WITH a "Tax rate..." search — the
 * rates are a company-written table, so the list can grow). Rows led by
 * "NO DEFAULT", then every workspace tax rate A to Z (the node lists all the
 * existing rates, the Bills-to-clients arrangement). The chip counts
 * "N rates" — the node's own noun.
 *
 * The icon is `percent` (Daniel picked it 2026-09-16) — the canonical tax
 * glyph. (NOT the pricebook `--tax-rate` token, which is the tag family's.)
 */
function taxRateFilter(): FilterDef<ClientRow> {
  return {
    id: "taxRate",
    noun: { one: "rate", many: "rates" },
    label: "Default tax rate",
    icon: "percent",
    searchPlaceholder: "Tax rate...",
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    options: [
      { id: "none", label: "No default" },
      ...[...TAX_RATES]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((rate) => ({ id: rate.id, label: rate.name })),
    ],
    matches: (client, { ids }) => ids.includes(taxRateOf(client)?.id ?? "none"),
  };
}

// ---- the registry ----------------------------------------------------------

/**
 * ONE registry, both phases. The menu lists them alphabetically, the order
 * the node draws: Available invoice credit, Billing address, Bills to,
 * Created at, Credit limit, Default estimate expiration, Default payment
 * terms, Default tax rate, Industry, Labels, Last modified, Locations,
 * Outstanding balance, Type.
 */
export const CLIENT_FILTERS: FilterDef<ClientRow>[] = [
  availableCreditFilter(),

  billingAddressTemplate(billingAddressParts),

  billsToFilter(),

  createdAtTemplate((client) => client.createdAt),

  creditLimitFilter(),

  estimateExpirationFilter(),

  paymentTermsFilter(),

  taxRateFilter(),

  industryFilter(),

  // Clients carry their OWN label table (production `ExternalClientLabel` —
  // see CLIENT_LABELS in the db), which is exactly the parameter the
  // template takes.
  labelsTemplate(CLIENT_LABELS, (client) => client.labelIds),

  lastModifiedTemplate((client) => client.lastModifiedAt),

  locationsFilter(),

  outstandingBalanceFilter(),

  typeFilter(),
];
