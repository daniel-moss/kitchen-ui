import { BadgeEstimateStatusStatus, STATUS } from "../../components/Badge/BadgeEstimateStatus";
import { Icon } from "../../components/Icon/Icon";
import { ESTIMATE_LABELS } from "../../data/db";

import { FilterDef } from "./filterDefs";
import { dateFilter, forwardWindows } from "./filterKinds";
import {
  addressTemplate,
  clientTemplate,
  issuedTemplate,
  labelsTemplate,
  lastModifiedTemplate,
  locationTemplate,
  seenTemplate,
  serviceTemplate,
  statusChangedTemplate,
  totalTemplate,
} from "./filterTemplates";
import { DOWN_PAYMENT_OPTIONS, EstimateRow, clientOf, displayStatus, locationOf } from "./estimatesData";

// The ESTIMATES list's filter registry — ONE entry per row of the Filters menu,
// in the menu's alphabetical order.
//
// TWO kinds of entry, Daniel's Figma split:
//   - STATUS (14268-43893), DOWN PAYMENT (14293-45032) and EXPIRES
//     (14297-48370) are object-specific — his Estimates page. They are written
//     out below, because no other list has these values;
//   - the other nine are shared TEMPLATES (14267-23337), taken from
//     filterTemplates.tsx and handed the one thing that differs: how to read an
//     ESTIMATE. The chrome — label, icon, options, conditions, search
//     placeholder, row shape, copy — is the template's, so "exactly the same as
//     for the Jobs" is a fact of the code rather than something kept in step by
//     hand. They used to be DERIVED from the jobs registry instead, which
//     guaranteed sameness too but pointed the dependency the wrong way.
//
// ALL THIRTEEN rows of the menu node (14265-27090) are BUILT since 2026-09-12,
// when Expires, Issued, Total and Seen arrived — Total brought the MONEY kind
// with it (filterKinds' `moneyFilter` + `MoneyCustom`). The shared **Due Date**
// template is still unbuilt, and stays that way until the INVOICES list exists:
// it is that list's filter, not a second name for Expires (Daniel, 2026-09-12).

// ---- Status (object-specific) ----------------------------------------------

/**
 * The statuses each PHASE offers, read off the two list nodes (Open
 * 14268-43894, Closed 14268-43911) in their order.
 *
 * They are the same sets the view tabs group by — see `BRANCHES` in
 * EstimatesPage.tsx, whose views partition exactly these lists. Both come from
 * the same design; if one changes, change the other.
 */
export const ESTIMATE_PHASE_STATUSES: Record<EstimatesPhase, BadgeEstimateStatusStatus[]> = {
  open: ["draft", "unsent", "awaitingApproval", "expired", "unconverted"],
  closed: ["jobbed", "invoiced", "lost", "cancelled"],
};

/** The two branches (phases) the Estimates page switches between. */
export type EstimatesPhase = "open" | "closed";

/**
 * Status — the Estimates list's own filter (Figma section 14268-43893, a
 * Multi-Select Filter — pattern documentation 14038-14033).
 *
 * Read off the nodes: the DS `SelectListHeader` in its CHIPS-ONLY variant ("is"
 * / "is not", `dsHeader`), NO search on either phase — five rows and four need
 * none, where the Jobs Status filter carries one over its nine — and rows that
 * are a checkbox, the status icon and the label, with no count.
 *
 * The icons, their colors and the labels all come from BadgeEstimateStatus's
 * own STATUS map — the same source the table's badges use, so a status can
 * never be spelled or coloured two ways. The nodes agree with it row for row:
 * Draft gray-a9 circle-dashed · Unsent violet-a9 circle-dashed · Awaiting
 * approval blue-a9 circle-half-stroke (turned 180°) · Expired tomato-a9
 * circle-exclamation · Unconverted orange-a9 circle-check · Jobbed and Invoiced
 * jade-a9 circle-check · Lost and Cancelled gray-a9 circle-xmark. Only the ICON
 * is coloured — the label stays --text-strong, body-400.
 *
 * FLAGGED: the chip's property icon is a REGULAR `circle-dashed` with NO
 * rotation (node 14265-21487), where the Jobs Status filter's is the same glyph
 * turned 180°. Built to this node; say the word if the two should match.
 */
function statusFilter(phase: EstimatesPhase): FilterDef<EstimateRow> {
  return {
    id: "status",
    noun: { one: "status", many: "statuses" },
    label: "Status",
    icon: "circle-dashed",
    hideCounts: true,
    dsHeader: true,
    options: ESTIMATE_PHASE_STATUSES[phase].map((key) => ({
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
    // The badge status, not the stored one — `expired` is derived from `dueAt`
    // (see estimatesData), and it is a row of this list.
    matches: (est, { ids }) => ids.includes(displayStatus(est)),
  };
}

/**
 * Down payment — the Estimates list's second object-specific filter (Figma
 * section 14293-45032, a Multi-Select Filter — pattern documentation
 * 14038-14033; built 2026-09-12).
 *
 * Read off the desktop node 14293-45034: the DS `SelectListHeader` in its
 * CHIPS-ONLY variant ("is" / "is not", `dsHeader`), NO search — four rows need
 * none — and rows that are a checkbox, the value's icon and its label, with no
 * count. The order is the node's, which is not the column's sort order.
 *
 * The icons, the copy and the colours come from `DOWN_PAYMENT_OPTIONS`
 * (estimatesData) — the same place the table cell takes them from, so a value
 * cannot be spelled or drawn two ways. What the cell does and this list does NOT
 * is escalate: a row is the value itself, never "unpaid on an approved
 * estimate".
 *
 * The menu row's icon is `money-check-dollar` (node 14295-47333, and the chip
 * examples 14293-45042/45043 draw it too) — a payment slip, distinct from
 * Invoices' `circle-dollar` in the sidebar, and it leaves the plain money glyph
 * free for the Total filter, which is an amount.
 *
 * The chip's value noun is "option" — the node writes "N options"
 * (14293-45043), where the Status chip writes "N statuses". FLAGGED: the node's
 * single-value chip draws NO icon next to "Not required", where the Status one
 * draws its status icon. The shared chip always shows a single value's own
 * `slotLeft` (filterDefs' "one value names itself"), so this one shows the
 * `minus`; say the word if the value slot should be bare here.
 */
function downPaymentFilter(): FilterDef<EstimateRow> {
  return {
    id: "downPayment",
    noun: { one: "option", many: "options" },
    label: "Down payment",
    icon: "money-check-dollar",
    hideCounts: true,
    dsHeader: true,
    options: DOWN_PAYMENT_OPTIONS.map((option) => ({
      id: option.id,
      label: option.label,
      slotLeft: (
        <Icon
          icon={option.icon}
          pack={option.pack}
          rotate={option.rotate}
          size={14}
          container="square"
          style={option.scheme == null ? undefined : { color: `var(--${option.scheme}-a9)` }}
        />
      ),
    })),
    matches: (est, { ids }) => ids.includes(est.downPayment),
  };
}

/**
 * Expires — the Estimates list's third object-specific filter (section
 * 14297-48370, built 2026-09-12). A TIMEFRAME filter over `dueAt`, production's
 * `date_due`.
 *
 * Its presets are the WINDOW list, not the shared past-anchored one: an estimate
 * expires ahead of you, so the question is "which ones run out this week". They
 * are the rows Jobs' "Scheduled for" offers — one list, `forwardWindows` — minus
 * that filter's "Not scheduled" row, which has no meaning here (every estimate
 * has a due date), and with the past row worded "Expired" instead of
 * "Past due".
 *
 * A window is a COMPLETE answer, so this list has NO condition chips (no header
 * at all — the desktop node 14297-48383 draws the SelectList as body + footer)
 * and a preset-valued chip renders WITHOUT its condition box. The node's own two
 * annotations say exactly that: "Preset Value — the chip with the preset value
 * renders without the condition box" and "Custom Value — the chip with the
 * custom value behaves as a regular Timeframe filter". The Custom dialog is
 * unchanged and its values keep their conditions ("after · Jan 1").
 *
 * The icon is `calendar-exclamation` — the node's own (its chips draw it) — and
 * it stays clear of the other two calendars in this menu: Issued's
 * `calendar-arrow-up` and, on the jobs list, Date received's
 * `calendar-arrow-down`.
 *
 * NOT the same filter as the shared "Due Date" template on the Filter Template
 * page (14267-23337) — SETTLED with Daniel on 2026-09-12: Due Date belongs to
 * the INVOICES list, which this prototype does not have yet. Two objects, two
 * filters; both stay.
 */
/**
 * EXPIRED first, then the six future windows — the node's order. "Expired" is
 * the jobs list's "Past due" under the word an estimate uses (Daniel,
 * 2026-09-12): the same open-ended window back from yesterday.
 */
const EXPIRES_WINDOWS = forwardWindows("Expired");

function expiresFilter(): FilterDef<EstimateRow> {
  return {
    id: "expires",
    kind: "date",
    noun: { one: "date", many: "dates" },
    label: "Expires",
    icon: "calendar-exclamation",
    dateWindows: EXPIRES_WINDOWS,
    ...dateFilter<EstimateRow>((est) => est.dueAt, EXPIRES_WINDOWS),
  };
}

// ---- the registry ----------------------------------------------------------

/**
 * ONE registry per BRANCH, the Jobs page's rule: only the Status filter differs
 * between them — the open phase's five statuses or the closed phase's four.
 * Everything else is the same object on both.
 *
 * The menu lists them alphabetically, the order its own node draws
 * (14265-27090): Address, Client, Down payment, Expires, Issued, Labels, Last
 * modified, Location, Service, Status, Status changed, Total — that node's
 * thirteen rows minus the one that is not built (Seen).
 */
const buildEstimateFilters = (phase: EstimatesPhase): FilterDef<EstimateRow>[] => [
  // Every filled field has to match the estimate's LOCATION — the same question
  // the jobs filter asks, pointed at the estimate's location.
  addressTemplate(locationOf),

  // An estimate has no client of its own: it belongs to a location, and the
  // location belongs to the client (`clientOf` walks that link).
  clientTemplate((est) => clientOf(est).id),

  // Third in the menu, where the node puts it (14265-27090): Address · Client ·
  // Down payment · Expires · Issued · …
  downPaymentFilter(),
  expiresFilter(),
  issuedTemplate((est) => est.issuedAt),

  // Estimates carry their OWN label table (production `EstimateLabel` — see
  // ESTIMATE_LABELS in the db), which is exactly the parameter the template
  // takes. The matching rules are the shared ones, unchanged.
  labelsTemplate(ESTIMATE_LABELS, (est) => est.labelIds),

  lastModifiedTemplate((est) => est.lastModifiedAt),
  locationTemplate((est) => est.locationId),
  // An estimate that is not for a pricebook service (EST-2205's build-out
  // consultation) has no `serviceId`, so no service ever matches it — the
  // template's own null rule.
  // Seen comes before Service in the menu's alphabet (node 14265-27090).
  seenTemplate((est) => est.lastViewedAt ?? null),
  serviceTemplate((est) => est.serviceId ?? null),
  statusFilter(phase),
  statusChangedTemplate((est) => est.statusChangedAt),
  // Last in the menu — the node's alphabetical order ends on it.
  totalTemplate((est) => est.total),
];

export const ESTIMATE_FILTERS: Record<EstimatesPhase, FilterDef<EstimateRow>[]> = {
  open: buildEstimateFilters("open"),
  closed: buildEstimateFilters("closed"),
};
