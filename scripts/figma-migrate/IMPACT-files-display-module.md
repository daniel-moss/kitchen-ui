# Impact report — "Files" Display Module (2026-10-19)

File `C6rO8SKXF9OVZyO7mTgRtE`, page `↳  "Files" DisplayModule` (1950:34790) — the only content page
(the other two are the thumbnail and a divider). 1,653 library instances, 156 placed by hand.
Read-only measurement, nothing accepted yet. Survey script: `survey-files-display-module.js`.

## Kind of job
A REBUILD. Every DisplayModule loses its old `#️⃣ Body` (header + body slot), and almost everything
inside the bodies is itself a rebuilt or retired component — so cloning the bodies back is not
enough: the rows inside would break a second time. The bodies are re-created from a semantic record.

## The 7 DisplayModules
| Frame | Body today | Inside |
|---|---|---|
| List View | 2 ItemGroups (Public / Private) | 6 file rows |
| Cards View | 2 ItemGroups, cards view | 8 CardFiles |
| "File Limit" Warning / 80% | 2 ListItemGroups (RETIRED) | 20 file rows, info banner |
| "File Limit" Warning / 100% | 2 ListItemGroups (RETIRED) | 25 file rows, warning banner |
| Empty (×2) | 2 ItemGroups | 3 file rows + 1 EmptyState each |
| Empty (×1) | 1 EmptyState | — |

## What breaks
| Cause | Count | Method |
|---|---|---|
| DisplayModule header (title, counter, TabGroup list/cards toggle, plus button) | 7 modules, 45 overrides (35 property values, 11 annotations, 7 variable bindings) | semantic record + rebuild |
| DisplayModule body slot deleted | 7 slots, 13 designer children (397 overrides inside) | semantic record + rebuild |
| ListItem 5 → 53 variants, ListItem Template 12 → 11 | 57 file rows | rebuild each row: name, caption, file type, right button |
| ItemGroup 2 → 32 variants (new `bodyList` slot) | 8 | rebuild |
| ListItemGroup RETIRED | 4 (in the 80% / 100% frames) | swap to ItemGroup |
| GroupLabel 2 → 46 variants | 12 (Public / Private headers) | rebuild: label + icon |
| Card 6 → 54 variants (CardFile unchanged) | 8 cards | check after the update; rebuild if the content is lost |
| TabGroup 6 → 4 variants | 7 (inside the headers) | part of the header rebuild |

Annotations: 15 total, 7 at risk (4 on DisplayModule headers, 3 inside bodies).

## Safe
80 of 127 hand-made overrides survive (Menus, Tooltip, AlertBanner, Hint, cursors…).
Menu 2 → 4 and MenuItemGroup 2 → 4 variants (4 menus, 16 items, outside the modules): content
survives, but the new variant values must be checked after the update (invented values).
2 overrides sit in a retired part (`#️⃣ Slot Right Instance`) — frozen, never update again.

## Not covered
Plain text nodes inside the bodies count as body children, not as overrides. Anything the old
component showed by DEFAULT (not overridden) is not in the override count — the semantic record
will read the full visible state instead.
