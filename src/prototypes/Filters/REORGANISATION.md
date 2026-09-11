# Filters prototype — re-organisation handoff

**Written 2026-09-11 for a fresh session.** Daniel wants the whole re-organisation
done in one pass. Everything needed to start is here; read this file first, then
`kitchen-ui/CLAUDE.md` and `../../../CLAUDE.md`.

---

## 1. The goal

Re-shape the prototype's code to match how Daniel organises the DESIGN. He set
that structure up in Figma and asked whether code should follow it. It should —
the split is on the axis that genuinely varies, and the current code already
duplicates two things this structure exists to prevent.

### Daniel's Figma taxonomy

File `54dNq5bLwhXf3fXwts0Jvx` ("View — Next Update"). Three tiers:

| Tier | Figma page / section | Holds |
|---|---|---|
| View behaviour, shared by Table + Cards + every object | page `14031-20299` "View ↳ Shared Behavior" | The Shell, Partially Hidden Objects, No Objects Match, Edge Cases (No Objects Exist, Failed To Load), Search |
| Filters, shared | page `14199-65429` "Filters ↳ Shared Behavior" | `14199-63395` The Shell (the Filters menu, No Filters Found, Filters ON, Applied Filters) · `14267-23297` **Filter Functionality** = the KINDS · `14267-23337` **Filter Template** = filters identical across objects |
| Object-specific filters | per-object pages | Jobs `14267-33379`: Assignee, Date Received, Duration, Priority, Scheduled For, Source, Status, Type · Estimates `14268-43750`: Status, Down Payment, Expires, Issued, Total |

- **Filter Functionality (kinds)**: Multi-Select, Timeframe, Address, Duration, **Money**.
- **Filter Template (shared filters)**: Client, Last Modified, Location, **Seen**, Service, Status Changed, Labels.

Note the distinction: *Duration* is a shared KIND, but the Jobs "Duration"
filter is object-specific. A kind is behaviour; a template is a whole filter
reused verbatim.

### The two problems it fixes in the current code

1. **The seven shared filters are owned by Jobs.** `estimateFilterDefs.tsx`
   *derives* them from the jobs registry. Sameness is guaranteed today, but the
   dependency points the wrong way — customise Jobs' Location and Estimates
   changes silently. They should belong to neither object.
2. **View-level states are written twice.** Jobs has `NoJobsYet`, `NoMatch`,
   `NoSearchResults`, `HiddenDataBar`; Estimates has `NoEstimatesYet`,
   `NoMatchingEstimates`, `NoSearchResults` again — and no hidden-data bar.
   Already drifting. They should be one set taking the object's noun.

---

## 2. Where the code is now

```
src/prototypes/Filters/
  FiltersPrototype.tsx    59   page switch + desktop frame + Sidebar. Entry point.
  Filters.tsx           4705   THE JOBS PAGE *and* the shared filter UI (see below)
  EstimatesList.tsx     1099   the Estimates page
  appShell.tsx           410   Sidebar, AppBottomBar, useAnchoredCard, useSingleAxisScroll, DIALOG_MARKER
  filterDefs.tsx        1815   filter TYPES + shared kinds + helpers + the JOBS registry
  estimateFilterDefs.tsx 105   the 7 estimates filters, derived from the jobs registry
  jobsData.ts            258   reader over the demo db → the Jobs row shape
  estimatesData.ts        98   reader over the demo db → the Estimates row shape
  Filters.stories.tsx     93   4 stories; imports FiltersPrototype
```

`Filters.tsx` is the file to break up. Its section markers (`// ---- `) map it:

- **Shared filter UI** (should move out): lines ~265–2178 — the Filters menu
  rows, the mobile applied-filters section, the option list + widths, the
  condition chips, all three Custom dialogs (date / duration / address) and the
  calendar, `FilterOptions`, `MobileFilterOptions`; then ~2532–3427 —
  `FiltersDrawer`, `FiltersMenuCard`, `FilterBar`, the locked chip, the
  schedule-horizon conflict, `AppliedChip`.
- **Jobs-only** (stays with the Jobs page): the list top bar, the view bar +
  tabs, the table, sorting, the column registry, the View menu wiring, the
  layouts/shells.
- **View-level states** (should move out and be shared): ~3977–4237
  (`NoMatch`, `NoJobsYet`, `NoSearchResults`, `HiddenDataBar`).

Already exported for reuse: `FiltersDrawer`, `FiltersMenuCard`, `FilterBar`.

### Types that make sharing possible (already done)

- `FilterDef<TRow>` is **generic**; only `matches` knows the row type.
- `AnyFilterDef = FilterDef<never>` is what the filter UI takes. Every registry
  is assignable to it (parameter contravariance). Use it for UI props.
- `FilterDef.counts?: () => Record<string, number>` — each registry supplies its
  own counting function, so the shared UI never imports `JOBS`.
- `dateFilter<TRow>(read)` and `addressFilter<TRow>(locationOf)` are generic.

---

## 3. Target structure

Five modules. **Do not create one file per Figma section** — that is ~20 tiny
files and worse to read. The useful unit is the module boundary.

```
src/prototypes/Filters/
  FiltersPrototype.tsx     page switch + shell            (unchanged)
  appShell.tsx             sidebar / bottom bar / hooks   (unchanged)

  viewStates.tsx      NEW   Figma "View ↳ Shared Behavior": NoObjectsExist,
                            NoObjectsMatch, NoSearchResults, HiddenDataBar,
                            FailedToLoad. Parameterised by the object noun and
                            an explicit list of layers.
  filterKinds.tsx     NEW   Figma "Filter Functionality": multi-select, timeframe,
                            duration, address, money — the predicates + the
                            Custom dialogs that belong to a kind.
  filterTemplates.tsx NEW   Figma "Filter Template": Client, Labels, Last modified,
                            Location, Seen, Service, Status changed. Owned by
                            NEITHER object; each registry picks what it uses.
  filterUI.tsx        NEW   Figma "Filters ↳ The Shell": the menu, its option
                            lists, the chips, the filter bar, the drawer.
                            (Today inside Filters.tsx.)

  jobs/    JobsPage.tsx, jobsFilters.tsx (object-specific + which templates),
           jobsData.ts, jobsTable.tsx
  estimates/ EstimatesPage.tsx, estimateFilters.tsx, estimatesData.ts, estimatesTable.tsx
```

Sub-folders are optional; flat files named `jobsFilters.tsx` /
`estimateFilters.tsx` are fine if the folder churn is not worth it.

### Two deliberate deviations from a literal mirror

1. **"Shared" ≠ "generic".** Some layers exist only for some objects — the
   schedule horizon is Jobs-only, the locked Status chip depends on the view
   tabs. Shared view-state components should take an explicit noun and an
   explicit list of layers to show. Do **not** build one component that knows
   every object's layers.
2. **Keep the kind's UI with the kind.** The date/duration/address Custom
   dialogs are ~1000 lines and belong to their kind, not to the generic shell.

---

## 4. The order to do it in

Each step pays for the next; `npx tsc --noEmit` must stay clean after each.

1. **View states → `viewStates.tsx`.** Removes real duplication immediately and
   touches the least machinery. Give Estimates the hidden-data bar it lacks.
2. **The seven templates → `filterTemplates.tsx`.** Both registries import them;
   delete the derive-from-jobs indirection in `estimateFilterDefs.tsx`. After
   this, neither object owns a shared filter.
3. **The filter shell → `filterUI.tsx`.** Mechanical move out of `Filters.tsx`.
   Watch the import cycle (§5).
4. **Split the kinds into `filterKinds.tsx`**, dialogs included.
5. **Per-object files**: `Filters.tsx` becomes the Jobs page only.

Then the additions Daniel's pages document but the code lacks (§6).

---

## 5. Invariants — break these and the prototype regresses

Every one of these was a real bug found and fixed in this work. Re-read before
moving code.

**Imports**
- `Filters.tsx` (the Jobs page) must **never** import `EstimatesList`. The
  Estimates page imports the filter UI, so importing back is a cycle. That is
  the only reason `FiltersPrototype.tsx` exists. Once the UI moves to
  `filterUI.tsx`, both pages import that and the risk goes away.

**Widths** (see also the `hugging-cards-searchfield-bar-fix` memory)
- **Never pin a card's width, and never measure content to size it.** Set a
  `min-width` floor only and let `fit-content` + the component's `max-width`
  hug. Pinning is what truncated labels.
- `MIN_WIDTH` = `var(--size-52)` = **208px** — the documented floor for the
  Filters menu card *and* every filter list. Max is **384px**, the DS
  SelectList/Menu's own. One constant feeds both.
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
- A filter's option counts are cached per def (`FilterDef.counts`).

**Data**
- The demo database is **the** source (`src/data/db`). If a property is
  missing, extend the db — never generate or hand-copy rows in a prototype.
- One clock: `TODAY` in `db.ts` (2026-09-04). Never the real clock.
- `scripts/regenerate-db-rows.mjs` re-derives the materialised job/estimate
  rows if the clock moves; keep its inlined reference arrays in step with db.ts.

**Figma reading**
- Read the **full subtree** of a node (every child, its type and its
  `componentProperties`), not props + text. Reading only props missed the
  Location group header's `AvatarClient` twice.
- Screenshots are never a source for a claim about the design.

---

## 6. Not built yet (Daniel's pages document these)

- **Seen** — a shared template filter. Estimates has the column, not the filter.
- **Money** — a filter KIND that does not exist in code, for Estimates' Total.
- **Estimates object-specific**: Status, Down Payment, Expires, Issued, Total.
- Estimates' view tabs are **not** locked Status filters yet (they filter by
  state directly); Jobs' are.
- Estimates has no Hidden Data Bar.

## 7. Open flags for Daniel (unresolved, carry them forward)

- Location option rows still truncate at the 384 cap; `SelectListItem` shows no
  tooltip for truncated text, unlike `ListItem`/`CellBody`.
- The Location group header draws the client TYPE icon where the node sets
  `logo: true` (an image) — no client in the db has a logo field.
- Labels "No labels" + a label under the default "include all of" matches
  nothing (correct, but reads as a dead end).
- The Location row's address includes the unit; the table's Location address
  column does not — each follows its own node.
- `SelectList.noResultsState` is an opt-in slot the filters use for their
  caption-only "No matching options". If the DS's own no-results design moves to
  caption-only, change the default and drop the slot.
- Daniel browses in **Zen (Firefox)**, where he reported the Filters menu search
  feeling slow. Measured fast in Chrome (16–24ms) and unreproduced in Gecko;
  suspected cause is `useOverlayScrollbar`'s forced layout inside a
  ResizeObserver over the large sticky table. Not fixed.

---

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
