import { ReactNode } from "react";

import AvatarClient from "../../components/Avatar/AvatarClient";
import AvatarUser from "../../components/Avatar/AvatarUser";
import { STATUS } from "../../components/Badge/BadgeJobStatus";
import { Icon } from "../../components/Icon/Icon";
import { IconPack } from "../../components/Icon/Icon.types";
import { semanticIcons } from "../../styles/semanticIcons";

import {
  CLIENTS,
  Job,
  LABELS,
  LOCATIONS,
  PriorityLevel,
  SERVICES,
  SOURCES,
  TECHS,
  dayOffset,
  formatDuration,
  locationLabel,
  locationOf,
} from "./jobsData";

// Filters — the Filters prototype's filter registry (filterDefs). ONE entry per row of the Filters menu
// (Figma nodes 13857-25343 / 13857-25352), in the node's order.
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
  | "duration"
  | "labels"
  | "lastModified"
  | "location"
  | "priority"
  | "scheduledFor"
  | "service"
  | "source"
  | "status"
  | "statusChanged"
  | "type";

export interface FilterOption {
  id: string;
  label: string;
  /** SelectListItem's left slot — an Icon or a 20px (xs) avatar. */
  slotLeft?: ReactNode;
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

export interface FilterDef {
  id: FilterId;
  /** The menu row's label, and the sub-list's title on mobile. */
  label: string;
  /** The menu row's icon, read off the node. */
  icon: string;
  pack?: IconPack;
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
   * it, so the old prototype-local chips block is gone from Filters.tsx.
   */
  dsHeader?: boolean;
  /**
   * Drop the "N jobs" count from every option row. Since the documented
   * sections (2026-09-03) EVERY options filter is drawn without counts, so
   * every one is on it.
   */
  hideCounts?: boolean;
  /**
   * Split this filter's option list into GROUPS with a `secondary` GroupLabel
   * over each (Figma node 13986-51038). The order here is the order on screen;
   * each option names its group through `FilterOption.groupId`, and a group with
   * nothing left in it after a search simply does not render.
   *
   * Only Location is grouped — its rows belong to a client, and without the
   * client above them "Downtown" and "Airport" say nothing.
   */
  groups?: { id: string; label: string }[];
  /**
   * A MINIMUM width for this filter's lists, wherever they open from — the
   * documented sections pin it on the node as a "Min Width" annotation. Only
   * Location carries one (384, the DS card's maximum — nodes 14101-44923 and
   * its mobile twin): its rows are whole location lines, so the list always
   * opens at full size. `openListWidth` in Filters.tsx reads it; `listWidth`'s
   * 240px floor still applies to everyone else.
   */
  listMinWidth?: number;
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
   *   "address"  — five TYPED fields, matched against the job's location
   *                (Figma section 13988-53503). The only kind with NO option
   *                list: its row in the Filters menu opens the dialog itself,
   *                and so does the chip's value segment.
   */
  kind?: "options" | "date" | "duration" | "address";
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
   * An option that stands for the ABSENCE of a value and can only be used
   * ALONE — Labels' "No labels" row (documented section 13999-17090; the
   * annotation on the list's first row: "Selecting this option unselects all
   * others. This option can only be used alone."). Ticking it clears every
   * other option, and ticking any other option clears it — the toggle in
   * Filters.tsx reads this id.
   */
  exclusiveOptionId?: string;
  /**
   * Does this job match this value? Reads `ids` for an options filter, `date`
   * for a date one and `duration` for a duration one. `negated` is NOT applied
   * here — `applyFilters` flips the result — which is exactly why every
   * condition pair has to be a true opposite ("after" / "before", "within" /
   * "outside"). A value carrying its own `compare` never flips (see
   * `withCondition`).
   */
  matches: (job: Job, value: FilterValue) => boolean;
}

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
export interface DurationValue {
  /**
   * How the duration is measured — this filter's condition. Four choices do not
   * fit `negated`, which is a boolean, so this IS the condition and `negated` is
   * held at false (see `conditionChoices` / `isConditionActive` /
   * `withCondition`), exactly like a date's `compare`.
   */
  compare: DurationCompare;
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
export type DurationCompare = "over" | "under" | "is" | "within";

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
export const DURATION_CONDITIONS: DurationCompare[] = ["over", "under", "is"];

/** The Custom dialog's ChipGroup — the same three plus `within` (node 13923-24049). */
export const DURATION_DIALOG_CONDITIONS: DurationCompare[] = [...DURATION_CONDITIONS, "within"];

/**
 * The four durations the list offers, in the node's order (13874-11407). Bare
 * labels — no icon, no count — and SINGLE-select, like the date presets.
 */
export const DURATION_PRESETS: { id: string; label: string; minutes: number }[] = [
  { id: "1h", label: "1 hour", minutes: 60 },
  { id: "2h", label: "2 hours", minutes: 120 },
  { id: "3h", label: "3 hours", minutes: 180 },
  { id: "4h", label: "4 hours", minutes: 240 },
];

const DURATION_PRESET_BY_ID = new Map(DURATION_PRESETS.map((preset) => [preset.id, preset]));

/** The minutes a value stands for — its preset's, or its own custom number. */
export const durationMinutesOf = (duration: DurationValue): number | null =>
  duration.preset != null ? (DURATION_PRESET_BY_ID.get(duration.preset)?.minutes ?? null) : duration.from;

/** The preset behind an id, for the chip's copy. */
export const durationPreset = (id: string | null) => (id == null ? undefined : DURATION_PRESET_BY_ID.get(id));

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
 * cannot collect. The same split the duration filter has (DURATION_CONDITIONS
 * vs DURATION_DIALOG_CONDITIONS); a value that already holds `within` gets no
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
  /** Duration filters only. */
  duration?: DurationValue;
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
export const newFilterInstance = (def: FilterDef): FilterInstance => ({
  key: `filter-${++keyCounter}`,
  id: def.id,
  ids: [],
  negated: false,
  // No `compare` yet: a fresh date starts on the PRESET list, whose condition is
  // the after / before pair. The Custom dialog is what gives it a `compare`.
  date: def.kind === "date" ? { preset: null, from: null, to: null } : undefined,
  // "over" is the condition a fresh duration opens on — the FIRST chip, drawn
  // active in the list header and in the Custom dialog (13874-11407 /
  // 13923-24049, both spelling it "over" since the documented section).
  duration: def.kind === "duration" ? { compare: "over", preset: null, from: null, to: null } : undefined,
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
  const duration = value.duration;
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

// ---- option helpers --------------------------------------------------------

const icon = (name: string, pack: IconPack = "regular", className?: string) => (
  <Icon icon={name} pack={pack} size={14} container="square" className={className} />
);

// Priority — the ONE designed list (node 13855-22268): five options, ASCENDING
// (No priority first, then Low → Urgent), each with the table's own glyph.
// Urgent is the only coloured one; its --orange-9 comes from the caller, which
// is why this takes a class name.
const PRIORITY_OPTION_DEFS: { id: string; label: string; level: PriorityLevel | null; icon: string; pack: IconPack }[] = [
  { id: "none", label: "No priority", level: null, icon: semanticIcons.priorityNone, pack: "custom" },
  { id: "4", label: "Low", level: 4, icon: "duotone-solid-priority-low", pack: "custom-duotone" },
  { id: "3", label: "Medium", level: 3, icon: "duotone-solid-priority-medium", pack: "custom-duotone" },
  { id: "2", label: "High", level: 2, icon: semanticIcons.priorityHigh, pack: "custom" },
  { id: "1", label: "Urgent", level: 1, icon: semanticIcons.priorityUrgent, pack: "solid" },
];

// The two PHASES' status sets, in the STATUS map's order — the documented
// Status lists: the OPEN phase's nine (node 14101-47650) and the CLOSED
// phase's two (14101-48863). Which set the Status filter offers follows the
// branch the page is on — `buildFilters`' `phase`.
const STATUS_KEYS = Object.keys(STATUS) as (keyof typeof STATUS)[];
const CLOSED_KEYS: readonly string[] = ["finalized", "cancelled"];
const OPEN_STATUSES = STATUS_KEYS.filter((key) => !CLOSED_KEYS.includes(key));
const CLOSED_STATUSES = STATUS_KEYS.filter((key) => CLOSED_KEYS.includes(key));

/**
 * The two on-holds carry their SUB-STATUS as the row label — the Status
 * section's annotation: "Sub-statuses — If exist, they are shown instead of
 * the generic status". The badge map calls both plain "On hold", which would
 * make two identical rows.
 */
const STATUS_FILTER_LABELS: Partial<Record<keyof typeof STATUS, string>> = {
  onHoldExternal: "On hold (external)",
  onHoldInternal: "On hold (internal)",
};

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

const PRESET_BY_ID = new Map(DATE_PRESETS.map((preset) => [preset.id, preset]));

/** "2026-08-17" → the day offset from TODAY, the same scale as `dayOffset`. */
const isoOffset = (iso: string) => dayOffset(`${iso}T12:00:00`);

/** A Date → ISO `yyyy-mm-dd`, in LOCAL time (never `toISOString`, which is UTC). */
export const isoOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * A MONTH value is stored as the first of that month and a YEAR value as the
 * first of January; these turn either one into its real bounds, which is what
 * `matches` compares against.
 */
const periodStartIso = (iso: string, timeframe: DateTimeframe) =>
  timeframe === "year" ? `${iso.slice(0, 4)}-01-01` : `${iso.slice(0, 7)}-01`;
const periodEndIso = (iso: string, timeframe: DateTimeframe) => {
  const date = new Date(`${iso}T12:00:00`);
  return timeframe === "year"
    ? `${date.getFullYear()}-12-31`
    : isoOf(new Date(date.getFullYear(), date.getMonth() + 1, 0));
};

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

/**
 * Options + matcher for a date filter over one job field.
 *
 * The POSITIVE half of each pair is what `matches` answers; `applyFilters` flips
 * it for the negative half, so the two are exact opposites:
 *   after N days ago  = received later than that day   → before = on it or earlier
 *   within [from, to] = received on or between the two → outside = neither
 */
function dateFilter(read: (job: Job) => string | null): { options: FilterOption[]; matches: FilterDef["matches"] } {
  return {
    options: DATE_PRESETS.map((preset) => ({ id: preset.id, label: preset.label })),
    matches: (job, value) => {
      const date = value.date;
      if (date == null) return true;
      const iso = read(job);
      // A job with NOTHING in this field matches nothing — only Scheduled for
      // can be empty, and "after 1 week ago" cannot be true of a job that has
      // no scheduled date. The old bucket list had a "Not scheduled" row for
      // those; the timeframe list has no equivalent. FLAGGED, twice over: the
      // row is gone, and `applyFilters` FLIPS this false for the negative half
      // ("before"), so an unscheduled job shows up under every "before" /
      // "outside" condition. The node does not say which way is meant.
      if (iso == null) return false;
      const offset = dayOffset(iso);
      if (date.preset != null) {
        const preset = PRESET_BY_ID.get(date.preset);
        return preset == null ? true : offset > -preset.days;
      }
      // A MONTH value holds the first of its month and a YEAR value the first
      // of January; either is compared as the WHOLE period, first day to last
      // (nodes 13962-14374 / 13965-24022 / 13965-29278 / 13965-31488). A DAY is
      // just itself.
      const timeframe = date.timeframe ?? "day";
      const startOf = (iso: string) => isoOffset(timeframe === "day" ? iso : periodStartIso(iso, timeframe));
      const endOf = (iso: string) => isoOffset(timeframe === "day" ? iso : periodEndIso(iso, timeframe));

      // `within` reads BOTH ends — it is the old Range toggle (Daniel,
      // 2026-08-24) — and the two ends are whole periods: the FIRST day of
      // `from`'s period to the LAST day of `to`'s.
      if (isDateRange(date)) {
        if (date.from == null || date.to == null) return true;
        return offset >= startOf(date.from) && offset <= endOf(date.to);
      }
      if (date.from == null) return true;
      const start = startOf(date.from);
      const end = endOf(date.from);
      // `compare` is the Custom dialog's own condition and is never flipped by
      // `applyFilters` (its values always carry `negated: false`).
      switch (date.compare) {
        case "before":
          return offset < start;
        case "after":
          return offset > end;
        // "on" — the day itself, or the WHOLE month / year it falls in. Also the
        // fallback for a custom value that somehow carries no `compare`.
        default:
          return offset >= start && offset <= end;
      }
    },
  };
}

/**
 * Options + matcher for the DURATION filter (Figma section 13874-10420).
 *
 * `compare` IS the condition, so `applyFilters` never flips this — every value
 * carries `negated: false`, the same contract the date filter's `compare` has.
 *
 * A job with NO duration (nothing scheduled) matches nothing: "longer than an
 * hour" cannot be true of a job that has no length. The old bucket list had a
 * "No duration" option for those; the new design has no equivalent row, so they
 * simply drop out. FLAGGED — say the word and it comes back as a fifth preset.
 */
function durationFilter(): { options: FilterOption[]; matches: FilterDef["matches"] } {
  return {
    options: DURATION_PRESETS.map((preset) => ({ id: preset.id, label: preset.label })),
    matches: (job, value) => {
      const duration = value.duration;
      if (duration == null) return true;
      const from = durationMinutesOf(duration);
      if (from == null) return true;
      const minutes = job.durationMinutes;
      if (minutes == null) return false;
      // `over` and `under` are STRICT — a job of exactly `from` minutes matches
      // only `is`. See the note on DurationCompare: if the boundary should be
      // included, this is the place, and the copy changes with it.
      switch (duration.compare) {
        case "under":
          return minutes < from;
        case "is":
          return minutes === from;
        case "within":
          return duration.to == null ? true : minutes >= from && minutes <= duration.to;
        // "over" — the first chip, and the fallback.
        default:
          return minutes > from;
      }
    },
  };
}

const receivedDates = dateFilter((job) => job.receivedAt);
const lastModifiedDates = dateFilter((job) => job.lastModifiedAt);
const scheduledDates = dateFilter((job) => job.scheduledFor);
const statusChangedDates = dateFilter((job) => job.statusChangedAt);
const durationValues = durationFilter();

/** Client id → name, for the Location list's group headers and its search. */
const CLIENT_NAME = new Map(CLIENTS.map((client) => [client.id, client.name]));

/**
 * Does a typed field match the job's? A BLANK field is not part of the question
 * and always passes; a filled one is a case-insensitive SUBSTRING test, which is
 * what "contains" says — typing "Mission" finds "418 Mission St".
 */
const addressFieldMatches = (typed: string, actual: string | null | undefined) => {
  const query = typed.trim().toLowerCase();
  return query === "" || (actual ?? "").toLowerCase().includes(query);
};

/**
 * The ADDRESS matcher (Figma section 13988-53503). Every filled field has to
 * match — Daniel, 2026-08-24: "if typed in 'Street address' matches location
 * address 'Street address' of one of the jobs on the list, we show those jobs."
 * Field against FIELD, so "Mission" typed into City does not match a job on
 * Mission St.
 *
 * `matches` answers the POSITIVE half only; `applyFilters` flips it for "does
 * not contain", which makes that the exact opposite: NOT every field matches.
 * FLAGGED — that reading means a job matching only some of the typed fields IS
 * shown by "does not contain". The alternative ("no field matches") is a
 * different question; the node does not settle it.
 */
const addressFilter = (): FilterDef["matches"] => (job, value) => {
  const address = value.address;
  if (address == null) return true;
  const location = locationOf(job);
  return (
    addressFieldMatches(address.street, location.street) &&
    addressFieldMatches(address.suite, location.unit) &&
    addressFieldMatches(address.city, location.city) &&
    addressFieldMatches(address.state, location.state) &&
    addressFieldMatches(address.postalCode, location.postalCode)
  );
};

// ---- the registry ----------------------------------------------------------

/**
 * `priorityUrgentClass` is the prototype's own --orange-9 class, handed in so
 * this module stays free of the concept's stylesheet.
 *
 * `phase` is the branch the page is on (the Views section 14032-23326,
 * 2026-09-03). Only the STATUS filter reads it: the open branch offers the
 * nine open statuses over a search, the closed branch the two closed ones
 * with no search.
 */
export function buildFilters(priorityUrgentClass: string, phase: "open" | "closed" = "open"): FilterDef[] {
  return [
    {
      // Address — the eighth designed filter (Figma section 13988-53503,
      // 2026-08-24), and the FIRST row of the menu: the rows are alphabetical
      // and this one is new at the top (node 13857-25352).
      //
      // It is unlike every filter before it. There is no option list, because
      // there is nothing to list — a workspace's addresses are free text. The
      // menu row opens a DIALOG of five typed fields (13988-53606 desktop /
      // 13988-53696 mobile), all optional, and each one is matched against the
      // matching field of the job's LOCATION. Its condition is a plain pair,
      // "contains" / "does not contain" (13995-16956).
      //
      // The mobile dialog stacks all five; the desktop one puts State / Province
      // and Postal code side by side on one row.
      id: "address",
      kind: "address",
      noun: { one: "address", many: "addresses" },
      label: "Address",
      // Plain FA `text` (node 14032-20321, 2026-09-03) — was the KIT icon
      // `regular-text-location-pin`.
      icon: "text",
      // No list, so no options — `matches` reads `address`, never `ids`.
      options: [],
      matches: addressFilter(),
    },
    {
      // Assignee — the first filter Daniel designed in full (Figma section
      // 13902-21570). Three things set it apart from the rest:
      //   - it is "Assignee", singular;
      //   - its option list carries a SEARCH field ("Assignee...") — nine people
      //     is already more than a glance, and a real workspace has hundreds;
      //   - its rows show NO job count, just the face and the name;
      //   - its search takes focus on mobile as well. Client does that too; no
      //     other filter has a search to focus.
      //
      // Its header is the DS `SelectListHeader` in the chipGroup + search
      // variant (`dsHeader`) — the chips came BACK on 2026-08-20 and the whole
      // block is now a DS component: nodes 13923-21709 (desktop) and 13923-21079
      // (mobile) draw the two plain Chips, "is" active, over the full 40px
      // search bar. So the local chip overrides are gone from this filter.
      //
      // Since 2026-09-04 the list opens with a "No assignees" row — the same
      // exclusive absence-option Labels has (`exclusiveOptionId`). See the
      // options below.
      id: "assignees",
      noun: { one: "assignee", many: "assignees" },
      label: "Assignee",
      icon: "user",
      // The ellipsis is BACK (Daniel, 2026-08-24). It went away on 2026-08-20
      // with Client's node 13947-15859; Labels' node (13984-38897) draws
      // "Label..." with it, so all three carry it again.
      searchPlaceholder: "Assignee...",
      hideCounts: true,
      autoFocusSearch: true,
      dsHeader: true,
      // "No assignees" stands ALONE — the row's annotation (node 14143-63387):
      // "Selecting this option unselects all others. This option can only be
      // used alone." — Labels' exclusive rule, read by the toggle in
      // Filters.tsx.
      exclusiveOptionId: "none",
      // xs (20px) user avatars — SelectListItem's left slot takes an Icon or an
      // xs avatar, and a person reads better as a face than as an icon.
      // Sorted by name, the order the node lists them in (the data's own order
      // is by user id, which reads as random here).
      options: [
        // "No assignees" FIRST, over the people (2026-09-04 — both breakpoints
        // draw it as the list's first row: 14143-63387 desktop, 14037-50110
        // mobile). Its dashed-ring avatar with the small user glyph IS
        // AvatarUser's `placeholder` content — the DS empty slot, read off the
        // node (dashed --gray-a9 ring, 10px regular `user` icon).
        // FLAGGED: the mobile node's copy reads "No assignee", SINGULAR, where
        // the desktop node reads "No assignees". Built with the plural — the
        // desktop copy, and what Daniel asked for.
        { id: "none", label: "No assignees", slotLeft: <AvatarUser size="xs" content="placeholder" /> },
        ...[...TECHS]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((tech) => ({
            id: String(tech.id),
            label: tech.name,
            slotLeft: <AvatarUser size="xs" content="image" imageSrc={tech.avatar} />,
          })),
      ],
      // "No assignees" = the job carries nobody. Its negative ("is not") is the
      // flip `applyFilters` makes — the job has at least one assignee.
      matches: (job, { ids }) =>
        ids.includes("none") ? job.assigneeIds.length === 0 : job.assigneeIds.some((id) => ids.includes(String(id))),
    },
    {
      // Client — the second filter Daniel designed in full (Figma section
      // 13934-13189). It is built EXACTLY like Assignee and differs only in the
      // row's left slot: an AvatarClient instead of a face.
      //
      // That sameness is a decision, not a coincidence. On 2026-08-19 Daniel
      // drew Client through five header variants — no fill under the chips, no
      // fill under the search, the search and the chips swapped, 28px chips, the
      // bordered SearchField inset in the list — compared each against
      // Assignee's, and settled on Assignee's. So the trial props those needed
      // are gone from FilterDef; the shapes are in the Figma section's history
      // if any of them comes back.
      //
      // Since 2026-08-20 that shared header is the DS `SelectListHeader`
      // (`dsHeader`) — nodes 13933-10525 desktop / 13933-9967 mobile, identical
      // to Assignee's but for the row avatars.
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
      matches: (job, { ids }) => ids.includes(job.clientId),
    },
    {
      // Date received — the third designed filter, and the first of the new
      // DATE kind (Figma section 13903-25906, 2026-08-19). It is single-select:
      // one relative date ("1 week ago") or one custom date / range, never a
      // set. Its condition pair is after/before, or within/outside once the
      // Custom popover's "Range" box is ticked.
      //
      // Last modified joined it on 2026-08-24 (section 13986-45329) and shares
      // every part of this build. Scheduled for and Status changed still use my
      // invented buckets — no node for them yet.
      //
      // Its header is the DS `SelectListHeader` too, since 2026-08-23 (Figma
      // node 13962-8817): the CHIPS-ONLY variant — a 16px-padded row of `md`
      // Chips closed by the component's own Divider, 65px in all. Date received
      // has no search, so that variant is the whole header. The prototype-local
      // chip block and its two trial props (a flat unselected chip, no fill
      // behind the block) are gone with it — the DS Chip's resting look IS the
      // flat one now, and the DS header has no fill of its own.
      id: "received",
      kind: "date",
      noun: { one: "date", many: "dates" },
      label: "Date received",
      // Back to plain `calendar` (node 14032-20321, 2026-09-03) — the same
      // glyph Scheduled for carries, which is what the node draws. Was the KIT
      // icon `regular-calendar-circle-arrow-right-bl`, `calendar-lines-pen`
      // before that, and plain `calendar` at the start.
      icon: "calendar",
      dsHeader: true,
      ...receivedDates,
    },
    {
      // Duration — the fourth designed filter, and the first of the new DURATION
      // kind (Figma section 13874-10420, 2026-08-24). It is built like Date
      // received and reads the same way: ONE value, a condition of its own, a
      // single-select list of presets over a "Custom..." row.
      //
      // What is different from a date: the condition is a set of THREE
      // (over / under / is) rather than a pair of opposites, and a fourth —
      // `within` — that only the Custom dialog can produce, because it needs two
      // values. So `negated` is never used here; `compare` is the condition.
      //
      // Its header is the DS `SelectListHeader` in the chips-only variant, the
      // same one Date received uses (node 13874-11407 draws md Chips over the
      // component's own Divider, 65px in all). It has no search — four presets
      // need none.
      id: "duration",
      kind: "duration",
      noun: { one: "duration", many: "durations" },
      label: "Duration",
      icon: "hourglass",
      dsHeader: true,
      ...durationValues,
    },
    {
      // Labels — the fifth designed filter; DOCUMENTED since 2026-09-03
      // (section 13999-17090: Empty 13999-17124 / 13999-17223, Selected
      // 14101-42749 / 14101-42751, the 2+ sub-menu 14101-43497 / 14101-43499 —
      // it replaced the first draft, section 13984-38887). Still an OPTIONS
      // filter, ticked with checkboxes, but three things set it apart:
      //
      //   - it carries a SEARCH ("Label...") over the condition chips, so its
      //     header is the DS `SelectListHeader` in the chipGroup + search
      //     variant — Assignee's and Client's header — and its search takes
      //     focus on the phone too (the mobile nodes draw the keyboard up);
      //   - it is the one filter that lets the user pick how several values
      //     COMBINE, ALL of them or ANY of them (`matchMode`). A job holds a set
      //     of labels, so both are real questions; a status or a client is one
      //     value per job, where "all of" could never match;
      //   - its list opens with a "No labels" row (`exclusiveOptionId`) — the
      //     absence of a value as a pickable option, and one that stands ALONE.
      //
      // Its rows are a checkbox and a name — no icon and no job count. Every
      // Labels list pins the DS card's 384px maximum as its MIN width (the
      // "Min Width" annotations on 13999-17141 / 14101-43138 / 14101-43512) —
      // `conditionsWidth` + the width unification in Filters.tsx deliver that.
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
      // order). Its annotation: "Selecting this option unselects all others.
      // This option can only be used alone."
      exclusiveOptionId: "none",
      options: [
        { id: "none", label: "No labels" },
        ...LABELS.map((label) => ({ id: label.id, label: label.name })),
      ],
      // The POSITIVE half only — `applyFilters` flips it for the "do not
      // include …" half, which is what makes each pair a true opposite:
      //   include all of = carries every ticked label → do not include all of = not all
      //   include any of = carries at least one       → do not include any of = none
      // With ONE label ticked the two modes are the same test, which is why the
      // condition collapses to include / do not include.
      //
      // "No labels" is always alone (`exclusiveOptionId`), so it never meets the
      // modes: the job simply carries nothing. Its negative ("do not include")
      // is the flip — the job carries at least one label.
      matches: (job, { ids, match }) => {
        if (ids.includes("none")) return job.labelIds.length === 0;
        return match === "any"
          ? ids.some((id) => job.labelIds.includes(id))
          : ids.every((id) => job.labelIds.includes(id));
      },
    },
    {
      // Last modified — the sixth designed filter, and the SECOND of the date
      // kind; since 2026-09-03 it is DOCUMENTED as a Timeframe filter (section
      // 14100-40610), identical to Date received's (13962-8766) — every piece
      // is the same one:
      //   - the same seven presets in the same order over the same "Custom..."
      //     row;
      //   - the same chips-only `SelectListHeader`, md Chips "after" (active,
      //     first) / "before", closed by the component's own Divider;
      //   - the same Custom dialog (the Timeframe filter section 14038-21304):
      //     Day / Month / Year over after / before / on-in / within, the
      //     period lists, the Cancel + Apply footer.
      // So it takes the date machinery unchanged and only reads another field.
      //
      // What is its own: the label, and the `pen` icon (regular, classic pack —
      // node 13986-45363), which is what this entry already carried as a bucket
      // filter. Date received's kit calendar icon is NOT reused here.
      id: "lastModified",
      kind: "date",
      noun: { one: "date", many: "dates" },
      label: "Last modified",
      icon: "pen",
      dsHeader: true,
      ...lastModifiedDates,
    },
    {
      // Location — DOCUMENTED since 2026-09-03 (section 14101-44921, annotated
      // as a Multi-Select Filter — the pattern documentation is 14038-14033).
      // An OPTIONS filter like Assignee and Client, borrowing their header: the
      // DS `SelectListHeader` in the chipGroup + search variant, "is" / "is
      // not" over the 40px search (the mobile node draws the keyboard up).
      //
      // What is its own, per the section's "The List" annotation:
      //   1. the list is GROUPED BY CLIENT — a SelectListItemGroup with a
      //      `secondary` GroupLabel per client, the DS divider between them.
      //      That is what lets the rows drop the client's name, and why the
      //      search still matches it — see `searchText`;
      //   2. clients are sorted A to Z;
      //   3. locations are sorted "by a name or street address" A to Z — the
      //      row's own label, which starts with the name when there is one and
      //      the address when there is not (`locationLabel`; the row annotation:
      //      the name and each address part show only if they exist).
      //
      // Its lists PIN the DS card's 384px maximum as their MIN width — the
      // "Min Width" annotation on node 14101-44923 (`listMinWidth`): the rows
      // are whole location lines, so the list always opens at full size.
      //
      // The rows are a checkbox and a line of text — no icon and no job count.
      //
      // FLAGGED: the node's search placeholder reads "location..." — lowercase,
      // where Assignee / Client / Labels all capitalize theirs. Built with the
      // capital, the shape the siblings share.
      id: "location",
      noun: { one: "location", many: "locations" },
      label: "Location",
      icon: "location-dot",
      searchPlaceholder: "Location...",
      hideCounts: true,
      autoFocusSearch: true,
      dsHeader: true,
      listMinWidth: 384,
      // Clients in name order, and only those that HAVE a location — an empty
      // group would be a header with nothing under it.
      groups: [...CLIENTS]
        .filter((client) => LOCATIONS.some((location) => location.clientId === client.id))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((client) => ({ id: client.id, label: client.name })),
      // Sorted by the row's label (the section's annotation: "by a name or
      // street address from A to Z") — the data's own order was insertion order.
      options: [...LOCATIONS]
        .sort((a, b) => locationLabel(a).localeCompare(locationLabel(b)))
        .map((location) => ({
          id: location.id,
          // "Downtown  ·  418 Mission St, San Francisco, CA 94105" — and only the
          // halves that exist (`locationLabel`).
          label: locationLabel(location),
          groupId: location.clientId,
          // The row PLUS its client, so the search finds "Wildwood" too.
          searchText: `${locationLabel(location)} ${CLIENT_NAME.get(location.clientId) ?? ""}`,
        })),
      matches: (job, { ids }) => ids.includes(job.locationId),
    },
    {
      // Priority — the FIRST designed filter, DOCUMENTED on 2026-09-03 (section
      // 13874-9043, a Multi-Select Filter — pattern documentation 14038-14033).
      // Against the first build:
      //   - the rows are an icon and a label ONLY — the "N jobs" counts are
      //     gone (`hideCounts`; neither node draws a tag);
      //   - the header is the DS `SelectListHeader` in its CHIPS-ONLY variant —
      //     "is" / "is not", no search. (The section briefly drew no header at
      //     all; Daniel put the chips back the same day, 2026-09-03.)
      id: "priority",
      noun: { one: "priority", many: "priorities" },
      label: "Priority",
      icon: semanticIcons.priorityHigh,
      pack: "custom",
      hideCounts: true,
      dsHeader: true,
      options: PRIORITY_OPTION_DEFS.map((option) => ({
        id: option.id,
        label: option.label,
        slotLeft: icon(option.icon, option.pack, option.id === "1" ? priorityUrgentClass : undefined),
      })),
      matches: (job, { ids }) => ids.includes(job.priority == null ? "none" : String(job.priority)),
    },
    {
      // Scheduled for — DOCUMENTED as a Timeframe filter on 2026-09-03 (section
      // 14101-46526; the annotation links the pattern documentation 14038-21304).
      // Identical to Date received's and Last modified's build — the same seven
      // presets over a "Custom..." row, the same after / before chips-only
      // header, the same Custom dialog — reading the job's SCHEDULED date. It
      // replaced this entry's invented buckets (Overdue / Today / Tomorrow /
      // Next 7 days / Later / Not scheduled).
      //
      // FLAGGED, twice:
      //   - the node's presets read "1 day ago" … "1 year ago" — the same
      //     PAST-anchored copy the other timeframe filters use — although a
      //     scheduled date is usually AHEAD of today. "Scheduled for after
      //     1 week ago" works, but nothing on the list can say "next week".
      //     Built as drawn;
      //   - a job with NO scheduled date has no row to catch it any more (the
      //     buckets had "Not scheduled") — see the null note in `dateFilter`.
      id: "scheduledFor",
      kind: "date",
      noun: { one: "date", many: "dates" },
      label: "Scheduled for",
      icon: "calendar",
      dsHeader: true,
      ...scheduledDates,
    },
    {
      // Service — DOCUMENTED on 2026-09-03 (section 14101-46745, a Multi-Select
      // Filter): the DS `SelectListHeader` in the chipGroup + search variant
      // ("is" / "is not" over a 40px "Service..." search; the mobile node draws
      // the keyboard up), and rows that are a checkbox and the service's name —
      // the wrench icon and the job count are GONE from the rows. The chip's
      // name segment keeps the wrench (node 14101-46752).
      id: "service",
      noun: { one: "service", many: "services" },
      label: "Service",
      icon: "wrench-simple",
      searchPlaceholder: "Service...",
      hideCounts: true,
      autoFocusSearch: true,
      dsHeader: true,
      options: SERVICES.map((service) => ({ id: service.id, label: service.name })),
      matches: (job, { ids }) => ids.includes(job.serviceId),
    },
    {
      // Source — DOCUMENTED on 2026-09-03 (section 14101-47385), built exactly
      // like Service: chipGroup + search header ("Source...", keyboard up on
      // the phone), bare name rows — no icon, no count.
      //
      // The `inbox` icon is Daniel's pick (2026-09-03) — Source means the
      // channel a request arrived through, and it ends the diamonds-4 clash
      // with Type. FLAGGED: the Figma nodes still draw the old glyphs (the
      // menu diamonds-4; the chip 14101-47392 even wrench-simple, a
      // duplication slip) — the file is behind the decision, not the code.
      id: "source",
      noun: { one: "source", many: "sources" },
      label: "Source",
      icon: "inbox",
      searchPlaceholder: "Source...",
      hideCounts: true,
      autoFocusSearch: true,
      dsHeader: true,
      options: SOURCES.map((source) => ({ id: source.id, label: source.name })),
      matches: (job, { ids }) => ids.includes(job.sourceId),
    },
    {
      // Status — DOCUMENTED on 2026-09-03 (section 14101-47648, a Multi-Select
      // Filter): the chipGroup + search header ("Status...", keyboard up on
      // the phone), icon + label rows with NO job counts.
      //
      // The documented list is PHASE-SPLIT, and since the Views section
      // (14032-23326) both halves are REAL: the OPEN branch draws the nine
      // open statuses over the search; the CLOSED branch its own two-row list
      // (Finalized / Cancelled) with no search (the "'Closed' Phase — No
      // Search" annotation) — two rows need none. `phase` picks the half.
      id: "status",
      noun: { one: "status", many: "statuses" },
      label: "Status",
      // REGULAR `circle-dashed`, still turned 180° (node 14032-20321,
      // 2026-09-03 — the node wraps the glyph in a 180° rotation) — was the
      // solid `circle-half-stroke`. This is the row's icon in the Filters menu
      // and the chip's icon, from one place.
      icon: "circle-dashed",
      rotate: 180,
      searchPlaceholder: phase === "open" ? "Status..." : undefined,
      hideCounts: true,
      autoFocusSearch: phase === "open",
      dsHeader: true,
      // The statuses, their icons, their colors and (but for the two on-holds)
      // their labels all come from BadgeJobStatus's own STATUS map — the same
      // source the table's badges use, so a status can never be spelled two
      // ways.
      //
      // The icons are SOLID, each in its scheme's own a9 — every row of both
      // node lists draws them that way (open 14101-47650: gray / violet / blue
      // / tomato / jade / amber / crimson / brown / orange; closed 14101-48863:
      // jade circle-check, gray circle-xmark). Only the ICON is colored — the
      // label stays --text-strong, body-400.
      options: (phase === "open" ? OPEN_STATUSES : CLOSED_STATUSES).map((key) => ({
        id: key,
        label: STATUS_FILTER_LABELS[key] ?? STATUS[key].label,
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
      matches: (job, { ids }) => ids.includes(job.status),
    },
    {
      // Status changed — DOCUMENTED as a Timeframe filter on 2026-09-03
      // (section 14101-53614, pattern documentation 14038-21304), identical to
      // Date received, Last modified and Scheduled for: the same seven presets
      // over "Custom...", the same after / before chips, the same Custom
      // dialog — reading the day the job's status last changed. It replaced
      // the LAST of the invented bucket lists, so the bucket machinery is gone
      // with it.
      //
      // `arrow-left-arrow-right` — Daniel's pick (2026-09-03): a transition
      // between two states, which is what a status change is. It replaced the
      // `pen` the chip node draws (14101-53620), which Last modified already
      // owns. FLAGGED: Figma is behind this decision.
      id: "statusChanged",
      kind: "date",
      noun: { one: "date", many: "dates" },
      label: "Status changed",
      icon: "arrow-left-arrow-right",
      dsHeader: true,
      ...statusChangedDates,
    },
    {
      // Type — DOCUMENTED on 2026-09-03 (section 14101-53833): the chips-only
      // DS header ("is" / "is not", no search — two rows need none), and the
      // rows KEEP their icons (the node draws sparkle / clock-rotate-left) but
      // drop the job counts.
      id: "type",
      noun: { one: "type", many: "types" },
      label: "Type",
      // `shapes` — Daniel's pick (2026-09-03), the category metaphor; it
      // replaced the `diamonds-4` the nodes still draw (menu and chip
      // 14101-53840), which Source used to share. FLAGGED: Figma is behind
      // this decision.
      icon: "shapes",
      hideCounts: true,
      dsHeader: true,
      // The values are the Job Details page's: New = sparkle, Recall =
      // clock-rotate-left, the same icons the table's Type column shows.
      options: [
        { id: "new", label: "New", slotLeft: icon("sparkle") },
        { id: "recall", label: "Recall", slotLeft: icon("clock-rotate-left") },
      ],
      matches: (job, { ids }) => ids.includes(job.type),
    },
  ];
}

// ---- applying and counting -------------------------------------------------

/**
 * The jobs left after every ACTIVE filter is applied. Filters combine with AND;
 * the options WITHIN one filter combine with OR.
 */
export function applyFilters(jobs: Job[], filters: FilterDef[], selection: FilterSelection): Job[] {
  const byId = new Map(filters.map((def) => [def.id, def]));
  const active = selection.filter((entry) => !isEmptyValue(entry));
  if (active.length === 0) return jobs;
  return jobs.filter((job) =>
    active.every((entry) => {
      const def = byId.get(entry.id);
      if (def == null) return true;
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
export function optionCounts(jobs: Job[], def: FilterDef): Record<string, number> {
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

/** "1 job" / "13 jobs" — the node's copy. */
export const countLabel = (count: number) => `${count} ${count === 1 ? "job" : "jobs"}`;

/** How many applications are on — the mobile Filters button's counter. */
export const activeFilterCount = (selection: FilterSelection) =>
  selection.filter((entry) => !isEmptyValue(entry)).length;

/**
 * The applications that are on, each with the filter it belongs to, in the order
 * the user added them — the chips in the bar. Two applications of the same
 * filter are two chips.
 */
export function activeFilters(filters: FilterDef[], selection: FilterSelection) {
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
  compare?: DateCompare | DurationCompare;
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
    // These four are LONG — about 575px on one row — so they wrap to two rows
    // (two per row, exactly as the nodes draw them) inside the DS card's 384px
    // maximum, and `conditionsWidth` in Filters.tsx opens the card at that
    // maximum so they never reflow.
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
  // A DURATION offers the three of DURATION_CONDITIONS (node 13877-16124) —
  // unless it is already a `within`, which is measured ONE way and so is a list
  // of one. That is what makes the chip's condition segment inert, exactly as a
  // date RANGE's is: node 13877-14876 draws the DEFAULT cursor over it (Daniel,
  // 2026-08-24). Leaving `within` is the Custom dialog's job, not the chip's.
  const duration = value.duration;
  if (duration != null) {
    if (duration.compare === "within") return [{ label: "within", negated: false, compare: "within" }];
    return DURATION_CONDITIONS.map((compare) => ({ label: compare, negated: false, compare }));
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
  if (value.duration != null) return value.duration.compare === choice.compare;
  return value.date?.compare === choice.compare;
};

/**
 * The value with one condition choice applied. A `compare` choice writes into
 * `date` or `duration` and holds `negated` at false — `matches` answers it in
 * full, so a flip would invert an already-complete condition. A `match` choice
 * writes BOTH halves, since it is one of two modes × one of the two halves.
 */
export function withCondition<T extends FilterValue>(value: T, choice: ConditionChoice): T {
  if (choice.match != null) return { ...value, negated: choice.negated, match: choice.match };
  if (choice.compare == null) return { ...value, negated: choice.negated };
  if (value.duration != null) {
    const compare = choice.compare as DurationCompare;
    return {
      ...value,
      negated: false,
      duration: {
        ...value.duration,
        compare,
        // A single-value condition has no second end. Unreachable from the chip
        // — a `within` value has only its own choice, so this never runs on one
        // — but it keeps the value honest wherever the call comes from.
        to: compare === "within" ? value.duration.to : null,
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
export function valueDisplay(def: FilterDef, value: FilterValue): { label: string; slotLeft?: ReactNode } {
  // An ADDRESS shows the fields that were typed into, in the dialog's order
  // (Figma node 13995-16947). It can get long; the chip truncates.
  const address = value.address;
  if (address != null) return { label: addressSummary(address) };
  // A DURATION shows its preset's own words ("2 hours"), one custom length
  // ("1h 30m") or both ends of a custom range ("1h 30m — 2h 45m"), never an
  // icon (documented nodes 14100-37398, 14100-37990 and 14100-37994). A custom
  // value is the table's own compact format — see the note over the jobsData
  // import of `formatDuration`.
  const duration = value.duration;
  if (duration != null) {
    const preset = durationPreset(duration.preset);
    if (preset != null) return { label: preset.label };
    if (duration.from == null) return { label: "" };
    if (duration.compare === "within" && duration.to != null) {
      return { label: `${formatDuration(duration.from)} — ${formatDuration(duration.to)}` };
    }
    return { label: formatDuration(duration.from) };
  }
  const date = value.date;
  if (date != null) {
    if (date.preset != null) return { label: PRESET_BY_ID.get(date.preset)?.label ?? "" };
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
