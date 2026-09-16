import AvatarVendor from "../../components/Avatar/AvatarVendor";
import { BadgeBillStatusStatus, STATUS } from "../../components/Badge/BadgeBillStatus";
import { Icon } from "../../components/Icon/Icon";
import { BILL_LABELS, VENDORS } from "../../data/db";

import { FilterDef } from "./filterDefs";
import {
  dueDateTemplate,
  issuedTemplate,
  labelsTemplate,
  lastModifiedTemplate,
  receivedTemplate,
  statusChangedTemplate,
  totalTemplate,
} from "./filterTemplates";
import { BillRow, displayStatus, vendorOf } from "./billsData";

// The BILLS list's filter registry — ONE entry per row of its Filters menu
// (node 14817-83613 on Daniel's Bill page 14817-83509, re-read 2026-09-15
// after he added Issued), in the menu's alphabetical order: Billing vendor,
// Due date, Issued, Labels, Last modified, Received, Status, Status changed,
// Total.
//
// TWO kinds of entry, the standing Figma split:
//   - STATUS (section 14817-83584) and BILLING VENDOR (14817-88125) are
//     object-specific — the page's own "Object-Specific Filters" section —
//     and are written out below;
//   - the other SEVEN are shared TEMPLATES (14267-23337), handed the one
//     thing that differs: how to read a BILL. This is the first list where
//     RECEIVED reads its promoted template ("'Received' is a sharable
//     filter. It'll be used on other objects" — Daniel, 2026-09-14, and here
//     it is): production `date_received`, the date the user enters when
//     creating the bill — NOT the status-transition timestamp production
//     shows as its "Received" column (Daniel, 2026-09-15: "all those relate
//     to the 'Status changed' concept").
//
// STATUS CHANGED is CLOSED-phase only (Daniel, 2026-09-15: "If Status
// changed is gonna be empty on the open phase, do not show the column and
// the filter on the open phase") — with Unsent gone a bill is BORN
// outstanding, so only Paid and Voided ever carry a transition date. The
// Credit Notes' Type arrangement, one for one. The menu node's own Status
// Changed row documents it (annotation added 2026-09-15: "Only shown on the
// 'Closed' phase lists"), so the one drawn menu and the two built ones
// agree.
//
// The templates that are NOT here — Address, Client, Location, Service,
// Seen, Amount due, Created at — have nothing to read: a bill belongs to a
// VENDOR (no client, location or service), cannot be sent so cannot be seen
// (Daniel, 2026-09-15 — production's `last_viewed` is another production
// gap), and has no partial payments, so its Total is the only amount.

// ---- Status (object-specific) ----------------------------------------------

/**
 * The statuses each PHASE offers, read off the two list nodes (Open
 * 14817-83585: Draft · Outstanding · Overdue, Closed 14817-83587: Paid ·
 * Voided) in their order. NO UNSENT — Daniel's 2026-09-15 ruling ("The
 * production is wrong. The bill can not have 'Unsent' status").
 *
 * They are the same sets the view tabs group by — see `BRANCHES` in
 * BillsPage.tsx, whose views partition exactly these lists. Both come from
 * the same design; if one changes, change the other.
 */
export const BILL_PHASE_STATUSES: Record<BillsPhase, BadgeBillStatusStatus[]> = {
  open: ["draft", "outstanding", "overdue"],
  closed: ["paid", "voided"],
};

/** The two branches (phases) the Bills page switches between. */
export type BillsPhase = "open" | "closed";

/**
 * Status — the Bills list's own filter (Figma section 14817-83584, a
 * Multi-Select Filter — pattern documentation 14038-14033). The invoices
 * shape exactly: the DS `SelectListHeader` in its CHIPS-ONLY variant ("is" /
 * "is not", `dsHeader`), NO search on either phase — three rows and two need
 * none — and rows that are a checkbox, the status icon and the label, with
 * no count.
 *
 * The icons, their colors and the labels all come from BadgeBillStatus's own
 * STATUS map — the same source the table's badges use, so a status can never
 * be spelled or coloured two ways. The nodes agree with it row for row (read
 * 2026-09-14): Draft gray-a9 circle-dashed · Outstanding blue-a9
 * circle-half-stroke (turned 180°) · Overdue tomato-a9 circle-exclamation ·
 * Paid jade-a9 circle-check · Voided gray-a9 circle-xmark. Only the ICON is
 * coloured — the label stays --text-strong, body-400.
 *
 * The menu row's own icon is a plain `circle-dashed` with NO rotation — the
 * settled rule (Daniel, 2026-09-12).
 */
function statusFilter(phase: BillsPhase): FilterDef<BillRow> {
  return {
    id: "status",
    noun: { one: "status", many: "statuses" },
    label: "Status",
    icon: "circle-dashed",
    hideCounts: true,
    dsHeader: true,
    options: BILL_PHASE_STATUSES[phase].map((key) => ({
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
    // (see billsData), and it is a row of this list.
    matches: (bill, { ids }) => ids.includes(displayStatus(bill)),
  };
}

// ---- Billing vendor (object-specific) ----------------------------------------

/**
 * Billing vendor — the Bills list's second object-specific filter (Figma
 * section 14817-88125, a Multi-Select Filter). The Client template's shape —
 * the DS `SelectListHeader` in the chipGroup + search variant ("is" / "is
 * not" over a "Vendor..." search, node 14817-88127; the mobile node draws
 * the keyboard up) — pointed at the VENDORS table: rows are a checkbox, an
 * xs avatar and the vendor's name, sorted A to Z, no counts. The chip's
 * value segment carries the picked vendor's avatar (the node's own
 * `valueSlotLeft`), which the shared chip does with every option's slotLeft.
 *
 * The avatar is the DS `AvatarVendor` in its image content — the node draws
 * an xs AvatarVendor on the rows and the chip (Daniel swapped the earlier
 * AvatarClient instances on 2026-09-15, closing the review flag; the vendor
 * NAMES in the node are still demonstration content). No vendor has a logo
 * of its own, so every row shows the DS generic object image, like the
 * Client filter's rows.
 *
 * The icon is `store` — the menu node's own, and the product's vendor icon
 * (`semanticIcons.vendor`; the sidebar's Vendors item draws it too).
 *
 * ALL vendors are listed, deactivated ones included — the Client template's
 * rule (Presidio Canteen is deactivated and still a row): old bills point at
 * them, and a filter is for finding rows, not for creating new links.
 */
function billingVendorFilter(): FilterDef<BillRow> {
  return {
    id: "vendor",
    noun: { one: "vendor", many: "vendors" },
    label: "Billing vendor",
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
    matches: (bill, { ids }) => ids.includes(vendorOf(bill).id),
  };
}

// ---- the registry ----------------------------------------------------------

/**
 * ONE registry per BRANCH, the other pages' rule: the Status filter's options
 * differ between them, and Status changed exists only on the closed one.
 * Everything else is the same object on both.
 *
 * The menu lists them alphabetically, the order its own node draws
 * (14817-83613): Billing vendor, Due date, Issued, Labels, Last modified,
 * Received, Status, Status changed (closed only — it keeps its alphabetical
 * slot between Status and Total), Total.
 */
const buildBillFilters = (phase: BillsPhase): FilterDef<BillRow>[] => [
  billingVendorFilter(),

  // A bill cannot exist without a due date (production enforces `date_due`),
  // so the template's no-absence-row shape fits unchanged; its "Overdue"
  // past window is worded with this list's own derived status already.
  dueDateTemplate((bill) => bill.dueAt),

  issuedTemplate((bill) => bill.issuedAt),

  // Bills carry their OWN label table (production `BillLabel` — see
  // BILL_LABELS in the db), which is exactly the parameter the template
  // takes. The matching rules are the shared ones, unchanged.
  labelsTemplate(BILL_LABELS, (bill) => bill.labelIds),

  lastModifiedTemplate((bill) => bill.lastModifiedAt),

  // The user-entered arrival date (`date_received`) — see the module note.
  receivedTemplate((bill) => bill.receivedAt),

  statusFilter(phase),

  // Only where a bill can HAVE a transition date — see the module note.
  ...(phase === "closed" ? [statusChangedTemplate<BillRow>((bill) => bill.statusChangedAt)] : []),

  totalTemplate((bill) => bill.total),
];

export const BILL_FILTERS: Record<BillsPhase, FilterDef<BillRow>[]> = {
  open: buildBillFilters("open"),
  closed: buildBillFilters("closed"),
};
