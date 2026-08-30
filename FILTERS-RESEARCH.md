# Filters — research and best practices

Collected 2026-08-12. Sources listed at the end. Written for Roopairs (FSM,
mobile-first PWA + desktop web), not for e-commerce.

---

## 1. What the app already does today (facts from `roopairs_api`)

Read before designing — the new UI should fit this, or change it on purpose.

**Backend (Django, `django-filter`).** Each app has a `filters.py` FilterSet.
`roopairs/apps/jobs/filters.py` → `JobFilter` accepts: `id`, `is_archived`,
`keywords` (keyword search), `service_name`, `status` (multi-choice),
`assigned_technicians`, `estimate`, `recall_to`, `series`,
`equipment_expected`, `priority`, `purchase_order`. Similar FilterSets exist
for clients, invoices, estimates, pricebook, purchase orders, bills,
inventory, equipment, dashboard.
→ Filters are **query parameters**. Multi-select is supported per field. There
is **no AND/OR query builder** on the backend today.

**Frontend (`roopairs/pwa`).** The `Table` organism already holds the state a
filter UI needs:
- `filters: URLSearchParams | null` + `setFilters` (`Table.types.ts`,
  `hooks/useTableState.ts`) — filters are already modeled as URL params.
- `listDataFilters` — a **fixed pre-filter** set by the page (e.g.
  `JobSeriesJobsTable` passes the series filter).
- `TableViewControls/` → `TableViewTabs` (views) and `TableViewPhases`
  (`ObjectPhase`) — the tab/phase row above the table.
- `TableKeywordSearch`, sorting state (`SortingState`, sortable columns),
  `TableViewMenu` (columns order + visibility; popover on desktop, bottom
  sheet on mobile).
- `pages/Reports/ReportDashboard/DashboardFilterBar` — an existing horizontal
  filter bar for the reports dashboard.

**What is missing:** there is no general filter panel/menu component, and
nothing in `kitchen-ui/src/components/` for filters yet.

---

## 2. The decisions to make (each one has a recommended answer below)

1. Where filters live: top bar, left sidebar, or per-column.
2. When results update: live, per-filter, or batch ("Apply").
3. How active filters are shown.
4. Which control per data type (status, person, date, number, boolean, text).
5. Defaults, saved views, and persistence (URL / per user).
6. Mobile presentation.
7. Result counts and empty states.
8. Accessibility.

---

## 3. Placement

Three patterns, each with a clear use case (Pencil & Paper):

| Pattern | Context | Scales to | Use when |
|---|---|---|---|
| **Filter bar** (horizontal, above the list) | hybrid | medium | The page is a list/table with a moderate number of filters. Most common in SaaS. |
| **Sidebar** (left, vertical) | global | high | Many filter groups with nested values; the whole page is one result set. |
| **Inline / per-column** | local | low | Dashboards where each block has its own data, or table-column filters. |

Rules:
- Order filters by **how often they are used**, not alphabetically. Most-used
  first, specialist filters last (NN/g, Pencil & Paper).
- Only offer filters for data the user can actually see in the list. If a
  column or list value exists, it should be filterable (Baymard).
- Do not build advanced filtering for a 10-item list. Match the depth to the
  data size.
- Keep filters **decoupled from the result area** so applying one does not
  shift the layout (Smart Interface Design Patterns).

---

## 4. When results update — the single most important decision

Three models (NN/g, Pencil & Paper):

- **Live / interactive** — refetch on every change. Best for *exploratory*
  users and small, fast data sets. Gives immediate feedback about what each
  filter does.
- **Per-filter** — apply when a single dropdown closes. Middle ground; keeps
  each group's choices batched.
- **Batch** — one global **Apply**. Best for *known-item* users who already
  know their criteria, for heavy data sets, and for slow connections.

Guidance:
- **NN/g recommends batch filtering on mobile** — every extra round trip on a
  slow connection costs too much.
- You cannot reliably predict the user's mindset, so use one of: an explicit
  Apply button, a short **1–2 s inactivity timeout** before refetching, or
  refetching when the pointer leaves the filter area.
- A hybrid works: results update live *and* an Apply/"Show N results" button
  exists for control.
- While refetching: **dim the results and show a progress indicator** — do not
  blank the list.
- **Never auto-scroll to top** after a filter change while the user is still
  filtering. Exception: scroll up if the result set became empty or very
  small.
- Never freeze the UI on a single input — the user is usually mid-way through
  several selections.

---

## 5. Showing active filters (Baymard: 42% of sites get this wrong)

Show applied filters in **two places at once**:
1. In the filter control itself — the selected values stay visible, and the
   control is marked as active (strong text + a count, e.g. `Status (3)`).
2. In a dedicated **applied-filters summary**: removable chips above the
   results (sidebar layout → top of the sidebar, sticky; bar layout → a chip
   row below the bar).

Plus:
- Each chip removes one value (`×`), and a **Clear all** action resets
  everything. Offer clear at both levels: per filter group and global.
- Chips are the standard mobile pattern too — a horizontally scrolling row.

---

## 6. Control per data type

- **Status / category (multi)** → checkbox list in a dropdown or menu.
- **Single choice** → radio list.
- **Boolean** (Archived, Has equipment) → a toggle or checkbox directly in the
  panel, no dropdown.
- **People / clients / locations (long lists)** → searchable select list, with
  avatars; search box required above ~8–10 options; on desktop the search
  input auto-focuses (on touch it must not — it opens the keyboard).
- **Dates** → presets ("Today", "This week", "Last 30 days", "This month")
  **plus** a custom range. Validate start ≤ end, show the chosen range as
  text, and let the user type dates.
- **Numbers** → range input or slider with typed values.
- **Free text** → keyword search, kept separate from the filters themselves.

Naming:
- Use the words the technicians and dispatchers use, never internal codes.
- Explain any filter whose meaning is not obvious (info icon + tooltip/hint).
- Sort numeric values low→high; sort names alphabetically only when the user
  knows the names (people, clients); otherwise order by frequency of use.

---

## 7. Counts, zero results, and empty states

- Show the **result count** ("48 jobs") near the list — it is the proof the
  filter worked.
- Where possible show a count per filter value ("Open 12") so a user never
  picks a value that returns nothing. Alternative: disable zero-result values.
- If the result is empty: an empty state that names the reason and offers
  **Clear all filters** / remove the last filter.
- On mobile the Apply button doubles as the count: **"Show 48 results"**.

---

## 8. Defaults, views and persistence

- Give a sensible **default filter** per list (e.g. Jobs = not archived,
  active statuses) and make it obvious that a default is applied — a filter
  the user cannot see is a bug report waiting to happen.
- **Saved views** are the enterprise upgrade over one-off filters: a named
  filter + sort (+ columns) set, switchable from tabs. The app's
  `TableViewTabs` / `TableViewPhases` are already this pattern; Polaris
  "Index filters" and Linear do the same.
- Persist filter state in the **URL** (already how the PWA models it) so a
  filtered list can be shared and survives reload; per-user preferences
  (column order, last view) persist per session/user, with a **reset to
  default**.
- Consider a "Search within filters" input when the number of filter fields
  itself gets large.

---

## 9. Advanced filtering (property → operator → value)

Linear / Notion / Airtable pattern, for power users:
- A condition = **identifier + relative + value** (field + operator + value).
- Operators depend on the field type: text → contains / does not contain / is
  empty; numbers → greater than / less than / between; relations → has any of
  / has all of / has none of.
- Conditions combine with **AND / OR**; each part of the condition is
  clickable and editable in place.
- Only worth building if the backend can express it — Roopairs' FilterSets
  today are field=value with multi-value support, so a simple filter model
  fits the API. A query builder would need API work.

---

## 10. Mobile (this matters most for Roopairs)

- Entry point: a **Filter button** (with a count badge when filters are
  active) plus a chip row of active filters.
- Presentation: a **drawer / bottom sheet or full-screen overlay** — not a
  split screen. NN/g's "tray" pattern keeps part of the results visible behind
  the sheet, so the user sees the effect.
- **Batch apply** on mobile, with a **sticky Apply button showing the result
  count**. It must never scroll out of view.
- Group values in accordions inside the sheet; keep a visible close/opt-out.
- Do not port every desktop filter to mobile — pick the ones field users need.
- Sorting sits next to filtering, but is a separate control (filtering reduces
  the set, sorting reorders it).

---

## 11. Accessibility

- The result count sits in a live region (`aria-live="polite"`,
  `aria-atomic="true"`) so a screen reader hears "48 jobs" after a change —
  WCAG 2.2 SC 4.1.3.
- Every filter control is reachable and operable by keyboard; the filter
  panel traps focus while open and returns focus to the trigger on close (the
  DS overlay hooks already do this).
- Chips: Enter/Space removes; "Clear all filters" needs an explicit label.
- Never rely on color alone to mark an active filter.

---

## 12. Mapping to Kitchen UI (what exists, what is missing)

Existing components that a filter UI would be built from:
`Chip` (active-filter chips — has an `active` state and a left slot),
`SelectList` + `SelectListHeader` (searchable value lists, multi-select,
inline/dialog/drawer), `Menu` / `Popover` (desktop card / mobile drawer),
`SearchField` (keyword search), `Tabs` (saved views / status tabs),
`DatePicker` + `DateField`, `Checkbox` / `Radio` / `Toggle`, `Counter`
(active count on a control), `Badge`, `EmptyState` (no results), `Button` /
`IconButton`, `ListItem` + `ItemGroup` (the results), `SidePanel`.

Not built yet — the likely new pieces:
1. **FilterBar** — the container: keyword search + filter controls + sort +
   applied-chip row + Clear all.
2. **FilterButton / FilterControl** — one filter's trigger (label + selected
   summary + count), opening a SelectList.
3. **FilterChip** — an applied filter as a removable chip (Chip probably needs
   a remove `×` slot).
4. **Filter drawer** (mobile) — sheet with grouped filters + sticky
   "Show N results".
5. **Saved views** — if wanted; Tabs + a view menu.

---

## 13. Recommendation for Roopairs (starting point to discuss)

- Desktop: **horizontal filter bar** above the list — keyword search, then
  3–6 primary filters as dropdowns, then "More filters", sort at the right.
  Applied filters as a chip row under the bar, with Clear all.
- Update model: **per-filter** on desktop (apply when a dropdown closes),
  **batch** on mobile with a sticky "Show N results".
- Mobile: Filter button with an active count → full-screen/drawer sheet;
  active filters as a scrolling chip row above the list.
- Persist in the URL; keep a per-list default; add saved views later, reusing
  the tab pattern the Table already has.
- Filter set per list comes from the backend FilterSet fields, so the first
  version needs no API work.

---

## Sources

- [NN/g — User Intent Affects Filter Design (applying filters)](https://www.nngroup.com/articles/applying-filters/)
- [NN/g — Defining Helpful Filter Categories and Values](https://www.nngroup.com/articles/filter-categories-values/)
- [NN/g — Mobile Faceted Search with a Tray](https://www.nngroup.com/articles/mobile-faceted-search/)
- [NN/g — Filters vs. Facets: Definitions](https://www.nngroup.com/articles/filters-vs-facets/)
- [Pencil & Paper — Enterprise filtering UX patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering)
- [Pencil & Paper — Mobile filter UX patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-mobile-filters)
- [Pencil & Paper — Enterprise data tables](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables)
- [Smart Interface Design Patterns — Filtering UX](https://smart-interface-design-patterns.com/articles/filtering-ux/)
- [Baymard — How to design "Applied Filters"](https://baymard.com/blog/applied-filters)
- [Baymard — Have filters for all displayed list item info](https://baymard.com/blog/have-filters-for-list-item-info)
- [Baymard — Always explain industry-specific filters](https://baymard.com/blog/explain-industry-specific-filters)
- [Shopify Polaris — Filters](https://polaris.shopify.com/components/filters)
- [Shopify Polaris — Index filters (saved views)](https://polaris-react.shopify.com/components/selection-and-input/index-filters)
- [Linear — Filters documentation](https://linear.app/docs/filters)
- [Airtable — Filter records using conditions](https://support.airtable.com/docs/filtering-records-using-conditions)
- [Lollypop — Filter UX design for SaaS](https://lollypop.design/blog/2025/july/filter-ux-design/)
- [Sara Soueidan — Accessible notifications with ARIA live regions](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-2/)
- [Atomic a11y — Filter accessibility checklist](https://www.atomica11y.com/accessible-web/filter/)
