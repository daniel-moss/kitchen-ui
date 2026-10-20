# Impact report — "Warranty" Side Panel — Next Update (2026-10-20)

File `RhlvzzPevWrSHCjZRPL19E`, page `↳  Side Panel` (18594:94275) — the only content page
(the other two pages are the thumbnail and a divider). 594 library instances, 78 placed by hand.
Read-only measurement, nothing accepted yet.

## Kind of job
A REBUILD (the same DisplayModule update as Equipment / Files), plus a few property-rename restores.
Small: 10 DisplayModules, 8 Toasts, 4 Dialogs, 2 Prompts, 3 SidePanels.

## What breaks
| Cause | Instances | Content | Method |
|---|---|---|---|
| DisplayModule `#️⃣ Body` deleted (header + body slot) | 10 modules | 31 header props, 2 bound vars, 5 annotations; 10 body slots (13 children: 6 ValueDisplayGroup with 20 ValueDisplays, 3 Notes texts, 4 skeleton lines, 1 EmptyState), 87 nested overrides | header: semantic record + rebuild; body: clone → park → back, + slot padding/gap |
| Toast properties deleted + re-added (`_title`→`↳ title`, `_supportText`→`↳ caption`, `_showCTA`→`CTA`, …) | 8 toasts | 8 titles, 5 captions, CTA off ×8 | record + write to the new properties. **The survival test does not see this** (node survives, property does not) |
| PopoverFooter `#️⃣ Body` deleted, ActionBar rebuilt | 4 Dialog + 2 Prompt footers | 8 props + 3 annotations | restore (live-test first) |
| MenuItem `#️⃣ MenuItem_BodyDanger` / `↳ actiob`→`↳ action` | 2 | "Delete" ×2 (+2) | restore |
| IconButton `_state`→`state` | 1 | `pressed` | assert after |

Body slot layout to record: pad 16 / gap 16 (most), Loading Notes gap 0, Empty Notes pad 0.

## Frozen (retired from the library) → swap to successor per the 2026-10-19 rule
TextInput ×2, DateInput ×4, TextArea ×2 (inside the 4 Edit-form Dialogs) → `Input`.
StatusBar ×1 (inside the mobile SidePanel — library-side, not ours).

## Invented values to assert after the update
- ActionBar `tertiaryButton=true` ×6 → new `layout` / `secondary` (last time Figma mapped it to `layout=slotLeft, secondary=false`).
- Avatar `content=icon` ×4 (warranty avatars) — `type` removed, check they stay warranty.
- DisplayModule `ring` — all at default, nothing to map.

Annotations: 15 total, 6 at risk (3 DisplayModule header, 3 PopoverFooter).
