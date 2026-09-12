# Filters prototype — the module map

**Re-organised 2026-09-11.** The code is shaped to mirror how Daniel organises
the DESIGN in Figma. Read this before changing anything here, then
`kitchen-ui/CLAUDE.md` and `../../../CLAUDE.md`.

(This file replaces `REORGANISATION.md`, the handoff that planned the move.)

---

## 1. Daniel's Figma taxonomy, and where each tier lives

File `54dNq5bLwhXf3fXwts0Jvx` ("View — Next Update"). Three tiers:

| Figma page / section | Holds | Code |
|---|---|---|
| page `14031-20299` **View ↳ Shared Behavior** | The Shell, Partially Hidden Objects, No Objects Match, Edge Cases (No Objects Exist, Failed To Load), Search | `viewStates.tsx` |
| page `14199-65429` **Filters ↳ Shared Behavior** → `14199-63395` **The Shell** | the Filters menu, No Filters Found, Filters ON, Applied Filters | `filterUI.tsx` |
| … → `14267-23297` **Filter Functionality** (the KINDS) | Multi-Select, Timeframe, Address, Duration, Money | `filterKinds.tsx` |
| … → `14267-23337` **Filter Template** (shared filters) | Address, Client, Due Date\*, **Issued**, Labels, Last Modified, Location, **Seen**, Service, Status Changed, **Total** | `filterTemplates.tsx` |
| Jobs page `14267-33379` | Assignee, Date Received, Duration, Priority, Scheduled For, Source, Status, Type | `jobsFilters.tsx` |
| Estimates page `14268-43750` | **Status**, **Down Payment**, **Expires** | `estimateFilters.tsx` (Status 2026-09-11; Down Payment, Expires 2026-09-12) — every row of its menu node `14265-27090` is built |

\* on the node, no code behind it yet — see §6.

Read off the nodes on 2026-09-11, after Daniel moved **Address** onto the
Filter Template page (it had been filed under Filter Functionality) and
**Issued** and **Due Date** with it.

Note the distinction: *Duration* is a shared KIND, but the Jobs "Duration"
filter is object-specific. A kind is behaviour; a template is a whole filter
reused verbatim.

## 2. The files

```
src/prototypes/Filters/
  FiltersPrototype.tsx     60   page switch + desktop frame + Sidebar. Entry point.
  Filters.stories.tsx      93   the 4 stories. Story TITLES must never change.
  Filters.module.scss     494   every page's styles (one sheet, shared)

  SHARED — owned by neither object
  filterUI.tsx           1855   the Filters menu, option lists, chips, bar, drawer
  filterKinds.tsx        1554   the kinds' predicates + their Custom dialogs
  filterDefs.tsx         1077   what a FILTER IS: types, value model, apply/count/copy
  filterTemplates.tsx     475   the filters that are the same on every object
  viewStates.tsx          390   the list's own states, parameterised by the noun
  appShell.tsx            410   Sidebar, AppBottomBar, useAnchoredCard, useSingleAxisScroll
  listTable.tsx           202   the table every list draws: pinning, sorting, memo
  listData.tsx            154   the clock, the workspace tables, the formatters, the noun

  JOBS
  JobsPage.tsx           1051   the page: top bar, views, view bars, shells, pipeline
  jobsTable.tsx           397   its column registry (+ its sort keys)
  jobsFilters.tsx         463   its registry: 8 object-specific + 7 templates
  jobsData.ts             134   reader over the demo db → the Jobs row shape

  ESTIMATES
  EstimatesPage.tsx       796   the same, for estimates
  estimatesTable.tsx      360
  estimateFilters.tsx     249   its registry: 3 object-specific + 9 templates
  estimatesData.ts        166
```

**Flat, not `jobs/` + `estimates/` sub-folders** (2026-09-11). Sub-folders would
have pushed every DS import from `../../components/…` to `../../../components/…`
in the two biggest files for no gain; the file names already say which object
owns what.

## 3. Which way the imports point

```
FiltersPrototype → JobsPage, EstimatesPage          (the page switch; see §5)
JobsPage      → jobsTable, jobsFilters, filterUI, viewStates, jobsData, listData
EstimatesPage → estimatesTable, estimateFilters, filterUI, viewStates,
                estimatesData, listData
jobsTable / estimatesTable → listTable, listData, <its own data door>
filterUI      → filterKinds, filterDefs, appShell
jobsFilters / estimateFilters → filterTemplates, filterKinds, filterDefs,
                <its own data door>, listData
filterTemplates → filterKinds, filterDefs, listData
filterKinds   → filterDefs, listData
filterDefs    → listData
listData / listTable / appShell → (nothing in this folder)
```

No cycles; no arrow from a shared module into a page; and since 2026-09-11 no
arrow from a shared module into `jobsData` either — what both lists need lives
in `listData`. **A page must never import the other page.**

## 4. Two deliberate deviations from a literal mirror

1. **"Shared" ≠ "generic".** Some layers exist only for some objects. The
   schedule horizon is Jobs-only, so `HiddenCounts.horizon` is OPTIONAL and the
   Estimates page simply leaves it out — no copy about it is then built. The
   locked Status chip is Jobs-only the same way (`lockedStatuses` defaults to
   empty). Shared components take an explicit noun (`ObjectNoun`) and an
   explicit set of layers; none of them holds a table of what each object has.
2. **Keep the kind's UI with the kind.** The date / duration / money / address
   Custom dialogs are ~1300 lines and belong to their kind, not to the generic
   shell.
3. **A registry hands the UI finished COPY, not data to word.** An option
   row's count tag is `FilterDef.optionTags` — the registry builds "13 jobs"
   with its own `ObjectNoun`. That is what lets `filterUI` never name what a
   list holds.

## 5. Invariants — break these and the prototype regresses

Every one of these was a real bug found and fixed in this work. Re-read before
moving code.

**Imports**
- Neither page may import the other. The shared filter UI is in `filterUI.tsx`
  now, so the old cycle cannot form — but `FiltersPrototype.tsx` still owns the
  page switch on purpose, so neither page knows the other exists.

**Widths** (see also the `hugging-cards-searchfield-bar-fix` memory)
- **Never pin a card's width, and never measure content to size it.** Set a
  `min-width` floor only and let `fit-content` + the component's `max-width`
  hug. Pinning is what truncated labels.
- `MIN_WIDTH` = `var(--size-52)` = **208px** — the documented floor for the
  Filters menu card *and* every filter list. Max is **384px**, the DS
  SelectList/Menu's own. One constant feeds both (`filterUI.tsx`).
- A card whose own search filters its rows must be **frozen at the width it
  hugged to when it opened** (`useFrozenWidth`), or it resizes per keystroke.
  The freeze must be keyed to the filter — the card stays mounted while the
  pointer moves between rows, so an unkeyed freeze holds the first list's width
  for all of them.
- Measure with `offsetWidth`, never `getBoundingClientRect()`: cards open under
  a `scale(0.98)` transition.
- `.filtersSub` (the sub-list portal) needs `width: max-content`. A
  `position: fixed` box with only `left` set is bounded by the viewport, so the
  card's width depended on where it was placed → placement loop.

**Motion**
- The sub-list is **not animated**. Tried twice, rejected twice. Width is
  intrinsic and re-hugs in one frame, so animating position alone still reads
  as a jump; animating width breaks the placement effect, which measures the
  card and reads the previous list's width mid-transition.
- Placement (`placeSub`) must also re-run from a `ResizeObserver` on the card —
  a card that settles late (Labels' header chips) is otherwise placed for the
  wrong width.
- The SidebarNav group collapse animates **only** because the Sidebar stays
  mounted across the page switch. Keep it rendered outside the switch.

**Performance**
- Big tables must be `memo`'d with a `useCallback` sort handler, or they
  re-render on every keystroke elsewhere (240ms → 16ms per keystroke, measured).
- The keyword search feeds the table through `useDeferredValue`.
- A filter's option counts are cached per def (`FilterDef.counts`), and the
  REGISTRY supplies that function — the shared UI never imports a row table.

**Views**
- A VIEW (a tab) owns its filters, its sort and its View-menu settings — one
  map each, keyed by the view id. View ids are unique across both branches on
  both pages, which is what lets one map hold a whole page.
- **Every view shows every column and offers every filter** (Daniel,
  2026-09-12). The per-view `hiddenColumns` / `hiddenFilters` mechanism is
  GONE — do not bring it back without asking. The reasoning: these preset views
  copy production's sections, but CUSTOM views are coming and then "All" is the
  only preset left, so a view guessing what a user wants to see stops making
  sense — "showing it everywhere is not a big deal, the user can still go to the
  View menu and hide it". It took two exclusions with it: Status changed on both
  Pending views, and Down payment on the three open Estimates views.
- Both maps (`DEFAULT_VIEW_SETTINGS`, `VIEW_FILTERS`) are still built ONCE at
  module level. An untouched view must keep a stable reference, or the memoised
  table re-renders on every keystroke elsewhere.

**Kinds**
- **`withCondition` writes `amount`, and TypeScript cannot check it.** It
  returns the generic `T extends FilterValue`, and a spread object literal in
  that position is NOT excess-property-checked — so when the `duration` →
  `amount` rename left one stale `duration:` key there, it compiled clean and
  the amount chips' whole condition list silently did nothing (over → under
  changed neither the chip nor the rows). Found by clicking through the list on
  2026-09-12, not by the compiler. `measure-filters.mjs` now asserts it
  ("Total chip: over → under applies"); keep that check.
- **Duration and Money are ONE machinery** (2026-09-12). Both store an
  `AmountValue` — `{compare, preset, from, to}` on `FilterValue.amount` — run
  through `amountFilter`, share the `AMOUNT_CONDITIONS` (over / under / is, plus
  `within` from the dialog only), and take the same single-select list with
  condition chips and a "Custom..." footer. Only the UNIT differs: minutes
  against dollars, `formatDuration` against `formatMoney`, `DURATION_PRESETS`
  against `MONEY_PRESETS`, and the Custom dialog's field (hr + min against a "$"
  TextField — `MoneyCustom`, whose range puts From and To side by side where the
  duration's stack). A third amount kind should be one preset table and one
  formatter, not a third branch — `isAmountKind` in filterUI is the one place
  that lists them.

**Date windows**
- A window preset is a pair of day offsets, and an end left UNSET is open. Three
  shapes, all in `forwardWindows` / `SCHEDULED_WINDOWS`:
  `{ absent: true }` — the rows with NO date ("Not scheduled"), the only window
  that matches an empty field; `{ to: -1 }` — everything up to yesterday ("Past
  due" on jobs, "Expired" on estimates); `{ from, to }` — a real span.
- **The absence row and the past row are different questions** (Daniel,
  2026-09-12): "Not scheduled" must list only the jobs with nothing in the
  field, so the jobs whose date has gone by needed a row of their own. Before
  that they were reachable only through the Custom dialog.

**Cells**
- **Down payment reads the estimate's STATUS, not just its own value**
  (node 14330-66931, re-read 2026-09-12 — `downPaymentCell` in
  `estimatesData.ts`). Six cells, not four: "Not paid" and "Partially paid" are
  neutral / warning while the estimate is still out with the client (draft ·
  unsent · sent · expired), and both turn `--text-error` once it is approved or
  closed (unconverted · jobbed · invoiced · lost · cancelled) — the node's own
  annotation, "On 'Unconverted' and closed statuses". "Not required" and "Paid"
  do not depend on the status. The icon WEIGHT follows the colour: regular on
  the two neutral cells, solid everywhere else.
- Two sent estimates in the db were moved to `partiallyPaid` (EST-2225,
  EST-2227) because the generator only ever made a partial deposit on approved
  and won rows, so the warning cell had nothing to render. Three UNCONVERTED
  ones (EST-2220, EST-2248, EST-2251) became `paid` for the mirror reason — the
  whole open branch had no green cell and the filter's "Paid" row matched
  nothing there.
- **NO local colour overrides in that column** (Daniel, 2026-09-12: "it
  shouldn't be overridden — Not required and Not paid should inherit the subtle
  variant. No overrides"). `.downPaymentNeutral` and its icon twin are deleted,
  and the DS was CORRECTED instead — see below. Measured after: the neutral
  cells draw text AND icon in `--text-subtle` (rgba(0,0,0,0.608)), which is the
  node.

**Data**
- The demo database is **the** source (`src/data/db`). If a property is
  missing, extend the db — never generate or hand-copy rows in a prototype.
- **One clock, and it is the REAL today** (changed 2026-09-12 — Daniel: "'Today'
  should be the actual today. Otherwise, it's confusing"). `db.ts` keeps every
  date as a literal written against an ANCHOR (2026-09-04 09:00, the moment the
  curated stories imply) and shifts the five date-carrying tables by whole days
  onto the real calendar as it loads, so a job scheduled "tomorrow" is tomorrow
  whenever the prototype is opened and the demo never goes stale. `TODAY` is the
  real today at the anchor's hour.
  - Read the clock from `TODAY` (db) or `dayOffset` (listData), NEVER from
    `new Date()`. The date Custom dialog did, which is how Daniel found this:
    its calendar circled the real date while every preset measured from the old
    fixed clock, eight days apart. `DialogCalendar`, its opening month and
    `PeriodList` all take `TODAY` now.
  - Editing db dates: write them against the ANCHOR, the way the file already
    reads. `scripts/regenerate-db-rows.mjs <kind> 2026-09-04` still generates
    anchor-dated rows, which is exactly what belongs in the file.
  - The shift moves WEEKDAYS (a Friday visit can land on a Sunday). This data
    already schedules on every day of the week, so nothing depends on it; if
    that changes, shift by a multiple of 7 instead and accept that "today"
    drifts by up to three days.
- `scripts/regenerate-db-rows.mjs` re-derives the materialised job/estimate
  rows if the clock moves; keep its inlined reference arrays in step with db.ts.
  It PRINTS rows, it does not write db.ts — and its output no longer reproduces
  what is in db.ts (those rows have been shifted and hand-extended since). db.ts
  is the source; the script is a starting point for a fresh mass.
- **`statusChangedAt` is nullable, and empty is the normal case** (Daniel,
  2026-09-12 — the rule is written on the db type). A date means the row really
  changed status: the status a row is born with is not a change, and neither is
  leaving Draft. So a draft is always empty, an unscheduled job carries a date
  only when it came BACK from a schedule, a scheduled job only when someone
  scheduled it later, and everything from Active on always has one. Estimates:
  draft and unsent are empty, everything from "sent" on has a date. Upcoming →
  Past due is the clock, not an action, and writes nothing; a SUB-status swap
  (Active ↔ Quick-paused, On hold external ↔ internal) does.
- A row with NO date in a date field is **outside that filter's answer**
  (`FilterDef.excluded`, set by `dateFilter`) — it matches neither "after" nor
  "before". Without it the negative half listed every dateless row. There is NO
  "Not changed" option row (Daniel decided against it); the ABSENCE window
  "Not scheduled" is the one value that does ask for dateless rows.

**Figma reading**
- Read the **full subtree** of a node (every child, its type and its
  `componentProperties`), not props + text. Reading only props missed the
  Location group header's `AvatarClient` twice.
- Screenshots are never a source for a claim about the design.

## 6. Not built yet (Daniel's pages document these)

Shared TEMPLATES on the node with no code behind them:

- (**Seen** was here; it was built on 2026-09-12 — single-select, `eye` /
  `eye-slash` rows, node 14267-13151.)
- **Due Date** — a Timeframe-kind filter, so it is `lastModifiedTemplate`'s
  shape with another field read. It belongs to the **Invoices** list, which
  this prototype does not have (Daniel, 2026-09-12) — not a second name for
  Estimates' Expires. (**Issued** was the other unbuilt one; it was built on
  2026-09-12.)

Estimates' own:

- **Nothing is left on the Estimates menu.** Expires, Issued, Total and Seen
  were built on 2026-09-12 — Total brought the **Money** kind with it — so all
  thirteen rows of `14265-27090` are live. What remains unbuilt on the SHARED
  page is **Due Date**, and that waits for the Invoices list (see the flags).

And one view state:

- **Failed To Load** — SETTLED as unbuilt (Daniel, 2026-09-11: "Failed to load
  may stay silent"). Nothing in the prototype can fail to load, so the state
  would never fire; it belongs here when the real data does.

Estimates DID gain the Hidden Data Bar in the re-organisation (it is the same
shared component, so it came for free), plus the shared No Objects Match /
No Objects Exist / No Search Results states and search-aware hidden counts.

And on 2026-09-11 it gained its **Status** filter and its **locked Status
filters**, which closed the last structural gap against the Jobs page:

- the filter (section `14268-43893`) is object-specific, so it is written out
  in `estimateFilters.tsx`. ONE registry per phase — the open five statuses
  (`14268-43894`) or the closed four (`14268-43911`), chips-only header, NO
  search on either;
- every view but **All** locks it (Views section `14265-21452`; each view's
  chip annotation names its statuses). The locked filter is never part of the
  user's selection, is applied on top of it, and shows as the bar's first,
  inert chip — the Jobs page's rules, through the same `LockedStatusChip`.
  What it hides is never counted, so a locked view shows no Hidden Data Bar
  until something else hides.

On 2026-09-12 it gained its second own filter, **Down payment** (section
`14293-45032`, a Multi-Select): chips-only header ("is" / "is not"), no search,
four rows in the node's order — Not required · Paid · Partially paid · Not paid
— with the value's icon in each, no counts. Menu row icon `money-check-dollar`
(Daniel's pick, 2026-09-12; the node draws it now). Its rows, copy and icons
come from `DOWN_PAYMENT_OPTIONS` in `estimatesData`, the same place the table
cell reads — but a ROW never escalates the way a cell does, so the row colours
are the badge family (jade / amber / tomato a9) and the cell's are text tokens.
The chip's value noun is "option" ("2 options"), which is what its node writes.

## 7. Open flags for Daniel

Still open:

- **Three icons in the Jobs menu node are BEHIND the build** (14032-20321, read
  2026-09-12) — Daniel is updating the node, so do not copy any of them back:
  LAST MODIFIED draws `clock` where the build keeps `pen` ("bring back pen
  icon for the last modified"); DATE RECEIVED draws `calendar-plus` where
  the build now uses `calendar-arrow-down` (he agreed with the reasoning: a
  plus reads as "add" everywhere else in the product — Create, "New" — so on a
  filter it suggested MAKING a date rather than the date a job arrived on);
  SCHEDULED FOR draws `calendar-lines` where the build now uses `calendar-day`
  (Daniel picked it 2026-09-12 — one filled day block = the single day a job is
  booked for; `calendar-lines` only says "a calendar", `calendar-clock` breaks
  the square silhouette the other filter icons share, and `calendar-range` is
  unreadable at the chip's 14px).
  Last modified's is set in the TEMPLATE, so it is the icon on every list.
  (The ESTIMATES menu node has no such gap: Daniel updated Down payment,
  Expires, Issued and Total on 2026-09-12 and the build matches it row for row —
  re-read and confirmed.)
- **SETTLED 2026-09-12 — "Due Date" and "Expires" are two different filters.**
  Expires is the ESTIMATES list's (built); Due Date is the INVOICES list's, and
  that list does not exist in this prototype. Both stay on the nodes; neither
  replaces the other.
- **The Status changed rule is not in Figma yet.** The nullable field, what
  counts as a transition, and the empty cells were settled in chat on
  2026-09-12 (see the Data invariants). The node set still shows a date on every
  row, and the per-transition date columns production keeps per closed view
  (Sent / Approved / Won / Lost / Cancelled dates) are still not built here —
  the generic column carries that story.
- **The Down payment filter's node calls the last value "Unpaid"**
  (14293-45034), where the table cell's node (14330-66931) calls it "Not paid".
  One value cannot be spelled two ways in one list, so the build uses "Not
  paid" — the newer copy, and the one the column shows. The filter node is the
  one to update.
- **That filter's single-value chip draws no icon** in the node (14293-45042,
  "is · Not required"), where the Status chip draws its status icon. The shared
  chip always shows a single value's own `slotLeft`, so the build shows the
  `minus`. Say the word if the value slot should be bare here.
- **Sub-status swaps have no data behind them.** Daniel counted them as real
  transitions (Active ↔ Quick-paused, On hold external ↔ internal), but the db
  has no sub-status history, so the demo cannot show one specifically — those
  rows just carry a date like every other post-Active job.
- Labels "No labels" + a label under the default "include all of" matches
  nothing (correct, but reads as a dead end).
- The Location row's address includes the unit; the table's Location address
  column does not — each follows its own node.
- **The no-match block is PLAIN TEXT, not `EmptyState`** (Daniel, 2026-09-12 —
  a trial). All four nodes draw one centred line in the card's own body: 16px
  around it, body/400 compact, `--text-subtle`. It still goes through
  `SelectList.noResultsState`, whose DS default is the EmptyState block — if
  this trial is kept, that default is worth revisiting.
  The mobile line centres in the full-height sheet, as its nodes draw it: the
  two boxes between the sheet's body and the line (`Menu`'s `[role="menu"]`
  and the Add-filter section's own) pass the height down — see `.menuFillBody`.
  A percentage height stops at the first box that sizes to its content, which
  is why it sat at the top at first.

- (CLOSED 2026-09-12 — **`CellBody`'s `subtle` scheme was named for one token
  and set to another.** Daniel settled what it means: "the subtle variant means
  that the text and the icon color is set to --text-subtle". The DS was changed
  to match — `.subtle` now carries `--text-subtle`, the scheme paints the left
  slot like the coloured ones, and the empty cell's "—" moved to its own
  `.placeholder` class so it keeps the lighter `--text-placeholder`.
  `CellBody.mdx` was updated with it; the Figma doc page still lists
  "`subtle` — `--text-placeholder`" and the old icon rule, so that needs the
  same edit.)
- **`ListItem` has no caption placeholder yet.** `SelectListItem` gained
  `captionPlaceholder` on 2026-09-12 (the copy doc's standard empty
  behaviour), and Daniel's note says the behaviour belongs to both. `ListItem`
  was left alone — no node was read for it in this pass.

Accepted as they are (Daniel, 2026-09-11 — do not "fix" these):

- **Location option rows truncate at the 384 cap**, with no tooltip, unlike
  `ListItem`/`CellBody`. Fine as it is. (A location with no NAME is a
  different thing and IS handled — its caption reads "No Location name" in
  `--text-placeholder`, the DS copy doc's rule.)
- **The Location group header draws the client TYPE icon** where the node sets
  `logo: true` (an image). No client in the db has a logo — none for now.
- **STATUS CHANGED's icon is `arrow-left-arrow-right`** — Daniel's 2026-09-03
  pick, and the node drew its mirror image for a while. He updated Figma to
  the build on 2026-09-12 ("keep arrow-left-arrow-right as it is currently in
  the build"), so the two agree now.
- **The Status filter's icon carries NO rotation**, on either list (Daniel,
  2026-09-12: "the status icon should not have rotation"). The Jobs one used to
  be turned 180°, which node 14032-20321 still drew when this was built —
  Daniel is updating the designs to match, so do not put it back from that node.
- **The Zen (Firefox) filter-search slowness** stays unchased. Measured fast in
  Chrome (16–24ms) and unreproduced in Gecko; suspected cause is
  `useOverlayScrollbar`'s forced layout inside a ResizeObserver over the large
  sticky table.

Closed on 2026-09-11 (kept here so the history is readable):

- ~~The db still carries the estimate STATE~~ — removed. `EstimateStatus` is
  now the eight badge keys (Expired stays derived from `dueAt`), and
  `isDraft` / `conversionPath` / `EstimateConversionPath` are gone with it.
- ~~Address is filed under the wrong Figma page~~ — Daniel moved it onto the
  Filter Template page; the node was re-read to confirm.
- ~~`jobsData.ts` owns shared formatters~~ — they are in `listData.ts`, and no
  shared module imports `jobsData` any more.
- ~~`countLabel` is hard-wired to "job"~~ — deleted. A registry builds its own
  option tags with `countOf(noun, n)`; see `FilterDef.optionTags`.
- ~~The two table modules duplicate their scaffolding~~ — shared as
  `listTable.tsx`, generic over the row, ready for the third list.

## 8. How to verify nothing regressed

`npx tsc --noEmit` after every step, and:

```bash
npm run screenshot prototypes-filters      # 4 stories
node scripts/measure-filters.mjs           # needs Storybook on :6006
```

`measure-filters.mjs` checks the things that broke repeatedly. Expected, with
the current data:

- **Jobs list widths** — Address (dialog), Assignee 208, Client 209,
  Date received 208, Duration 208, Labels 222, Last modified 208, Location 384,
  Priority 208, Scheduled for 208, Service 291, Source 231, Status 208,
  Status changed 208, Type 208. **Nothing clipped.**
- **Placement** — every sub-list exactly **4px** from its row, no overlap with
  the menu, nothing offscreen.
- **Stability** — each list holds its width while typing in its own search.
- **Menu** — 208px, and it stays 208 while typing.
- **Estimates** — the menu lists exactly Address, Client, Labels, Last modified,
  Location, Service, Status changed.

Never kill Daniel's Storybook; reuse the running one on :6006.
