# What the 2026-10 library update actually breaks

- Design file: `ubqeGmv6rQW4yUUDQAs3ku` ("View — Next Update (Copy)", 26 pages)
- DS library: `ArSNpC1K8KiEvjCRHTzaLd`
- **Rewritten 2026-10-03 for the redo**, after the file was rolled back to its
  pre-update version. This version is measured on both sides — the structure the
  file has now, and the published structure it is about to receive — not inferred
  from a variant union. The first attempt's numbers are at the bottom, kept only
  as a record of how it went wrong.

## Outcome — done 2026-10-03

The update was accepted and the restore ran on all 19 pages that had anything to
restore. **1,388 property writes: 694 chip labels and 694 `slotLeft` resets.**
Nothing else in the file needed touching.

Zero unrecoverable entries, zero index-fallback guesses, zero failed writes, no
size and no layout writes anywhere. Verified page by page afterwards: every chip
carries its real label, no chip has a phantom icon slot, no chip was left
fixed-width, and the annotation count matches the pre-update snapshot on every
single page (597 of 597). The snapshot frames were then deleted — 883 KB of text
removed from the file.

The one thing the snapshot could NOT have fixed on its own was the invented
`slotLeft=true`; it took a separate measurement across the file to establish
that `false` was the truth. See "What the update actually did" below.

## How this was measured

`importComponentSetByKeyAsync` in the design file resolves the **published**
component — the version the file is about to receive — while the file's own
instances still show the old one. That difference is the measurement. For every
component key in use it recorded the union of child layer paths (stopping at
nested-instance boundaries, which is the shape override paths have) and the
**raw** property-definition keys. The raw key carries the definition id
(`↳ label#31300:0`), so a property deleted and re-added under the same name
shows up as a different key — which is exactly the case where every instance's
value silently falls back to the default.

The override side comes from the Jobs page snapshot: 2,397 instances, 664
recorded override entries, reduced to **55 distinct (owning component, layer
path) pairs**. Jobs is the densest page in the file and uses 69 remote
components, so it covers the shared page template every object page is built
from.

## Only one published component was deleted

Seven component keys fail to resolve in the library. **Six of them are local to
the design file**, which is why they cannot be imported — they were never at
risk, because a library update only replaces remote components:
`#️⃣ isDropdown`, `#️⃣ Desktop`, `#️⃣ Content Mobile`, `TextCell`, `LinkCell`,
`BadgesCell`.

The seventh is the real one: **`#️⃣ Content (B)`
(`de85195f…`) — Chip's content wrapper.** It is gone.

## What breaks, measured

| Owner → layer path | Count on Jobs | Field | What happens |
|---|---|---|---|
| `Chip` → `#️⃣ Content` | 46 | componentProperties | The wrapper that held the chip's label and slotLeft is gone. **Rule written and verified.** |
| `#️⃣ Content (B)` → `Label` | 28 | fills | The label's colour override. Its owner is the deleted wrapper. **Rule written and verified.** |
| `#️⃣ Body Bar` → `#️⃣ Content Placeholder` | 7 | componentProperties | **Needs Daniel's decision — see below.** |
| `#️⃣ ActionBar` → `Button` | 4 | annotations, componentProperties | Renamed to `Primary` / `Secondary`. Resolved by the guarded index fallback. |
| `#️⃣ Actions` → `Button` | 2 | annotations, componentProperties | Renamed to `First` / `Second`. Same. |

**The other 50 pairs are provably safe.** Every one of their layer paths still
exists in the published component, and every recorded property raw key still
exists in the published property definitions — including all of Icon's five
text properties (`iconName`, `iconName#`, `iconName##`, `iconNameCustom`,
`iconNameBrand`), which is why no icon was ever lost. Every recorded variant
value is still a valid option of its new variant property, including
`TabGroup style=underlined`, which survives the rename of the option set to
`pill | underlined`.

## The whole file, measured

Every one of the 26 pages was swept (6 hold nothing). 1,345 overrides are at
risk out of roughly 5,700 recorded, and 597 annotations were captured. The
snapshot totals **880 KB** — the first attempt's unfiltered one was 6.6 MB,
which is what pushed the file to 95% memory.

| What breaks | Count across the file |
|---|---|
| `Chip → #️⃣ Content` (chip label + slotLeft) | 694 |
| `#️⃣ Content (B) → Label` (chip label colour) | 444 |
| `#️⃣ ActionBar → Button` | 90 |
| `#️⃣ Body Bar → #️⃣ Content Placeholder` (search placeholders) | 57 |
| `#️⃣ isClickable → #️⃣ Content` (renamed to `Content`) | 8 |
| `#️⃣ GroupLabelContentPrimary → #️⃣ GroupLabelContentPrimaryLabel` (renamed to `Label`) | 6 |
| `#️⃣ Actions → Button` / `#️⃣ Action Instance → Button` | 5 |

So 1,138 of the 1,345 — 85% — are the Chip rebuild, and the two verified rules
carry them.

Two groups in that count are over-capture, kept deliberately because the safe
direction is to record too much:

- **Table View's cell components** (`TextCell`, `BadgesCell`, `#️⃣ isDropdown`,
  `#️⃣ Content Mobile`, 27 overrides). They report as remote but cannot be
  imported by key, so they are not in the DS library at all and this update
  cannot touch them. Recorded because "cannot verify" counts as at risk.
- **Slot content inside a drawer** (`SelectList → Drawer / body / EmptyState`,
  `Popover → Drawer Instance / body / Divider`, 7 overrides). The slot test only
  looks at the first path segment, so a slot nested under a drawer wrapper is
  not recognised. Slot content lives in the instance and survives regardless.

Both restore as no-ops.

## What the update actually did — verified after accepting it

The dry run on Jobs (87 at-risk overrides) resolved every single one. Two
predictions above turned out to be too pessimistic, and one piece of damage was
not predicted at all:

- **Chip labels: lost, as predicted.** All 46 came out as the default `"Label"`.
- **Chip `slotLeft`: NOT predicted.** The update set `slotLeft=true` on every
  chip that carried a custom label, with a visible icon slot the chip never had
  — 46 of 46 on Jobs, 184 of 200 on Shared Behavior/Filters. Nothing in the
  snapshot could fix it, because the old value equalled the old component's
  default and was therefore filtered out as "nothing to restore". The repair is
  the new `propDefaults` clause in `rules.json`: zero chip entries anywhere in
  the file ever recorded a slotLeft value, so no chip in this file had an icon,
  so `false` is measured truth rather than a guess.
- **Chip label colours: NOT lost.** All 28 `fills` overrides still carry their
  bound variable. The collapse rule resolves them and finds nothing to write.
- **Search-bar placeholders: NOT lost.** The live `#️⃣ Body Bar` instances still
  hold `#️⃣ Content Placeholder` with their text ("Filter…", "Assignee…",
  "Source…", "Status…"), even though the published component now holds
  `#️⃣ Content Value` in that slot. So the 57 placeholders need no decision and
  no rule.
- **Annotations: nothing lost.** 39 on the page before, 39 after, all 39 compare
  equal. 27 of them resolve only through the recorded node id, because their
  path runs through a slot that is now a `SLOT` node with no children to walk.
- **`#️⃣ ActionBar` / `#️⃣ Actions`: not renamed in practice.** Those instances
  still have a child named `Button`, so the recorded path resolves directly and
  the index fallback was never needed (0 uses).

So the real write set on Jobs is 92 property values: 46 chip labels and 46
chip `slotLeft` resets. Nothing else on the page needs touching.

## The search-bar placeholder — predicted, then disproved

`#️⃣ Body Bar` is the search field's body. It used to hold
`#️⃣ Content Placeholder` (`01449e9f…`, property `↳ placeholder#24657:2`); the
published version holds **`#️⃣ Content Value`** (`bed1fac4…`, property
`↳ value#24657:4`, default `"Value"`) in that slot instead. Different component,
so the placeholder text has no home: after the update those search bars show
the default `Value` rather than e.g. "Search jobs". Seven on Jobs, and the
search bar appears once or twice on every object page.

The ids (`#24657:2` → `#24657:4`) say this is the same component reworked, so a
rule could carry `↳ placeholder` into `↳ value`. But that writes the placeholder
copy into a **value** slot, which makes an empty search field look like it has
text typed in it. That is a design decision, not a mechanical one, so nothing
was mapped.

**Disproved by the update itself.** The instances kept their
`#️⃣ Content Placeholder` child and its text, so no placeholder was lost and no
decision is needed. Left in this file as the reason the restore carries no rule
for it, and as a reminder that a path comparison predicts the worst case: the
dry run is what tells you what really happened.

## Rules

Only the two Chip rules are loaded, and both were read off live structure — see
`rules.json`, which records the evidence per clause. Everything the first
attempt guessed is parked in that file's `_retired` block.

`#️⃣ ActionBar` and `#️⃣ Actions` deliberately have **no rule**. Their old child
is a `Button` instance at the same child index as the new `Primary` / `First`,
which is also a `Button` instance, so the restore's index fallback resolves them
behind its identity check (same node type, same main component key) and logs
every such write in `indexFallback` for review. A name-based rename would have
been wrong anyway: a two-button ActionBar had two children both named `Button`,
and a rename by name would send both to `Primary`.

## Method notes worth keeping

- The override surface is small: 55 distinct `(component, layer path)` pairs on
  a page with 2,397 instances.
- Zero `characters` and zero `mainComponent` overrides anywhere — all copy and
  all icons travel as component properties. That is the single best predictor
  that a migration will go well.
- `componentProperties` reports every property's current value, overridden or
  not. Dropping the ones still sitting at the component default removed 1,012
  values from the Jobs snapshot.
- Part names collide: `#️⃣ Content`, `#️⃣ Body` and `#️⃣ Text` each exist under
  several different keys. Key on the component key, never the name.
- Card and CardFile are unused in this file; the Cards View page is empty.
- `ds-paths.json` is the first attempt's path dump, without property
  definitions. The measurement above supersedes it.

## The first attempt, and why its numbers were wrong

Kept as a record. A first pass predicted ~830 broken overrides by comparing
recorded override paths against the library's variant union. **That estimate was
far too high**, and two of its three headline claims were wrong:

| Claimed broken | Reality |
|---|---|
| Every filter-menu icon reset to `user`, ~100+ icon names lost | **Nothing lost.** 101 of 101 icons correct on Jobs. The comparison resolved ten identically-named `MenuItem` siblings onto the first one and reported the other nine rows' icons as differences. |
| 67 shadow bindings lost with a deleted variable | **Nothing lost.** The box-shadow variable collection became effect styles; all 67 nodes already carry their shadow from the rebuilt component. |
| `#️⃣ ActionBar / Button` renamed to `Primary` | **Half right, for the wrong reason.** Pre-update those instances do still have a child named `Button`, so applying the rename then broke paths that already resolved. The rename only becomes true after the update — which is why the recorded path is always tried first and a rule is only ever a fallback. |

Then the restore itself did more damage than the update:

1. **Wrong target.** Resolving a path by layer name alone collapses
   identically-named siblings onto the first. Row 3's label and icon colour were
   written onto row 1, then row 4's, and so on. Visible as Bills → Status where
   "Draft" says "Overdue". Affected: Products, Series, Bill, Labor, Vendors,
   Estimates.
2. **Restoring size.** `width`/`height` were recorded and written back with
   `resize()`, which forces FIXED sizing. Hugging Chips became fixed-width,
   hugging SelectLists fixed-height. Affected all ten restored pages.

Both are fixed in the scripts: the recorded child index is now the primary key
and an ambiguous step fails instead of guessing, and size, name and every layout
field are neither recorded nor written.
