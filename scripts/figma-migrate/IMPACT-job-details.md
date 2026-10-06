# Impact report — DS library update in `"Job Details" Page — Next Update`

Design file `N0cgcrhj7KhBovYXySJpqZ`. Measured 2026-10-03, read-only, **before**
any update is accepted. 15 pages, 11 with content, all 11 covered.

> **Revised 2026-10-04 — the Explorations page is out of scope.** Daniel
> detached it after the first measurement; it now reports **0 instances**, so a
> library update cannot touch it. Every number below the "Revised totals"
> heading excludes it. The original figures are kept as measured, because they
> are what the method produced on the file as it then stood.
>
> **Revised totals:** 18,569 instances · 5,199 content overrides · 4,090
> survive · 228 frozen · **881 break** · 385 annotated nodes (29 break).
> The rebuild is **42 ItemGroups and 126 rows** over five pages — Timesheet
> (18/56), Summary (10/30), Complete Job Form (6/26), Check In / Out (4/8),
> Job Statuses (4/6) — in **8 row shapes, every row 60px**.
>
> Revised breakage by cause: `ItemGroup → #️⃣ Divider` 372 · `ListItem →
> #️⃣ Item` 178 · `ItemGroup → #️⃣ Items` 138 · `Chip → #️⃣ Content` 78 ·
> `GroupLabel → #️⃣ Primary/#️⃣ Secondary` 30 · `#️⃣ ActionBar → Button` 24 ·
> `#️⃣ Body Bar → #️⃣ Content Placeholder` 24 · `#️⃣ Value Content →
> BadgeJobStatus/Icon` 16 · `Card → #️⃣ Content Slot` 11 · `_InputBackground` 8
> · `#️⃣ GroupLabelContentPrimary → …Label` 2. Of these, **688 are the
> ListItem/ItemGroup rebuild** and 193 restore by rule.
>
> Two further findings from the 2026-10-04 pass: filling the new `bodyList`
> slot by script is **verified to work** (`SlotNode.appendChild` inside an
> instance), and **truncation is used only on the Details tab** (2 ItemGroups
> in `"Assignees" Module / "4+ Assignees"`) — no old ItemGroup anywhere shows a
> show-more or footer signal, so asserting `isTruncated=false` on all 42 loses
> nothing. The rebuild spec is `rules-job-details.json`.

Method: every instance's `.overrides`, reduced to content fields only, then the
survival test run **top-down over the whole ancestor-instance chain** against
the PUBLISHED component (`importComponentSetByKeyAsync` resolves the version the
file is about to receive). See "Correction to the method" at the end — the
nearest-owner test the skill describes is not sufficient in this file.

## The number that matters

**6,542 content overrides. 1,230 break. 1,032 of those (84%) are one thing:
the ListItem / ItemGroup / GroupLabel rebuild — and they are NOT restorable by
the snapshot-and-restore tooling.** About 198 are restorable with mapping rules.

| | count |
|---|---|
| content overrides recorded | 6,542 |
| survive untouched | 5,037 |
| frozen (component no longer in the library — the update cannot reach them) | 275 |
| **break** | **1,230** |
| → of which restorable with a mapping rule | ~198 |
| → of which structurally unrecoverable | **1,032** |
| annotated nodes | 424 |
| annotations that break | 30 |

## Why most of it cannot be restored

The file carries **two main components under the same library key** for four
components — the old build and the new one, side by side:

| component | key | OLD main (in use) | NEW published |
|---|---|---|---|
| ListItem | `cf991cac…` | 5 variants, child `#️⃣ Item`, props isClickable/isDraggable/isAccordion | 53 variants, child `Body`, `body` SLOT + 9 props |
| ItemGroup | `6e2a7e31…` | 2 variants, child `#️⃣ Divider`, prop `header` | 32 variants, child `bodyList` SLOT + 9 props |
| GroupLabel | `fde91a6f…` | 2 variants, child `#️⃣ Primary`, prop `variant` | 46 variants, `Content` + `Slot Right` + 6 props |
| Chip | `bcab2f23…` | 60 variants, child `#️⃣ Content` | 126 variants, child `Label:TEXT`, `↳ label` property |

The `"Details" Tab` is **already on the new builds** (53-variant ListItem,
32-variant ItemGroup) — which is why that page loses almost nothing. Six pages
are still on the old builds, and that is where the damage is.

The old list is a **wrapper chain of part components**, every one of which is
gone from the library:

```
ItemGroup → #️⃣ Divider → #️⃣ Header → #️⃣ Items → #️⃣ View → #️⃣ ListItems → Body(slot)
          → ListItem → #️⃣ Item → #️⃣ Body → #️⃣ Content → #️⃣ Content Text
          → #️⃣ Content Text Left → #️⃣ Title → Title
```

The new ItemGroup's only child is a `bodyList` SLOT. So the whole chain is
deleted, and the rows held inside it go with it — the row content is not merely
reset to a default, the row NODES cease to exist. A path-keyed restore has
nothing to write onto. Putting those lists back is a rebuild, not a restore.

Size of that rebuild: **82 ItemGroup instances and 246 ListItem instances, all
246 carrying text**, spread over six pages.

## Breakage by cause

| cause | count | recoverable? |
|---|---|---|
| `ItemGroup → #️⃣ Divider` | 442 | **no** — wrapper chain deleted |
| `ItemGroup → #️⃣ Items` | 412 | **no** — wrapper chain deleted |
| `ListItem → #️⃣ Item` | 178 | **no** — wrapper chain deleted |
| `Chip → #️⃣ Content` | 78 | yes — write the new `↳ label` property (the known 2026-10 rule) |
| `GroupLabel → #️⃣ Primary` / `#️⃣ Secondary` | 30 | likely — map to `Content` / `Body / Content` |
| `#️⃣ ActionBar → Button` | 24 | likely — map to `Primary` (or `Secondary`); which one needs the dry run |
| `#️⃣ Body Bar → #️⃣ Content Placeholder` | 24 | likely — map to `#️⃣ Content Value` |
| `#️⃣ Value Content → BadgeJobStatus` (15) / `→ Icon` (1) | 16 | likely — `BadgeJobStatus` → `Badge` |
| `Card → #️⃣ Content Slot` | 11 | **no** — old structural part, new Card uses a `body` SLOT |
| `_InputBackground` (component gone) | 10 | no — a fill variable binding, low value |
| `#️⃣ GroupLabelContentPrimary → #️⃣ GroupLabelContentPrimaryLabel` | 2 | likely — map to `Label` |
| `RadioGroup → #️⃣ Header` | 2 | no — the new RadioGroup has no header |
| `AvatarGroup/user/xs/stack/3` (component gone) | 1 | no — one annotation |

## Per page

| page | instances | overrides | survive | frozen | **break** | annotated | ann. break |
|---|---|---|---|---|---|---|---|
| 📕 Thumbnail | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ↳ The Shell | 496 | 126 | 126 | 0 | **0** | 10 | 0 |
| ↳ "Details" Tab | 4,205 | 1,046 | 1,019 | 0 | **27** | 81 | 1 |
| ↳ "Service" Tab | 871 | 208 | 193 | 6 | **9** | 16 | 1 |
| ↳ "Timesheet" Tab | 2,345 | 814 | 339 | 4 | **471** | 63 | 11 |
| ↳ "Summary" Tab | 4,373 | 1,123 | 852 | 109 | **162** | 81 | 9 |
| ↳ "Activity" Tab | 1,085 | 383 | 377 | 0 | **6** | 23 | 0 |
| ↳ Check In / Out | 536 | 177 | 89 | 24 | **64** | 11 | 1 |
| ↳ Job Statuses | 2,753 | 715 | 644 | 9 | **62** | 74 | 6 |
| ↳ "Complete Job" Form | 1,905 | 607 | 451 | 76 | **80** | 26 | 0 |
| 💡 Explorations | 5,491 | 1,343 | 947 | 47 | **349** | 39 | 1 |
| **total** | **24,060** | **6,542** | **5,037** | **275** | **1,230** | **424** | **30** |

Four pages hold no content at all (two separators, `👍 Validated ↓`,
`❖ Local Components`).

## Frozen — 275 overrides the update cannot reach

These sit on instances whose main component is no longer in the library at all,
so the update does not touch them. They also will never update again.

`ListItemGroup` (156), `Columns` (32), `#️⃣ Avatar` (22), `#️⃣ Slot Right
Instance` (16), `TabStack` (12), `SelectInput` (17), `Card` (old key, 5),
`Chip` (old key, 4), `TextArea` (6), `TextInput` (3), `ViewBar Mobile` (2).

## The invention problem

The new builds add variant properties the old ones did not have — ItemGroup
gains `isAccordion`, `open`, `view`, `isTruncated`, `isExpanded`, `divider`;
ListItem gains `open`, `state`, `size`, `slotBottom`, `isLoading`; Chip gains
`slotLeft` and `isLoading`. Every existing instance will be given a value for
each, and it may not be the one the design had. No snapshot can fix this,
because the old value equalled the old default and is correctly filtered out as
"nothing to restore". Chip's `slotLeft` was exactly this trap in the 2026-10-03
run and is handled by `propDefaults` in `rules.json`; the ItemGroup and ListItem
ones need the same treatment, decided from a file-wide count.

## Correction to the method

The skill's rule — "the owner is the nearest ancestor instance strictly above
the node" — **under-reports in this file.** The owner of an override here is
often itself an old part component that is gone from the library, so the
nearest-owner test returns "cannot verify" and tells you nothing. The test has
to walk the chain from the **top-level instance downward**, asking at each link
whether the parent's published structure still places the child where it sits.
A node placed by a designer (on the canvas, or into a SLOT) survives as a node;
a node placed by a component's own structure is re-created from the new
component. If the top of the chain is itself gone from the library, everything
below it is frozen, not at risk.

Second correction: the slot test must check **every prefix** of the path, not
only its first segment. Checking only the first segment over-reported 654
overrides as broken in the first pass (the `Complete Job` form's
`#️⃣ Body → Body / body / FormModule`, the Explorations `… / body / Input`, and
SidePanel's `Panel / body / …` are all slot content, and they are safe).
