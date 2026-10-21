# Impact report — "Labor Rate" Side Panel — Next Update (2026-10-21)

File `qhebbfbPHDVnv8IF1EC7Zg`, page `↳  Side Panel` (0:1) — the only content page
(section "Side Panel" 1:7179). `↳  Create Form` is empty; `📕 Thumbnail` is the cover.
2,038 instances, 314 placed by hand. Read-only measurement, nothing accepted yet.
Survey script: `survey-labor-rate-side-panel.js`.

## Kind of job
A REBUILD — the same DisplayModule rebuild as Equipment / Warranty / Contact, and smaller than
Contact: no ListItem, no ListItemGroup, no retired TextInput (fields are already `Input`).

## What breaks
| Cause | Instances | Content | Method |
|---|---|---|---|
| DisplayModule `#️⃣ Body` deleted (header + body slot) | 47 modules (11 on canvas, 36 inside 6 SidePanels) | 129 header props, 5 bound vars, 17 annotations; body slots → 23 ValueDisplayGroup, 18 Input, 8 SkeletonTypography, 3 EmptyState, 2 SelectListItemGroup, 2 MenuItemGroup, 1 AlertBanner, 12 text, 7 frames; 390 nested overrides, 7 annotations | header: semantic record + rebuild; body: clone → park → back, + slot padding/gap |
| `#️⃣ Header` `⚙️ slotRight` → `slotRight`, `#️⃣ Header Slor Right` `qty` → `slots` | 29 / 6 non-default | — | set after (part of the header rebuild) |
| `ring` removed, new `status` / `variant` / `open` | 47, all `ring=none` | — | assert defaults after |
| SelectList search placeholder (predicted) | 2 | "Label..." | live-test after; was a false alarm before |

Totals: 397 content overrides — 233 safe, 153 at risk (151 DisplayModule), 0 frozen, plus 152
slot children (390 overrides) inside the DM body slots. Annotations: 48 total, 15 at risk.
Body padding/gap varies (16/16, 16/0, 16/24, 0/0, 0/16) → record per slot.

## Not changed by the update
Toast, PopoverFooter / ActionBar, Input, ValueDisplay, Button, IconButton, Avatar: property
definitions equal. 34 stale override records (ids that do not resolve today — Toasts,
ValueDisplayGroup labels) are old, not caused by this update.

## Frozen / library-side (not ours)
StatusBar ×4 (inside SidePanel), `_InputBackground` ×14 (inside Input's field).
