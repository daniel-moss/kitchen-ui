# Impact report — "Contact" Side Panel — Next Update (2026-10-20)

File `yHAKtZA0xLw4AqxooiOHYI`, page `↳  Side Panel` (21874:10859) — the only content page
(sections "Side Panel" 18592:106699 and "Header" 23908:4269). 1,622 instances, 256 placed by hand.
Read-only measurement, nothing accepted yet. Survey script: `survey-contact-side-panel.js`.

## Kind of job
A REBUILD — bigger than Warranty. Same DisplayModule rebuild, PLUS the old ListItem build
(5 variants → 53) and two retired containers (ListItemGroup, TextInput).

## What breaks
| Cause | Instances | Content | Method |
|---|---|---|---|
| DisplayModule `#️⃣ Body` deleted (header + body slot) | 28 modules (12 on canvas, 16 inside 4 SidePanels) | 62 header props, 21 bound vars, 4 annotations; 28 body slots → 7 ValueDisplayGroup, 6 EmptyState, 15 ListItemGroup; 192 nested overrides, 9 annotations | header: semantic record + rebuild; body: clone → park → back, + slot padding/gap |
| `ring` removed → new `status` | 4 modules with `ring=warning, banner=true` | — | set `status=warning` (to confirm) |
| ListItemGroup RETIRED | 15 (all inside DM bodies) | header label/icon/counter, 20 rows | swap → ItemGroup, rows BUILT fresh from semantic records |
| ListItem rebuilt (old 5-variant build) | 20 rows in groups + 3 on canvas (Phone, Email, Reminders) | 8 props, 5 annotations, 2 text styles; 41 retired `Slot Right Instance` inside | semantic record (title, caption, avatar, right slot) + rebuild |
| PopoverFooter `#️⃣ Body` deleted, ActionBar `tertiaryButton` → `layout/secondary` | 6 Dialog + 6 Prompt footers | 18 props, 7 annotations | restore (live-test first) |
| TextInput RETIRED | 12 (10 in Dialogs, 2 on canvas) | label, value, error copy | swap → `Input` |
| Toast props deleted + re-added | 28 | titles/captions/CTA | record; Figma mapped this itself last time — check, don't assume |
| AlertBanner props renamed (`_,message`→`↳ copy`, …) | 4 | copy, CTA, dismissable | record + check |
| IconButton `_state` → `state` | 18 non-default (6 loading, 6 hovered, 6 pressed) | state | assert after |
| Avatar: `type` removed, `counter/initials/nameFirstChar` renamed | 27 | content/type | assert after |
| AvatarUser `isPrimary` → `addOn` | 2 with `isPrimary=true` | — | assert after |
| Avatar Instance option `genericObject` → `generic` | 14 | — | check Figma's own mapping |

Totals: 366 content overrides — 215 safe, 119 break, 28 frozen (TextInput), plus 67 slot
children (192 overrides) lost with the DM body slots. Annotations: 63 total, 18 at risk + 2 frozen.

## Frozen / library-side (not ours)
StatusBar ×2 (inside SidePanel), Toggle ×2 (inside MenuItem, Reminders menu).

## Invented values to assert after the update
DisplayModule `variant/status/open`, ListItem `size/state/slotBottom/isLoading`,
Menu `header`, Menu_ItemGroup `label`, `#️⃣ Header Slor Right` `qty`→`slots`.
