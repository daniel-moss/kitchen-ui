import { BadgeInvoiceStatusStatus, STATUS } from "../../components/Badge/BadgeInvoiceStatus";
import { Icon } from "../../components/Icon/Icon";
import { INVOICE_LABELS } from "../../data/db";

import { FilterDef } from "./filterDefs";
import { moneyFilter } from "./filterKinds";
import {
  clientTemplate,
  dueDateTemplate,
  issuedTemplate,
  labelsTemplate,
  lastModifiedTemplate,
  locationAddressTemplate,
  locationTemplate,
  seenTemplate,
  serviceTemplate,
  statusChangedTemplate,
  totalTemplate,
} from "./filterTemplates";
import { InvoiceRow, amountDueOf, clientOf, displayStatus, locationOf } from "./invoicesData";

// The INVOICES list's filter registry — ONE entry per row of its Filters menu
// (node 14320:66224 on Daniel's Invoices page 14300:52150, read 2026-09-14),
// in the menu's alphabetical order.
//
// TWO kinds of entry, the standing Figma split:
//   - STATUS (section 14320-63153) and AMOUNT DUE (14787-82892) are
//     object-specific — the page's own "Object-Specific Filters" section —
//     and are written out below;
//   - the other ELEVEN are shared TEMPLATES (14267-23337), taken from
//     filterTemplates.tsx and handed the one thing that differs: how to read
//     an INVOICE. DUE DATE is the eleventh — it sits on the shared page and
//     was built WITH this registry (2026-09-14), the last template that had
//     no code behind it.
//
// ALL THIRTEEN rows of the menu node are built. The registry arrived three
// days after the list itself (Daniel first: "Do not add filters for now";
// then: "Add filters to the 'Invoices'").

// ---- Status (object-specific) ----------------------------------------------

/**
 * The statuses each PHASE offers, read off the two list nodes (Open
 * 14320-63154, Closed 14320-63167) in their order.
 *
 * They are the same sets the view tabs group by — see `BRANCHES` in
 * InvoicesPage.tsx, whose views partition exactly these lists. Both come from
 * the same design; if one changes, change the other.
 */
export const INVOICE_PHASE_STATUSES: Record<InvoicesPhase, BadgeInvoiceStatusStatus[]> = {
  open: ["draft", "unsent", "outstanding", "overdue"],
  closed: ["paid", "voided", "forgiven"],
};

/** The two branches (phases) the Invoices page switches between. Lived in
 *  invoicesTable.tsx while the list had no filters; the registry owns it now,
 *  the other two pages' arrangement. */
export type InvoicesPhase = "open" | "closed";

/**
 * Status — the Invoices list's own filter (Figma section 14320-63153, a
 * Multi-Select Filter — pattern documentation 14038-14033).
 *
 * Read off the nodes: the DS `SelectListHeader` in its CHIPS-ONLY variant
 * ("is" / "is not", `dsHeader`), NO search on either phase — four rows and
 * three need none — and rows that are a checkbox, the status icon and the
 * label, with no count.
 *
 * The icons, their colors and the labels all come from BadgeInvoiceStatus's
 * own STATUS map — the same source the table's badges use, so a status can
 * never be spelled or coloured two ways. The nodes agree with it row for row:
 * Draft gray-a9 circle-dashed · Unsent violet-a9 circle-dashed · Outstanding
 * blue-a9 circle-half-stroke (turned 180°) · Overdue tomato-a9
 * circle-exclamation · Paid jade-a9 circle-check · Voided and Forgiven
 * gray-a9 circle-xmark. Only the ICON is coloured — the label stays
 * --text-strong, body-400.
 *
 * The menu row's own icon is a plain `circle-dashed` with NO rotation — the
 * settled rule (Daniel, 2026-09-12) and what the menu node draws.
 */
function statusFilter(phase: InvoicesPhase): FilterDef<InvoiceRow> {
  return {
    id: "status",
    noun: { one: "status", many: "statuses" },
    label: "Status",
    icon: "circle-dashed",
    hideCounts: true,
    dsHeader: true,
    options: INVOICE_PHASE_STATUSES[phase].map((key) => ({
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
    // The badge status, not the stored one — `overdue` is derived from `dueAt`
    // (see invoicesData), and it is a row of this list.
    matches: (inv, { ids }) => ids.includes(displayStatus(inv)),
  };
}

/**
 * Amount due — the Invoices list's second object-specific filter (Figma
 * section 14787-82892). What the client still owes, `total − amountPaid` —
 * the same derivation the column shows (`amountDueOf`), so the two can never
 * disagree.
 *
 * An AMOUNT filter (the section's own annotation links the shared Amount
 * documentation, 13874-10420) — the third of the one machinery, after Jobs'
 * Est. duration and the shared Total: the MONEY kind unchanged, with the
 * same eight presets the desktop node draws ($100 → $10,000 over
 * "Custom..."), the same chips-only header (at least / at most / is) and the
 * same "$" Custom dialog. Exactly what the machinery was shared FOR — one
 * preset table, one formatter, no third branch.
 *
 * The icon is `hand-holding-dollar` — the menu node's own (its chip draws it
 * too): money being asked for, which is what an amount due is. Distinct from
 * Total's plain `money-bill` two rows below it.
 */
function amountDueFilter(): FilterDef<InvoiceRow> {
  return {
    id: "amountDue",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Amount due",
    icon: "hand-holding-dollar",
    dsHeader: true,
    ...moneyFilter<InvoiceRow>((inv) => amountDueOf(inv)),
  };
}

// ---- the registry ----------------------------------------------------------

/**
 * ONE registry per BRANCH, the other pages' rule: only the Status filter
 * differs between them — the open phase's four statuses or the closed
 * phase's three. Everything else is the same object on both.
 *
 * The menu lists them alphabetically, the order its own node draws
 * (14320:66224): Amount due, Client, Due date, Issued, Labels, Last modified,
 * Location, Location address, Seen, Service, Status, Status changed, Total.
 * The node still draws "Address" as its FIRST row — Daniel renamed the filter
 * "Location address" on 2026-09-16, which moves it after Location; FLAGGED so
 * the node can follow.
 */
const buildInvoiceFilters = (phase: InvoicesPhase): FilterDef<InvoiceRow>[] => [
  amountDueFilter(),

  // An invoice has no client of its own: it belongs to a location, and the
  // location belongs to the client (`clientOf` walks that link).
  clientTemplate((inv) => clientOf(inv).id),

  dueDateTemplate((inv) => inv.dueAt),
  issuedTemplate((inv) => inv.issuedAt),

  // Invoices carry their OWN label table (production `InvoiceLabel` — see
  // INVOICE_LABELS in the db), which is exactly the parameter the template
  // takes. The matching rules are the shared ones, unchanged.
  labelsTemplate(INVOICE_LABELS, (inv) => inv.labelIds),

  lastModifiedTemplate((inv) => inv.lastModifiedAt),
  locationTemplate((inv) => inv.locationId),

  // Location address — every filled field has to match the invoice's LOCATION,
  // the same question the other lists ask. It follows Location in the alphabet
  // since the 2026-09-16 rename (it was "Address", the first row).
  locationAddressTemplate(locationOf),

  seenTemplate((inv) => inv.lastViewedAt ?? null),
  serviceTemplate((inv) => inv.serviceId ?? null),
  statusFilter(phase),
  statusChangedTemplate((inv) => inv.statusChangedAt),
  // Last in the menu — the node's alphabetical order ends on it.
  totalTemplate((inv) => inv.total),
];

export const INVOICE_FILTERS: Record<InvoicesPhase, FilterDef<InvoiceRow>[]> = {
  open: buildInvoiceFilters("open"),
  closed: buildInvoiceFilters("closed"),
};
