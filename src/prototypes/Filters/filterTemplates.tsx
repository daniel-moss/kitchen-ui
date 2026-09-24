import AvatarClient from "../../components/Avatar/AvatarClient";
import AvatarLocation from "../../components/Avatar/AvatarLocation";
import { STATUS as PRICEBOOK_STATUS } from "../../components/Badge/BadgePricebookStatus";
import { Icon } from "../../components/Icon/Icon";
import { PricebookStatus, PricebookSubtype } from "../../data/db";
import { semanticIcons } from "../../styles/semanticIcons";
import { joinWithSeparator } from "../../utils/textSeparator";

import { FilterDef, FilterOption, FreeformValue } from "./filterDefs";
import { FreeformFieldDef, dateFilter, forwardWindows, freeformFilter, moneyFilter } from "./filterKinds";
import {
  CLIENTS,
  LOCATIONS,
  LocationRecord,
  SERVICES,
  formatPaymentTerms,
  locationAddress,
} from "./listData";

// FILTER TEMPLATE. Daniel's Figma node 14267-23337 ("Filter Template", inside
// the "Filters ↳ Shared Behavior" page 14199-65429) holds the filters that are
// the SAME on every object — a whole filter reused verbatim, not a behaviour:
// Client, Labels, Last modified, Location, Seen, Service, Status changed.
//
// This module is that node, and it is owned by NEITHER object. Until the
// 2026-09-11 re-organisation these seven lived inside the JOBS registry and the
// estimates registry *derived* its copies from them by stripping `matches` off
// a jobs def. Sameness was guaranteed, but the
// dependency pointed the wrong way: customising Jobs' Location would have
// changed Estimates silently. Now each registry picks the templates it uses and
// hands each one the one thing that genuinely differs — how to READ its row.
//
// Everything else — the label, the icon, the options, the search placeholder,
// the header, the row shape, the copy — is here, once. A change to Location's
// rows is a change to this file and shows up on every list that uses it,
// which is what the Figma node says.
//
// LOCATION ADDRESS is one of them. The build put it here first — it is shared
// by both lists exactly like the rest — while Figma still filed it under Filter
// FUNCTIONALITY (the KIND). Daniel MOVED it on 2026-09-11, and the node was
// re-read to confirm: 14267-23337 now lists Address, Client, Due Date,
// Issued, Labels, Last Modified, Location, Seen, Service and Status Changed.
// The taxonomy and the build agree again. (The filter was RENAMED "Location
// address" on 2026-09-16 — see `locationAddressTemplate` for what the rename
// moved.)
//
// ISSUED, TOTAL and SEEN joined this module on 2026-09-12 — all three sit on
// the shared page (14297-48697, 14297-48909 and 14267-13151), even though only
// the Estimates list uses them today. Total brought the MONEY kind with it
// (filterKinds).
//
// DUE DATE joined on 2026-09-14, when the Invoices list got its filters —
// the LAST row of the shared node with no code behind it. Every template on
// 14267-23337 is built now.

/**
 * The address INCLUDING the unit — "418 Mission St, Suite 200, San Francisco,
 * CA 94105". The Location filter's object row draws this as its title (node
 * 14101-44923 writes "123 Main Street, Suite 45, San Francisco, CA 98765").
 *
 * It lives with the Location TEMPLATE because nothing else uses it.
 *
 * FLAGGED: the tables' "Location address" COLUMN still leaves the unit out, so
 * the same location reads slightly differently in the two places. That is what
 * each node draws; say the word and they can be made to agree.
 */
function locationAddressWithUnit(location: LocationRecord): string {
  const region = [location.state, location.postalCode].filter((part) => part != null).join(" ");
  return [location.street, location.unit, location.city, region === "" ? null : region]
    .filter((part) => part != null && part !== "")
    .join(", ");
}

/**
 * One location as the filter SORTS it (Figma node 13987-52348): "Location name
 * · Street address, city, state postal code". Each half appears only if it
 * exists, so a nameless location is just its address.
 *
 * The separator is the shared `TEXT_SEPARATOR` (Daniel, 2026-09-04) — the
 * node's own U+30FB katakana dot is retired: Inter does not contain it, so it
 * rendered from a different fallback font in every app. FLAGGED: the Figma node
 * still draws " ・ ".
 */
function locationLabel(location: LocationRecord): string {
  return joinWithSeparator(location.name, locationAddress(location) || null);
}

/** Client id → name, for the Location list's group headers and its search. */
const CLIENT_NAME = new Map(CLIENTS.map((client) => [client.id, client.name]));

// ---- Client -----------------------------------------------------------------

/**
 * Client — the second filter Daniel designed in full (Figma section
 * 13934-13189). It is built EXACTLY like Assignee and differs only in the row's
 * left slot: an AvatarClient instead of a face.
 *
 * That sameness is a decision, not a coincidence. On 2026-08-19 Daniel drew
 * Client through five header variants — no fill under the chips, no fill under
 * the search, the search and the chips swapped, 28px chips, the bordered
 * SearchField inset in the list — compared each against Assignee's, and settled
 * on Assignee's. So the trial props those needed are gone from FilterDef; the
 * shapes are in the Figma section's history if any of them comes back.
 *
 * Since 2026-08-20 that shared header is the DS `SelectListHeader` (`dsHeader`)
 * — nodes 13933-10525 desktop / 13933-9967 mobile, identical to Assignee's but
 * for the row avatars.
 *
 * @param clientIdOf the row's client. A JOB carries it directly; an ESTIMATE
 * belongs to a location and the location belongs to the client.
 */
export function clientTemplate<TRow>(clientIdOf: (row: TRow) => string): FilterDef<TRow> {
  return {
    id: "client",
    noun: { one: "client", many: "clients" },
    label: "Client",
    // The node drew `building` first (14032-20321, 2026-09-03); the
    // `--client` token itself followed on 2026-09-16.
    icon: semanticIcons.clientGeneric,
    searchPlaceholder: "Client...", // the ellipsis is back (Daniel, 2026-08-24)
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    // xs (20px) client avatars, `image` content — the node draws the DS's
    // generic company image (the "companyAvatar/Generic" style) on every row,
    // which is AvatarClient's own default image. The prototype's clients have
    // no logos of their own, so they all show that placeholder.
    // Sorted by name, the order the node lists them in.
    options: [...CLIENTS]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((client) => ({
        id: client.id,
        label: client.name,
        slotLeft: <AvatarClient size="xs" content="image" />,
      })),
    matches: (row, { ids }) => ids.includes(clientIdOf(row)),
  };
}

// ---- Labels -----------------------------------------------------------------

/**
 * Labels — the fifth designed filter; DOCUMENTED since 2026-09-03 (section
 * 13999-17090: Empty 13999-17124 / 13999-17223, Selected 14101-42749 /
 * 14101-42751, the 2+ sub-menu 14101-43497 / 14101-43499 — it replaced the
 * first draft, section 13984-38887). Still an OPTIONS filter, ticked with
 * checkboxes, but three things set it apart:
 *
 *   - it carries a SEARCH ("Label...") over the condition chips, so its header
 *     is the DS `SelectListHeader` in the chipGroup + search variant —
 *     Assignee's and Client's header — and its search takes focus on the phone
 *     too (the mobile nodes draw the keyboard up);
 *   - it is the one filter that lets the user pick how several values COMBINE,
 *     ALL of them or ANY of them (`matchMode`). A row holds a SET of labels, so
 *     both are real questions; a status or a client is one value per row, where
 *     "all of" could never match;
 *   - its list opens with a "No labels" row — the absence of a value as a
 *     pickable option, which combines with the labels themselves.
 *
 * Its rows are a checkbox and a name — no icon and no count. Its card is sized
 * by nothing but the component (2026-09-11): it hugs to 223 with the two
 * conditions (node 13999-17141) and to the 384 maximum once a second ticked
 * label brings the four, which then wrap to two rows (node 14101-42750). Both
 * come out of the DS card's own fit-content.
 *
 * @param labels the object's OWN label table — the one field of this template
 * that is not shared. Jobs have `JOB_LABELS`, estimates their own
 * `ESTIMATE_LABELS` (production `EstimateLabel`).
 */
export function labelsTemplate<TRow>(
  labels: { id: string; name: string }[],
  labelIdsOf: (row: TRow) => string[],
): FilterDef<TRow> {
  return {
    id: "labels",
    noun: { one: "label", many: "labels" },
    label: "Labels",
    icon: "tag",
    searchPlaceholder: "Label...", // the node draws the ellipsis
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    matchMode: true,
    // "No labels" FIRST, over the labels themselves (node 13999-17141's row
    // order).
    options: [{ id: "none", label: "No labels" }, ...labels.map((label) => ({ id: label.id, label: label.name }))],
    // The POSITIVE half only — `applyFilters` flips it for the "do not
    // include …" half, which is what makes each pair a true opposite:
    //   include all of = carries every ticked label → do not include all of = not all
    //   include any of = carries at least one       → do not include any of = none
    // With ONE label ticked the two modes are the same test, which is why the
    // condition collapses to include / do not include.
    //
    // "No labels" JOINS the modes since 2026-09-11, where it used to stand
    // alone. Under "any of" it is one more alternative — "No labels" plus
    // Warranty matches the unlabelled rows and the Warranty ones. Under "all
    // of" it can only be satisfied on its own: a row cannot carry no labels AND
    // carry Warranty, so that combination matches nothing, which is what the
    // condition literally asks for.
    matches: (row, { ids, match }) => {
      const rowLabels = labelIdsOf(row);
      const wantsNone = ids.includes("none");
      const labelIds = ids.filter((id) => id !== "none");
      if (match === "any") {
        return (wantsNone && rowLabels.length === 0) || labelIds.some((id) => rowLabels.includes(id));
      }
      if (wantsNone) return labelIds.length === 0 && rowLabels.length === 0;
      return labelIds.every((id) => rowLabels.includes(id));
    },
  };
}

// ---- Last modified ----------------------------------------------------------

/**
 * Last modified — the sixth designed filter, and the SECOND of the date kind;
 * since 2026-09-03 it is DOCUMENTED as a Timeframe filter (section 14100-40610),
 * identical to Date received's (13962-8766) — every piece is the same one:
 *   - the same seven presets in the same order over the same "Custom..." row;
 *   - the same chips-only `SelectListHeader`, md Chips "after" (active, first)
 *     / "before", closed by the component's own Divider;
 *   - the same Custom dialog (the Timeframe filter section 14038-21304):
 *     Day / Month / Year over after / before / on-in / within, the period
 *     lists, the Cancel + Apply footer.
 * So it takes the TIMEFRAME kind unchanged and only reads another field.
 *
 * What is its own: the label, and the `pen` icon (regular, classic pack — node
 * 13986-45363). Date received's calendar icon is NOT reused here.
 *
 * The icon STAYS `pen` (Daniel, 2026-09-12: "bring back pen icon for the last
 * modified") — FLAGGED, because the Jobs menu node 14032-20321 currently draws
 * `clock` for this row. Daniel is updating it back; do not take `clock` from
 * that node.
 *
 * Being a TEMPLATE, this one icon is the row's icon and the chip's icon on
 * EVERY list that uses Last modified — Jobs and Estimates today.
 */
export function lastModifiedTemplate<TRow>(read: (row: TRow) => string | null): FilterDef<TRow> {
  return {
    id: "lastModified",
    kind: "date",
    noun: { one: "date", many: "dates" },
    label: "Last modified",
    icon: "pen",
    dsHeader: true,
    ...dateFilter(read),
  };
}

// ---- Issued ------------------------------------------------------------------

/**
 * Issued — the day a document went out (production `date_issued`, which
 * replaced the estimate's `createdAt`). Section 14297-48697, built 2026-09-12.
 *
 * Another TIMEFRAME filter with nothing of its own but a label and an icon: the
 * node draws the same seven past-anchored presets over "Custom...", the same
 * chips-only header (after / before) and the same Custom dialog Last modified
 * and Date received use. So it takes the kind unchanged.
 *
 * The icon is `calendar-arrow-up` (Daniel, 2026-09-12) — a calendar with an
 * arrow LEAVING it, the exact mirror of Date received's `calendar-arrow-down`:
 * a request comes in, an estimate goes out. It replaced two drawings that were
 * on the nodes, and Daniel has updated both to match (re-read 2026-09-12): the
 * menu row's placeholder `diamonds-4`, and this section's `calendar-lines-pen`
 * — a pen, which belongs to Last modified, and the busiest glyph of that set at
 * the chip's 14px.
 *
 * Only Estimates has the filter today, but it is a TEMPLATE because it sits on
 * the shared Filter Template page — any object with an issue date reads the
 * same way.
 */
export function issuedTemplate<TRow>(read: (row: TRow) => string | null): FilterDef<TRow> {
  return {
    id: "issued",
    kind: "date",
    noun: { one: "date", many: "dates" },
    label: "Issued",
    icon: "calendar-arrow-up",
    dsHeader: true,
    ...dateFilter(read),
  };
}

// ---- Received ----------------------------------------------------------------

/**
 * Received — the day a request came in (the Job's `receivedAt`). RENAMED from
 * "Date received" and PROMOTED to a template on 2026-09-14 (Daniel: rename
 * the filter and the column, and "'Received' is a sharable filter. It'll be
 * used on other objects") — its section 13962-8766 is renamed "Received" and
 * the Jobs menu node 14032-20321 draws the new row (both re-read the same
 * day). It was the Jobs registry's own filter from the first build — the
 * THIRD filter Daniel designed, and the first of the date kind.
 *
 * A TIMEFRAME filter with nothing of its own but the label and the icon: the
 * shared seven past-anchored presets over "Custom...", the chips-only header
 * (after / before), the shared Custom dialog.
 *
 * The icon is `calendar-arrow-down` (Daniel, 2026-09-12): a calendar with an
 * arrow coming INTO it — the day a request arrived — the exact mirror of
 * Issued's `calendar-arrow-up`. (Its history: `calendar-plus` for a few
 * hours — a plus reads as "add" everywhere else in this product — plain
 * `calendar` before that, shared with Scheduled for, and two kit glyphs
 * before that.)
 */
export function receivedTemplate<TRow>(read: (row: TRow) => string | null): FilterDef<TRow> {
  return {
    id: "received",
    kind: "date",
    noun: { one: "date", many: "dates" },
    label: "Received",
    icon: "calendar-arrow-down",
    dsHeader: true,
    ...dateFilter(read),
  };
}

// ---- Created at ---------------------------------------------------------------

/**
 * Created at — the day the record itself was made (production `created_at`).
 * Built 2026-09-14 for the Series list; its menu row's documentation link
 * points at a "Created At" SECTION on the shared Filter Template page
 * (14767-79168), so it is a template like the other shared dates.
 *
 * Another TIMEFRAME filter — the shared presets, header and Custom dialog,
 * reading another field.
 *
 * The icon is `calendar-plus` (Daniel, 2026-09-14: "I agree. Use it") — the
 * day the record was ADDED. The reason this glyph was rejected for Received
 * ("a plus reads as add everywhere in this product") is exactly why it is
 * right here. The Series menu node still draws the placeholder; Daniel is
 * updating it.
 */
export function createdAtTemplate<TRow>(read: (row: TRow) => string | null): FilterDef<TRow> {
  return {
    id: "createdAt",
    kind: "date",
    noun: { one: "date", many: "dates" },
    label: "Created at",
    icon: "calendar-plus",
    dsHeader: true,
    ...dateFilter(read),
  };
}

// ---- Due date ----------------------------------------------------------------

/**
 * Due date — when the money is expected (production `date_due`). Section
 * 14320-66655 on the shared page, built 2026-09-14 with the Invoices list's
 * filters; only that list uses it today. SETTLED 2026-09-12: NOT a second name
 * for the Estimates page's own Expires — two objects, two filters.
 *
 * A FORWARD-window Timeframe filter, the Expires shape: a window is a complete
 * answer, so the list has NO condition chips (the desktop node draws body +
 * footer only) and a preset-valued chip renders WITHOUT its condition box —
 * the section's own two annotations, word for word the Expires ones ("Preset
 * Value — the chip with the preset value renders without the condition box";
 * "Custom Value — the chip with the custom value behaves as a regular
 * 'Timeframe' filter", its chip example "Due date · after · Jan 1").
 *
 * OVERDUE leads the list (Daniel updated the node on 2026-09-14, after the
 * first build shipped without it): the same open-ended past window every
 * forward filter carries, worded with the OBJECT's own derived status — a
 * job is "Past due", an estimate "Expired", an invoice "Overdue". One list,
 * `forwardWindows(pastLabel)`. What Due date still does NOT have is the
 * absence row: an invoice cannot exist without a due date (production
 * enforces `date_due`), where Scheduled for needs its "Not scheduled".
 *
 * The icon is `calendar-exclamation` — the node's own (its chips draw it).
 * The same glyph is Expires' on the ESTIMATES menu — SETTLED with Daniel,
 * 2026-09-14: "Expires" and "Due date" never appear on one list, and the two
 * concepts are close kin, so one urgent calendar serves both.
 */
const DUE_DATE_WINDOWS = forwardWindows("Overdue");

export function dueDateTemplate<TRow>(read: (row: TRow) => string | null): FilterDef<TRow> {
  return {
    id: "dueDate",
    kind: "date",
    noun: { one: "date", many: "dates" },
    label: "Due date",
    icon: "calendar-exclamation",
    dateWindows: DUE_DATE_WINDOWS,
    ...dateFilter(read, DUE_DATE_WINDOWS),
  };
}

// ---- Seen --------------------------------------------------------------------

/**
 * Seen — has the client opened the document? Section 14267-13151, built
 * 2026-09-12; the Estimates list has had the COLUMN since it was created
 * (production's `last_viewed`).
 *
 * An OPTIONS filter with two rows and, per the node's own annotation, SINGLE
 * select: "Only one selected option at a time" — a document has been opened or
 * it has not, so a set of the two would only ever mean "any". Its header is
 * the chips-only `SelectListHeader` ("is" / "is not"), no search, and the
 * rows are BARE — Seen · Not seen, no counts and, since Daniel's 2026-09-15
 * update (the node re-read: the `eye` / `eye-slash` row icons are gone), no
 * icons either. The MENU row keeps its `eye`.
 *
 * `read` returns WHEN it was last opened, or null for never — the same shape the
 * column reads, so the two can never disagree.
 */
export function seenTemplate<TRow>(read: (row: TRow) => string | null): FilterDef<TRow> {
  return {
    id: "seen",
    noun: { one: "option", many: "options" },
    label: "Seen",
    icon: "eye",
    hideCounts: true,
    dsHeader: true,
    singleSelect: true,
    options: [
      { id: "seen", label: "Seen" },
      { id: "notSeen", label: "Not seen" },
    ],
    matches: (row, { ids }) => ids.includes(read(row) == null ? "notSeen" : "seen"),
  };
}

// ---- Payment terms -----------------------------------------------------------

/**
 * Payment terms — a vendor's net-days terms. PROMOTED to a template on
 * 2026-09-15, when Daniel moved its section onto the shared Filter Template
 * page (14944-4762, re-read after the update) — it was the POs list's own
 * filter first, and the Vendors list is its second consumer. The chips-only
 * header ("is" / "is not"), NO search — the values are few — and bare rows
 * led by "NO TERMS" (the node's updated absence row; it said "No payment
 * terms" until the same update — inside this list the short word is
 * unambiguous, the "No carrier" / "No method" pattern). The chip counts
 * "N options" (the node's own copy; "2 terms" read wrong because one value
 * IS "terms").
 *
 * The options are only the values in use, worded exactly as the columns
 * print them — "Same Day" / "Net 30" — through the same `formatPaymentTerms`
 * (its annotation: "Only the actual values that exist on the list"). WHICH
 * values are in use differs per list — the POs list counts the vendors that
 * HAVE orders, the Vendors list counts every row — so the list is a
 * parameter, like the labels table on Labels.
 *
 * The icon is `square-n` — the node's own (the "N" of "Net N").
 */
export function paymentTermsTemplate<TRow>(
  termsInUse: number[],
  read: (row: TRow) => number | null,
): FilterDef<TRow> {
  return {
    id: "paymentTerms",
    noun: { one: "option", many: "options" },
    label: "Payment terms",
    icon: "square-n",
    hideCounts: true,
    dsHeader: true,
    options: [
      { id: "none", label: "No terms" },
      ...termsInUse.map((terms) => ({ id: String(terms), label: formatPaymentTerms(terms) })),
    ],
    matches: (row, { ids }) => {
      const terms = read(row);
      return ids.includes(terms == null ? "none" : String(terms));
    },
  };
}

// ---- Total -------------------------------------------------------------------

/**
 * Total — the first MONEY filter (section 14297-48909, built 2026-09-12; the
 * kind itself is 14299-49183). Eight preset amounts over "Custom...", the
 * chips-only header carrying over / under / is, and a Custom dialog with a "$"
 * field — see `moneyFilter` and `MoneyCustom` in filterKinds.
 *
 * The icon is `money-bill` — the node's own (14297-48920's chip). It is the
 * plain money glyph on purpose: Total is an AMOUNT, where Down payment's
 * `money-check-dollar` is a payment, and the sidebar's Invoices keeps
 * `circle-dollar`.
 *
 * Reads dollars. An estimate's total always exists, so unlike a date there is
 * no absent case to exclude.
 */
export function totalTemplate<TRow>(read: (row: TRow) => number | null): FilterDef<TRow> {
  return {
    id: "total",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Total",
    icon: "money-bill",
    dsHeader: true,
    ...moneyFilter(read),
  };
}

// ---- Location ---------------------------------------------------------------

/**
 * Location — REDESIGNED 2026-09-11 (section 14101-44921, list node
 * 14101-44923). It was a one-line row, "name · address", which truncated as
 * soon as a real address ran past the card's 384px maximum. The row is the DS
 * SelectListItem's OBJECT variant now — 60px, an xl AvatarLocation, the ADDRESS
 * as the Medium title and the site's NAME as the caption under it — so both
 * halves are readable and neither has to share a line.
 *
 * Read off the node: `variant=object`, `select=multi`, a 36px AvatarLocation,
 * title "123 Main Street, Suite 45, San Francisco, CA 98765" (the address
 * INCLUDING the unit — see `locationAddressWithUnit`) over caption
 * "Headquarters" (the name). No tag: the object variant may not combine a
 * caption with one, and Location shows no counts anyway.
 *
 * Unchanged from the first build, per the section's "The List" annotation:
 *   1. GROUPED BY CLIENT — a SelectListItemGroup with a GroupLabel per client;
 *   2. clients sorted A to Z;
 *   3. locations sorted "by a name or street address from A to Z" — still
 *      `locationLabel`, which leads with the name where there is one.
 *
 * The search placeholder is the node's own "Location or client...", which also
 * says out loud what `searchText` has always done: match the client's name as
 * well as the row's.
 */
export function locationTemplate<TRow>(locationIdOf: (row: TRow) => string): FilterDef<TRow> {
  return {
    id: "location",
    noun: { one: "location", many: "locations" },
    label: "Location",
    icon: "location-dot",
    searchPlaceholder: "Location or client...",
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    objectRows: true,
    // Clients in name order, and only those that HAVE a location — an empty
    // group would be a header with nothing under it.
    //
    // Each group header carries the client's own AVATAR, read off the node
    // (the GroupLabel's `slotLeft` → `AvatarClient`, size sm / 24px, in
    // 14101-44923's header).
    //
    // FLAGGED: the node sets that avatar's `logo: true`, i.e. an IMAGE. No
    // client in the demo database has a logo — there is no such field — so this
    // renders the type icon instead, which at least tells a business from an
    // individual. Add a `logo` to the db's clients and it becomes an image with
    // one prop.
    groups: [...CLIENTS]
      .filter((client) => LOCATIONS.some((location) => location.clientId === client.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((client) => ({
        id: client.id,
        label: client.name,
        slotLeft: <AvatarClient size="sm" type={client.clientType === "Individual" ? "individual" : "business"} />,
      })),
    options: [...LOCATIONS]
      .sort((a, b) => locationLabel(a).localeCompare(locationLabel(b)))
      .map((location) => ({
        id: location.id,
        // Title = the address; caption = the site's name — or, where it has
        // none (ferry-main and presidio-canteen), the PLACEHOLDER. The DS
        // ListItem Template copy doc gives both the rule and the copy for a
        // location (27171-15212): the row reads "123 Main Street, San
        // Francisco, CA" over "No Location name", and "The placeholder is
        // shown if the value is missing. The placeholder inherits the
        // --text-placeholder token."
        label: locationAddressWithUnit(location),
        caption: location.name,
        captionPlaceholder: "No Location name",
        avatar: <AvatarLocation size="xl" />,
        groupId: location.clientId,
        // Both lines PLUS the client, so the search finds "Wildwood" too —
        // what the placeholder now promises.
        searchText: `${locationAddressWithUnit(location)} ${location.name ?? ""} ${CLIENT_NAME.get(location.clientId) ?? ""}`,
      })),
    matches: (row, { ids }) => ids.includes(locationIdOf(row)),
  };
}

// ---- Service ----------------------------------------------------------------

/**
 * Service — DOCUMENTED on 2026-09-03 (section 14101-46745, a Multi-Select
 * Filter): the DS `SelectListHeader` in the chipGroup + search variant ("is" /
 * "is not" over a 40px "Service..." search; the mobile node draws the keyboard
 * up), and rows that are a checkbox and the service's name — the wrench icon
 * and the count are GONE from the rows. The chip's name segment keeps the
 * wrench (node 14101-46752).
 *
 * @param serviceIdOf the row's pricebook service, or null where it has none —
 * an estimate that is not for a pricebook service (EST-2205's build-out
 * consultation) carries no `serviceId`, so no service ever matches it.
 */
export function serviceTemplate<TRow>(serviceIdOf: (row: TRow) => string | null): FilterDef<TRow> {
  return {
    id: "service",
    noun: { one: "service", many: "services" },
    label: "Service",
    // `screwdriver-wrench` (Daniel, 2026-09-14) — the crossed-tools "service
    // work" glyph. It REPLACED `wrench-simple`, which he gave to the Series
    // list's Open jobs (the JOB icon — that filter counts jobs), so the two
    // could no longer share. Being a template this changed on every menu at
    // once (Jobs, Estimates, Invoices, Series); the menu NODES still draw
    // the old wrench — Daniel is updating them. The chip's name segment
    // follows automatically (it draws the def's icon).
    icon: "screwdriver-wrench",
    searchPlaceholder: "Service...",
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    options: SERVICES.map((service) => ({ id: service.id, label: service.name })),
    matches: (row, { ids }) => {
      const serviceId = serviceIdOf(row);
      return serviceId != null && ids.includes(serviceId);
    },
  };
}

// ---- Status changed ---------------------------------------------------------

/**
 * Status changed — DOCUMENTED as a Timeframe filter on 2026-09-03 (section
 * 14101-53614, pattern documentation 14038-21304), identical to Date received,
 * Last modified and Scheduled for: the same seven presets over "Custom...", the
 * same after / before chips, the same Custom dialog — reading the day the row's
 * status last changed. It replaced the LAST of the invented bucket lists, so
 * the bucket machinery is gone with it.
 *
 * `arrow-left-arrow-right` — Daniel's pick (2026-09-03): a transition between
 * two states, which is what a status change is. It replaced the `pen` the chip
 * node used to draw (14101-53620), which Last modified owns. No longer a flag:
 * Daniel updated Figma to match on 2026-09-12 ("keep arrow-left-arrow-right as
 * it is currently in the build").
 */
export function statusChangedTemplate<TRow>(read: (row: TRow) => string | null): FilterDef<TRow> {
  return {
    id: "statusChanged",
    kind: "date",
    noun: { one: "date", many: "dates" },
    label: "Status changed",
    icon: "arrow-left-arrow-right",
    dsHeader: true,
    ...dateFilter(read),
  };
}

// ---- Location address + Billing address (the two FREEFORM filters) ----------

/**
 * The five matchable parts of ANY address — a location's, or a vendor's /
 * client's billing address. `LocationRecord` satisfies it structurally, so
 * the location-based callers pass their record through unchanged; a row
 * whose address is not a location hands in a plain object. (Moved here from
 * filterKinds in the 2026-09-16 reorganisation: the KIND is generic
 * "Freeform" now, and the address SHAPE belongs to the address FILTERS.)
 */
export interface AddressParts {
  street?: string | null;
  unit?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

/**
 * The address filters' five fields, in the dialog's order — the labels are
 * the nodes' copy (Location address 14947-21952 / Billing address 14947-34564
 * draw the same five). State / Province and Postal code share a desktop row
 * (`half`); mobile stacks all five.
 *
 * None of the five carries the "(optional)" label condition any more (Daniel,
 * 2026-09-16): every field of an address filter is optional by nature, so the
 * word was on all five at once and said nothing.
 */
const addressFields = <TRow,>(read: (row: TRow) => AddressParts): FreeformFieldDef<TRow>[] => [
  { key: "street", label: "Street address", read: (row) => read(row).street },
  { key: "suite", label: "Suite, unit, etc.", read: (row) => read(row).unit },
  { key: "city", label: "City", read: (row) => read(row).city },
  { key: "state", label: "State / Province", half: true, read: (row) => read(row).state },
  { key: "postalCode", label: "Postal code", half: true, read: (row) => read(row).postalCode },
];

/**
 * The chip's value segment, both address filters' own format (their nodes'
 * "Value" annotation: "[street_address], [suite], [city], [state]
 * [postal_code]" — the value is only shown if it exists). State and postal
 * code are ONE unit joined by a space, the same rule `locationAddress`
 * follows, so dropping either leaves the other reading whole.
 */
export function addressSummary(value: FreeformValue): string {
  const part = (key: string) => (value[key] ?? "").trim();
  const region = [part("state"), part("postalCode")].filter((v) => v !== "").join(" ");
  return [part("street"), part("suite"), part("city"), region].filter((v) => v !== "").join(", ");
}

/**
 * What the two address filters share — everything but the id, the label and
 * the reader: the FREEFORM kind (section 14100-36446) over the five address
 * fields, the plain "contains" / "does not contain" pair, no option list
 * (there is nothing to list — a workspace's addresses are free text; the
 * menu row opens the dialog straight away), the address chip format, and
 * the plain FA `text` icon (node 14032-20321, 2026-09-03).
 */
const addressFreeform = <TRow,>(read: (row: TRow) => AddressParts) => ({
  kind: "freeform" as const,
  noun: { one: "address", many: "addresses" },
  icon: "text",
  // No list, so no options — `matches` reads `freeform`, never `ids`.
  options: [] as FilterOption[],
  freeformSummary: addressSummary,
  ...freeformFilter(addressFields(read)),
});

/**
 * Location address — the eighth designed filter (its own section 14947-21952
 * since the 2026-09-16 reorganisation — a FILTER built on the Freeform kind,
 * 14100-36446). Each field is matched against the matching field of the row's
 * LOCATION.
 *
 * RENAMED from "Address" on 2026-09-16 (Daniel): the name now says WHOSE
 * address is being matched, the way its twin "Billing address" always did.
 * The rename MOVED it in every menu — the rows are alphabetical (node
 * 13857-25352), so it stopped being the first row and now follows "Location",
 * which is the filter it reads through.
 */
export function locationAddressTemplate<TRow>(locationOfRow: (row: TRow) => LocationRecord): FilterDef<TRow> {
  return {
    id: "address",
    label: "Location address",
    ...addressFreeform(locationOfRow),
  };
}

/**
 * Billing address — the Location address filter's twin over a row's OWN
 * `billing_*` fields (its section 14947-34564, also built on the Freeform kind; a
 * shared TEMPLATE since the 2026-09-16 reorganisation — the Vendors and
 * Clients lists carried identical local copies before). The reader hands in
 * the row's billing parts; this list-side shape has no location anywhere.
 */
export function billingAddressTemplate<TRow>(read: (row: TRow) => AddressParts): FilterDef<TRow> {
  return {
    id: "address",
    label: "Billing address",
    ...addressFreeform(read),
  };
}

// ---- the PRICEBOOK family's shared filters -----------------------------------
//
// PROMOTED on 2026-09-16, when the Products list became the second pricebook
// type — the `receivedTemplate` / `paymentTermsTemplate` /
// `billingAddressTemplate` precedent: a filter goes here the moment a second
// list reads the same one.
//
// Figma files them under the LABOR canvas rather than the shared Filter
// Template page (Cost 15056-60848, Status 15307-68262, Subtype 15049-71446,
// Taxability 15049-71299) — and the PRODUCTS menu node's rows link to those
// same four sections, which is the design saying "the same filter", in the
// only way that node can. FLAGGED for Daniel: if the four should become
// sections of the shared Filter Template page, nothing in the code moves.
//
// The two pricebook fields that are NOT here stay with their lists, because
// they are not the same filter: `default_price` is Labor's "Rate" and
// Products' "Price" (different name, different icon), and Est. duration /
// Unit type / Inventory / Stock / MFG exist on one type only.

/**
 * Cost — what the company PAYS for a pricebook item (production `cost`;
 * system-created Review items carry its 0 default). The MONEY kind
 * unchanged: the shared eight presets, at least / at most / is, the "$"
 * Custom dialog. Icon `coins` — an expense, distinct from the plain money
 * glyph the list's own price filter uses.
 */
export function costTemplate<TRow>(read: (row: TRow) => number): FilterDef<TRow> {
  return {
    id: "cost",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Cost",
    icon: "coins",
    dsHeader: true,
    ...moneyFilter(read),
  };
}

/**
 * Price — what the client is charged for a pricebook item (production
 * `default_price`). The MONEY kind over the shared ladder; its section is
 * 15339-3946, on the PRODUCTS canvas, and the Other and Discounts menus both
 * link their Price row to it — which is the design saying "the same filter",
 * so it is a template (promoted 2026-09-16 with those two lists).
 *
 * Icon `money-bill`, the standing Amount glyph. The Labor list is the one
 * type that does NOT use this: the same field is its "Rate", a different name
 * with a different meaning, so it keeps its own def.
 *
 * NOTE for the Discounts list: production heads this column "Discount" there
 * and stores the value NEGATIVE, so its money ladder ("at least $250") reads
 * against negative numbers. Daniel's menu still calls the filter "Price" —
 * FLAGGED in `discountFilters`.
 */
export function priceTemplate<TRow>(read: (row: TRow) => number): FilterDef<TRow> {
  return {
    id: "price",
    kind: "money",
    noun: { one: "amount", many: "amounts" },
    label: "Price",
    icon: "money-bill",
    dsHeader: true,
    ...moneyFilter(read),
  };
}

/**
 * Status — the pricebook's two-state review model over production's boolean
 * `confirmed` (section 15307-68262). SINGLE-select (the frame's annotation:
 * "Single-select. Only one selected option at a time" — with two options,
 * "is any of both" could only mean "all"), the DS SelectListHeader in its
 * chips-only variant ("is" / "is not"), no search, no counts.
 *
 * The rows are the node's own: a `circle-small` dot-glyph in the status's
 * colour — amber-a9 Review, jade-a9 Active — and the label, the SAME dot
 * `BadgePricebookStatus` draws, read from the badge's own STATUS map so a
 * status can never be spelled or coloured two ways. The menu row's icon is
 * `circle-dashed`, the standing Status glyph.
 *
 * ACTIVE-phase only on every pricebook list (the menu row's own annotation:
 * "Only shown on the 'Active' phase views") — the registry decides that, not
 * this template.
 */
export function pricebookStatusTemplate<TRow>(
  statuses: PricebookStatus[],
  read: (row: TRow) => PricebookStatus,
): FilterDef<TRow> {
  return {
    id: "status",
    noun: { one: "status", many: "statuses" },
    label: "Status",
    icon: "circle-dashed",
    hideCounts: true,
    dsHeader: true,
    singleSelect: true,
    options: statuses.map((key) => ({
      id: key,
      label: PRICEBOOK_STATUS[key].label,
      // size 10 in the square container = the node's 12px icon box with the
      // fs-10 glyph (read off 15307:68279 and the views' fixed chips) — the
      // same dot the badge draws, NOT the 14px the other filters' row icons
      // use.
      slotLeft: (
        <Icon
          icon="circle-small"
          pack="solid"
          size={10}
          container="square"
          style={{ color: `var(--${PRICEBOOK_STATUS[key].scheme}-a9)` }}
        />
      ),
    })),
    matches: (row, { ids }) => ids.includes(read(row)),
  };
}

/**
 * Subtype — production `subtype`, the nullable revenue-category FK (section
 * 15049-71446 links the Multi-Select documentation). A MULTI-select: "is" /
 * "is not" over a "Subtype..." search, rows led by "No subtype" (the absence
 * value — production's null, and a system-created item's normal state), then
 * the workspace's subtypes A to Z. No counts, no row icons. Icon
 * `diagram-subtask` — the type-tree glyph (`shapes`, the standing Type icon,
 * is Labor's Unit type).
 *
 * The SUBTYPES are the parameter: production scopes each row to one
 * `pricebook_item_type`, so Labor and Products pass their own tables.
 */
export function subtypeTemplate<TRow>(
  subtypes: PricebookSubtype[],
  read: (row: TRow) => string | null,
): FilterDef<TRow> {
  return {
    id: "subtype",
    noun: { one: "subtype", many: "subtypes" },
    label: "Subtype",
    icon: "diagram-subtask",
    searchPlaceholder: "Subtype...",
    hideCounts: true,
    autoFocusSearch: true,
    dsHeader: true,
    options: [
      { id: "none", label: "No subtype" },
      ...[...subtypes].sort((a, b) => a.name.localeCompare(b.name)).map((subtype) => ({ id: subtype.id, label: subtype.name })),
    ],
    matches: (row, { ids }) => {
      const subtypeId = read(row);
      return (ids.includes("none") && subtypeId == null) || (subtypeId != null && ids.includes(subtypeId));
    },
  };
}

/**
 * Taxability — production's `default_is_taxable` boolean, worded as the two
 * values (section 15049-71299: "Single-select. Only one selected option at a
 * time"): Non-taxable · Taxable, in the node's order, bare rows. The NAME
 * settled 2026-09-16 (Daniel kept "Taxability" over "Tax" — on a pricebook
 * screen whose sibling nav item is "Tax rates", "Tax" reads as a rate). Icon
 * `percent` — the tax family's glyph, shared with the tax-rate OBJECT icon
 * on purpose (the Labels = tag precedent).
 */
export function taxabilityTemplate<TRow>(read: (row: TRow) => boolean): FilterDef<TRow> {
  return {
    id: "taxability",
    noun: { one: "option", many: "options" },
    label: "Taxability",
    icon: "percent",
    hideCounts: true,
    dsHeader: true,
    singleSelect: true,
    options: [
      { id: "nonTaxable", label: "Non-taxable" },
      { id: "taxable", label: "Taxable" },
    ],
    matches: (row, { ids }) => ids.includes(read(row) ? "taxable" : "nonTaxable"),
  };
}
