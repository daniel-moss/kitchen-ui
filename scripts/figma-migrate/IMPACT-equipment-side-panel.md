# Impact report — "Equipment" Side Panel — Next Update (2026-10-19)

File `yee2IMsxPF0E4verwgQrm6`, page `↳  Side Panel` (21896:13391) — the only content page.
2,861 library instances, 319 placed by hand. Read-only measurement, nothing accepted yet.

## Kind of job
Mostly a REBUILD (same DisplayModule update as Job Details 2026-10-17), plus a few restores.

## What breaks
| Cause | Instances | Content overrides | Method |
|---|---|---|---|
| DisplayModule body slot deleted (old `#️⃣ Body`) | 33 modules, 45 body children (149 instances) | 222 | clone bodies → parking frames → back into new `body` slot |
| DisplayModule header (lived in old `#️⃣ Body`) | 33 | 144 (titles, icons, counters, bound vars, fills) | semantic record + rebuild (rebuild.js from 2026-10-17) |
| SidePanel nav: TabStack/_TabItem retired → TabGroup (+ `#️⃣ SidePanelNavigation`) | 12 panels | 60 (tab labels, icons, bound vars) | semantic record + rebuild |
| ListItem rebuild (5 → 53 variants), rows inside DM bodies | 3 ListItem + 20 ListItem Template rows | 42 + 3 annotations | semantic record + rebuild, even after the body clone |
| SelectListItem `#️⃣ Body › #️⃣ Content` → `#️⃣ Copy` | 36 | 36 | restore by rename rule (live-test first) |
| PopoverFooter `#️⃣ Body` → frame, ActionBar rebuilt | 9 footers (Dialog, Prompt, SelectList) | 9 + 3 annotations | restore |
| SelectListHeader SearchInput → SearchField | 2 | 2 | restore |

Annotations: 51 total, 24 at risk (7 DM header, 14 in bodies — 11 come back with the clone, 3 on
ListItem internals — 3 PopoverFooter).

## Frozen (retired from the library — safe, but never update again)
TextInput 10, SelectInput 6, DateInput 2, TextArea Dialog 2, ListItemGroup 20 (inside DM bodies).

## Invented values to assert after the update
- SelectListItem `multiSelect` → `select` (single|multi|counter): 28 rows were multiSelect=true → must be `multi`.
- IconButton `_state` → `state`: 3 rows were `hovered`.
- ActionBar `tertiaryButton=true` (8) → new `layout`/`secondary` — mapping to confirm with Daniel.
- DisplayModule `ring` → `status`: 1 module was `warning`.

## Not covered by this measurement
Plain text nodes inside DM bodies are counted as body children, not as overrides. 6 override ids
did not resolve (nested inside ValueDisplayGroup / SelectList groups).

Survey script: session scratchpad `survey.js` (top-down test, slot prefixes, fixed top-instance bug).
