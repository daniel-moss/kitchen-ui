import AvatarClient from "../../components/Avatar/AvatarClient";
import AvatarLocation from "../../components/Avatar/AvatarLocation";
import { Icon } from "../../components/Icon/Icon";
import { joinWithSeparator } from "../../utils/textSeparator";

import { FilterDef, FilterOption } from "./filterDefs";
import { addressFilter, dateFilter, moneyFilter } from "./filterKinds";
import { CLIENTS, LOCATIONS, LocationRecord, SERVICES, locationAddress } from "./listData";

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
// ADDRESS is one of them. The build put it here first — it is shared by both
// lists exactly like the rest — while Figma still filed it under Filter
// FUNCTIONALITY (the KIND). Daniel MOVED it on 2026-09-11, and the node was
// re-read to confirm: 14267-23337 now lists Address, Client, Due Date,
// Issued, Labels, Last Modified, Location, Seen, Service and Status Changed.
// The taxonomy and the build agree again.
//
// ISSUED, TOTAL and SEEN joined this module on 2026-09-12 — all three sit on
// the shared page (14297-48697, 14297-48909 and 14267-13151), even though only
// the Estimates list uses them today. Total brought the MONEY kind with it
// (filterKinds).
//
// NOT BUILT, still on the node with no code behind it:
//   - **Due Date**. A Timeframe filter like Issued, so it is
//     `lastModifiedTemplate`'s shape with another field read. It belongs to the
//     INVOICES list, which this prototype does not have yet — SETTLED with
//     Daniel on 2026-09-12: Due Date and the Estimates page's own **Expires**
//     (14297-48370) are two different filters on two different objects, and
//     both stay. Neither replaces the other.

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
    icon: "building", // was building-user (node 14032-20321, 2026-09-03)
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

// ---- Seen --------------------------------------------------------------------

/**
 * Seen — has the client opened the document? Section 14267-13151, built
 * 2026-09-12; the Estimates list has had the COLUMN since it was created
 * (production's `last_viewed`).
 *
 * An OPTIONS filter with two rows and, per the node's own annotation, SINGLE
 * select: "Only one selected option at a time" — a document has been opened or
 * it has not, so a set of the two would only ever mean "any". Its header is the
 * chips-only `SelectListHeader` ("is" / "is not"), no search, and the rows carry
 * their icons in the default colour with no counts: `eye` Seen · `eye-slash`
 * Not seen (desktop node 14267-13152).
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
      { id: "seen", label: "Seen", slotLeft: <Icon icon="eye" size={14} container="square" /> },
      { id: "notSeen", label: "Not seen", slotLeft: <Icon icon="eye-slash" size={14} container="square" /> },
    ],
    matches: (row, { ids }) => ids.includes(read(row) == null ? "notSeen" : "seen"),
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
    icon: "wrench-simple",
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

// ---- Address ----------------------------------------------------------------

/**
 * Address — the eighth designed filter (Figma section 13988-53503, 2026-08-24),
 * and the FIRST row of every menu: the rows are alphabetical and this one sorts
 * to the top (node 13857-25352).
 *
 * It is unlike every filter around it. There is no option list, because there
 * is nothing to list — a workspace's addresses are free text. The menu row
 * opens a DIALOG of five typed fields (the documented section 14100-36446), all
 * optional, and each one is matched against the matching field of the row's
 * LOCATION. Its condition is a plain pair, "contains" / "does not contain"
 * (13995-16956).
 *
 * The mobile dialog stacks all five; the desktop one puts State / Province and
 * Postal code side by side on one row.
 *
 * (See the module note: Figma files this under the KIND page, not the Template
 * page, even though both lists carry the identical filter. FLAGGED.)
 */
export function addressTemplate<TRow>(locationOfRow: (row: TRow) => LocationRecord): FilterDef<TRow> {
  return {
    id: "address",
    kind: "address",
    noun: { one: "address", many: "addresses" },
    label: "Address",
    // Plain FA `text` (node 14032-20321, 2026-09-03) — was the KIT icon
    // `regular-text-location-pin`.
    icon: "text",
    // No list, so no options — `matches` reads `address`, never `ids`.
    options: [] as FilterOption[],
    matches: addressFilter(locationOfRow),
  };
}
