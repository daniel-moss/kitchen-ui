import AvatarUser from "../../components/Avatar/AvatarUser";
import { STATUS } from "../../components/Badge/BadgeJobStatus";
import { Icon } from "../../components/Icon/Icon";
import { IconPack } from "../../components/Icon/Icon.types";
import { semanticIcons } from "../../styles/semanticIcons";

import { DateWindowPreset, FilterDef, optionCounts } from "./filterDefs";
import { dateFilter, durationFilter, forwardWindows } from "./filterKinds";
import {
  addressTemplate,
  clientTemplate,
  labelsTemplate,
  lastModifiedTemplate,
  locationTemplate,
  serviceTemplate,
  statusChangedTemplate,
} from "./filterTemplates";
import { JOBS, Job, LABELS, PriorityLevel, SOURCES, TECHS, locationOf } from "./jobsData";
import { JOB_NOUN, countOf } from "./listData";

import styles from "./Filters.module.scss";

// The JOBS list's filter registry — ONE entry per row of the Filters menu
// (Figma node 14032-20321), in the node's alphabetical order.
//
// TWO kinds of entry, which is exactly Daniel's Figma split:
//   - the OBJECT-SPECIFIC ones, his Jobs page 14267-33379: Assignee, Date
//     received, Duration, Priority, Scheduled for, Source, Status, Type. They
//     are written out below, because they exist on no other list;
//   - the shared TEMPLATES (14267-23337), taken from filterTemplates.tsx and
//     handed the one thing that differs — how to read a JOB. Until 2026-09-11
//     they lived HERE and the Estimates list derived its copies from them; now
//     neither object owns them.
//
// Each entry owns three things, so a parameter is mapped in exactly one place:
//   - how the row looks in the menu (label + icon, read off the node);
//   - its OPTIONS (for most filters the option list IS the data — techs,
//     sources, statuses);
//   - `matches`, the single predicate used BOTH to filter the table and to
//     count the jobs behind each option. One function, so a count can never
//     disagree with what applying the filter actually does.
//
// EVERY filter is designed and DOCUMENTED (2026-09-03): Address (14100-36446),
// Assignee (13902-21570), Client (13934-13189), Date received (13903-25906),
// Duration (13874-10420), Labels (13999-17090), Last modified (14100-40610),
// Location (14101-44921), Priority (13874-9043), Scheduled for (14101-46526),
// Service (14101-46745), Source (14101-47385), Status (14101-47648), Status
// changed (14101-53614) and Type (14101-53833). The invented bucket lists and
// the prototype-local list header are gone with the last of them.

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

/**
 * Scheduled for's presets — WINDOWS, not the shared past-anchored list (the
 * updated section 14101-46526, 2026-09-09; it replaced the "1 day ago …"
 * copy this filter inherited, which could never say "next week"). The edges
 * are Daniel's rule: "from today + N days; Tomorrow is tomorrow only" — so
 * "Next N days" runs today through the END of today+N (the same counting the
 * View menu's horizon documents), Today is day 0 alone and Tomorrow day 1
 * alone.
 *
 * A window is a COMPLETE answer, so a value holding one has NO condition:
 * the list draws no condition chips (no header at all) and the chip renders
 * without its condition box (the FilterChip `condition=false` variant).
 * The Custom dialog is unchanged — a custom value keeps the dialog's own
 * conditions ("after · Jan 1", the section's second chip example).
 */
export const SCHEDULED_WINDOWS: DateWindowPreset[] = [
  // "Not scheduled" FIRST (added in the 2026-09-09 list update) — the row for
  // jobs with NO scheduled date at all, which closed the old flag about them
  // matching nothing. Single-select like every preset, so it needs none of
  // Labels' exclusive machinery.
  { id: "none", label: "Not scheduled", absent: true },
  // Then PAST DUE and the six future windows — the kind's own list
  // (`forwardWindows`), which Estimates' "Expires" draws too under its own
  // word for the past row.
  ...forwardWindows("Past due"),
];

// The date and duration KINDS, pointed at the job fields the object-specific
// filters read. The shared ones (Last modified, Status changed) build their own
// inside filterTemplates.
const receivedDates = dateFilter<Job>((job) => job.receivedAt);
const scheduledDates = dateFilter<Job>((job) => job.scheduledFor, SCHEDULED_WINDOWS);
const durationValues = durationFilter<Job>((job) => job.durationMinutes);

// ---- the registry ----------------------------------------------------------

/**
 * `phase` is the branch the page is on (the Views section 14032-23326,
 * 2026-09-03). Only the STATUS filter reads it: the open branch offers the
 * nine open statuses over a search, the closed branch the two closed ones with
 * no search.
 *
 * (The `priorityUrgentClass` parameter is gone with the 2026-09-11 move: it
 * existed so `filterDefs` could stay free of the prototype's stylesheet, and
 * this module is the prototype's.)
 */
function buildJobsFilters(phase: JobsPhase): FilterDef<Job>[] {
  const defs: FilterDef<Job>[] = [
    // Address — shared (see filterTemplates).
    addressTemplate(locationOf),
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
      // Since 2026-09-04 the list opens with a "No assignees" row — the absence
      // of a value as a pickable option. It combines with the people since
      // 2026-09-11 (see `matches`).
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
      // "No assignees" = the job carries nobody, and it is ORed with whoever
      // else is ticked (2026-09-11), so "No assignees" + Dana matches the
      // unassigned jobs AND Dana's. Its negative ("is not") is the flip
      // `applyFilters` makes.
      matches: (job, { ids }) =>
        (ids.includes("none") && job.assigneeIds.length === 0) ||
        job.assigneeIds.some((id) => ids.includes(String(id))),
    },
    // Client — shared (see filterTemplates).
    clientTemplate((job) => job.clientId),
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
      // `calendar-arrow-down` (Daniel, 2026-09-12, agreeing with the reasoning
      // below). A calendar with an arrow coming INTO it: the day a request
      // arrived. It does not collide with Source's `inbox`.
      //
      // FLAGGED: node 14032-20321 still draws `calendar-plus`, which is what
      // this row carried for a few hours. A PLUS reads as “add” everywhere else
      // in this product — the sidebar's Create, the list's “New” — so on a
      // filter it suggested MAKING a date rather than the date a job came in
      // on. (Before that it was plain `calendar`, shared with Scheduled for;
      // that one is `calendar-day` now, so the two date filters no longer
      // use one glyph. Before the plain calendar: the KIT icon
      // `regular-calendar-circle-arrow-right-bl`, and `calendar-lines-pen`.)
      icon: "calendar-arrow-down",
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
    // Labels — shared (see filterTemplates), over the JOB label table.
    labelsTemplate(LABELS, (job) => job.labelIds),
    // Last modified — shared (see filterTemplates).
    lastModifiedTemplate((job) => job.lastModifiedAt),
    // Location — shared (see filterTemplates).
    locationTemplate((job) => job.locationId),
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
        slotLeft: icon(option.icon, option.pack, option.id === "1" ? styles.priorityUrgent : undefined),
      })),
      matches: (job, { ids }) => ids.includes(job.priority == null ? "none" : String(job.priority)),
    },
    {
      // Scheduled for — REDESIGNED 2026-09-09 (the updated section
      // 14101-46526): the past-anchored presets this filter inherited are
      // GONE, replaced by forward WINDOWS — Today / Tomorrow / Next 3 / 7 /
      // 14 / 30 days over the same "Custom..." row (see SCHEDULED_WINDOWS
      // for the edge rules). A window is a complete answer, so this list has
      // NO condition chips — `dsHeader` is off, the one timeframe filter
      // without a header — and a preset-valued chip renders WITHOUT its
      // condition box ("Scheduled for · Next 3 days · ×", the section's
      // chip example). The Custom dialog is unchanged and its values keep
      // their conditions ("after · Jan 1").
      //
      // "Not scheduled" leads the list since the same day's second update —
      // the row for jobs with no scheduled date, which closed the old flag
      // about them matching nothing.
      id: "scheduledFor",
      kind: "date",
      noun: { one: "date", many: "dates" },
      label: "Scheduled for",
      // `calendar-day` (Daniel, 2026-09-12) — a calendar with ONE day block
      // filled: the single day a job is booked for. Picked over `calendar-clock`
      // (the other candidate, which says "date + time" but breaks the square
      // silhouette every other filter icon has) and over `calendar-range`
      // (unreadable at the chip's 14px).
      //
      // FLAGGED: node 14032-20321 draws `calendar-lines`, which this row
      // carried for a few hours — too generic, it only says "a calendar".
      // Daniel is updating the node. Before the lines: plain `calendar`, which
      // Date received carried too, so the two date filters were one glyph.
      icon: "calendar-day",
      dateWindows: SCHEDULED_WINDOWS,
      ...scheduledDates,
    },
    // Service — shared (see filterTemplates).
    serviceTemplate((job) => job.serviceId),
    {
      // Source — DOCUMENTED on 2026-09-03 (section 14101-47385), built exactly
      // like Service: chipGroup + search header ("Source...", keyboard up on
      // the phone), bare name rows — no icon, no count.
      //
      // The `inbox` icon is Daniel's pick (2026-09-03) — Source means the
      // channel a request arrived through, and it ends the diamonds-4 clash
      // with Type. The MENU row has caught up (14032-20321 draws `inbox`,
      // checked 2026-09-09); FLAGGED still: the chip node 14101-47392 was
      // last seen drawing wrench-simple (a duplication slip) — not re-checked.
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
      // REGULAR `circle-dashed`, NOT rotated (Daniel, 2026-09-12: "the status
      // icon should not have rotation" — he is updating the designs to match).
      // It was turned 180° here, which is what node 14032-20321 drew and what
      // made the Jobs and Estimates Status filters differ; the Estimates one
      // (14265-21487) never had the rotation. Both are the plain glyph now.
      // (It was the solid `circle-half-stroke` before 2026-09-03.) This is the
      // row's icon in the Filters menu and the chip's icon, from one place.
      icon: "circle-dashed",
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
    // Status changed — shared (see filterTemplates).
    statusChangedTemplate((job) => job.statusChangedAt),
    {
      // Type — DOCUMENTED on 2026-09-03 (section 14101-53833): the chips-only
      // DS header ("is" / "is not", no search — two rows need none), and the
      // rows KEEP their icons (the node draws sparkle / clock-rotate-left) but
      // drop the job counts.
      //
      // SINGLE-select since 2026-09-09 — the section's annotation (desktop
      // node 14101-53834): "Single-select filter. Only one option might be
      // selected at a time." A job is either New or Recall, never both, so a
      // set of the two could only ever mean "any type". See `singleSelect`.
      id: "type",
      noun: { one: "type", many: "types" },
      label: "Type",
      // `shapes` — Daniel's pick (2026-09-03), the category metaphor; it
      // replaced the `diamonds-4` Source used to share. Figma has CAUGHT UP
      // (checked 2026-09-09): the menu row (14032-20321) and this section's
      // chips (14101-53840 / 14101-54207) all draw `shapes` now — the old
      // "Figma is behind" flag is resolved.
      icon: "shapes",
      hideCounts: true,
      dsHeader: true,
      singleSelect: true,
      // The values are the Job Details page's: New = sparkle, Recall =
      // clock-rotate-left, the same icons the table's Type column shows.
      options: [
        { id: "new", label: "New", slotLeft: icon("sparkle") },
        { id: "recall", label: "Recall", slotLeft: icon("clock-rotate-left") },
      ],
      matches: (job, { ids }) => ids.includes(job.type),
    },
  ];

  // Every filter that SHOWS tags gets its own tag function, so the filter UI
  // never has to know where the rows come from OR what they are called — it
  // just asks the def (see `FilterDef.optionTags`). The copy is "N jobs", built
  // here with this registry's own noun.
  //
  // Cached per def, because a count walks every job once per option (Status:
  // 9 × 78) and the list re-renders on every keystroke in its search. The
  // counts are of the whole data set, never of the current view, so for a
  // given def they are a constant.
  for (const def of defs) {
    if (def.hideCounts === true) continue;
    let cached: Record<string, string> | undefined;
    def.optionTags = () =>
      (cached ??= Object.fromEntries(
        Object.entries(optionCounts(JOBS, def)).map(([id, count]) => [id, countOf(JOB_NOUN, count)]),
      ));
  }
  return defs;
}

/** The two branches (phases) the Jobs page switches between. */
export type JobsPhase = "open" | "closed";

/**
 * ONE registry per BRANCH (the Views section 14032-23326, 2026-09-03). The two
 * differ only in the Status filter: the open nine over a search, or the closed
 * two without one. Whoever needs a registry takes it as a `defs` prop, so every
 * piece follows the branch the page is on.
 */
export const JOBS_FILTERS: Record<JobsPhase, FilterDef<Job>[]> = {
  open: buildJobsFilters("open"),
  closed: buildJobsFilters("closed"),
};
