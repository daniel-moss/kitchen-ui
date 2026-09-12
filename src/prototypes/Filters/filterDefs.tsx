import { ReactNode } from "react";

import { IconPack } from "../../components/Icon/Icon.types";

import { formatDuration } from "./listData";

// Filters — what a FILTER IS. The types every registry is written in, the
// value model behind an application, and the pure helpers that apply, count
// and describe one. No registry and no UI: this module knows nothing about
// jobs, estimates or the Filters menu.
//
// The 2026-09-11 re-organisation emptied it out, onto Daniel's Figma split:
//   - the KINDS' predicates and their Custom dialogs → filterKinds.tsx
//     ("Filter Functionality", 14267-23297);
//   - the seven filters that are the same on every object →
//     filterTemplates.tsx ("Filter Template", 14267-23337);
//   - the JOBS registry → jobsFilters.tsx, the ESTIMATES one →
//     estimateFilters.tsx (the per-object pages);
//   - the menu, the lists, the chips and the bar → filterUI.tsx
//     ("The Shell", 14199-63395).
//
// Each entry owns three things, so a parameter is mapped in exactly one place:
//   - how the row looks in the menu (label + icon, read off the node);
//   - its OPTIONS (for most filters the option list IS the data — clients,
//     locations, labels, techs, services);
//   - `matches`, the single predicate used BOTH to filter the table and to count
//     the jobs behind each option. One function, so a count can never disagree
//     with what applying the filter actually does.
//
// EVERY filter is designed and DOCUMENTED now (2026-09-03): Address
// (14100-36446), Assignee (13902-21570), Client (13934-13189), Date received
// (13903-25906), Duration (13874-10420), Labels (13999-17090), Last modified
// (14100-40610), Location (14101-44921), Priority (13874-9043), Scheduled for
// (14101-46526), Service (14101-46745), Source (14101-47385), Status
// (14101-47648), Status changed (14101-53614) and Type (14101-53833). The
// invented bucket lists and the prototype-local list header are gone with the
// last of them.

export type FilterId =
  | "address"
  | "assignees"
  | "client"
  | "received"
  | "downPayment"
  | "duration"
  | "expires"
  | "issued"
  | "labels"
  | "lastModified"
  | "location"
  | "priority"
  | "scheduledFor"
  | "seen"
  | "service"
  | "source"
  | "status"
  | "statusChanged"
  | "total"
  | "type";

export interface FilterOption {
  id: string;
  label: string;
  /** SelectListItem's left slot — an Icon or a 20px (xs) avatar. */
  slotLeft?: ReactNode;
  /**
   * OBJECT rows only (see `FilterDef.objectRows`): the second line, under the
   * title. Location puts the site's NAME here and its address in `label`.
   */
  caption?: ReactNode;
  /**
   * OBJECT rows only: what the caption reads when this option HAS no value for
   * it — the DS row's standard empty behaviour, dimmed to --text-placeholder
   * (see `SelectListItem.captionPlaceholder` and the ListItem Template copy
   * doc, 27171-15212). Location uses it for the sites with no name of their own.
   */
  captionPlaceholder?: ReactNode;
  /** OBJECT rows only: the mandatory xl (36px) avatar on the left. */
  avatar?: ReactNode;
  /**
   * Which of `FilterDef.groups` this row sits under. Only a GROUPED filter sets
   * it — Location, whose rows are gathered by client (Figma node 13986-51038).
   */
  groupId?: string;
  /**
   * What the SEARCH matches, INSTEAD of the label — the same meaning the DS
   * `SelectListItem.searchText` has, so the two searches (this module's, for a
   * list opened from the Filters menu, and SelectList's built-in one, for a list
   * opened from a chip) agree. Include the label in it.
   *
   * Location needs it: the grouping moved the client's name OUT of the row and
   * into the header, and someone typing "Wildwood" still expects that client's
   * sites. FLAGGED — that consequence is mine, not drawn in the node.
   */
  searchText?: string;
}

/**
 * One filter. Generic over the ROW it tests (2026-09-11, when the Estimates
 * list gained filters): everything about a filter except its predicate — the
 * label, the icon, the options, the conditions, the whole UI — is the same
 * whatever the list holds, so only `matches` needs to know the row type.
 *
 * There is no default row type on purpose. It used to default to `Job`, which
 * meant this module — the one that defines what a filter IS — had to import a
 * jobs type. A registry names its own row.
 */
export interface FilterDef<TRow> {
  id: FilterId;
  /** The menu row's label, and the sub-list's title on mobile. */
  label: string;
  /** The menu row's icon, read off the node. */
  icon: string;
  pack?: IconPack;
  /**
   * Turn the icon, in degrees. NO registry sets it today — the Jobs Status
   * filter was the only one, and its 180° went on 2026-09-12 (Daniel: "the
   * status icon should not have rotation"). Kept because a def's icon is
   * whatever its node draws, and the DS `Icon` takes the prop.
   */
  rotate?: number;
  options: FilterOption[];
  /**
   * Give this filter's option list a search field, with this placeholder
   * (Figma section 13902-21570 — Assignee is the first filter to get one;
   * Client follows in 13902-23431). Left unset, the list has no search.
   */
  searchPlaceholder?: string;
  /**
   * Build this filter's option-list header from the DS `SelectListHeader` —
   * the `chipGroup + search` variant when the filter HAS a search (the
   * condition chips in a real ChipGroup over the real 40px SearchField bar),
   * the CHIPS-ONLY variant when it does not (a 16px-padded row of chips, 65px
   * in all). Either way the closing Divider is the component's own.
   *
   * Since the documented sections (2026-09-03) EVERY filter with a list is on
   * it, so the old prototype-local chips block is gone from filterUI.tsx.
   */
  dsHeader?: boolean;
  /**
   * Drop the "N jobs" count from every option row. Since the documented
   * sections (2026-09-03) EVERY options filter is drawn without counts, so
   * every one is on it.
   */
  hideCounts?: boolean;
  /**
   * Draw this filter's rows as the DS SelectListItem's OBJECT variant — the
   * 60px row with an xl avatar, a Medium title and a caption under it — instead
   * of the default 36px text row. Only Location, since its 2026-09-11 redesign
   * (node 14101-44923): its rows carry the address as the title and the site's
   * name below it, which no single line could hold without truncating.
   */
  objectRows?: boolean;
  /**
   * Split this filter's option list into GROUPS with a `secondary` GroupLabel
   * over each (Figma node 13986-51038). The order here is the order on screen;
   * each option names its group through `FilterOption.groupId`, and a group with
   * nothing left in it after a search simply does not render.
   *
   * Only Location is grouped — its rows belong to a client, and without the
   * client above them "Downtown" and "Airport" say nothing.
   */
  groups?: { id: string; label: string; slotLeft?: ReactNode }[];
  // (`listMinWidth` — the per-filter "Min Width" pin, which only Location
  // carried at 384 — is GONE since 2026-09-11: its node now pins the same 208
  // every other list does, so ONE floor serves them all. See LIST_MIN_WIDTH in
  // filterUI.tsx.)
  /**
   * Let the search take focus as the list OPENS, on touch devices too — the
   * mobile nodes draw the drawer with the caret in the field and the keyboard
   * already up. The DS default is the opposite (Daniel, 2026-07-29: focusing
   * inside the tap makes iOS throw the keyboard over half the list), so this is
   * a per-filter opt-in — and every filter that HAS a search is on it
   * (Assignee, Client, Labels, Location, Service, Source, Status: each mobile
   * node draws the keyboard up).
   */
  autoFocusSearch?: boolean;
  /**
   * The noun the chip uses once more than one option is picked — "N priorities",
   * "3 clients" (Figma node 13855-21840). Only those two are in the node; the
   * rest follow the same shape. FLAGGED.
   */
  noun: { one: string; many: string };
  /**
   * What KIND of value this filter holds (Figma section 13903-25906 introduced
   * the second one, 13874-10420 the third):
   *   "options"  — the default. Several ticked options, combined with OR.
   *   "date"     — ONE relative preset ("1 week ago") or ONE custom date /
   *                date range. Single-select, so its list has no checkboxes, no
   *                counts and no search, and it ends in a "Custom" row.
   *   "duration" — ONE length of time: a preset ("2 hours") or a custom
   *                hr + min value, measured over / under / is / within. Built
   *                exactly like a date filter — single-select list, condition
   *                chips in the header, a "Custom..." row in the footer.
   *   "money"    — ONE amount of money, and the duration's twin in every way
   *                that is not the unit (Figma section 14299-49183, the "Money"
   *                kind, 2026-09-12): the same four measures, the same list, the
   *                same Custom dialog with a "$" field instead of hr + min. Both
   *                store an `AmountValue`.
   *   "address"  — five TYPED fields, matched against the job's location
   *                (Figma section 13988-53503). The only kind with NO option
   *                list: its row in the Filters menu opens the dialog itself,
   *                and so does the chip's value segment.
   */
  kind?: "options" | "date" | "duration" | "money" | "address";
  /**
   * Let the user choose how several ticked values combine — ALL of them or ANY
   * of them (Figma section 13984-38887). Only Labels is on it: a job carries a
   * SET of labels, so "has both Warranty and Compliance" and "has either" are
   * both real questions. Every other options filter holds ONE value per job
   * (a status, a client), where "all of" could never match anything.
   *
   * It seeds `FilterValue.match`, which is what `conditionChoices` reads.
   */
  matchMode?: boolean;
  /**
   * This OPTIONS filter holds ONE option at a time — the Type section's
   * annotation (desktop node 14101-53834, 2026-09-09): "Single-select filter.
   * Only one option might be selected at a time." Its rows are single-select
   * (no checkboxes; the picked row shows the right check), picking REPLACES
   * the pick and closes the list, and the mobile drawer has no Apply bar —
   * the pick is the decision, the same rule the date and duration lists
   * follow. Unlike those, there is no "Custom..." row behind it. Only Type
   * is on it.
   */
  singleSelect?: boolean;
  /**
   * WINDOW presets for a date filter — see `SCHEDULED_WINDOWS`. Set only on
   * Scheduled for; unset means the shared past-anchored `DATE_PRESETS` with
   * the after/before pair. A window-preset VALUE has no condition, which is
   * what drops the list's header chips and the chip's condition box.
   */
  dateWindows?: DateWindowPreset[];
  // (`exclusiveOptionId` is GONE since 2026-09-11 — Daniel: "remove the logic
  // of the single-selection only for 'No assignees' and 'No labels'. The user
  // should be able to select those options along with the rest". The absence
  // options are ordinary members of the set now; each filter's `matches` ORs
  // the absence in. FLAGGED: the rows still carry the old Figma annotation
  // "This option can only be used alone" on nodes 14143-63387 and 13999-17141.)
  /**
   * Does this job match this value? Reads `ids` for an options filter, `date`
   * for a date one and `duration` for a duration one. `negated` is NOT applied
   * here — `applyFilters` flips the result — which is exactly why every
   * condition pair has to be a true opposite ("after" / "before", "within" /
   * "outside"). A value carrying its own `compare` never flips (see
   * `withCondition`).
   */
  matches: (row: TRow, value: FilterValue) => boolean;
  /**
   * Is this row OUTSIDE this filter's answer altogether? A row that is excluded
   * matches neither half — `applyFilters` drops it before the flip, so it
   * appears under "after" and under "before" alike.
   *
   * Only date filters set it, for rows with NO date (Daniel, 2026-09-12): a job
   * whose status never changed cannot be "changed after Aug 1", and it is not
   * "changed before Aug 1" either — it is simply not part of that question. The
   * flip would otherwise list every dateless row under every negative
   * condition. The one exception lives inside `dateFilter`: an ABSENCE window
   * ("Not scheduled") is the value that asks for exactly those rows, so it is
   * never excluded.
   */
  excluded?: (row: TRow, value: FilterValue) => boolean;
  /**
   * What each option row shows in its `tag` — "13 jobs", "1 estimate" — keyed
   * by option id, when the filter shows tags at all (`hideCounts` turns them
   * off). A filter without tags leaves it unset.
   *
   * The REGISTRY supplies the whole STRING, not the number (changed
   * 2026-09-11). Only the registry knows which rows to count AND what they are
   * called, so this is what keeps the filter UI from ever having to know which
   * list it is filtering — it just prints what the def hands it.
   */
  optionTags?: () => Record<string, string>;
}

/**
 * A filter as the UI sees it. The menu, the option lists, the chips and the
 * filter bar never call `matches` — they only read a filter's chrome — so the
 * row type is none of their business, and every registry is assignable to
 * this (a predicate that accepts a Job also accepts `never`). It is what lets
 * one filter UI serve both the Jobs list and the Estimates list.
 */
export type AnyFilterDef = FilterDef<never>;

/**
 * A date filter's value (Figma section 13903-25906). Either a relative PRESET
 * ("1 week ago") or a CUSTOM date — never both (Daniel, 2026-08-18: picking one
 * clears the other).
 */
export interface DateValue {
  /** A DATE_PRESETS id, or null when a custom date is in use. */
  preset: string | null;
  /** Custom dates as ISO `yyyy-mm-dd`. `from` alone is a single custom date. */
  from: string | null;
  to: string | null;
  /**
   * How the custom date is MEASURED — the Custom dialog's second ChipGroup
   * (Figma nodes 13962-8889 / 13962-8893). Set only by that dialog; a preset
   * leaves it unused and keeps the after / before pair.
   *
   * Four choices do not fit `negated`, which is a boolean, so this is the
   * condition for such a value and `negated` is held at false — see
   * `conditionChoices` / `isConditionActive` / `withCondition`.
   */
  compare?: DateCompare;
  /**
   * Which timeframe the dialog was on. It decides how `from` / `to` are READ: a
   * day value is that exact day, a month value is the whole month its `from`
   * falls in, a year value the whole year. Missing means "day".
   */
  timeframe?: DateTimeframe;
}

/**
 * The Custom dialog's second ChipGroup — FOUR choices since 2026-08-24, and the
 * SAME four on every timeframe (Figma nodes 13962-8889 Day, 13965-24022 Month,
 * 13965-31488 Year). `within` REPLACED the "Range" toggle that used to sit next
 * to the timeframe chips — "it does the same thing as the Range toggle, just
 * structured differently" (Daniel) — so it is the one choice that reads BOTH
 * `from` and `to`, and `DateValue` no longer carries a `range` flag.
 *
 * `on` carries the single-period meaning: the day itself, or the whole month /
 * year its `from` falls in. It is STORED as `on` on every timeframe, but PRINTED
 * as "in" on a month or a year — see `dateCompareLabel`. A month used to be
 * measured `within`, which is now taken.
 */
export type DateCompare = "on" | "within" | "before" | "after";

/** The Custom dialog's top ChipGroup. All three are built. */
export type DateTimeframe = "day" | "month" | "year";

/**
 * The four measures, in the node's order — `after` first, and the dialog's
 * DEFAULT (Daniel, 2026-08-24: "'After' should be the first one and the default
 * one"). Read off the rebuilt Date received nodes, which agree across all three
 * timeframes: Day 13979-32841 (chips 13994-16100…16103), Month 13979-34143,
 * Year 13979-35147 — every one draws after / before / on|in / within with
 * `after` active.
 *
 * FLAGGED: the Last modified section (13986-45329) still draws the older
 * on / after / before / within. Both filters share this list, so both now follow
 * the Date received order.
 */
export const DATE_CONDITIONS: DateCompare[] = ["after", "before", "on", "within"];

/**
 * What a measure is CALLED on a given timeframe. Only `on` changes: a day is
 * "on Jan 1", but a month or a year is "in January 2027" / "in 2027" — the nodes
 * print "in" on both (Month 13994-16162's row, Year 13994-16160). Everything
 * else reads the same on every timeframe.
 *
 * The stored value is always `on`; this is copy only, so a value keeps working
 * when the timeframe changes under it.
 */
export const dateCompareLabel = (compare: DateCompare, timeframe: DateTimeframe = "day"): string =>
  compare === "on" && timeframe !== "day" ? "in" : compare;

/** Is this value a RANGE? `within` is what says so — there is no separate flag. */
export const isDateRange = (date: DateValue) => date.compare === "within";

/**
 * An address filter's value (Figma section 13988-53503, 2026-08-24) — the five
 * fields of the dialog, in its order. Plain strings, never null: a blank field
 * is simply not part of the question, which is why every label carries
 * "(optional)".
 *
 * This filter has NO option list at all. There is nothing to choose from — a
 * workspace's addresses are free text — so the user types, and the row in the
 * Filters menu opens the dialog straight away.
 */
export interface AddressValue {
  street: string;
  /** "Suite, unit, etc." in the dialog. */
  suite: string;
  city: string;
  /** "State / Province" in the dialog. */
  state: string;
  postalCode: string;
}

/** The dialog's fields, in the node's order — the labels are the node's copy. */
export const ADDRESS_FIELDS: { key: keyof AddressValue; label: string }[] = [
  { key: "street", label: "Street address" },
  { key: "suite", label: "Suite, unit, etc." },
  { key: "city", label: "City" },
  { key: "state", label: "State / Province" },
  { key: "postalCode", label: "Postal code" },
];

export const emptyAddress = (): AddressValue => ({ street: "", suite: "", city: "", state: "", postalCode: "" });

/**
 * The chip's value segment — the filled fields only, in the dialog's order:
 * "Street address, Suite, City, State Postal code" (Figma node 13995-16947).
 * State and postal code are ONE unit joined by a space, the same rule
 * `locationAddress` follows, so dropping either leaves the other reading whole.
 */
export function addressSummary(address: AddressValue): string {
  const part = (value: string) => value.trim();
  const region = [part(address.state), part(address.postalCode)].filter((v) => v !== "").join(" ");
  return [part(address.street), part(address.suite), part(address.city), region].filter((v) => v !== "").join(", ");
}

/**
 * A duration filter's value (Figma section 13874-10420, 2026-08-24). Either a
 * PRESET ("2 hours") or a custom length in MINUTES — never both, the same rule
 * the date filter follows.
 */
export interface AmountValue {
  /**
   * How the duration is measured — this filter's condition. Four choices do not
   * fit `negated`, which is a boolean, so this IS the condition and `negated` is
   * held at false (see `conditionChoices` / `isConditionActive` /
   * `withCondition`), exactly like a date's `compare`.
   */
  compare: AmountCompare;
  /** A DURATION_PRESETS id, or null when a custom duration is in use. */
  preset: string | null;
  /** The custom duration in MINUTES. `to` is the second end, `within` only. */
  from: number | null;
  to: number | null;
}

/**
 * The four measures. `over` / `under` / `is` compare against ONE value;
 * `within` needs both ends, so only the Custom dialog can produce it.
 *
 * The strings are the LABELS as well as the stored values — what the chip's
 * condition segment, its condition list and the dialog's chips all print.
 *
 * COPY SETTLED with the documented section (2026-09-03): the nodes themselves
 * now draw `over` / `under` / `is` (13874-11407 header, 14100-37396 condition
 * list, 13923-24049 dialog). They replaced the original `greater` / `less`,
 * which were comparatives and could not stand alone — "Duration greater 2
 * hours" is not a sentence. The old flag about that mismatch is resolved.
 *
 * STILL OPEN: `over` / `under` are STRICT — a job of exactly 2 hours matches
 * neither "over 2 hours" nor "under 2 hours", only "is 2 hours". If they should
 * include the boundary, the copy has to say so (`at least` / `at most`) and
 * `matches` below changes with it.
 */
export type AmountCompare = "over" | "under" | "is" | "within";

/**
 * The three the CHIP's condition list and the option list's header chips offer
 * (Figma nodes 13874-11407 and, documented, 14100-37396). `within` is
 * deliberately NOT here: it needs a second value, and only the Custom dialog
 * can collect one.
 *
 * A value that already holds `within` therefore has NO choices at all — see
 * `conditionChoices`, which returns the single "within" that makes the chip's
 * condition segment inert. The documented chip states it in words now
 * (14100-37994's annotation: "The 'Condition' box is not clickable when the
 * condition is set to 'within'"). The same rule a date RANGE follows.
 */
export const AMOUNT_CONDITIONS: AmountCompare[] = ["over", "under", "is"];

/** The Custom dialog's ChipGroup — the same three plus `within` (node 13923-24049). */
export const AMOUNT_DIALOG_CONDITIONS: AmountCompare[] = [...AMOUNT_CONDITIONS, "within"];

/**
 * An amount preset — one row of a duration or money list. `amount` is in the
 * kind's own unit: minutes for a duration, dollars for money.
 */
export interface AmountPreset {
  id: string;
  label: string;
  amount: number;
}

/**
 * The four durations the list offers, in the node's order (13874-11407). Bare
 * labels — no icon, no count — and SINGLE-select, like the date presets.
 */
export const DURATION_PRESETS: AmountPreset[] = [
  { id: "1h", label: "1 hour", amount: 60 },
  { id: "2h", label: "2 hours", amount: 120 },
  { id: "3h", label: "3 hours", amount: 180 },
  { id: "4h", label: "4 hours", amount: 240 },
];

/**
 * The eight amounts the MONEY list offers, in the node's order (14297-48913,
 * the Total filter). Same shape as the durations — bare labels, single-select
 * — and the labels are the money format the chip and the Total column use.
 */
export const MONEY_PRESETS: AmountPreset[] = [
  { id: "100", label: "$100", amount: 100 },
  { id: "250", label: "$250", amount: 250 },
  { id: "500", label: "$500", amount: 500 },
  { id: "1000", label: "$1,000", amount: 1000 },
  { id: "1500", label: "$1,500", amount: 1500 },
  { id: "2500", label: "$2,500", amount: 2500 },
  { id: "5000", label: "$5,000", amount: 5000 },
  { id: "10000", label: "$10,000", amount: 10000 },
];

const AMOUNT_PRESETS_BY_KIND: Record<string, AmountPreset[]> = {
  duration: DURATION_PRESETS,
  money: MONEY_PRESETS,
};

/** This kind's preset table — duration's or money's. */
export const amountPresets = (kind: FilterDef<never>["kind"]) => AMOUNT_PRESETS_BY_KIND[kind ?? ""] ?? [];

/** The preset behind an id, within one kind's table — for the chip's copy. */
export const amountPreset = (kind: FilterDef<never>["kind"], id: string | null) =>
  id == null ? undefined : amountPresets(kind).find((preset) => preset.id === id);

/**
 * The number a value stands for, in the kind's own unit — its preset's, or its
 * own custom number.
 */
export const amountOf = (kind: FilterDef<never>["kind"], value: AmountValue): number | null =>
  value.preset != null ? (amountPreset(kind, value.preset)?.amount ?? null) : value.from;

/**
 * A money amount as the chip and the lists print it: "$1,000" — US currency
 * with NO cents (every node draws whole dollars: 14297-48913's rows,
 * 14297-48920's chip). The TABLE's Total column keeps its own cents format
 * (`formatCurrency` in estimatesData) — a column of money is read down, where a
 * chip is read across.
 */
export const formatMoney = (dollars: number): string =>
  dollars.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// A CUSTOM duration in the chip is the TABLE's own compact format — "1h 30m" /
// "1h" / "30m" — imported from jobsData (`formatDuration`), not written again
// here. The documented chip settled it (node 14100-37990's annotation: "Shown
// in the compact format. The hours and minutes are only shown if greater than
// 0"), which is exactly what that formatter does — so the chip and the Duration
// column can never spell one number two ways. The old chip spelling
// ("1h 30min") and the dialog-footer spelling ("1 hr 30 min", gone with the
// footer preview) are both retired with the documented section.

/**
 * The measures the CHIP's condition list offers for a custom date — the
 * dialog's four minus `within`, which needs a second date the chip's list
 * cannot collect. The same split the duration filter has (AMOUNT_CONDITIONS
 * vs AMOUNT_DIALOG_CONDITIONS); a value that already holds `within` gets no
 * choices at all, so its condition segment is inert.
 *
 * Figma node 13994-16309 draws exactly these three, in this order, and carries
 * the design annotation "No 'Within' Option" — so the exclusion is now written
 * on the node, not only inferred. Node 13994-16410 states the other half:
 * a range's condition segment is "Non-interactive".
 *
 * FLAGGED: the MOBILE twin (13994-16343) lists only after / before — no `on`.
 * Built with all three, because a value the dialog created as "on Jan 1" would
 * otherwise be unreachable from a phone.
 */
export const DATE_CHIP_CONDITIONS: DateCompare[] = ["after", "before", "on"];

/**
 * The years the Month grid and the Year list offer. The documented Timeframe
 * filter section settles the old flag with an annotation (node 14098-28104,
 * 2026-09-03): "Years from 1990 till '+10 years from the current one'". So the
 * floor is fixed at 1990 and the ceiling rolls with the clock.
 */
export const FIRST_YEAR = 1990;
export const YEARS_AFTER_TODAY = 10;

/**
 * One filter's state: the ticked option ids plus its CONDITION. `negated` is the
 * "is not" half of the condition menu (Figma nodes 13861-1837 / 13870-7296), and
 * the second half of every other pair as well.
 */
export interface FilterValue {
  ids: string[];
  negated: boolean;
  /** Date filters only. */
  date?: DateValue;
  /**
   * The two AMOUNT kinds — `duration` (minutes) and `money` (dollars). One
   * shape serves both: a number with a condition, or a preset instead. Only the
   * unit and the formatting differ, and those belong to the kind, not here (see
   * `AmountValue`).
   */
  amount?: AmountValue;
  /** Address filters only. */
  address?: AddressValue;
  /** Match-mode filters only (Labels) — see `MatchMode`. */
  match?: MatchMode;
}

/**
 * How several ticked values combine, on a filter that lets the user choose
 * (Figma section 13984-38887, 2026-08-24). Every OTHER options filter is fixed
 * at `any` — "Status is any of Draft, Active" — and never shows the choice.
 *
 * Present on a value = this filter HAS the choice, the same way `date` and
 * `duration` mark their kinds.
 *
 * With ONE value ticked the two are identical, so the condition collapses to
 * `include` / `do not include` and the mode is simply not shown. It is still
 * remembered, so ticking a second label brings back whichever was chosen.
 */
export type MatchMode = "all" | "any";

/**
 * ONE APPLICATION of a filter. A filter can be applied as many times as the user
 * likes (Daniel, 2026-08-18) — "Assignee is Lorne Riddle" and "Assignee is not
 * Amy Lowery" are two instances of the same filter, sitting side by side in the
 * bar — so each application carries its own `key` and its own condition.
 */
export interface FilterInstance extends FilterValue {
  /** Identifies this application; never reused, so React and the edits agree. */
  key: string;
  id: FilterId;
}

/** What the user has applied, in the order they added it. */
export type FilterSelection = FilterInstance[];

let keyCounter = 0;

/** A fresh, empty application of `def` — what opening a filter's list starts. */
export const newFilterInstance = (def: AnyFilterDef): FilterInstance => ({
  key: `filter-${++keyCounter}`,
  id: def.id,
  ids: [],
  negated: false,
  // No `compare` yet: a fresh date starts on the PRESET list, whose condition is
  // the after / before pair. The Custom dialog is what gives it a `compare`.
  date: def.kind === "date" ? { preset: null, from: null, to: null } : undefined,
  // "over" is the condition a fresh AMOUNT opens on — a duration or a money
  // value alike — the FIRST chip, drawn active in the list header and in the
  // Custom dialog (13874-11407 / 13923-24049 for the duration, 14297-48913 /
  // 14299-49211 for money; all four spell it "over").
  amount:
    def.kind === "duration" || def.kind === "money"
      ? { compare: "over", preset: null, from: null, to: null }
      : undefined,
  // Five blank fields. `negated` stays false, which is "contains" — the first
  // and default condition (node 13995-16953 draws it checked).
  address: def.kind === "address" ? emptyAddress() : undefined,
  // "all" is the mode a fresh Labels filter opens on — the documented condition
  // list (14101-43505) draws "include all of" selected, and the Empty header's
  // annotation marks "include" as the default condition. It stays unseen until
  // a second label is ticked.
  match: def.matchMode === true ? "all" : undefined,
});

/**
 * Has this application nothing to show yet? An options filter is empty with no
 * ticked options; a date one with no preset AND no custom date — and a RANGE
 * needs both ends, since "within Jan 1 — …" says nothing. A duration follows the
 * same shape, with `within` as its two-ended condition.
 */
export function isEmptyValue(value: FilterValue): boolean {
  // An ADDRESS is empty until at least one field has been typed into. Every
  // field is optional on its own, so any ONE of them makes a real question.
  const address = value.address;
  if (address != null) return ADDRESS_FIELDS.every((field) => address[field.key].trim() === "");
  const duration = value.amount;
  if (duration != null) {
    if (duration.preset != null) return false;
    if (duration.from == null) return true;
    return duration.compare === "within" && duration.to == null;
  }
  const date = value.date;
  if (date == null) return value.ids.length === 0;
  if (date.preset != null) return false;
  return isDateRange(date) ? date.from == null || date.to == null : date.from == null;
}

/**
 * Put an instance into the selection. A NEW application is added at the END, so
 * its chip appears last in the bar, right before the "plus" (Daniel,
 * 2026-08-23). One that is already there is replaced IN PLACE — editing a chip
 * must not make it jump to the end while the user is still working on it.
 *
 * An EMPTY instance is dropped instead — an empty chip would have nothing to
 * show in its value segment.
 */
export function upsertFilter(selection: FilterSelection, instance: FilterInstance): FilterSelection {
  if (isEmptyValue(instance)) return selection.filter((entry) => entry.key !== instance.key);
  const at = selection.findIndex((entry) => entry.key === instance.key);
  if (at === -1) return [...selection, instance];
  const next = [...selection];
  next[at] = instance;
  return next;
}

/** Drop one application (the chip's remove button). */
export const removeFilter = (selection: FilterSelection, key: string) =>
  selection.filter((entry) => entry.key !== key);

// ---- the date filter (Figma section 13903-25906) ---------------------------

/**
 * The seven relative dates the list offers, in the node's order. `days` is how
 * far back the moment sits from TODAY — the months and the year are the round
 * numbers the copy implies (30 / 90 / 180 / 365), not calendar arithmetic.
 */
export const DATE_PRESETS: { id: string; label: string; days: number }[] = [
  { id: "1d", label: "1 day ago", days: 1 },
  { id: "3d", label: "3 days ago", days: 3 },
  { id: "1w", label: "1 week ago", days: 7 },
  { id: "1m", label: "1 month ago", days: 30 },
  { id: "3m", label: "3 months ago", days: 90 },
  { id: "6m", label: "6 months ago", days: 180 },
  { id: "1y", label: "1 year ago", days: 365 },
];

/**
 * One WINDOW of days, as offsets from TODAY, both ends inclusive. An end left
 * unset is OPEN: "Past due" / "Expired" are `{ to: -1 }` — everything up to
 * yesterday, however far back it goes (Daniel, 2026-09-12; both lists gained
 * that row, nodes 14101-46526 and 14297-48370).
 */
export interface DateWindowPreset {
  id: string;
  label: string;
  /** Unset = no lower bound. */
  from?: number;
  /** Unset = no upper bound. */
  to?: number;
  /**
   * The row that stands for NO date at all — "Not scheduled" (2026-09-09). It
   * is the ONE window that matches an empty field, and it takes no bounds.
   * Daniel, 2026-09-12: it must match ONLY the jobs with nothing in the field,
   * which is why the past needed a row of its own rather than being folded in
   * here.
   */
  absent?: boolean;
}
const PRESET_BY_ID = new Map(DATE_PRESETS.map((preset) => [preset.id, preset]));

/** The shared past-anchored preset behind an id — the Timeframe kind's lookup. */
export const datePreset = (id: string | null) => (id == null ? undefined : PRESET_BY_ID.get(id));
/** A Date → ISO `yyyy-mm-dd`, in LOCAL time (never `toISOString`, which is UTC). */
export const isoOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
/**
 * "Jan 1" — the chip's copy for a custom date (Figma node 13914-15296). No year:
 * the node has none, and the chip is already tight. FLAGGED.
 */
export const formatChipDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
/**
 * "Jan 1, 2027" — the Custom dialog's footer, which shows the picked date next
 * to Apply (Figma node 13962-8889). WITH the year, unlike the chip: the footer
 * has the room and the calendar above it can be years away from today.
 */
export const formatFooterDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * "August 5, 2026" — the Custom dialog's DateFields on DESKTOP (Daniel,
 * 2026-08-23). The phone uses `formatFooterDate`'s short month instead, because
 * two fields share one row there.
 *
 * Both override the DS DateField's own default ("Wednesday, August 5", with the
 * year only when it is not the current one): a filter date is often years back,
 * so the year always shows, and the weekday adds nothing next to a calendar.
 */
export const formatLongDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/**
 * "May 2027" — a MONTH value in the chip. NO comma (Daniel, 2026-09-03, and
 * node 14098-35853 draws "Jan 2027 — Aug 2027") — the old node's "May, 2027"
 * was the slip the earlier flag suspected.
 */
export const formatMonthValue = (iso: string) => {
  const date = new Date(`${iso}T12:00:00`);
  return `${date.toLocaleDateString("en-US", { month: "short" })} ${date.getFullYear()}`;
};

/**
 * One end of a date value, in the copy its timeframe calls for. A DAY inside a
 * RANGE spells the year out — "Aug 5, 2026 — Aug 20, 2026" (Daniel,
 * 2026-08-23), because a bare "Aug 5 — Aug 20" leaves the reader guessing which
 * year the two ends are in. A single day stays short ("Aug 5"), as its node
 * draws it (13914-15296). FLAGGED: the two now differ.
 */
export const formatValueEnd = (date: DateValue, iso: string) => {
  if (date.timeframe === "year") return iso.slice(0, 4);
  if (date.timeframe === "month") return formatMonthValue(iso);
  return isDateRange(date) ? formatFooterDate(new Date(`${iso}T12:00:00`)) : formatChipDate(iso);
};

// ---- applying and counting -------------------------------------------------

/**
 * The jobs left after every ACTIVE filter is applied. Filters combine with AND;
 * the options WITHIN one filter combine with OR.
 */
export function applyFilters<TRow>(jobs: TRow[], filters: FilterDef<TRow>[], selection: FilterSelection): TRow[] {
  const byId = new Map(filters.map((def) => [def.id, def]));
  const active = selection.filter((entry) => !isEmptyValue(entry));
  if (active.length === 0) return jobs;
  return jobs.filter((job) =>
    active.every((entry) => {
      const def = byId.get(entry.id);
      if (def == null) return true;
      // Out of this filter's answer entirely — before the flip, so it cannot
      // come back through the negative half (see `excluded`).
      if (def.excluded?.(job, entry)) return false;
      const hit = def.matches(job, entry);
      return entry.negated ? !hit : hit;
    }),
  );
}

/**
 * How many jobs sit behind each option of one filter — the number the option's
 * `tag` shows.
 *
 * Counted over the WHOLE list, with no filters applied (Daniel, 2026-08-17). The
 * count says how many jobs of that kind exist at all, so the user can see what
 * the list actually holds before touching anything — it is a property of the
 * data, not of the current view.
 *
 * The consequence, on purpose: with a filter already on, the counts no longer
 * add up to the rows on screen, and an option can read "6 jobs" while ticking it
 * shows fewer (or none), because another filter excludes them. It was the other
 * way round before — the counts tracked the current view and answered "how many
 * would I get" instead.
 */
export function optionCounts<TRow>(jobs: TRow[], def: FilterDef<TRow>): Record<string, number> {
  const counts: Record<string, number> = {};
  // A date or duration filter shows no counts at all (its rows are bare labels),
  // so there is nothing to measure — and its value does not live in `ids`. An
  // address filter has no rows in the first place.
  if (def.kind !== "options" && def.kind != null) return counts;
  for (const option of def.options) {
    counts[option.id] = jobs.filter((job) => def.matches(job, { ids: [option.id], negated: false })).length;
  }
  return counts;
}

// (`countLabel` is GONE, 2026-09-11: it was hard-wired to "job" / "jobs" in a
// module that must not know what a list holds. `countOf(noun, n)` in
// listData.ts is the noun-aware replacement, and a registry builds its own
// option tags with it — see `FilterDef.optionTags`.)

/** How many applications are on — the mobile Filters button's counter. */
export const activeFilterCount = (selection: FilterSelection) =>
  selection.filter((entry) => !isEmptyValue(entry)).length;

/**
 * The applications that are on, each with the filter it belongs to, in the order
 * the user added them — the chips in the bar. Two applications of the same
 * filter are two chips.
 */
export function activeFilters(filters: AnyFilterDef[], selection: FilterSelection) {
  const byId = new Map(filters.map((def) => [def.id, def]));
  return selection
    .filter((entry) => !isEmptyValue(entry))
    .flatMap((entry) => {
      const def = byId.get(entry.id);
      return def == null ? [] : [{ def, instance: entry }];
    });
}

// ---- the chip's copy -------------------------------------------------------

/**
 * The condition segment's text. Read off the two condition menus: with ONE value
 * picked the choices are "is" / "is not" (node 13861-1837); with several they are
 * "is any of" / "is not" (node 13870-7296).
 *
 * FLAGGED to Daniel: the negative stays "is not" in both, so several values read
 * "Priority is not 3 priorities". "is none of" would parse better — but the node
 * says "is not", so that is what this builds.
 */
export const conditionLabel = (value: FilterValue) => {
  const choices = conditionChoices(value);
  return (choices.find((choice) => isConditionActive(value, choice)) ?? choices[0]).label;
};

/** One row of a condition menu / one Chip of a condition ChipGroup. */
export interface ConditionChoice {
  label: string;
  /** The `negated` this choice sets. Always false for a `compare` choice. */
  negated: boolean;
  /** Date and duration filters: the `compare` this choice sets. */
  compare?: DateCompare | AmountCompare;
  /**
   * Match-mode filters: the `match` this choice sets. Set together with
   * `negated`, since the four choices are two modes × the two halves of the
   * pair — see `conditionChoices`.
   */
  match?: MatchMode;
}

/**
 * The choices the condition menu offers.
 *
 * Most filters have a PAIR — the second choice is the exact opposite of the
 * first, which is why `FilterDef.matches` only answers the positive half and
 * `applyFilters` flips it. A DATE filter has its own pairs, chosen by the value:
 * after / before for one date, within / outside for a range (Figma nodes
 * 13912-12012 and 13912-13163).
 *
 * A date carrying `compare` is the ONE case with THREE choices — the Custom
 * dialog's second ChipGroup, on / before / after (Figma node 13962-8889). They
 * are not opposites of each other, so they set `date.compare` instead of
 * `negated`, and `matches` reads them directly.
 *
 * A MATCH-MODE filter (Labels) has FOUR, but they are still two pairs: two modes
 * (all / any) × the two halves. So `matches` answers only the positive half of
 * each and `applyFilters` flips the other, exactly as everywhere else.
 */
export const conditionChoices = (value: FilterValue): ConditionChoice[] => {
  // LABELS and anything else that lets the user pick ALL vs ANY (Figma nodes
  // 13984-38916 for one value, 13984-38934 for several).
  if (value.match != null) {
    // ONE value: "all of it" and "any of it" are the same thing, so the mode is
    // not offered and the copy drops it. The chosen mode is kept on the value
    // and comes back the moment a second label is ticked. Node 13984-38916.
    if (value.ids.length <= 1) {
      return [
        { label: "include", negated: false },
        { label: "do not include", negated: true },
      ];
    }
    // SEVERAL values — the documented section's copy, REWRITTEN by Daniel on
    // 2026-09-03 (sub-menu node 14101-43498 and condition list 14101-43505,
    // applied verbatim): the verb never drops, so every chip is a whole
    // phrase, and the ORDER puts the two "any" measures in the middle —
    // include all of / include any of / do not include any of / do not
    // include all of. (An "exclude if …" wording existed in the node for a
    // moment the same day; Daniel replaced it with this.) Each negative is the
    // true opposite of its positive ("do not include any of" flips "include
    // any of", "do not include all of" flips "include all of"), which is what
    // lets `applyFilters` keep flipping the positive `matches`.
    //
    // These four are LONG — about 575px on one row — so the card hugs out to
    // its own 384px maximum and they wrap to two rows, two per row, exactly as
    // the nodes draw them. Nothing measures that: the ChipGroup asks for one
    // row, the card's max-width refuses, and the chips wrap.
    return [
      { label: "include all of", negated: false, match: "all" },
      { label: "include any of", negated: false, match: "any" },
      { label: "do not include any of", negated: true, match: "any" },
      { label: "do not include all of", negated: true, match: "all" },
    ];
  }
  // An ADDRESS has one pair, and they are true opposites, so `negated` carries
  // it like an options filter's "is" / "is not" — no `compare` needed (Figma
  // node 13995-16956, "contains" checked).
  if (value.address != null) {
    return [
      { label: "contains", negated: false },
      { label: "does not contain", negated: true },
    ];
  }
  // A DURATION offers the three of AMOUNT_CONDITIONS (node 13877-16124) —
  // unless it is already a `within`, which is measured ONE way and so is a list
  // of one. That is what makes the chip's condition segment inert, exactly as a
  // date RANGE's is: node 13877-14876 draws the DEFAULT cursor over it (Daniel,
  // 2026-08-24). Leaving `within` is the Custom dialog's job, not the chip's.
  const duration = value.amount;
  if (duration != null) {
    if (duration.compare === "within") return [{ label: "within", negated: false, compare: "within" }];
    return AMOUNT_CONDITIONS.map((compare) => ({ label: compare, negated: false, compare }));
  }
  const date = value.date;
  if (date != null) {
    // RANGE first: a `within` value has no choices, which is what makes the
    // chip's condition segment inert (Daniel, 2026-08-23 for the date, restated
    // 2026-08-24 for the duration — the node draws the DEFAULT cursor over that
    // segment). Leaving `within` is the Custom dialog's job: only it can collect
    // the second date the other three would throw away.
    if (isDateRange(date)) return [{ label: "within", negated: false, compare: "within" }];
    if (date.compare != null) {
      // "on" a day, "in" a month or a year — the chip and its list say what the
      // dialog says (`dateCompareLabel`).
      const timeframe = date.timeframe ?? "day";
      return DATE_CHIP_CONDITIONS.map((compare) => ({
        label: dateCompareLabel(compare, timeframe),
        negated: false,
        compare,
      }));
    }
    // A PRESET date's pair. `after` is FIRST and, carrying `negated: false`, the
    // default a fresh filter opens on — Daniel, 2026-08-24, and both list-header
    // nodes now draw it that way (13986-45365 / I13962:8818;24979:74472). The
    // nodes used to draw `before` first; the code already defaulted to `after`,
    // so only the ORDER changed here.
    return [
      { label: "after", negated: false },
      { label: "before", negated: true },
    ];
  }
  return [
    { label: value.ids.length > 1 ? "is any of" : "is", negated: false },
    { label: "is not", negated: true },
  ];
};

/** Is this the choice the value currently sits on? */
export const isConditionActive = (value: FilterValue, choice: ConditionChoice) => {
  // A match-mode choice is a PAIR of facts — which half, and which mode — so
  // both have to agree. The one-value choices carry no `match` and fall through
  // to the plain comparison below, which is right: the mode is not on offer.
  if (choice.match != null) return choice.negated === value.negated && value.match === choice.match;
  if (choice.compare == null) return choice.negated === value.negated;
  if (value.amount != null) return value.amount.compare === choice.compare;
  return value.date?.compare === choice.compare;
};

/**
 * The value with one condition choice applied. A `compare` choice writes into
 * `date` or `amount` and holds `negated` at false — `matches` answers it in
 * full, so a flip would invert an already-complete condition. A `match` choice
 * writes BOTH halves, since it is one of two modes × one of the two halves.
 *
 * The key it writes MUST be `amount`, and TypeScript will not catch it if it is
 * not: the return type is the generic `T`, and a spread object literal in that
 * position is not excess-property-checked, so a stale `duration:` key compiled
 * happily and silently did nothing (found 2026-09-12 — the amount chips' whole
 * condition list was dead).
 */
export function withCondition<T extends FilterValue>(value: T, choice: ConditionChoice): T {
  if (choice.match != null) return { ...value, negated: choice.negated, match: choice.match };
  if (choice.compare == null) return { ...value, negated: choice.negated };
  if (value.amount != null) {
    const compare = choice.compare as AmountCompare;
    return {
      ...value,
      negated: false,
      amount: {
        ...value.amount,
        compare,
        // A single-value condition has no second end. Unreachable from the chip
        // — a `within` value has only its own choice, so this never runs on one
        // — but it keeps the value honest wherever the call comes from.
        to: compare === "within" ? value.amount.to : null,
      },
    };
  }
  return {
    ...value,
    negated: false,
    date: value.date == null ? value.date : { ...value.date, compare: choice.compare as DateCompare },
  };
}

/**
 * The value segment. ONE value shows that option — its icon and its label. More
 * than one collapses to a count, with no icon ("3 priorities"). A date shows the
 * preset's own words ("1 day ago"), one custom date ("Jan 1") or both ends of a
 * custom range ("Jan 1 — Jan 10"), never an icon.
 */
export function valueDisplay(def: AnyFilterDef, value: FilterValue): { label: string; slotLeft?: ReactNode } {
  // An ADDRESS shows the fields that were typed into, in the dialog's order
  // (Figma node 13995-16947). It can get long; the chip truncates.
  const address = value.address;
  if (address != null) return { label: addressSummary(address) };
  // A DURATION shows its preset's own words ("2 hours"), one custom length
  // ("1h 30m") or both ends of a custom range ("1h 30m — 2h 45m"), never an
  // icon (documented nodes 14100-37398, 14100-37990 and 14100-37994). A custom
  // value is the table's own compact format — see the note over the jobsData
  // import of `formatDuration`.
  const amount = value.amount;
  if (amount != null) {
    // The unit is the KIND's: minutes print as the table's compact duration,
    // dollars as "$1,000" (node 14297-48920's chip).
    const format = def.kind === "money" ? formatMoney : formatDuration;
    const preset = amountPreset(def.kind, amount.preset);
    if (preset != null) return { label: preset.label };
    if (amount.from == null) return { label: "" };
    if (amount.compare === "within" && amount.to != null) {
      return { label: `${format(amount.from)} — ${format(amount.to)}` };
    }
    return { label: format(amount.from) };
  }
  const date = value.date;
  if (date != null) {
    // A WINDOW preset's label comes from the filter's own list (Scheduled
    // for); everything else from the shared DATE_PRESETS.
    if (date.preset != null) {
      const window = def.dateWindows?.find((w) => w.id === date.preset);
      return { label: window?.label ?? PRESET_BY_ID.get(date.preset)?.label ?? "" };
    }
    if (isDateRange(date) && date.from != null && date.to != null) {
      return { label: `${formatValueEnd(date, date.from)} — ${formatValueEnd(date, date.to)}` };
    }
    return { label: date.from == null ? "" : formatValueEnd(date, date.from) };
  }
  // ONE value names itself — Location included since its documented section
  // (2026-09-03): node 14101-44928 draws the whole location line in the value
  // segment, truncating at the chip's 240px value cap. (It used to COUNT even
  // at one value, through a `countValue` prop that is gone with it.)
  if (value.ids.length === 1) {
    const option = def.options.find((o) => o.id === value.ids[0]);
    if (option != null) return { label: option.label, slotLeft: option.slotLeft };
  }
  const noun = value.ids.length === 1 ? def.noun.one : def.noun.many;
  return { label: `${value.ids.length} ${noun}` };
}
