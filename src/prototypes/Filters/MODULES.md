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
| … → `14267-23297` **Filter Functionality** (the KINDS) | Multi-Select, Timeframe, **Freeform** (`14100-36446` — RENAMED from "Address" 2026-09-16: "used for any freeform filters: address, name, etc. It does not define what inputs and how many the filter uses" — the DEF declares the fields), Duration, Money | `filterKinds.tsx` |
| … → `14267-23337` **Filter Template** (shared filters) | **Cost** (`15056-60848`), **Price** (`15339-3946`), **Pricebook Status** (`15307-68262`), **Subtype** (`15049-71446`) and **Taxability** (`15049-71299`) — the five PRICEBOOK templates, MOVED here by Daniel on 2026-09-16 from the Labor and Products canvases, which is where the code already had them. **Location address** (`14947-21952` — its own section since 2026-09-16, built ON the Freeform kind; RENAMED from "Address" later the same day, which moved it after Location in every alphabetical menu — the nodes still draw it first), **Billing Address** (`14947-34564` — a TEMPLATE since 2026-09-16, the Vendors/Clients local copies consolidated), Client, **Created At** (`14767-79168`, new), **Due Date** (its section `14320-66655` sits on the Shared Behavior page), **Issued**, Labels, Last Modified, Location, **Received** (`13962-8766` — renamed from "Date received" and PROMOTED from the Jobs registry, 2026-09-14: "'Received' is a sharable filter"), **Payment Terms** (`14944-4762` — PROMOTED from the POs registry 2026-09-15, when the Vendors list became its second consumer), **Seen**, Service, Status Changed, **Total** | `filterTemplates.tsx` — every template is BUILT |
| Jobs page `14267-33379` | Assignee, Duration, Priority, Scheduled For, Source, Status, Type (Received moved OUT to the templates 2026-09-14) | `jobsFilters.tsx` |
| Estimates page `14268-43750` | **Status**, **Down Payment**, **Expires** | `estimateFilters.tsx` (Status 2026-09-11; Down Payment, Expires 2026-09-12) — every row of its menu node `14265-27090` is built |
| Invoices page `14300-52150` | **Status** (`14320-63153`), **Amount Due** (`14787-82892`) | `invoiceFilters.tsx` (2026-09-14) — every row of its menu node `14320-66224` is built |
| Credit Notes page `14759-68515` | **Status** (`14759-68590`), **Type** (`14759-71943`) | `creditNoteFilters.tsx` (2026-09-14) — every row of its menu node `14759-68604` is built; Type is CLOSED-phase only since later the same date |
| Series page `14759-72314` | **Type** (`14759-74546`), **Open Jobs** (`14767-79379`), **Recurrence** (`14831-29459`), **Series Start** (`14831-29788`), **Series End** (`14831-30000`) | `seriesFilters.tsx` (2026-09-14) — every row of the menu node `14759-74313` is built; Recurrence and the two Series dates got their sections later the same day |
| Bill page `14817-83509` | **Status** (`14817-83584`), **Billing Vendor** (`14817-88125`) | `billFilters.tsx` (2026-09-15) — every row of its menu node `14817-83613` is built; Status changed is CLOSED-phase only |
| POs page, section `14817-88566` | **Status** (`14817-91233`), **Est. Arrival** (`14951-37533`), **Shipping Carrier** (`14936-42471`) + **Shipping Method** (`14954-37900` — the pair that replaced the combined Shipping), **Purchasing Vendor** (`14825-8429`), **Amount** (`14825-18855`), **Items** (`14854-31182`), **Associated Estimates / Jobs / Invoices** (`14944-5951` / `14944-6209` / `14944-6307`) | `poFilters.tsx` (2026-09-15) — every row of its menu node `14824-29890` is built; Status changed on BOTH phases |
| Vendors page `14831-30339` | **Billing Address** (`14947-34564`), **Bills Via** (`14963-43879`), **Commitments** (`14963-44960`), **Current POs** (`14947-34881`), **Payables** (`14963-45576`) | `vendorFilters.tsx` (2026-09-15) — every row of its menu node (in section `14831-31010`) is built; ONE registry, both phases. **Created at** joined 2026-09-16 (Daniel: "we do need 'Created at' on 'Vendors' and 'Clients'"; the menu node draws the row) — the shared template over the db's new `Vendor.createdAt`, and since later the same day its COLUMN too (Daniel: "Clients and Vendors should have a 'Created at' column" — a prototype ADDITION, production's vendors table has none; 192 datetime, before Last modified) |
| "↳ Labor" canvas `15044-66760` (the "View - Next Update" file) | **Rate** (`15056-60150`), **Est. Duration** (`15339-20649` — the list's OWN, distinct from the Jobs template: "No est. duration" leads), **Unit Type** (`15049-71097`). Its **Cost** (`15056-60848`), **Status** (`15307-68262`), **Subtype** (`15049-71446`) and **Taxability** (`15049-71299`) sections are still filed here, but the FILTERS were promoted to `filterTemplates` when Products became their second reader | `laborFilters.tsx` (2026-09-16) — every row of its menu node (`15044-67466`) is built; Status is ACTIVE-phase only (the row's own annotation) |
| "↳ Other" canvas `15059-64482` | NOTHING of its own — all seven menu rows are shared templates (Cost, Labels, Last modified, Price, Status, Subtype, Taxability) | `chargeFilters.tsx` (2026-09-16), shared with Discounts |
| "↳ Discounts" canvas `15058-63980` | **Discount** (`15416-61777`) — the DISCOUNT kind, the sixth amount unit, over ten NEGATIVE presets. Its other four rows are templates | `chargeFilters.tsx`, the same module, `variant: "discount"` |
| "↳ Tax Rates" canvas `15059-64984` | **Tax rate** (`15368-50064`) — the PERCENT kind, the fifth amount unit | `taxRateFilters.tsx` (2026-09-16); its other three rows are templates |
| "↳ Products" canvas `15058-61566` | **Inventory** (`15339-3869`, single-select Tracked · Not tracked), **Price** (`15339-3946`), **MFG** (`15339-34571`) + **MFG part #** (`15339-34948`) — both the FREEFORM kind with ONE unlabelled field — and **Stock** (`15348-38255`, multi-select over the four inventory levels led by the absence row). Cost / Status / Subtype / Taxability come from the templates (its menu rows link to the LABOR sections) | `productFilters.tsx` (2026-09-16) — every row of its menu node (`15058-61588`) is built; Status is ACTIVE-phase only |
| Clients page `14947-35514` | **Available Invoice Credit** (`14970-61844`), **Bills To** (`14970-59620`), **Credit Limit** (`14970-58966`), **Default Estimate Expiration** (`14970-60678`), **Default Payment Terms** (`15047-67829` — the CLIENTS-OWN split of the shared template: "No default" for "No terms"), **Default Tax Rate** (`14970-60917`), **Industry** (`14970-46445`), **Locations** (`14970-59990`), **Outstanding Balance** (`14970-61205`), **Type** (`14970-46189`); Billing Address links the shared `14947-34564` | `clientFilters.tsx` (2026-09-16) — every row of its menu node is built; ONE registry, both phases |

Read off the nodes on 2026-09-11, after Daniel moved **Location address** (then
still "Address") onto the
Filter Template page (it had been filed under Filter Functionality) and
**Issued** and **Due Date** with it.

Note the distinction: *Duration* is a shared KIND, but the Jobs "Duration"
filter is object-specific. A kind is behaviour; a template is a whole filter
reused verbatim.

## 2. The files

```
src/prototypes/Filters/
  FiltersPrototype.tsx     63   page switch + desktop frame + Sidebar. Entry point.
  Filters.stories.tsx     123   the 6 stories. Story TITLES must never change.
  Filters.module.scss     494   every page's styles (one sheet, shared)

  SHARED — owned by neither object
  filterUI.tsx           1855   the Filters menu, option lists, chips, bar, drawer
  filterKinds.tsx        1554   the kinds' predicates + their Custom dialogs
  filterDefs.tsx         1077   what a FILTER IS: types, value model, apply/count/copy
  filterTemplates.tsx     475   the filters that are the same on every object
  viewStates.tsx          390   the list's own states, parameterised by the noun
  appShell.tsx            433   Sidebar, AppBottomBar, useAnchoredCard, useSingleAxisScroll
  listTable.tsx           202   the table every list draws: pinning, sorting, memo
  listData.tsx            172   the clock, the workspace tables, the formatters, the noun

  JOBS
  JobsPage.tsx           1051   the page: top bar, views, view bars, shells, pipeline
  jobsTable.tsx           397   its column registry (+ its sort keys)
  jobsFilters.tsx         463   its registry: 8 object-specific + 7 templates
  jobsData.ts             134   reader over the demo db → the Jobs row shape

  ESTIMATES
  EstimatesPage.tsx       796   the same, for estimates
  estimatesTable.tsx      360
  estimateFilters.tsx     249   its registry: 3 object-specific + 9 templates
  estimatesData.ts        181

  INVOICES (2026-09-14; its filters arrived later the same date)
  InvoicesPage.tsx        779   the same, for invoices
  invoicesTable.tsx       325
  invoiceFilters.tsx      182   its registry: 2 object-specific + 11 templates
  invoicesData.ts          78

  CREDIT NOTES (2026-09-14, later the same date — table, filters and views
  in one build)
  CreditNotesPage.tsx     778   the same, for credit notes
  creditNotesTable.tsx    227   ONE registry per phase — Type is closed-only
  creditNoteFilters.tsx   161   its registry: 2 object-specific + 5 templates
  creditNotesData.ts       64

  BILLS (2026-09-15 — table, filters and views in one build; the FIRST list
  whose rows hang off VENDORS, not clients — accounts payable)
  BillsPage.tsx           766   the same, for bills; plain title (no stack)
  billsTable.tsx          301   ONE registry per phase — Status changed is
                                closed-only (column AND filter)
  billFilters.tsx         208   its registry: 2 object-specific + 7 templates
  billsData.ts             72   reader + displayStatus (derived Overdue) +
                                the VENDOR lookups

  POS (2026-09-15 — table, filters and views in one build; the SECOND
  vendor-side list, the buying half of the Bills relationship)
  POsPage.tsx             744   the same, for purchase orders; title "POs",
                                sidebar item "Purchase orders" (both the
                                design's own copy)
  posTable.tsx            354   ONE registry for both phases — nothing is
                                phase-only (Status changed has data on both)
  poFilters.tsx           382   its registry: 9 object-specific + 5 templates
  posData.ts               89   reader + the payment-terms / shipping
                                values-in-use lists (the two filters' options)

  VENDORS (2026-09-15, after POs — the THIRD vendor-side list: the supplier
  DIRECTORY itself, the first list whose rows are not documents)
  VendorsPage.tsx         593   the same, for vendors; phases Active /
                                Inactive (the isActive flag), one "All" view
                                per phase, nothing locked
  vendorsTable.tsx        265   ONE registry for both phases; three DERIVED
                                number columns (Current POs, Commitments,
                                Payables)
  vendorFilters.tsx       255   its registry: nine rows — 5 object-specific
                                + 4 templates (Created at joined 2026-09-16,
                                with its COLUMN — a prototype addition,
                                production has none)
  vendorsData.ts          138   reader + the derived aggregates (Daniel's
                                five-status Commitments formula) + the
                                billing-address print + terms-in-use

  CLIENTS (2026-09-16, after the Vendors Created-at round — the SECOND
  directory list: the CUSTOMER side, production's eight columns plus the
  seven client-level properties its table never showed)
  ClientsPage.tsx         600   the same, for clients; phases Active /
                                Inactive (the isActive flag), one "All" view
                                per phase, nothing locked
  clientsTable.tsx        329   ONE registry for both phases; fifteen
                                columns, Client + Type pinned (production's
                                own); the three money columns right-aligned
  clientFilters.tsx       441   its registry: 11 object-specific + 3
                                templates; the first ABSENT amount row
                                ("No credit limit")
  clientsData.ts          202   reader + derived outstanding balance (the
                                production ENDPOINT's semantics, not the
                                db helper's) + values-in-use lists

  PRICEBOOK — the SHARED shell for all five pricebook lists (2026-09-16)
  pricebookList.tsx       the phases, the views, the locked Status chips, the
                          title's sub-page selector, the View menu, the
                          search / filter / sort pipeline and both shells —
                          everything Labor · Products · Other · Discounts ·
                          Tax rates do the same way. A list brings a
                          `PricebookListConfig`; `pricebookSorter` is the
                          shared comparator. It is the `listTable` decision
                          one level up, and it replaced five copies of one
                          450-line page.

  LABOR (2026-09-16 — the first PRICEBOOK list: production PriceBookItem,
  type service, the design's "Labor" page under the Pricebook stack)
  LaborPage.tsx           the same, for labor items; phases Active /
                          Inactive (`isActive`); Active holds All / Review /
                          Confirmed over the TWO-state status (production's
                          boolean `confirmed`; the status is NAMED "Active",
                          the tab stays "Confirmed" — Daniel's 2026-09-16
                          decision), Inactive one "All"; the title lists the
                          five pricebook types as sub-pages (only Labor
                          exists)
  laborTable.tsx          ONE registry per phase — the Status COLUMN is
                          Active-phase only (Daniel's ruling, diverging from
                          production's per-tab hiding); name column plain
                          text (no avatar); empty Subtype / Est. duration /
                          Summary = the DS "No value" cell
  laborFilters.tsx        its registry: 7 object-specific + 2 templates;
                          Status (single-select, Active phase only)
  laborData.ts            reader over the db's LABOR_ITEMS + the subtype /
                          label lookups and the "/hr" suffix rule

  PRODUCTS (2026-09-16, after Labor — the SECOND pricebook list: production
  PriceBookItem, the part type, production's "Parts & Materials" which the
  design renames "Products")
  ProductsPage.tsx        the Labor page's twin: phases Active / Inactive,
                          Active holding All / Review / Confirmed over the
                          same two-state status, Inactive one "All". Its
                          title selector NAVIGATES to Labor (the Pricebook
                          stack holds two pages now)
  productsTable.tsx       ONE registry per phase — Status Active-only; the
                          four part-only columns (MFG, MFG part #, Stock,
                          Levels); no Summary column (production's parts
                          config has none); the Stock cell draws the level's
                          icon in its own scheme and the "No value" cell for
                          an untracked product
  productFilters.tsx      its registry: 5 object-specific + 6 templates
                          (four of them promoted out of laborFilters)
  productsData.ts         reader over the db's PRODUCT_ITEMS + STOCK_LEVELS
                          (the one place a level's label, icon and colour
                          live) and the subtype / label lookups

  OTHER + DISCOUNTS (2026-09-16 — ONE set for two lists: production gives
  the two types the same fields but one, and the design's two Filters menus
  are identical row for row)
  OtherPage.tsx           the config; production's "Miscellaneous", which the
                          design renames "Other"
  DiscountsPage.tsx       the config; the only structural difference is no
                          Cost column
  chargesTable.tsx        `chargeColumns(list, {withCost})` + `sortCharges`
  chargeFilters.tsx       `chargeFilters(list, variant)` — Other's seven
                          rows are every one a shared template; Discounts has
                          five, with its OWN Discount filter in place of the
                          Price template and no Cost / Taxability
  chargesData.ts          both lists' rows and their own subtype / label
                          lookups, from one `chargeLookups` factory

  TAX RATES (2026-09-16 — the leanest pricebook type)
  TaxRatesPage.tsx        the config
  taxRatesTable.tsx       no Subtype and no Cost column (production's own);
                          the rate column prints a percent
  taxRateFilters.tsx      four rows — Tax rate (the PERCENT kind) plus three
                          templates
  taxRatesData.ts         reader over TAX_RATE_ITEMS, whose four workspace
                          rates ARE the Clients list's TAX_RATES rows

  SERIES (2026-09-14, still later — table, filters and views in one build)
  SeriesPage.tsx          602   the same, for series; the simplest page: one
                                "All" view per phase, nothing locked
  seriesTable.tsx         233   no ID column, nothing pinned (production's own)
  seriesFilters.tsx       155   its registry: 4 object-specific + 5 templates;
                                Recurrence NOT built
  seriesData.ts           109   reader + the derived phase + formatRecurrence
```

**Flat, not `jobs/` + `estimates/` sub-folders** (2026-09-11). Sub-folders would
have pushed every DS import from `../../components/…` to `../../../components/…`
in the two biggest files for no gain; the file names already say which object
owns what.

## 3. Which way the imports point

```
FiltersPrototype → JobsPage, SeriesPage, EstimatesPage, InvoicesPage,
                CreditNotesPage, POsPage, BillsPage, VendorsPage,
                ClientsPage                           (the page switch; see §5)
JobsPage      → jobsTable, jobsFilters, filterUI, viewStates, jobsData, listData
SeriesPage    → seriesTable, seriesFilters, filterUI, viewStates,
                seriesData, listData
EstimatesPage → estimatesTable, estimateFilters, filterUI, viewStates,
                estimatesData, listData
InvoicesPage  → invoicesTable, invoiceFilters, filterUI, viewStates,
                invoicesData, listData
CreditNotesPage → creditNotesTable, creditNoteFilters, filterUI, viewStates,
                creditNotesData, listData
BillsPage     → billsTable, billFilters, filterUI, viewStates, billsData,
                listData
POsPage       → posTable, poFilters, filterUI, viewStates, posData, listData
VendorsPage   → vendorsTable, vendorFilters, filterUI, viewStates,
                vendorsData, listData
ClientsPage   → clientsTable, clientFilters, filterUI, viewStates,
                clientsData, listData
LaborPage / ProductsPage / OtherPage / DiscountsPage / TaxRatesPage
              → pricebookList (the shared shell) + their own table registry,
                filter registry and data door + listData
pricebookList → listTable, filterUI, filterDefs, viewStates, appShell,
                listData
jobsTable / seriesTable / estimatesTable / invoicesTable / creditNotesTable /
billsTable / posTable / vendorsTable / clientsTable →
                listTable, listData, <its own data door>
filterUI      → filterKinds, filterDefs, appShell
jobsFilters / seriesFilters / estimateFilters / invoiceFilters /
creditNoteFilters / billFilters / poFilters / vendorFilters /
clientFilters → filterTemplates, filterKinds,
                filterDefs, <its own data door>, listData
filterTemplates → filterKinds, filterDefs, listData
filterKinds   → filterDefs, listData
filterDefs    → listData
listData / listTable / appShell → (nothing in this folder)
```

One EXCEPTION to "a page never navigates to another page": the pages that
share a sidebar STACK list each other as the title's sub-pages, and picking
one navigates there through the page's own `onNavigate` (the prop the
sidebar already uses) — Invoices ↔ Credit notes, and Jobs ↔ Series (Requests
stays a label; no page exists). No page IMPORTS another; FiltersPrototype
still owns the switch.

No cycles; no arrow from a shared module into a page; and since 2026-09-11 no
arrow from a shared module into `jobsData` either — what the lists share lives
in `listData` (`formatCurrency` moved there from `estimatesData` on
2026-09-14, when a second list started printing money). **A page must never
import another page.**

## 4. Two deliberate deviations from a literal mirror

1. **"Shared" ≠ "generic".** Some layers exist only for some objects. The
   schedule horizon is Jobs-only, so `HiddenCounts.horizon` is OPTIONAL and the
   pages without one simply leave it out — no copy about it is then built.
   (`lockedStatuses` defaults to empty the same way; since 2026-09-11 every
   list locks view statuses, so today no page leaves THAT one out.) Shared
   components take an explicit noun (`ObjectNoun`) and an explicit set of
   layers; none of them holds a table of what each object has.
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
- **Never pin a card's width, and never measure content to size it.** Let
  `fit-content` plus the component's own min/max hug. Pinning is what truncated
  labels.
- **THE PROTOTYPE SETS NO WIDTH AT ALL** (Daniel, 2026-09-17 — the settled end
  of a three-way comparison run on the Jobs list: 208 floor → no floor → 160
  floor → none). The components own their widths, and that is now stated in the
  DS:
  - **`SelectList`: no minimum, maximum 384.** A list is as wide as its rows
    and no wider. Every filter option / condition / value list is one.
  - **`Menu`: minimum 160, maximum 384** (`--size-40` / `--size-96`,
    Menu.module.scss). The Filters card is a Menu, so 160 is its floor and it
    comes from the component.
  - `MIN_WIDTH`, `LIST_STYLE`, `DS_MIN_WIDTH` and `FilterWidthFloorContext`
    are all GONE from filterUI. Do not reintroduce a floor here; if a width
    looks wrong, change the DS rule.
  - **What moved on Jobs:** the menu card 208 → 191 ("Location address" is its
    widest row); Received, Last modified, Priority and Status changed → 154,
    Scheduled for → 156, Type → 127 (the narrowest — two rows, "Upfront" /
    "Rolling"). The other nine lists were already wider than 208 and did not
    move. Elsewhere: Estimates' Down payment → 169, Credit notes' Type → 153.
    Nothing clipped.
  - **FLAGGED:** the Figma nodes still pin "Min Width" 208 — the Shell's
    "Filters" Menu / Desktop (14310-59652) and each list section. An older
    copy of the menu, 14295-47676, pins the DS 160, which is what the build
    does now.
  - Side effect, sub-pixel: `placeSub` positions a sub-list by `offsetWidth`,
    the fractional width rounded to the NEAREST integer, so the real gap is
    4 ± half a pixel. Always was; what made it visible is the menu card
    hugging to a fractional 191.42, which moved every row's left edge off the
    whole pixel. The `placement` measure section accepts 4–5px now.
- A card whose own search filters its rows must be **frozen at the width it
  hugged to when it opened**, or it resizes per keystroke. Since 2026-09-14 that
  is the **DS SelectList's own behaviour** (Daniel: "it should be a default
  component behavior") — the prototype's `useFrozenWidth` is gone, and the lists
  pass nothing at all. The component measures whenever its search is
  EMPTY, which is also what re-measures it when the pointer moves to another
  filter: `FilterOptions` clears the query during that render, so the card that
  stays mounted still hugs the new list. The FILTERS MENU is a `Menu`, not a
  SelectList, and still freezes its own width here — `frozenWidth` is the only
  width this prototype writes.
- Measure with `offsetWidth`, never `getBoundingClientRect()`: cards open under
  a `scale(0.98)` transition.
- `.filtersSub` (the sub-list portal) needs `width: max-content`. A
  `position: fixed` box with only `left` set is bounded by the viewport, so the
  card's width depended on where it was placed → placement loop.

**The FilterChip redesign shipped** (2026-09-17) — the DS component was
rebuilt in Figma and the code follows it. There is no longer a second design
and no `variant` prop: every list draws the one chip.
- The chip is a `--gray-a2` body inside a 1px `--gray-a6` ring (an inset
  box-shadow, so it adds no size) with no drop shadow; the dividers are HIGH
  contrast and inset `--size-2` (8px) top and bottom.
- Every interactive box carries a chevron — `angle-down`, solid, 10px,
  `--gray-a9`, 6px after the text, stepping to `--gray-12` in the hovered,
  pressed and focused states. It is not a prop: the box draws it whenever it
  has a click handler, which is the Figma part's `isClickable`.
- The box at the chip's right end takes the chip's 6px radius on its outer
  corners, so a focus ring there follows the chip's shape instead of being
  shaved by the clip.
- THE BOXES WERE RENAMED with the Figma component: `property` → **`name`**,
  `condition` → **`operator`** (and with them `onConditionClick` →
  `onOperatorClick`, `conditionPressed` → `operatorPressed`, `propertyHint` →
  `nameHint`). The filter DEFS still speak of conditions internally — that is
  the filter's own vocabulary, not the chip's.

**One chip size** (2026-09-18) — the Figma component dropped its breakpoint,
so the chip is **36px with 12px side paddings everywhere** (desktop included;
the old desktop chip was 32/10) and the code has no `breakpoint` on FilterChip
at all.
- What used to be the mobile presentation now belongs to **FilterChipGroup's
  `orientation`**: `horizontal` (hug, boxes capped at 240px) / `vertical`
  (the chip fills the row, the "value" box takes the slack, no cap). The group
  publishes it through `FilterChipOrientationContext`; a chip outside a group
  can set `orientation` itself — which is what the prototype's chips do
  (`mobile ? "vertical" : "horizontal"` in `AppliedChip` / `LockedStatusChip`).
- The group's "Add filter" IconButton went `md` → **`lg` (36px)**, and
  TopBarFilter's "Clear all" / "Reset" Buttons `md` → **`lg`**; the bar's
  vertical padding went 14 → **12px**, so the row is still 60px.
- The warning Hint is the one thing that still follows the VIEWPORT (hover vs
  tap): `nameHintBreakpoint` only exists so Storybook can force the drawer.
- The mobile sheet's applied chips ARE the DS group now (`orientation
  ="vertical"`): the 10px local column was a drift — the node always said 8px
  — and `.appliedChips` keeps only the 4/16/16 inset. Neither chip wrapper
  passes `orientation` any more; both inherit it from the group they stand in
  (the bar's horizontal one, the sheet's vertical one).

**Heights, and the bottom of the screen** (2026-09-17)
- **Every anchored card slides UP when it would not fit.** `placeSub` (the
  menu's hovered option lists) always did; `useAnchoredCard` (the Filters menu
  itself, a chip's condition and value lists, both View menus) did NOT until
  now — it set `top: trigger.bottom + 4` and nothing else, so on a short window
  the card simply ran past the bottom. It now measures the card
  (`offsetHeight`, re-run by a ResizeObserver once the portal exists) and
  clamps `top` to `innerHeight - 8 - height`. Sliding, not flipping above the
  trigger — the same correction `placeSub` makes, so every surface behaves one
  way. On a tall window nothing moves.
- **That clamp only works because the DS cards cap their height at the SCREEN**
  (`min(1000px, calc(100dvh - var(--size-4)))` on Menu and SelectList `.card`,
  added the same day). A card taller than the window cannot be placed at all:
  sliding it up hits the top margin and the rest still hangs off the bottom.
  Daniel found it on the **Location** list — 1000px tall in a 533px window,
  475px of it off-screen; the Filters menu card itself was 169px off.
- Verify with `node scripts/measure-filters.mjs` for the normal case, and by
  opening the Jobs story in a SHORT window for this one — the measure script
  runs at 1400×900, where nothing overflows.

**Layout**
- **The Hidden Data Bar hugs the list** (Daniel, 2026-09-16): below the LAST
  ROW while the rows fit, at the screen bottom once the table scrolls. Done in
  CSS only (`Filters.module.scss`): while a shell has the bar, `:has()` flips
  `.mainArea` from `flex: 1 1 0` to `flex: 0 1 auto`, every other shell row is
  `flex-shrink: 0` (the DS bars set no flex of their own and would be squeezed
  by the overflowing line), and the mobile `.bottomBar` pins itself with
  `margin-top: auto`. Without the bar the area still FILLS — that is what
  keeps the empty states (`.noResults`, height 100%) vertically centred.

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
  the amount chips' whole condition list silently did nothing (the condition
  changed neither the chip nor the rows). Found by clicking through the list on
  2026-09-12, not by the compiler. `measure-filters.mjs` now asserts it
  ("Total chip: at least → at most applies"); keep that check.
- **Duration and Money are ONE machinery** (2026-09-12), and Figma says the
  same: there is ONE filter type, **"Amount"** (section `13874-10420`), which
  the jobs list's **Est. duration** (`14267-33380`) and the estimates list's
  **Total** (`14297-48909`) both inherit. Both store an `AmountValue` —
  `{compare, preset, from, to}` on `FilterValue.amount` — run through
  `amountFilter`, share the `AMOUNT_CONDITIONS`, and take the same single-select
  list with condition chips and a "Custom..." footer. Only the UNIT differs:
  minutes against dollars, `formatDuration` against `formatMoney`,
  `DURATION_PRESETS` against `MONEY_PRESETS`, and the Custom dialog's field
  (hr + min against a "$" TextField — `MoneyCustom`, whose range puts From and
  To side by side where the duration's stack). A third amount kind should be one
  preset table and one formatter, not a third branch — `isAmountKind` in
  filterUI is the one place that lists them.
- **The conditions are `at least` / `at most` / `is`, and they INCLUDE the
  boundary** (Daniel, 2026-09-14; node `14100-37396` draws the copy). A job of
  exactly 2 hours matches "at least 2 hours", "at most 2 hours" and "is 2
  hours". They replaced the strict `over` / `under`, which left such a row out
  of both halves. `within` is the fourth, and only the Custom dialog can make
  one. The string IS the label — `AmountCompare` is the copy.
- **The jobs filter is "Est. duration", not "Duration"** (Daniel, 2026-09-14).
  The filter row, the FilterChip's property, the Custom dialog's title, and the
  TABLE's column all say it; the dialog TITLE reads `def.label`, the way the
  Money one already did. The KIND is still called `duration` in the code — a
  kind is not a filter.
- **The Custom dialog's single FIELD is labelled with the kind's unit word**
  (Daniel, 2026-09-15 — nodes 14758-68026, 14299-49210, 14787-82929,
  14854-31217, 14767-79594): "Duration" / "Amount" / "Number" for the
  duration / money / count kinds, NOT the filter's name (the title already
  carries that). The range labels stay "From" / "To". The aria-labels keep
  `def.label` on purpose — they are not visible copy, and the specific name
  reads better in a screen reader. The column went 112 → **144** with the rename:
  at 112 the header clipped (the sort affordance leaves 58px for the label, and
  the words need 77), though the cells never did.
- **A row with NO duration matches nothing, and that is now safe**: a job
  cannot be created without a duration, so only a DRAFT can be missing one
  (Daniel, 2026-09-14 — the rule is written on the db's `Job.durationMinutes`,
  and the db was filled in to match). No "No duration" row is needed.

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
- **`CellBody` styles only STRING children** — a raw number child skips the
  text span, so the cell loses the typography token (the tabular numerals
  included). `String(...)` every numeric cell. The POs and Series count
  columns always did; the Vendors Current POs column shipped without it and
  Daniel caught the un-tokened digits (2026-09-15).
- **Dates ALWAYS carry the year** (Daniel, 2026-09-15: "the year should
  always be shown" — the old hide-the-current-year rule is removed
  product-wide; before this the tables showed no year at all): `formatDay`
  prints "Aug 12, 2026", `formatDateTime` "Aug 12, 2026, 9:00 AM". And the
  Date+Time format is EVERY timestamp column's ("I like Date+Time. Let's
  use it everywhere"): Last modified and Status changed on every list, and
  any date column whose FIELD carries a time — jobs' Received, the
  estimates/invoices/credit-notes Issued and Due date/Expires (the seven
  date-only curated invoices got times for it). DATE-only fields (the
  bills' three dates, the POs' Issued and Est. arrival) keep `formatDay`.
  Every date+time column is **192** wide — 176 clipped the longest string
  ("Aug 23, 2026, 11:30 AM" needs 157px + the cell's 32) — where date-only
  columns stay 144. The chip's single-day copy still draws "Aug 5" with no
  year (`formatChipDate`) — that is node 13914-15296's own design, not the
  removed rule; FLAGGED in filterDefs if it should follow.
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
- (**Due Date** was here; it was built on 2026-09-14 with the Invoices
  filters — see below. NOTHING on the shared Filter Template page is unbuilt
  any more.)

Estimates' own:

- **Nothing is left on the Estimates menu.** Expires, Issued, Total and Seen
  were built on 2026-09-12 — Total brought the **Money** kind with it — so all
  thirteen rows of `14265-27090` are live. What remains unbuilt on the SHARED
  page is **Due Date**, and that waits for the Invoices list (see the flags).

And one view state:

- **Failed To Load** — SETTLED as unbuilt (Daniel, 2026-09-11: "Failed to load
  may stay silent"). Nothing in the prototype can fail to load, so the state
  would never fire; it belongs here when the real data does.

**The INVOICES list (2026-09-14)** — Daniel: "Add 'Invoices' list to the
prototype. Investigate roopairs-api. Add the columns and views. Do not add
filters for now. 'View' menu should work, though." Built from PRODUCTION (no
Figma page for it yet — every value below is roopairs_api's own):

- **Views** — production's `invoices_table__*` tabs, verbatim: Open holds
  All · Pending · Outstanding · Overdue, Closed holds All · Paid · Voided ·
  Forgiven. Each view lists invoices by the BADGE status (the estimates
  rule): Pending = draft + unsent (production's `status=pending`, where
  `is_draft` is a flag — there is no separate Draft tab), Overdue = the
  DERIVED status, exactly production's `status=sent & is_overdue` slice.
- **Status model** — the estimates decision applied from day one: the db
  stores the six badge keys (`InvoiceStatus` in types.ts), production's
  State never entered the schema, there is NO State column, and OVERDUE is
  the one derivation (`displayStatus` in invoicesData: outstanding + `dueAt`
  past). Outstanding → Overdue is the clock and writes no `statusChangedAt`.
- **Columns** — the production All-Open set in its order and widths, with
  TOTAL folded in after Amount due and SEEN at the end (the other views'
  columns; every view shows every column, the 2026-09-12 rule). Two width
  deviations: Status stays production's 176 (no "Awaiting approval" here),
  and **Amount due is 144, not production's 128** — production heads it
  "Amt. Due", and the written-out label clipped at 128 (the Est. duration
  precedent). The **Due date** cell escalates through the DERIVED status
  only (production: `isDangerous = state_label === "Overdue"`) — a paid
  invoice past its date is not a problem. Since later on 2026-09-14 the
  ESTIMATES' Expires cell follows the SAME rule (Daniel: "I don't think it
  makes sense to highlight Expires cells with the red color on closed
  estimates") — ONE rule on both lists now, which for estimates DIVERGES
  from production on purpose (its `is_expired` is date-only and colours
  every state, closed included). Trade-off accepted: a stale draft/unsent
  or approved-but-unconverted estimate past its date shows no red, like a
  stale Pending invoice.
- **The money columns are RIGHT-aligned, header included** (Daniel,
  2026-09-14 — he first wrote "left" and corrected it to right the same
  day): here AND the Estimates Total. The cells right-align through
  `content="number"`'s own default; the HEADER right-aligns through the
  registry (`TableColumnDef.align`, passed to CellHeader, which defaults
  left and must match the column's cells — its own doc rule). Before this,
  the headers sat left over right-aligned cells on every money column.
  Matches production's alignment. Tabular numerals as before.
- **Sort** — production's `date_due`, ascending open / descending closed;
  Labels and Status changed do not sort (`last_status_transition_time` is
  not server-sortable in production either).
- **db** — `Invoice` grew the list fields (serviceId/serviceName, labelIds
  + its own `INVOICE_LABELS` table, `amountPaid`, `dueAt` REPLACING
  `netDays`, `statusChangedAt`, `lastModifiedAt`, `lastViewedAt`); 7 curated
  rows upgraded in place + 56 materialized (`regenerate-db-rows.mjs
  invoices`, seed 20260914). "Amount due" is DERIVED: `total − amountPaid`
  (production subtracts credit-note allocations too — not modelled). The
  generator keeps LARGE unpaid invoices off Wildwood locations so the
  credit-limit story stays Bayside's (`outstandingBalanceOf` now counts
  draft + unsent + outstanding).
- **FILTERS since later the same date** (Daniel: "Add filters to the
  'Invoices'", with his Invoices Figma page 14300-52150) — the no-filters
  state and its inert-button flags lasted three days of story time and are
  GONE: the page carries the full filter stack (menu, chips bar, mobile
  drawer, locked Status chips, Hidden Data Bar, No Objects Match, the
  search-aware counts). THIRTEEN filters, the menu node's rows (14320-66224,
  alphabetical): eleven shared TEMPLATES — Client, Due date, Issued,
  Labels, Last modified, Location, Location address, Seen, Service,
  Status changed, Total —
  plus the list's own **Status** and **Amount due** (`invoiceFilters.tsx`,
  which owns `InvoicesPhase` now).
  - **Status** (section 14320-63153): the estimates shape exactly — one
    registry per phase (open: draft / unsent / outstanding / overdue, closed:
    paid / voided / forgiven, the badge map's icons and colours), chips-only
    is / is-not header, no search, matched on `displayStatus` so the derived
    Overdue works. Every view but the two Alls LOCKS it (the Views section's
    chip annotations name the statuses); the same LockedStatusChip rules.
  - **Amount due** (section 14787-82892): the third AMOUNT filter — the
    MONEY kind unchanged over `amountDueOf` (total − paid, the column's own
    derivation), the same eight presets as Total, at least / at most / is.
    Icon `hand-holding-dollar`, the node's own. One preset table, one
    formatter, no third branch — what the machinery was shared for.
  - **Due date** (section 14320-66655, on the SHARED page → a template in
    filterTemplates): a FORWARD-window Timeframe like Expires — no condition
    header, preset chip without the condition box (the section's two
    annotations). **OVERDUE leads the list** (Daniel added it to the node
    later on 2026-09-14, after the first build shipped without it) —
    `forwardWindows("Overdue")`, the same past window every forward filter
    carries, worded per object: Past due / Expired / Overdue. Still NO
    absence row (an invoice cannot exist without a due date). NOTE the
    window ⊇ the status: "Overdue" the ROW is a date question and also
    matches a stale PENDING invoice whose date ran out before sending (10
    rows where the status slice is 9) — production's `is_overdue` is
    date-only too, and the estimates' Expired row behaves the same. Icon
    `calendar-exclamation`, SHARED with Expires on purpose (Daniel,
    2026-09-14: the two never appear on one list, and the concepts are close
    kin). SETTLED the same day: the two COLUMNS keep their different names —
    "Expires" describes an offer, "Due date" a debt, and each pairs with its
    own derived status.
- Per-transition date columns (Sent / Paid / Voided / Forgiven dates) left
  out like the estimates' — the generic Status changed carries that story.
  FLAGGED, same as there. The top bar's title lists the sidebar stack's
  sub-pages (Invoices / Credit notes, the Jobs pattern); since the Credit
  notes page arrived (later on 2026-09-14) picking it NAVIGATES there.

**The CREDIT NOTES list (2026-09-14, later the same date)** — Daniel: "Add
'Credit notes' table, filters and view settings to the 'Filters' prototype",
against his Credit Notes Figma page (14759-68515, in the SAME file — its
sections re-read after he fixed the two flags from the design review that
morning: the Pending view locks Draft + Unsent now, and the Type icon is
`shapes`, not the placeholder `diamonds-4`). Views and filters from the
FIGMA page, the table from PRODUCTION (CreditNoteTableView +
defaultTableViewConfig `credit_notes_table__*`):

- **Views** — the Figma Views section (14759-68516), which is also
  production's TableViewTabs one for one: Open holds All · Pending, Closed
  holds All · Issued · Voided. Pending = draft + unsent (production's
  `status=pending`; `is_draft` is a flag there), so **All Open and Pending
  list the SAME rows** — only the locked chip differs, exactly as the design
  draws it. Every view but the two Alls locks its Status filter; Pending's
  chip reads "is any of 2 statuses" (the updated annotation).
- **Status model** — the standing decision from day one: the db stores the
  four badge keys (`CreditNoteStatus` in types.ts = BadgeCreditNoteStatus's
  set). NOTHING is clock-derived — a credit note has no due date, so this is
  the first list with no derived status at all.
- **TYPE is null until issue** — production computes `credit_note_type` when
  the note is ISSUED (CreditNoteViewSet.issue: fully allocated to the
  invoice = pre_payment, none = post_payment, part = mixed; no invoice =
  post_payment). The db mirrors that: drafts and unsent rows carry no type,
  their Type cells show the placeholder, and no Type option matches them
  (a typeless row still falls under every "is not", the Service template's
  null rule). FLAGGED: the whole OPEN phase therefore shows an empty Type
  column — say the word if the demo should type every row instead.
- **Columns** — production's set, order and widths (ID 144 · Invoice ID 144
  · Client 288 · Status 176 · Type 144 · Labels 240 · Total 144 · Issued 192
  · Last modified 192 — the two datetime columns since the 2026-09-15 date
  rules), ID + Client pinned, everything sortable but Labels.
  Production heads the date column "Date Issued"; here it is "Issued", the
  name the Invoices list already gave the same field (`date_issued`) —
  FLAGGED. Total right-aligns, header included (the money-column rule).
- **Sort** — production's `date_issued`, ascending open / descending closed.
- **FILTERS** — SEVEN, the menu node's rows (14759-68604, alphabetical):
  five shared TEMPLATES — Client, Issued, Labels, Last modified, Total —
  plus the list's own **Status** and **Type** (`creditNoteFilters.tsx`).
  - **Status** (section 14759-68590): the invoices shape exactly — one
    registry per phase (open: draft / unsent, closed: issued / voided, the
    badge map's icons and colours), chips-only is / is-not header, no
    search. FLAGGED: the menu node draws the `circle-dashed` turned 180°;
    built with NO rotation, the settled 2026-09-12 rule (the Jobs node had
    the same leftover).
  - **Type** (section 14759-71943): a MULTI-select — unlike the Jobs list's
    single-select Type — with the three production types as bare checkbox
    rows in the design's casing: Pre-payment · Post-payment · Mixed
    (production's own labels capitalize both words, "Pre-Payment" — the
    design wins, FLAGGED). Chips-only header, no search, no counts, no
    per-option icons. Icon `shapes` — Daniel's established Type icon, and
    what the node draws since his update.
  - The templates that are NOT here — Location address, Location, Service, Due date,
    Seen, Status changed, Amount due — have nothing to read: a credit note
    belongs to the CLIENT directly (no location, no service), has no due
    date, no Seen tracking in the list, and no Status changed column in
    production's view either.
- **db** — `CreditNote` + `CREDIT_NOTE_LABELS` in src/data/db (the labels
  are INVENTED like the invoice ones — production's are company-written;
  FLAGGED): clientId (direct — the one table hanging off the client, not a
  location), optional invoiceId (each link points at an invoice of the SAME
  client), status, optional type, labelIds, optional reason, total,
  issuedAt, lastModifiedAt. Six curated rows tell stories against existing
  invoices (a post-payment refund on paid INV-3110, a pre-payment discount
  on open INV-3157, a mixed warranty credit on INV-3113, a draft return, an
  unlinked goodwill credit, a voided mistake) + 22 materialized
  (`regenerate-db-rows.mjs creditnotes`, seed 20260915). 28 in all — credit
  notes are rarer than invoices on purpose. The Database browser page shows
  the table under each CLIENT (not under a location).
- The keyword search's field set is my choice again (id, invoice id,
  client, status label, type label — no node names one); FLAGGED like the
  others' .

**UPDATED later on 2026-09-14** (Daniel's items 5 + 6): the open phase keeps
ONLY the "All" view — Pending is gone ("Since they have the same objects,
the 'Pending' view is redundant"; the Figma Views section dropped the frame
too), and the branch declares its own status set now (`CreditNoteBranch.
statuses`), since there is no view left to derive it from. And TYPE — the
column AND the filter — is CLOSED-phase only: `creditNotesTable` keeps one
registry per phase (open = the closed one minus Type), the View menu is fed
the phase's own lists, and `creditNoteFilters` appends `typeFilter()` on the
closed branch alone. This RESOLVED the empty-Type-column flag from the first
build. Two notes: it is a PHASE-level difference, not the retired per-view
hiding (every view of a phase still shows every column its phase has); and
the Figma menu node (14759-68604) still draws ONE menu with the Type row —
the open menu here has six. FLAGGED.

**Two renames + a promotion (2026-09-14, Daniel's items 1–3):** the Jobs
list's "Date received" is **"Received"** — the COLUMN (jobsTable), the
FILTER, and its Figma section 13962-8766 (renamed by Daniel; the Jobs menu
node draws the new row, `calendar-arrow-down` kept). And the filter is a
shared TEMPLATE now (`receivedTemplate` in filterTemplates — "'Received' is
a sharable filter. It'll be used on other objects"), so the Jobs registry
takes it like Client or Labels. `createdAtTemplate` joined the templates the
same day (its section 14767-79168 sits on the shared page; the Series list
is its first consumer; PLACEHOLDER icon until Daniel picks one).

**The SERIES list (2026-09-14, Daniel's item 4)** — "Investigate 'Job
series' list on the 'roopairs-api'... Check out my designs for 'Series'
filters." Views and filters from the Figma Series page (14759-72314), the
table from PRODUCTION (JobSeriesTableView + job_series_table__*):

- **The object** — production `JobSeries` (jobs/models.py): a recurrence
  rule that stamps out jobs. Belongs to a LOCATION; `service_name`
  denormalized; TYPE Upfront (every job created at once — an end date is
  required) or Rolling (the next job is created as the series progresses —
  the end is optional); `recurrence_start/end/interval/frequency` +
  `weekly_recurrence` (weekday set) + `monthly_recurrence` (same date / same
  day); `open_jobs_count` annotated (jobs in scheduled / active / paused /
  on hold / completed). NO status: the list's phase is DERIVED —
  `is_closed` = the end has passed (filters.py) — and NO id column, NOTHING
  pinned, one "All" view per phase (TableViewTabs).
- **Columns** — production's, verbatim widths: Service 224 · Client 224 ·
  Location name 288 · Location address 288 · Type 96 · Series start 192 ·
  Series end 192 · Recurrence 288 (a sentence, `formatRecurrence` — the
  production formatter ported one for one, lowercase units FLAGGED where
  production capitalizes "Every 2 Weeks") · Open jobs 160 (right-aligned) ·
  Created at 192 (192 since the year joined the format, 2026-09-15). The
  three date columns head with the FILTER names ("Series
  start" / "Series end" / "Created at") where production writes "Recurrence
  Start" / "Recurrence End" / "Created At" — the one-word rule; FLAGGED.
  Dates print date + time (production's DateTimeCell).
- **Sort** — production's TWO-key `recurrence_start,created_at` (asc open /
  desc closed): one sort column here, the created-at tie-break baked into
  `sortSeries`.
- **Filters** — NINE of the menu node's ten rows (14759-74313): Client,
  Created at, Location, Location address and Service are templates; Series start,
  Series end (Timeframe shape — their doc links point at the shared
  section; own sections not drawn), Open jobs and Type (single-select
  Upfront / Rolling, `shapes`) are object-specific. PLACEHOLDER `diamonds-4`
  icons on Series start, Series end, Created at and Open jobs — Daniel has
  not picked them; the menu node draws the placeholder on each.
- **Open jobs brought the COUNT kind** — the FOURTH amount kind (the
  section's annotation links the shared Amount doc): COUNT_PRESETS (5 → 50,
  the node's rows), `countFilter` over `amountFilter`, the chip prints the
  bare number, and the Custom dialog is MoneyCustom with the "$" scoped to
  money. One preset table and one formatter, no new branch — what the
  machinery is for.
- **RECURRENCE — built later the same day.** Daniel first ("Not sure how to
  build it and how it's supposed to work"), then took the frequency
  proposal and DREW it (section 14831-29459): a Multi-Select of the four
  frequencies — Daily · Weekly · Monthly · Yearly — chips-only is / is-not,
  no search, no counts; the chip's noun is the node's "N frequencies". The
  interval and the weekday set stay out on purpose. Icon `arrows-repeat`,
  endorsed: a cycle, distinct from Status changed's one-time swap.
- **Series start / Series end — designed later the same day.** Series start
  (14831-29788) = the shared past-anchored Timeframe, exactly as first
  built. Series end (14831-30000) = FORWARD windows LED BY "No end date" —
  the absence row, which closed the open-ended-rows flag: it lists the
  rolling series with no end. No past ("Ended") row, and rightly: a past
  end IS the closed phase, so the row would be dead on Open and
  all-matching on Closed.
- **Received's menu position fixed** (Daniel's catch): the rename moved it
  down the alphabet — after Priority, before Scheduled for, where the menu
  node draws it — but the registry had left it in "Date received"'s old
  slot after Client.
- **The placeholder icons are SETTLED** (Daniel, later 2026-09-14): Series
  start `arrow-right-from-line` / Series end `arrow-right-to-line` (the
  pair he picked), Created at `calendar-plus` (the template — every future
  list gets it), Open jobs `wrench-simple` (the JOB icon — the filter
  counts jobs). And SERVICE moved to **`screwdriver-wrench`** to make way —
  a TEMPLATE change, so it landed on Jobs, Estimates, Invoices and Series
  at once. FLAGGED: the Figma nodes still draw the old icons everywhere
  these changed (`diamonds-4` on the four rows, `wrench-simple` on every
  Service row) — Daniel is updating them.
- **Open jobs: "None" over the 1 · 2 · 5 · 10 · 20 · 50 ladder** — both in
  Daniel's updated node (14767-79588) and built. "None" is the first
  COMPLETE amount preset (`AmountPreset.complete`): exactly zero, the
  at least / at most / is condition does not apply to it ("at least none"
  would mean everything), and its chip renders WITHOUT the condition box —
  the date WINDOW rule applied to the amount kinds (`isCompleteAmountValue`
  feeds the chip's `noCondition`). Picking a condition chip while None is
  applied changes nothing (the condition re-engages on the next numeric
  pick), the same way a window value ignores conditions.
- **db** — `JobSeries` in src/data/db: 6 curated rows + 18 materialized
  (`regenerate-db-rows.mjs jobseries`, seed 20260916); 18 open / 6 closed.
  `openJobsCount` is STORED (production's annotation counts real linked
  jobs; the demo does not link jobs to series) — FLAGGED. The generator's
  service names can pair oddly with a frequency (a "quarterly maintenance"
  on a daily rule) — the curated rows carry the sensible stories, the mass
  carries the volume, like the other masses.

**The BILLS list (2026-09-15, Daniel: "Build")** — after the design review
against roopairs_api (apps/bills) and his Bill page (14817-83509, re-read
after he added Issued). ACCOUNTS PAYABLE: the first list whose rows hang off
VENDORS — the suppliers billing the company — so there is no client, location
or service anywhere on it, and the sidebar's top-level "Bills" item navigates
to it (no stack, so the title carries no sub-pages). Views and filters from
the FIGMA page, the table adapted from production (BillTableView +
defaultTableViewConfig `bills_table__*`) per Daniel's four rulings, each
OVERRIDING production on purpose:

- **No Unsent, anywhere** ("The production is wrong. The bill can not have
  'Unsent' status"): the db stores four badge keys (`BillStatus` in types.ts
  = BadgeBillStatus's set minus the derived Overdue), production's
  `is_draft`-split Pending never entered the schema. The second open view is
  **DRAFT** — Daniel renamed it from production's "Pending" after the build
  review (2026-09-15: with one status left, the status names the tab, the
  design's own single-status-tab rule; the Views frames and tab bars draw
  "Draft" now). Views: Open All · Draft · Outstanding · Overdue, Closed All
  · Paid · Voided; Overdue = the DERIVED status (`displayStatus` in
  billsData: outstanding + `dueAt` past), exactly production's
  `status=unpaid & is_overdue` slice.
- **One Status changed, CLOSED-phase only** (two rulings in one): production
  shows THREE transition-date columns ("Received" = last_received_at,
  "Paid", "Voided") — "all those relate to the 'Status changed' concept.
  It's wrong" — which collapse into the one generic column here; and since
  a bill is BORN outstanding (leaving Draft is not a change, the standing
  statusChangedAt rule), only Paid / Voided ever carry a date, so the
  column AND the filter exist on the closed phase alone ("If Status changed
  is gonna be empty on the open phase, do not show the column and the
  filter"). The Credit Notes' Type arrangement: one registry per phase in
  billsTable / billFilters; the closed menu keeps the row in its
  alphabetical slot between Status and Total.
- **RECEIVED is `date_received`** — the user-entered arrival date, which
  production never lists at all — through the promoted `receivedTemplate`
  (its first consumer since the rename); ISSUED (`date_issued`, also
  unlisted in production's table) joins it, added to the design after the
  review. The three dates sit chronologically: Issued · Received · Due
  date.
- **Only Billing vendor** ("The purchasing vendor is not being shown as a
  list property. So, only 'Billing vendor' for now") — and NO Seen ("The
  bill can not be sent which means that it can not be seen"; production's
  `last_viewed` is another production gap).

- **Columns** — ID 144 · Billing vendor 224 · Vendor invoice ID 192 (144 in
  production; the written-out header clipped at 144 AND at 176 while
  pinned — the pin glyph joins the sort affordance — the Est. duration /
  Amount due precedent) · Status 176 · Labels 240 · Total 144
  (right-aligned, header included — production's `subtotal`, a bill's only
  amount: no tax, no partial payments, no Amount due twin) · Issued 144 ·
  Received 144 · Due date 144 · [Status changed 192, closed only] · Last
  modified 192 (the two datetime columns since the 2026-09-15 date rules;
  the three DATE-only bill dates stay date-only at 144). ID + Billing
  vendor + Vendor invoice ID pinned
  (production's own). The Due date cell escalates through the DERIVED
  status only — the Invoices rule, applied here on purpose: production's
  bills column has NO danger styling at all (a production gap Daniel
  called out). Headers sentence case where production capitalizes every
  word.
- **Sort** — production's `date_due`, ascending open / descending closed;
  Labels and Status changed do not sort.
- **FILTERS** — NINE, the menu node's rows (14817-83613, alphabetical):
  seven shared TEMPLATES — Due date (no absence row; a bill cannot exist
  without one, and its "Overdue" past window already words this list's
  derived status), Issued, Labels, Last modified, Received, Status changed
  (closed only), Total — plus the list's own **Status** and **Billing
  vendor** (`billFilters.tsx`).
  - **Status** (section 14817-83584): the invoices shape exactly — one
    registry per phase (open: draft / outstanding / overdue, closed: paid /
    voided, BadgeBillStatus's icons and colours), chips-only is / is-not
    header, no search, matched on `displayStatus` so the derived Overdue
    works. Every view but the two Alls locks it.
  - **Billing vendor** (section 14817-88125): the Client template's shape —
    chipGroup + "Vendor..." search header, xs-avatar rows sorted A to Z, no
    counts, the chip's value carrying the picked vendor's avatar (the
    shared `valueSlotLeft` wiring). The avatar is the DS `AvatarVendor`
    (image content) — and the NODE draws AvatarVendor too since Daniel
    swapped its AvatarClient instances after the build review (2026-09-15;
    the vendor NAMES in the node stay demonstration content). ALL vendors
    are listed, the deactivated presidio-fire included — the Client
    template's rule.
- **db** — `Vendor`, `Bill` + `BILL_LABELS` in src/data/db (labels INVENTED
  like every other list's — FLAGGED): 10 vendors (one deactivated), 44
  bills (curated BILL-6101..6106 — JOB-1201's compressor, a derived-Overdue
  chemicals account, a draft, a paid hood-filter order, its voided
  duplicate sharing the same vendorInvoiceId, the deactivated vendor's old
  paid bill — + 38 materialized, `regenerate-db-rows.mjs bills`, seed
  20260917). The three date fields are DATE-only strings, production's own
  shape. The Database browser page shows bills under "The vendor side".
- The keyword search's field set is my choice again (id, vendor name,
  vendor invoice id, status label — no node names one); FLAGGED like the
  others'. The menu node draws ONE menu with all nine rows, and since
  2026-09-15 its Status Changed row carries the annotation "Only shown on
  the 'Closed' phase lists" — the node documents the phase split, so no
  flag (unlike the Credit Notes' Type twin, which is still undocumented on
  its node).

**The POS list (2026-09-15, after Bills)** — Daniel: "I want to add 'POs'
list and filters to the prototype", after the design review against
roopairs_api (apps/purchase_orders) and his POs section (14817-88566, on the
"↳ POs" page of the same file; re-read twice as he updated it — the
Associated trio, Payment terms' conditions and the Seen menu row all landed
during the review). The SECOND vendor-side list — the buying half of the
Bills relationship. Views and filters from the FIGMA section, the table from
production (PurchaseOrderTableView + defaultTableViewConfig
`purchase_orders_table__*`) per Daniel's rulings:

- **Views** — production's nine tabs one for one (the Figma Views section
  14817-88570): Open holds All · Pending · Open · In transit · Delivered ·
  Stocked, Closed holds All · Paid · Cancelled. A view lists POs by the
  BADGE status, and production's RELABELING carries through: Pending =
  Draft + Unsent (production `status=pending`, `is_draft` the flag), Open =
  Sent + Acknowledged (production's coarse "Open" State), Delivered =
  Unstocked and Stocked = Unpaid — the tab names the step done, the badge
  names the work left. Every view but the two Alls locks its Status filter
  (each view's chip annotation names its statuses).
- **Status model** — the standing decision from day one: the db stores the
  NINE display statuses (`POStatus` in types.ts = BadgePOStatus's set);
  production's eight stored values and its `is_draft` flag never entered
  the schema, and production's coarser State column is left out (the
  estimates decision). NOTHING is clock-derived — a PO has no due date —
  so like Credit notes there is no `displayStatus` derivation at all.
- **ONE shipping column** (Daniel: "Keep 'Shipping Preference' but name it
  'Shipping' on all views") — production stores carrier + method TWICE
  (`preferred_shipping_*` = requested, `shipping_*` = what the vendor
  actually used), each view showing ONE of the two combined strings
  (preferred on Pending/Open, actual from In Transit on). The db keeps ONE
  pair under the one name. FLAGGED (the nuance, accepted): in production
  the two field sets CAN differ — the vendor ships FedEx when UPS was
  asked for — and that difference cannot be expressed here. LATER the same
  day the single `shipping` STRING became the `shippingCarrierId` +
  `shippingCarrierOtherName` + `shippingMethodId` +
  `shippingMethodOtherName` pair (production's enum + custom-name shape,
  minus the preferred/actual doubling), with the COLUMN string derived
  (`shippingOf` in db/index.ts — production's `get_shipping_details`) —
  the Shipping FILTER split forced the structure, see the filters below.
- **One Status changed, BOTH phases** (Daniel: "Per-status columns are
  'Status changed' data... replaced with the 'Status changed' column and
  filter") — production's SEVEN per-status date columns (Sent /
  Acknowledged / In Transit / Delivered / Stocked / Paid / Cancelled
  dates) collapse into the one generic column, and unlike Bills it lives on
  BOTH phases: a PO's status moves through the whole open phase, so
  everything from Sent on carries a date (born pending — Draft/Unsent stay
  null, the standing rule).
- **Columns** — ID 144 · Purchasing vendor 224 · Status 176 (160 in
  production — the "Acknowledged" badge clipped there; Daniel, 2026-09-15,
  the width the other lists' Status already uses) · Labels 240 ·
  Items 96 (right-aligned count of line items — `item_count`) · Amount 128
  (right-aligned; production `subtotal`, the line-items rollup, a PO's only
  money field) · Est. arrival 144 (RED while the status is In transit and
  the date has passed — production's `isDangerous`) · Shipping 224 ·
  Tracking number 176 · Payment terms 160 · Issued 144 · Associated
  estimates / jobs / invoices 176 each (deduplicated id badges; the links
  live on production's LINE ITEMS, M2M per line — the db stores the union
  the columns show, over REAL job/estimate/invoice ids) · Status changed
  192 · Last modified 192 · Seen 96. ID + Purchasing vendor pinned
  (production's own). State is dropped; Tracking number and Seen kept
  (Daniel's rulings). Headers sentence case.
- **Sort** — production's `date_issued`, ASCENDING on EVERY tab, the closed
  ones included (Daniel: "follow production") — the one list whose closed
  views do not flip to descending.
- **FILTERS** — SIXTEEN since the same-day update (the menu node's rows,
  14824-29890, alphabetical): five shared TEMPLATES — Issued, Labels, Last
  modified, Seen, Status changed (both phases) — plus ELEVEN of the list's
  own (`poFilters.tsx`). The first build had fourteen; the review that
  followed split Shipping in two and added Est. arrival (both below):
  - **Status** (14817-91233): the invoices shape — one registry per phase
    (open: the seven, closed: Paid / Cancelled), chips-only is / is-not, no
    search, icons/colours/rotations from BadgePOStatus's own map (the
    progress circles, a quarter per stage).
  - **Purchasing vendor** (14825-8429): the Bills Billing-vendor shape one
    for one over the same VENDORS table — chipGroup + "Vendor..." search,
    AvatarVendor rows A to Z, the chip's value carrying the avatar.
    (A store-icon flag was raised here and CLOSED by Daniel 2026-09-15:
    the node DOES draw AvatarVendor — the row's DS avatar slot part,
    variant=vendor, `logo: false`. The first read was a TEXT sweep that
    flattened the instance to the store glyph INSIDE the avatar — the
    standing metadata-flattening gotcha; the proper instance-tree read
    confirmed it. Residual prop note: the node's AvatarVendor is xxs with
    icon content; the build uses xs with image content, the Client / Bills
    filter convention — a one-prop change if the node's exact variant is
    wanted.)
  - **Shipping carrier (14936-42471) + Shipping method (14954-37900)** —
    the SPLIT that replaced the single combined Shipping filter (settled
    in review the same day: carrier and method answer different questions
    — "everything UPS" vs "everything expedited" — and the combined
    values grow multiplicatively; the "Other + custom name" mechanism
    sealed it). Two same-shaped multi-selects: is/is-not + "Carrier..." /
    "Method..." search, the absence row leading ("No carrier" / "No
    method"), rows = ALL the presets (production's fixed ShippingCarriers
    19 / ShippingMethods 4, labels verbatim — they read as carriers'
    service names, so no sentence-casing) PLUS the custom "Other" names in
    use — both sections' own annotation — merged A to Z
    (`shippingFilterOptions` in posData). Rules that came with it: an
    "Other" with a BLANK name falls under the absence row (nothing to
    show); duplicate custom spellings are separate rows (free text is
    reflected, not repaired); FLAGGED — production's own pickers order
    presets by popularity (USPS first), the filter sorts A to Z like the
    vendor list. Icons `truck` / `route` (the way it travels, not a
    speed — `truck-fast` lost to two-trucks similarity, `stopwatch` to
    "Ground is not a speed"; settled over rendered icon strips).
  - **Est. arrival** (14951-37533, added in the same review — "We don't
    have 'Est. arrival' filter. I think it makes sense to add it"): a
    FORWARD-window Timeframe, the Scheduled for shape — "No arrival date"
    (absence; a PO can have no ETA) over "Late" (the past window, worded
    for a shipment — an arrival is not "due"; the same date-only nuance
    as the Overdue window: it also lists past-ETA orders that already
    arrived, where the red CELL shows only while In transit) over the six
    shared future windows and "Custom...". Icon `arrow-down-to-line` —
    coming down onto the line = arriving (settled from the icon strip;
    truck-clock and calendar-clock both rejected).
  - **Payment terms** (14944-4762): multi-select, chips-only is / is-not
    (Daniel added the conditions after the first draft had none), NO
    search; options = only the values IN USE, led by "No payment terms",
    worded by the column's own `formatPaymentTerms` ("Same Day" / "Net
    30"). The value is the VENDOR's (production reads
    `vendor.payment_terms` live; `Vendor.paymentTerms` added to the db) —
    filtering POs by terms is filtering by their vendors' terms.
  - **Amount** (14825-18855): the MONEY kind unchanged over `amount` — the
    shared eight presets, at least / at most / is, the "$" dialog. Only the
    NAME is the list's own (the column heads "Amount" where the others'
    twin is "Total"). Icon `money-bill`, the node's own.
  - **Items** (14854-31182): the COUNT kind over `itemCount` — None over
    the 1 → 50 ladder, "Custom...". Icon `box-taped` — the DS PRODUCT icon
    (semanticIcons.product): every PO line is a part/material, endorsed.
  - **Associated estimates / jobs / invoices** (14944-5951 / 6209 / 6307):
    PRESENCE, not identity — the design decision from the review ("It
    would be a very long list if I list all the jobs"): two rows, None ·
    Has any, SINGLE-select with NO conditions anywhere — no header chips
    and no chip condition box (`FilterDef.noConditions`, NEW — the first
    filter with no condition at all; the chip reads "Associated jobs ·
    None"). Entity icons `clock` / `wrench-simple` / `circle-dollar`.
    The identity half ("POs of JOB-1201") is the SEARCH's job: the keyword
    search matches the associated ids — a DELIBERATE deviation from
    production's `keywords`, which does not (flagged to the team in the
    review; production serves that case from the object's related-POs
    panel instead).
- **db** — `PurchaseOrder` + `PO_LABELS` in src/data/db (labels INVENTED
  like every other list's — FLAGGED), and `Vendor` gained `paymentTerms`
  (net days; Fogline 0 = "Same Day", Mission Electric and the deactivated
  Presidio Fire null): 10 curated rows (PO-7101..7110 — JOB-1201's
  compressor as the stocked/Unpaid story with BILL-6101 as its follow-on,
  an empty draft, the red-ETA in-transit order, the vendor-opened sent
  order for Seen, the deactivated vendor's old paid order, a cancel tied
  to lost EST-2221) + 38 materialized (`regenerate-db-rows.mjs
  purchaseorders 2026-09-04`, seed 20260918). 48 in all. The Database
  browser shows them under each vendor, above its bills, with the vendor's
  terms line.
- The keyword search's field set is my choice again (id, vendor name,
  tracking number, status label, PLUS the associated ids — see above);
  FLAGGED like the others'.

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

**The VENDORS list (2026-09-15, after POs)** — Daniel: "Build", after the
investigation against roopairs_api (Vendor lives in the PRICEBOOK app) and
his "↳ Vendors" page 14831-30339 — read three times as the three new filters
were designed, reviewed and settled the same day. The THIRD vendor-side
list, and the first whose rows are NOT documents: the supplier directory.
Views and filters from the FIGMA page, the table from production
(VendorTableView + defaultTableViewConfig `vendors_table__*`) — the page's
own content area is a placeholder, so the columns are production plus the
standing rulings (the Invoices arrangement):

- **Phases** — Active · Inactive, the one `isActive` flag (production's
  own): no status, no locked filter, no Status filter anywhere, nothing
  clock-derived. One "All" view per phase (the Views section 14831-30343);
  the Series shape. 9 active / 3 inactive — TWO inactive vendors were ADDED
  to the db (alameda-welding, bay-city-paper; no bills, no POs) so the
  phase is more than the old presidio-fire row.
- **The db grew the list fields** (Vendor in types.ts): accountId, the five
  `billing*` address parts, labelIds + its own `VENDOR_LABELS` table
  (INVENTED like every list's — FLAGGED), `billsViaId` (production
  `default_billing_vendor`, the nullable SELF-link), website,
  lastModifiedAt — and VENDORS joined the date-SHIFTED tables for that last
  one. Two bills-via stories: peninsula-parts → marin-equipment,
  bayview-hood → golden-gate-supply.
- **The three NUMBER columns are DERIVED, not stored** (vendorsData, once
  at module load — production annotates them onto the queryset the same
  way): Current POs = the count of the vendor's POs in the five open
  statuses (Sent → Unpaid); **Commitments = the money of the SAME set —
  Daniel's ruling ("let's use five statuses"), diverging from production ON
  PURPOSE**: production sums only sent/delivered/stocked, so its number
  drops when a vendor acknowledges an order and comes back at delivery
  while its own count column counts all five — a production gap, flagged;
  Payables = production's formula one for one, the outstanding bills where
  the vendor is the BILLING vendor (the stored "outstanding", which holds
  the derived Overdue by construction).
- **Columns** — Vendor 224 (pinned, production's own) · Account ID 128 ·
  Billing address 288 (the vendor's own `billing_address_formatted`;
  printed with the prototype's region rule "CA 94107" and WITH the unit —
  production's formatted string keeps it, unlike the Location address
  columns; an optional RECIPIENT — production
  `billing_address_recipient`, added 2026-09-15 on Daniel's review — leads
  the string, joined with the shared TEXT SEPARATOR, and is NOT one of the
  filter's five fields) · Labels 240 · **Payment terms 160** (production heads it
  "Terms" at 144 — renamed so the column and the filter share one name, the
  Est. duration rule, and widened for the written-out header) · Bills via
  224 (production `default_billing_vendor_name`; EMPTY = bills come from
  the vendor itself, production's blank cell — FLAGGED: it could print
  "Same as vendor", the legacy detail card's copy) · Current POs 144
  (right-aligned; its ZERO prints — production has no ignoreZero on the
  count) · Commitments 160 · Payables 160 (right-aligned; zero renders an
  EMPTY cell, production's `ignoreZero`) · Website 224 (plain TEXT where
  production draws a LinkCell — nothing in these tables is interactive;
  FLAGGED) · Last modified 192 (date + TIME — production's own
  DateTimeCell here, unlike the Bills list's date-only column). Labels and
  Website do not sort (production's UI). `formatPaymentTerms` MOVED
  posData → listData (the formatCurrency precedent; posData re-exports).
- **Sort** — production's `name`, ASCENDING on BOTH phases (the two view
  configs there are identical); nothing flips.
- **FILTERS** — EIGHT, the menu node's rows (in 14831-31010, alphabetical
  after Daniel fixed the Bills via / Billing address swap): six
  object-specific + the Labels and Last modified templates
  (`vendorFilters.tsx`, ONE registry for both phases — nothing is
  phase-only and there is no Status).
  - **Billing address** (14947-34564): the shared ADDRESS kind over the
    vendor's own `billing*` fields — `addressFilter` was WIDENED to take
    any `AddressParts` (LocationRecord still satisfies it structurally),
    and the def's label "Billing address" titles the dialog.
  - **Bills via** (14963-43879): the Billing-vendor multi-select shape —
    "Vendor..." search, AvatarVendor rows A to Z, all vendors, deactivated
    included — with "SAME VENDOR" leading (the node's own avatarless first
    row): the absence value, production's null. "Is not Same vendor" =
    bills through someone. Icon `money-bill-transfer`. FLAGGED (no ruling
    asked): the chip's noun says "vendors" even when "Same vendor" is
    among the picks.
  - **Commitments** (14963-44960) and **Payables** (14963-45576): the
    MONEY kind over the two derived aggregates — the shared eight presets,
    Custom, "$" dialog. Icons `handshake` and `file-invoice-dollar` (the
    bill icon — the wears-the-object-icon precedent), both settled
    2026-09-15.
  - **Current POs** (14947-34881): the COUNT kind over the list's OWN
    ladder — None · 1 · 2 · 3 · 4 · 5 · 10 · 15 · 20 (Daniel updated the
    node 2026-09-15: denser low steps, no 50 — a vendor holds a handful of
    open orders). The first per-def ladder: `COUNT_PRESETS` is the UNION
    resolution table now, `COUNT_LADDER` the default the Open jobs / Items
    lists keep, and `countFilter` takes the ladder as a parameter. Icon
    `basket-shopping` (the PO object icon; the node writes the alias
    "shopping-basket" — the DS glyph name differs, noted).
  - **Payment terms** (doc link → the POs section 14944-4762): the POs
    filter over the vendor's OWN value — chips-only header, values in use
    led by "No payment terms", the same `formatPaymentTerms` wording.
- The keyword search's field set: production's own (name, formatted
  billing address, label names) PLUS account id, the bills-via name and
  the website — my choice, FLAGGED like the others'.
- The sidebar's "Vendors" item navigates (the third top-level vendor-side
  item); two new stories, DesktopVendors / MobileVendors. The measure
  script's Billing-vendor expectation moved 10 → 12 rows (the two new
  vendors list there too — the all-vendors rule).

**The Vendors review round (later 2026-09-15)** — Daniel's six items and the
decisions they carried beyond the Vendors list:

- **Dates**: the year-always and Date+Time-everywhere rules (see the Cells
  invariant above) — every timestamp column on every list, all at 192; the
  seven curated invoices whose issuedAt/dueAt were date-only got times, so
  the field has one shape per table.
- **PAYMENT TERMS is a TEMPLATE** (`paymentTermsTemplate` in
  filterTemplates) — Daniel moved its section 14944-4762 onto the shared
  Filter Template page when the Vendors list became its second consumer.
  With the promotion the node's two copy updates landed on both lists: the
  absence row says "NO TERMS" (was "No payment terms" — the "No carrier" /
  "No method" short-word pattern) and the chip counts "N OPTIONS" (was "N
  terms" — one value already IS "terms", so "2 terms" read wrong).
- **SEEN's rows are BARE** — the node update removed the `eye` /
  `eye-slash` row icons (14267-13151 re-read); the menu row keeps `eye`.
  Lands on Estimates, Invoices and POs at once — a template change.
- **Current POs** got its own ladder and the Current POs CELL its
  `String(...)` — both under their own bullets above.
- **Billing address** grew the optional RECIPIENT (the column bullet above).

**The CLIENTS list (2026-09-16, Daniel: "Build. And pay attention to icon
tokens")** — after a two-round design review against roopairs_api
(apps/clients) and his "↳ Clients" page (14947-35514, re-read after each of
his update rounds). The SECOND directory list — the CUSTOMER side, the
Vendors twin. Views and filters from the FIGMA page, the table from
production (ClientTableView + defaultTableViewConfig's clients_table__*)
EXTENDED with the client-level properties production never lists — the point
of the exercise (Daniel: "The table doesn't show many properties that exist
on a client level. I want to show them in the prototype"):

- **Views** — Active · Inactive phases (`isActive`), one "All" view per
  phase, nothing locked — production's two tabs and the Figma Views section
  (14947-35515) alike. Sort name asc, BOTH phases. Client + Type pinned
  (production's own columnPinning).
- **Columns** — FIFTEEN: production's eight (Client 224 · Type 112 · Labels
  240 · Locations 288 · Bills to 224 · Default payment terms 224 · Credit
  limit 144 · Last modified 192) + SEVEN additions (Industry 144 · Billing
  address 288 · Default estimate expiration 256 — the longest header on any
  list — · Default tax rate 176 · Outstanding balance 192 · Available
  invoice credit 224 · Created at 192). Rulings built in: **"Locations"**
  heads production's "Location" (Daniel: "I prefer 'Locations'") and the
  cell is the production CONCEPT on his copy — one site prints its address,
  several "N locations", none nothing; **"Default payment terms"** heads
  production's "Terms" (the one-name rule); the **Bills to** cell prints
  the FILTER's words — "Same client" / "Location" / the billing client's
  name — where production prints "This Client" / a BLANK cell / the name
  (the Bills-via blank-cell lesson; his option copy wins); the three money
  columns right-align, header included, and Outstanding balance + Available
  invoice credit render EMPTY for zero (the Commitments/Payables
  arrangement; the legacy card prints "--" for a zero credit balance).
  Headers verified unclipped at every width WITH the sort affordance active
  (a headless-Chrome DOM check, not a screenshot).
- **The money trio's semantics** (the investigation's three questions,
  built): CREDIT LIMIT is the client's own nullable field — null = no limit
  configured. OUTSTANDING BALANCE is DERIVED in clientsData the production
  ENDPOINT's way (`/api/clients/{id}/balance`): status "outstanding" only
  (the derived Overdue is stored "outstanding" — drafts/unsent are OUT,
  unlike the db's `outstandingBalanceOf` helper, which the New Job warning
  reads and which this list does NOT use), amount due = total − amountPaid,
  matched by who OWNS the location (billing intention ignored —
  production's own gap, kept on purpose). AVAILABLE INVOICE CREDIT is
  production's `credit_balance` — fed only by credit notes there (trigger
  ledger: issue +, allocate −, void −, deallocate +) — STORED on the db
  client because allocations are not modelled; curated to roughly agree
  with the issued credit notes.
- **FILTERS** — FOURTEEN, the menu node's rows (alphabetical): eleven
  object-specific — **Type** (single-select Business `building` /
  Individual `user` — the client-type TOKEN glyphs), **Industry**
  (multi-select over the FIXED four-value enum + leading "No industry";
  production's `industry_type` is optional and NOT company-written, so no
  values-in-use rule), **Bills to** (Same client · Location · every client
  A–Z with xs AvatarClients; matches `default_billing_intention` +
  `default_billing_client`), **Billing address** (the address kind over the
  client's own `billing_*`, the Vendors twin), the MONEY trio — **Credit
  limit** (led by "No credit limit", the first ABSENT amount row: matches
  the NULL field, not $0 — `AmountPreset.absent`, `MONEY_PRESETS` is a
  union table with `MONEY_LADDER` now, the COUNT arrangement),
  **Outstanding balance** ("No balance" = complete zero) and **Available
  invoice credit** ("No credit" = complete zero) — **Locations** (the COUNT
  kind over the location count, the Current POs ladder, "None" =
  Marisol's), and the three defaults — **Default estimate expiration**
  (values in use as "N days", "No default" leading), **Default payment
  terms** (the CLIENTS-OWN section 15047-67829 Daniel split off the shared
  template: label "Default payment terms", absence "No default" — a
  client's empty field falls back to the company default, where a vendor's
  simply has no terms; same `formatPaymentTerms` wording) and **Default tax
  rate** ("Tax rate..." search, "No default" + every workspace rate A–Z) —
  plus the **Created at**, **Labels** and **Last modified** templates.
- **Icon tokens** (Daniel: "pay attention to icon tokens — I've added
  tokens for 'client-industry' and 'credit-limit'"): `--client-industry:
  "industry"` and `--credit-limit: "gauge-high"` added to
  semanticIcons.ts + icons-semantic.css and READ by the Industry and
  Credit limit filters; Type's option rows read `--client-business` /
  `--client-individual`; Default estimate expiration reads `--estimate`
  (clock — the estimate object icon, Daniel's own point); Available
  invoice credit reads `--invoice` (circle-dollar). Literals where no
  token exists: `money-bill-transfer` (Bills to — the Bills via pair,
  Daniel's pick), `scale-unbalanced` (Outstanding balance), `percent`
  (Default tax rate — NOT the pricebook `--tax-rate` token, which is
  `tag`), `shapes` (Type), `location-dot` (Locations), `text` (Billing
  address), `square-n` (Default payment terms).
- **db** — `Client` EXTENDED (types.ts + db.ts): free-form `labels` strings
  became `labelIds` + the invented `CLIENT_LABELS` table (production
  `ExternalClientLabel` is company-written — FLAGGED like every other
  list's); `creditBalance` (stored — see above), `billingRecipient` +
  `billingUnit`, `defaultBillingClientId`, `defaultEstimateNet`,
  `defaultInvoiceNet`, `defaultTaxRateId` (+ the invented `TAX_RATES`
  table: SF/Oakland/CA sales tax + a real 0% "Tax exempt"), `createdAt` +
  `lastModifiedAt` — and CLIENTS joined the date-SHIFTED exports. SIX new
  clients (Gateway Conference Center — bills to North Point; Civic Center
  Grill — Government + tax-exempt; Anchor Line Seafood; Marisol's Kitchen
  Truck — Individual, no industry, ZERO locations, created == modified;
  inactive Redwood Room + Lighthouse Cannery) → 11 active / 3 inactive,
  plus five new locations and a third Wildwood site (Marina). The
  `defaultBillingIntention` comment was CORRECTED: production HAS the
  client-level field (its default is SERVICE_LOCATION) — the old "NEW
  concept" note was written before the investigation.
- The keyword search's field set is production's (name, location names,
  location addresses, labels) + my extras (billing address, the Bills to
  text) — FLAGGED like the others'.
- measure-filters: the Jobs **Client filter hug** expectation moved 209 →
  276 (the new client names are longer — content-driven, the behaviour is
  the same) and `menuRows`' junk-filter cap 24 → 40 ("Default estimate
  expiration" is 27 characters).

**The LABOR list (2026-09-16, Daniel's corrections applied: "Avatar is
unnecessary" on the name column; empty Subtype / Est. duration cells use the
DS "No value" cell)** — the first PRICEBOOK list, built against the "↳
Labor" canvas (15044-66760) after the production investigation
(apps/pricebook — PriceBookItem type 1, the "LABR" service type) and three
design-update rounds the same day:

- **The status model** — production's boolean `confirmed` as a two-state
  status on ACTIVE items: `review` (the system MINTS an unconfirmed item
  whenever a free-text service description lands on a line item —
  core/mixins.py's get_or_create) and `active` (confirmed). Daniel's naming
  decision: the STATUS is called "Active" while the view TAB stays
  "Confirmed", so the Confirmed view's fixed chip reads "Status is Active" —
  drawn exactly so in the frame. The Inactive phase is one bucket: no
  status column, no Status filter (the menu row's own annotation), and NO
  "review + inactive" rows in the db on purpose (the production UI cannot
  create one — deactivation runs through the edit form, which force-confirms
  on every save).
- **db** — `LaborItem` + `LABOR_SUBTYPES` + `LABOR_LABELS` (both INVENTED,
  company-written in production — flagged, like every list's). The 12
  `SERVICES` rows are the SAME records seen from the pricebook side —
  LABOR_ITEMS derives them by id, and the 9 services that had no
  `defaultDurationMinutes` got one (the field IS production's
  `default_job_duration`; one field, one value). 40 rows in all: 27
  confirmed catalog items (3 with deliberate gaps), 8 review rows (messy
  line-item names, cost 0 — production's auto-create default — no subtype /
  duration / summary; one carries a subtype, the line-item-with-subtype
  case), 5 inactive legacy items. LABOR_ITEMS joined the date-SHIFTED
  exports.
- **Filters** — NINE: Cost (`coins`) and Rate (`money-bill`) on the money
  kind's shared ladder; the list's OWN Est. duration (15339-20649) — the
  duration kind grew the union-table + ladder arrangement (the money /
  count pattern): "No est. duration" is `DURATION_PRESETS`' new ABSENT row,
  `DURATION_LADDER` keeps the Jobs list on its four; Status (single-select,
  is / is-not chips, the two circle-small dot rows read from
  BadgePricebookStatus's map); Subtype (multi-select, "Subtype..." search,
  "No subtype" leading); Taxability (single-select Non-taxable · Taxable —
  the NAME settled over "Tax": production's form says "Tax" but the sibling
  nav item is "Tax rates"); Unit type (single-select Hourly · Flat rate);
  plus the Labels and Last modified templates.
- The keyword search's field set: production's `filter_keywords` covers
  description, summary and label names; the subtype and (active-phase)
  status label are my extras — FLAGGED like the others'.
- The sidebar's Pricebook stack navigates (Labor only; Products / Other /
  Discounts / Tax rates stay labels, the Requests arrangement) and joined
  the follow-the-page collapse rule. Two new stories, DesktopLabor /
  MobileLabor.

**The PRODUCTS list (2026-09-16, Daniel: "Build")** — the SECOND pricebook
list, built against his "↳ Products" canvas (15058-61566) after the design
review that settled its four open questions. Production's part type
(`PriceBookItem`, "Parts & Materials"); the design renames the list
**Products** and the sidebar / title / Create menu all say it. Structurally
the Labor list's twin — same phases, same views, same two-state status, same
locked chips — so only what DIFFERS is worth writing down:

- **The four questions Daniel settled before the build.** The Inventory
  filter's values are **Tracked / Not tracked** (over the node's first
  Inventory / Non-inventory, which made the chip read "Inventory is
  Inventory"); the Stock COLUMN's untracked cell is the DS **"No value"
  dash**, not production's "Untracked" word (his CellBody examples frame
  15368-44651 draws all five cells); the three placeholder icons became
  **MFG `industry-windows`** (the plain `industry` glyph stays the Clients
  list's Industry filter), **MFG part # `hashtag`** and **Stock
  `boxes-stacked`**; and a Preferred vendor filter is SKIPPED ("There is no
  column like this for now") even though production sets `preferred_vendor`
  on every part created from a PO.
- **FOUR filters were PROMOTED, not copied.** The Products menu's Cost,
  Status, Subtype and Taxability rows link to the LABOR canvas's sections —
  the design saying "the same filter" in the only way a menu row can — so
  they moved into `filterTemplates` as `costTemplate`,
  `pricebookStatusTemplate`, `subtypeTemplate` and `taxabilityTemplate`
  (the `receivedTemplate` / `paymentTermsTemplate` precedent). Each takes
  its reader, and the two SUBTYPE / LABEL tables are parameters, because
  production scopes both to one `pricebook_item_type`. The Labor registry
  now reads the same four; its measure section still passes unchanged,
  which is what proves the promotion was verbatim.
- **MFG and MFG part # are ONE-FIELD freeform filters**, and that made
  `FreeformField.label` OPTIONAL: both dialogs draw their Input with
  `header: false` (the title already names the field, so a label under it
  would only repeat it). With no label the DS Input renders no header at
  all, and the field takes the filter's name as its aria-label. Everything
  else is the kind unchanged — contains / does not contain, the Apply gate,
  the typed text as the chip's value.
- **Stock is the first filter whose rows and CELLS share one colour
  table.** `STOCK_LEVELS` in productsData holds each level's label, icon and
  CellBody scheme once: Full a jade `circle-check`, Limited an amber
  `circle-half-stroke`, Low an orange `circle-quarter-stroke`, Depleted a
  red `ban`. The four fill progressively less of their circle as the shelf
  empties, and `ban` breaks that pattern on purpose. The CELL takes the
  semantic `--text-*` tokens through `colorScheme` (a11); a LIST row paints
  its own icon on the **a9** step, which is what the node draws — the map
  from scheme to scale is `SCHEME_SCALE` in productFilters, the one place
  it is written.
- **The absence row has NO ICON.** Daniel took the `minus` off Stock's "Not
  tracked" the same day he took the icon off the Estimates list's "Not
  required" — an absence row names a missing value, not a value, so it has
  nothing to draw. Both nodes and both builds now agree.
- **Columns** — production's parts view with the standing substitutions
  (name 288, Status 176, Last modified 192 date+time) plus **Stock 128**,
  the width Daniel's own CellBody examples are drawn at over production's
  112. TWO deliberate divergences, both FLAGGED in productsTable: the
  COLUMN ORDER keeps Status second to match every other list in this
  prototype (production's parts config puts Subtype first and Labels early,
  where its SERVICES config does not — the two pricebook lists would
  otherwise read differently side by side); and there is **no Summary
  column**, which is production's own choice for parts (a part is
  identified by its manufacturer and part number, not a sentence) — the
  FIELD is still there and the keyword search still reads it.
- **db** — `ProductItem` + `PRODUCT_SUBTYPES` + `PRODUCT_LABELS` (both
  INVENTED, company-written in production — flagged, like every list's). 58
  rows: 26 tracked catalog parts covering every level (full 12 · limited 7 ·
  low 4 · depleted 3, with `quantity` against `quantityDesired` always
  agreeing with the status), 14 untracked special-order and bulk items, 10
  REVIEW rows and 8 inactive legacy parts. The review rows carry BOTH
  production paths: a free-text line item (cost 0, its auto-create default)
  and a part typed onto a PO (`get_or_create_pricebook_item`, which copies
  the expected cost, so those arrive with a cost and often a
  manufacturer) — and every one of them is UNTRACKED, because production
  forces it ("Parts created ad-hoc … always default to non-inventory"),
  which is why the Review view's Stock column is all placeholders.
  `LaborStatus` / `LaborSubtype` / `LaborLabel` were RENAMED
  `PricebookStatus` / `PricebookSubtype` / `PricebookLabel` with this build:
  production has one `PriceBookItem` model and one `confirmed` flag across
  all five types.
- Taxability is lopsided here — 48 of the 50 active products are taxable,
  the two exceptions being pass-through freight and the warranty part. That
  is the domain (a part sold to a client is taxable where labor often is
  not), not a data gap.
- The sidebar's Pricebook stack now holds TWO pages and stays open for
  either; the Labor page's title selector navigates to Products and back
  (the Invoices ↔ Credit notes rule). Two new stories, DesktopProducts /
  MobileProducts, and a `products` section in `measure-filters.mjs`.

**The REMAINING THREE PRICEBOOK LISTS (2026-09-16, Daniel: "Add 'Other',
'Discounts' and 'Tax rate' tables and filters")** — built against his three
canvases (Other 15059-64482, Discounts 15058-63980, Tax Rates 15059-64984)
after investigating the three types in production. With them the Pricebook
stack is complete: five lists, no display-only items left in the sidebar.

- **The SHARED PAGE.** Three more copies of the 450-line pricebook page would
  have been the third, fourth and fifth, so the shell moved into
  `pricebookList.tsx` and Labor and Products were folded in with them. The
  measure suite is what made that safe: the labor and products sections pass
  unchanged, which is the proof the fold was verbatim. A pricebook list is
  now a data door, a column registry, a filter registry and one config
  object.
- **OTHER and DISCOUNTS share one table and one filter module.** They are one
  production shape (`ChargeItem`), so the table takes `withCost` and
  `amountLabel` and the filter registry takes a `variant`. Other's seven rows
  are every one a shared TEMPLATE — the first pricebook list with nothing of
  its own. Discounts has FIVE: no Cost and no Taxability (production offers a
  discount neither), and its own **Discount** filter in place of the Price
  template. The two menus were identical when first built, which is what
  produced three of the review's flags; Daniel pruned them the same day.
  PRICE was promoted into `filterTemplates` for Other and Products; Labor
  keeps its own "Rate", the same field under a different name.
- **The DISCOUNT kind** — the SIXTH amount unit (section 15416-61777),
  brought by the Discounts list's own filter when Daniel renamed it from
  "Price". It compares **magnitudes**, not signed values: a discount is
  stored negative, so comparing the signed number would make "at least $500"
  mean the SMALLEST discounts. `Math.abs` is taken inside `discountFilter`,
  once, so no registry can forget it.
- **THE SIGN LIVES IN THE COLUMN, NOT THE FILTER** (Daniel, 2026-09-16,
  after he asked how to make the conditions read naturally). The filter was
  first built with the node's negative presets and a "– $" Custom prefix,
  and it read badly: a minus and a comparison word fight each other, because
  "at least -$500" literally means "≥ -$500", which on a number line is the
  smallest discounts. Three ways out were put to him — drop the minus from
  the filter, keep it and reword the conditions to "of at least / of at most
  / of exactly", or flip to true signed comparison and reverse the list. He
  took the first: the ten presets are "$100" through "$5,000", the Custom
  field is prefixed plain "$", and the conditions stay the shared ones, so
  "Discount at least $500" is unambiguous with no vocabulary of its own. The
  filter's NAME carries the sign. The COLUMN keeps it, because a column
  reports the stored value where a filter asks about its size — and it is
  drawn with the true MINUS SIGN (U+2212), not the hyphen the currency
  formatter emits: Inter carries it (no fallback risk), and at 0.662em
  against the digit's 0.631em it lines up in a right-aligned money column
  where the hyphen (0.460em) sits short and low. `formatCurrency` swaps it
  in for every list; Discounts is the only one with negatives to show.
- **The PERCENT kind** — the fifth amount unit after duration, money and
  count, brought by the Tax rates list's own filter (section 15368-50064,
  whose frame annotation links the shared Amount doc): `PERCENT_PRESETS` (the
  node's nine rows, 0% through 20%), `percentFilter`, `formatPercent`
  ("8.63%", trailing zeros dropped), and the "%" SUFFIX on the Custom
  dialog's field where money carries a "$" prefix. One preset table and one
  formatter, no new branch — what the machinery was shared for.
- **"0%" is a plain numeric preset, not a `complete` one.** A 0% rate is a
  real rate a workspace writes ("Tax exempt" is one of the demo's four), so
  "at least 0%" honestly means every rate. The Series list's "None" is the
  other case, where zero is an absence.
- **db** — `ChargeItem` + `TaxRateItem`, five new reference tables
  (OTHER_SUBTYPES / OTHER_LABELS / DISCOUNT_SUBTYPES / DISCOUNT_LABELS /
  TAX_RATE_LABELS, all INVENTED like every list's), and 52 rows: OTHER 22
  (18 active — 14 confirmed + 4 review — and 4 inactive), DISCOUNTS 16 (13 /
  3), TAX RATES 15 (12 / 3). The four workspace tax rates are the SAME
  records the Clients list reads for its "Default tax rate" filter, derived
  by id — the LABOR_ITEMS ⊇ SERVICES arrangement, so a rate cannot disagree
  between the two places. Production's rules are respected in the data: a
  discount's price is zero or negative, and it carries no cost and is never
  taxable.
- **A REAL BUG, caught in the browser.** `CustomDialog` falls through to the
  DATE dialog, so the new `percent` kind opened a calendar under the title
  "Tax rate" until it was added to the number branch. TypeScript could not
  catch it — `def.kind` is a string union and nothing forces that branch to
  cover every amount kind. The `amount` measure section now guards it, along
  with the no-label rule below.

**The AMOUNT dialog's single value lost its LABEL (2026-09-16, Daniel:
"Remove the label from the 'Amount' type filter when it's a single value")** —
node 13923-24049 draws the Input with `header: false`, where the RANGE frame
keeps `header: true` on both ends. So the single field is bare and a range
still labels From and To. It retires the 2026-09-15 unit-word relabel
("Duration" / "Amount" / "Number"), for the reason the MFG dialogs already
had: the dialog's title names the field, so a label under it only repeats it.
The field keeps the filter's name as its aria-label.

**The FREEFORM reorganisation (2026-09-16, Daniel: "Reorganise 'Address'
filter type. I call it 'Freeform' now")** — the taxonomy change, mirrored:

- The KIND `address` is **`freeform`** (section 14100-36446, renamed): it
  serves ANY freeform filter — address, name, etc. — and "does not define
  what inputs and how many the filter uses". The def does, through the new
  `FilterDef.freeformFields` ({key, label, half?} — consecutive `half`
  fields share a desktop row); the kind brings the dialog shell (titled
  with the filter's name, Apply gated until something is typed — the
  section's own annotation now, no longer invented), the contains /
  does-not-contain pair, and the chip copy (`FilterDef.freeformSummary`
  overrides the default filled-fields-joined-", " wording).
- `FilterValue.address` (the fixed five-field `AddressValue`) became
  `FilterValue.freeform` (`FreeformValue = Record<string, string>` over the
  def's keys); `addressFilter` became `freeformFilter(fields)` — each field
  carries its own `read`, every filled field must substring-match (the
  standing 2026-08-24 / 2026-09-14 rules, unchanged); `AddressCustom`
  became the generic `FreeformCustom` (the scss classes renamed with it).
- ON TOP of the kind, TWO template filters in filterTemplates: **Location
  address** (14947-21952; the row's LOCATION — labelled "Address" until
  later the same day, see the rename below) and **Billing
  address** (14947-34564; label "Billing address", the row's own
  `billing_*` parts) — the Vendors and Clients registries dropped their
  identical local copies for `billingAddressTemplate`. `AddressParts`, the
  five-field shape and `addressSummary` (the "[street], [suite], [city],
  [state] [postal]" chip format — the two sections' own Value annotation)
  moved from filterKinds into filterTemplates with them.
- Behaviour is UNCHANGED end to end — the new `freeform` measure section
  proves it on the real dialog (fields render from the def, the half row,
  the Apply gate, the applied chip).

**The "Location address" rename (2026-09-16, Daniel)** — two changes on top
of the reorganisation above:

- The **Address** filter is **"Location address"** now: the name says whose
  address is matched, the way its twin "Billing address" always did.
  `addressTemplate` is `locationAddressTemplate`; the `FilterId` stays
  `"address"` (internal, and Billing address shares it — the two never sit in
  one registry). Because every menu is ALPHABETICAL (node 13857-25352), the
  rename MOVED it: it was the FIRST row of every menu and now follows
  **Location**, in all four registries that carry it (Jobs, Estimates,
  Invoices, Series). FLAGGED: the four menu NODES still draw "Address" first.
- The **"(optional)" label condition is gone** from every freeform field —
  Location address and Billing address were the only filters that had it
  (the one-field defs draw no label at all). Every field of a freeform
  filter is optional, so the word sat on all five at once and said nothing.
  The measure section asserts its absence.

## 7. Open flags for Daniel

Still open:

- **The Labor list (2026-09-16), its flags**: the labor SUBTYPES and LABELS
  are invented tables; the search field set beyond production's three is my
  choice; the Status column width is the DS-standard 176 where production's
  pricebook State sits at 128; and the menu node's Est. Duration annotation
  still links the JOBS doc (14267-33380) instead of the list's own section
  (15339-20649).

- **Other / Discounts / Tax rates (2026-09-16), the design review.** Daniel
  answered all eighteen numbered items the same day and FIXED six of them in
  Figma; the build was updated to match (see §6). What he changed:

  - **Discounts lost its Cost and Taxability rows** — production offers a
    discount neither — and its **Price row became "Discount"**, the list's own
    object-specific filter over ten NEGATIVE presets (section 15416-61777).
    The amount COLUMN is headed "Discount" with it, so the design, the build
    and production agree.
  - **Tax rates lost its Subtype row**, and its menu is alphabetical in the
    node now.
  - **The five pricebook templates moved to the shared Filter Template
    page** (Cost, Price, Pricebook Status, Subtype, Taxability), where the
    code already had them — so the Figma taxonomy and the module map agree
    again.

  Still OPEN, and all of them decisions rather than defects — he noted each:

  1. **Column ORDER is this prototype's, not production's.** Status sits
     second on all five pricebook lists; production's own configs disagree
     with each other (misc puts Subtype first, discounts the other way
     round), so there was no single order to follow.
  2. **Products has no Summary column** — production's own choice for the
     parts type, where the other three list it.
  3. **Two column widths differ**: Tax rate 144 (production 128) and Stock
     128 (production 112). Every numeric column here is 144, and headers
     carry a sort affordance.
  4. **The Custom dialog takes whole numbers** for percent and discount, like
     money — so "is 8%" does not match the 8.63% rate. Presets and at least /
     at most work against the real value.
  5. **The reference tables are INVENTED** (subtypes and labels for all
     three types), and the keyword search's fields beyond production's three
     are my choice.
  6. **"Other" vs "Others"** — his open question. Recommendation in the
     session notes: keep **Other**; "Others" reads as "other people" in
     English, and a catch-all bucket is conventionally singular. If plural
     symmetry with its siblings matters, the honest plural is "Other
     charges", which is what the list's own counts already say.
  7. **Production's own four defects**, untouched here and worth tickets:
     the discount sign-error message is the copy-pasted non-discount text
     ("may not be a negative number" for a POSITIVE price); `item_code`'s
     prefix map has no `tax` entry (a latent KeyError nothing reaches);
     the Miscellaneous view's default sort is `description` where its own tab
     requests `confirmed,description`; and the Miscellaneous Cost cell passes
     `default_unit_type_label`, which is service-only and always null there.

- **The Products list (2026-09-16), its flags**: the COLUMN ORDER keeps
  Status second where production's parts config puts Subtype first and
  Labels early (the two pricebook lists would otherwise read differently
  side by side — say the word if production's own order should win); there
  is **no Summary column**, production's own choice for parts, though the
  field and the keyword search keep it; **Stock is 128** where production
  has 112 (Daniel's CellBody examples are drawn at 128); the product
  SUBTYPES and LABELS are invented tables; the search field set beyond
  production's three (the manufacturer pair and the status label) is my
  choice; and a **Preferred vendor** filter is unbuilt by his ruling, even
  though production stamps `preferred_vendor` on every part created from a
  PO — worth revisiting if a Preferred vendor column ever ships.
  Four filters now live in `filterTemplates` whose Figma SECTIONS still sit
  on the Labor canvas (Cost, Status, Subtype, Taxability): if they should
  become sections of the shared Filter Template page, nothing in the code
  moves.

- **The Clients list (2026-09-16), its flags**: the **Outstanding balance
  cell does NOT escalate** when it exceeds the Credit limit — production's
  deleted "Balance Due" column painted exactly that red (`isAlerting` when
  `outstanding_balance > credit_limit`, removed 2025-06 for performance),
  no node here draws it, and Daniel has not asked; one comparison away
  (Bayside is the over-limit story if it comes back). The **Bills to cell
  copy diverges from production on purpose** (his filter words over "This
  Client" / blank). **`creditBalance` is STORED, not derived** (allocations
  not modelled; curated to roughly agree with the issued credit notes).
  The **client labels and tax rates are INVENTED tables** (production's are
  company-written). The keyword search's field set is my choice beyond
  production's four.

- **The Invoices list (2026-09-14), its flags** (the build itself is in §6):
  **"Amount due" is written out** where production abbreviates "Amt. Due"
  (and the column is 144 for it, not production's 128); the per-transition
  date columns (Sent / Paid / Voided / Forgiven dates) are left out like the
  estimates'; the keyword search's field set is my choice (id, client,
  service, location, status label — no node names one); and the db's
  **invoice labels are invented** (production `InvoiceLabel` is
  company-written, so there was nothing to copy). (CLOSED later the same
  date, when the filters arrived: the inert Filters button, the empty mobile
  count, and the view tabs not being locked Status filters — all three were
  the no-filters state.)
- **The DS SelectList's width-freeze had an infinite-loop bug, fixed
  2026-09-14** (found while testing the Invoices mobile filters, but it
  crashed EVERY mobile list page): the measuring layout effect ran on every
  commit and called `setFullWidth` unconditionally; a setState from a layout
  effect while the fiber has pending work cannot take React's same-value
  bail-out, so opening the mobile VIEW SELECTOR (the one inline SelectList
  that stays mounted while `open` flips) hit "Maximum update depth exceeded".
  The fix mirrors the width in a ref and only calls setState on a real
  change (`holdFullWidth` in SelectList.tsx). The freeze behaviour itself is
  unchanged — the stability section still passes.
- **A right-aligned column must SAY so twice**: the cells right-align by
  `content="number"`'s default, but `CellHeader` has no such default — it
  aligns left until the registry passes `align: "right"`
  (`TableColumnDef.align`, added 2026-09-14 when the money headers sat left
  over right cells). CellHeader already receives the column's `dataType`,
  so a DS-side default (numerical → right) would remove the double-say —
  a DS decision, flagged, not made.

(CLOSED 2026-09-14 — the Jobs menu node `14032-20321` was re-read row by row
and it now MATCHES the build: `calendar-arrow-down` on Date received,
`hourglass` on Est. duration, `pen` on Last modified, `calendar-day` on
Scheduled for, `arrow-left-arrow-right` on Status changed. The three icons that
were behind are updated. The ESTIMATES menu node matched already.)
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
(CLOSED 2026-09-14 — both Down payment flags. Node `14293-45034` now reads
"Not paid" like the column, and node `14293-45042` DOES draw the `minus` in its
value segment, so the chip and the build agree. The earlier note that the node
had no icon was wrong.)
- (CLOSED 2026-09-14 — **sub-statuses**, both halves. The db carries them:
  `JOB_SUB_STATUSES` mirrors production's `JobSubStatus`, a company-written
  table of named reasons each belonging to ONE status, and only the paused /
  on-hold statuses can carry one; `Job.subStatusId` holds it, `subStatusOf(job)`
  reads it, six reasons on the six jobs that qualify. And they SHOW (Daniel:
  "the status should show the sub-status name if it's set. The Status filter
  SelectList also should show the exact sub-status names if sub-statuses
  exist"):
  the Status COLUMN's badge prints the sub-status name and keeps the status's
  colour and icon — a job on hold for parts is still on hold — through the new
  optional `label` on the DS status badge (`createStatusBadge`), which exists
  for exactly this and defaults to the status's own label;
  the Status FILTER replaces a status's row with its sub-statuses' rows where
  any exist (`SUB_STATUSES_BY_STATUS` in `jobsFilters`), keeping the status's
  icon on each, and `matches` tests the option id against BOTH `job.status` and
  `job.subStatusId` — the two id sets cannot collide.
  a VIEW that locks such a status ticks its sub-statuses in the locked chip's
  read-only list, and counts them — "In progress" locks Active + Quick-paused
  and reads "3 statuses" (Active · Lunch break · Pulled to another call), "On
  hold" reads "4 statuses". `lockedStatusOptionIds` in `jobsFilters` is the
  expansion; the page still FILTERS on the view's own statuses, which is a
  different list and stays as it was.
  FLAGGED, and only production can hit it: a job whose status can carry a
  sub-status but carries NONE has no row of its own any more, because the
  generic row was replaced. Every such job in the demo has one. If a workspace
  can leave it empty, that status needs to keep its generic row alongside.)
- Labels "No labels" + a label under the default "include all of" matches
  nothing (correct, but reads as a dead end). **Left as it is on purpose**
  (Daniel, 2026-09-14: "keep the labels as they are for now"). The proposal on
  the table, if it comes back: make "No labels" EXCLUSIVE in the list — ticking
  it clears the real labels and ticking a real label clears it — so the
  combination that can never match cannot be built.
- The Location row's address includes the unit; the table's Location address
  column does not — each follows its own node.
- (CLOSED 2026-09-14 — **the no-match block.** It is the DS `EmptyState` in its
  CAPTION-ONLY form on all four surfaces (Daniel: "use this component for the
  Filters menu"), ending the two-day plain-text trial. What settled it: the View
  menu's Column list got the same state DRAWN as an EmptyState instance (nodes
  14767-81877 / 14767-81874), so the picture and the component were never in
  conflict. The component brings the centring, the border-box `height: 100%`
  that centres the line in the mobile sheet, and the caption's body/400 compact
  `--text-subtle`; `.noMatches` overrides nothing but the padding, 16px against
  its own 32 (that one is for the block state, an icon and a title above the
  line). The COPY is the Column list's too — "No matches" (Daniel, same day),
  so one wording covers every no-match surface. Measured after: desktop menu and option list both 52px tall — 16 + a
  20px line + 16 — and the mobile sheet's line sits at 341px above / 341 below
  in a 701px body. The DS's own no-results default is still the icon-title-
  caption block, which the other consumers take.) All four nodes draw one centred line in the card's own body: 16px
  around it, body/400 compact, `--text-subtle`. It still goes through
  `SelectList.noResultsState`, whose DS default is the EmptyState block — if
  this trial is kept, that default is worth revisiting.
  The mobile line centres in the full-height sheet, as its nodes draw it: the
  two boxes between the sheet's body and the line (`Menu`'s `[role="menu"]`
  and the Add-filter section's own) pass the height down — see `.menuFillBody`.
  A percentage height stops at the first box that sizes to its content, which
  is why it sat at the top at first.

- (CLOSED 2026-09-14 — **`CellBody`'s colour schemes and the icon.** Daniel
  rewrote the doc page's rule (node `29284-19562`): "Supports several color
  schemes. The icon inherits the color unless it's different from the default
  one." So EVERY scheme paints the left slot now, `default` included — it used
  to be the one exception. The mechanism is plain inheritance, a `color` on the
  slot and never a colour forced onto the glyph, which is what makes the
  "unless" work: an icon given a colour of its own keeps it (measured — the
  urgent priority glyph stays orange while every other cell icon takes
  `--text-strong`). `CellBody.mdx` carries the new sentence.)
- (CLOSED 2026-09-14 — **`ListItem` has no caption placeholder.** It has one
  now: `captionPlaceholder` on `ListItemTextLeft` → `ListItemText` →
  `ListItemContent` → `ListItem`, shown instead of `caption` when there is no
  value, in `--text-placeholder`, the copy doc's standard empty behaviour —
  the same prop and the same rule `SelectListItem` got on 2026-09-12. Story
  `CaptionPlaceholder` and a "Placeholder" section in `ListItem.mdx`.)

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
  Filter Template page; the node was re-read to confirm. (Superseded
  2026-09-16 by the Freeform reorganisation: the kind is Freeform, and
  Address / Billing address are its two template filters — see §6.)
- ~~`jobsData.ts` owns shared formatters~~ — they are in `listData.ts`, and no
  shared module imports `jobsData` any more.
- ~~`countLabel` is hard-wired to "job"~~ — deleted. A registry builds its own
  option tags with `countOf(noun, n)`; see `FilterDef.optionTags`.
- ~~The two table modules duplicate their scaffolding~~ — shared as
  `listTable.tsx`, generic over the row, ready for the third list.

## 8. How to verify nothing regressed

`npx tsc --noEmit` after every step, and:

```bash
npm run screenshot prototypes-filters      # 6 stories
node scripts/measure-filters.mjs           # needs Storybook on :6006
```

`measure-filters.mjs` checks the things that broke repeatedly. Expected, with
the current data:

- **freeform** (its own measure-filters section) — the Jobs Location address
  dialog renders the def's five fields with PLAIN labels (no "(optional)"
  condition since 2026-09-16), State / Postal share the desktop half-row,
  Apply stays disabled until a field is filled, and applying "City contains
  San Francisco" filters 72 → 66 with the chip reading "Location address ·
  contains · San Francisco".
- **Jobs list widths** — NO floor anywhere since 2026-09-17 (see Widths
  above); every list hugs its own rows. Assignee 208, Client 209,
  Est. duration 216, Labels 222, Last modified 154, Location 384,
  Location address (dialog), Priority 154, Received 154 (the RENAMED
  "Date received"), Scheduled for
  156, Service 291, Source 231, Status 256 (the sub-status rows — see the
  Status bullet), Status changed 154, Type 127. **Nothing clipped.**
  (Est. duration was above the retired floor already, because its header chips — "at
  least" / "at most" / "is" — are what it hugs to; the node draws 218.)
- **Placement** — every sub-list **4–5px** from its row, no overlap with
  the menu, nothing offscreen. (4 exactly, ± the half-pixel `offsetWidth`
  rounding — see Widths.)
- **Stability** — each list holds its width while typing in its own search.
- **Menu** — 191px on Jobs: the card hugs its rows, above Menu's own 160
  minimum (it was 208 on the retired floor), and holds that width while typing.
- **Estimates** — the menu lists exactly Client, Down payment, Expires,
  Issued, Labels, Last modified, Location, Location address, Seen, Service,
  Status, Status changed, Total.
- **Status** — its list is 256 wide and its rows are the SUB-STATUS names where
  a status has any: Draft · Unscheduled · Upcoming · Past due · Active ·
  Lunch break · Pulled to another call · Waiting for parts · Waiting for client
  approval · Waiting for a tech · Quote in progress · Completed.
- **Invoices** (its own measure-filters section since the filters arrived) —
  the menu lists exactly Amount due, Client, Due date, Issued,
  Labels, Last modified, Location, Location address, Seen, Service, Status,
  Status changed, Total; Status offers the open four (Draft · Unsent · Outstanding ·
  Overdue) and applies on the derived Overdue; Due date offers Overdue over
  the six future windows (no absence row; the Overdue WINDOW lists 10 where
  the status slice is 9 — the stale-pending nuance, see §6) and its preset
  chip carries no condition box; Amount due offers the money presets and
  applies; the Pending view locks "Status is any of 2 statuses".
  List counts with the current data: Open → All 36, Pending 13 (Draft 4 +
  Unsent 9), Outstanding 14, Overdue 9; Closed → All 27, Paid 18, Voided 5,
  Forgiven 4. Headers in order: ID · Client · Status · Amount due · Total ·
  Service · Location name · Location address · Labels · Issued · Due date ·
  Status changed · Last modified · Seen — nothing clipped. Default sort Due
  date (asc open / desc closed); the View menu edits columns, sort and the
  Table/Cards switcher (Cards disabled).
- **Credit notes** (its own measure-filters section, `creditnotes`) — the
  OPEN menu lists exactly Client, Issued, Labels, Last modified, Status,
  Total (six — no Type); the CLOSED menu adds Type as the seventh row.
  Status offers Draft · Unsent open (Issued · Voided closed) and applies
  (Unsent: 8 → 5); Type offers Pre-payment · Post-payment · Mixed at the
  208 floor and applies on the closed branch (Pre-payment: 20 → 9). The
  open phase has ONLY the All view (Pending is gone); Issued locks "Status
  is Issued". List counts with the current data: Open → All 8 (Draft 3 +
  Unsent 5); Closed → All 20, Issued 15, Voided 5. Headers in order: ID ·
  Invoice ID · Client · Status · [Type, closed only] · Labels · Total ·
  Issued · Last modified. Default sort Issued (asc open / desc closed);
  the View menu edits the PHASE's own columns, sort and the Table/Cards
  switcher (Cards disabled).
- **Bills** (its own measure-filters section, `bills`) — the OPEN menu lists
  exactly Billing vendor, Due date, Issued, Labels, Last modified, Received,
  Status, Total (eight — no Status changed); the CLOSED menu adds Status
  changed between Status and Total. Status offers Draft · Outstanding ·
  Overdue open (Paid · Voided closed) and applies on the derived Overdue
  (All Open: 21 → 7); Billing vendor lists the ten vendors A to Z and
  applies (Pacific Refrigeration Parts: 21 → 3); the open views are All ·
  Draft · Outstanding · Overdue (DRAFT, renamed from production's Pending),
  and the Draft view locks "Status is Draft" ALONE — no Unsent anywhere.
  List counts with the current data: Open → All 21, Draft 4, Outstanding
  10, Overdue 7;
  Closed → All 23, Paid 19, Voided 4. Headers in order: ID · Billing
  vendor · Vendor invoice ID · Status · Labels · Total · Issued · Received
  · Due date · [Status changed, closed only] · Last modified — nothing
  clipped (Vendor invoice ID needs its 192; it clips at 176 while pinned).
  Default sort Due date (asc open / desc closed); the View menu edits the
  PHASE's own columns, sort and the Table/Cards switcher (Cards disabled).
- **POs** (its own measure-filters section, `pos`) — the menu lists all
  SIXTEEN on BOTH phases: Amount, Associated estimates, Associated
  invoices, Associated jobs, Est. arrival, Issued, Items, Labels, Last
  modified, Payment terms, Purchasing vendor, Seen, Shipping carrier,
  Shipping method, Status, Status changed. Status offers the open seven
  (Draft · Unsent · Sent · Acknowledged · In transit · Unstocked · Unpaid)
  and applies (Sent: 32 → 5); Shipping carrier offers all 19 presets + the
  2 customs ("Local courier", "Presidio van") under "No carrier" and
  applies (none: 32 → 6); Shipping method offers No method · 2 Day Air ·
  Ground · Next Day Air · Next Day Early AM · Same day and applies
  (Ground: 32 → 14); Est. arrival offers No arrival date · Late · the six
  future windows · Custom, applies (Late: 32 → 8) and its window chip has
  no condition box; Payment terms offers No payment terms · Same Day ·
  Net 15 · Net 30 · Net 45 · Net 60 and applies (Net 30: 32 → 10);
  Associated jobs offers None · Has any, applies (None: 32 → 19) and its
  chip has NO condition box; Items offers None over the 1 → 50 ladder and
  applies (at least 5: 32 → 18). List counts with the current data: Open → All 32, Pending 6
  (Draft 3 + Unsent 3), Open 10 (Sent 5 + Acknowledged 5), In transit 6,
  Delivered 5, Stocked 5; Closed → All 16, Paid 13, Cancelled 3. Headers
  in order: ID · Purchasing vendor · Status · Labels · Items · Amount ·
  Est. arrival · Shipping · Tracking number · Payment terms · Issued ·
  Associated estimates · Associated jobs · Associated invoices · Status
  changed · Last modified · Seen — ID + Purchasing vendor pinned. Default
  sort Issued, ASCENDING on every view (production's own; no closed-phase
  flip). The Delivered view locks "Status is Unstocked" (the relabeling on
  a locked chip); the View menu edits columns, sort and the Table/Cards
  switcher (Cards disabled).
- **Series** (its own measure-filters section, `series`) — the menu lists
  all ten: Client, Created at, Location, Location address, Open jobs,
  Recurrence, Series end, Series start, Service, Type; Open jobs offers None over the
  1 · 2 · 5 · 10 · 20 · 50 ladder and "Custom..." and applies (at least 5:
  18 → 2; None: 18 → 4, its chip without a condition box); Type offers
  Upfront · Rolling and applies (Upfront:
  18 → 4); Recurrence offers Daily · Weekly · Monthly · Yearly and applies
  (Weekly: 18 → 7); Series end offers No end date · the six future windows
  (no past row) — "No end date" lists the 11 open-ended series and its
  chip carries no condition box; the derived phases hold 18 open / 6
  closed. Headers in order: Service · Client · Location name · Location
  address · Type · Series start · Series end · Recurrence · Open jobs ·
  Created at — nothing pinned, no ID column. Default sort Series start
  (asc open / desc closed) with the created-at tie-break.
- **Vendors** (its own measure-filters section, `vendors`) — the menu lists
  all eight: Billing address, Bills via, Commitments, Current POs, Labels,
  Last modified, Payables, Payment terms; Bills via offers "Same vendor"
  over the twelve vendors A to Z and applies (Same vendor: 9 → 7); Current
  POs offers its OWN denser ladder — None · 1 · 2 · 3 · 4 · 5 · 10 · 15 ·
  20 — and applies (at least 5: 9 → 1,
  Sequoia); Commitments offers the eight money presets and applies (at
  least $2,500: 9 → 5 — the five-status sum); Payables applies (at least
  $1,000: 9 → 7); Payment terms offers No payment terms · Same Day ·
  Net 15 · Net 30 · Net 45 · Net 60 and applies (No payment terms: 9 → 1,
  Mission Electric); the phases hold 9 active / 3 inactive with one "All"
  view each. Headers in order: Vendor · Account ID · Billing address ·
  Labels · Payment terms · Bills via · Current POs · Commitments ·
  Payables · Website · Last modified — Vendor pinned. Default sort Name,
  ascending on both phases.
- **Labor** (its own measure-filters section, `labor`) — the ACTIVE menu
  lists all nine: Cost, Est. duration, Labels, Last modified, Rate, Status,
  Subtype, Taxability, Unit type; the INACTIVE menu drops Status (the
  phase rule). Status is SINGLE-select (Review · Active, circle-small dot
  rows) and applies (Review: 35 → 8); Est. duration offers "No est.
  duration" over the four hour presets and applies (35 → 14 — the six
  duration-less catalog items + all eight review rows); Subtype offers "No
  subtype" over the six subtypes A to Z and applies (35 → 9); Taxability is
  Taxable 35 → 15; Unit type is Hourly 35 → 17; Rate at least $250 35 → 9;
  Cost at least $100 35 → 2. The phases hold 35 active (27 confirmed + 8
  review) / 5 inactive; Active views All · Review · Confirmed — the
  Confirmed view locks the fixed chip "Status is Active" (the tab named
  "Confirmed", the status named "Active" — Daniel's decision) and lists 27.
  Headers in order: Short description · Status (Active phase only) ·
  Subtype · Summary · Cost · Rate · Est. duration · Labels · Last
  modified — Short description pinned (288 wide since Daniel's build
  review — production's 224 clipped the catalog names), Cost BEFORE Rate
  (production's columnOrder). Default sort: status-then-name on the ACTIVE
  All view (production's `confirmed,description` — Review floats up), name
  A-Z everywhere else — the Inactive All included, deliberately diverging
  from production's two-key default there: its Status column is hidden, a
  default on an unoffered column mis-renders the View menu's Sort-by row,
  and with every inactive row confirmed the order is name A-Z either way.
- **Clients** (its own measure-filters section, `clients`) — the menu lists
  all fourteen; Type is Individual applies (11 → 2, Ferry + Marisol);
  Industry offers "No industry" over the fixed four and applies (11 → 2);
  Bills to offers Same client · Location over the fourteen clients A to Z
  and applies (Same client: 11 → 2, Ferry + North Point); Credit limit
  offers the ABSENT "No credit limit" over the eight money presets and
  applies (11 → 6); Available invoice credit applies (at least $250:
  11 → 3); Outstanding balance's "No balance" finds the four invoice-less
  new clients (11 → 4); Locations offers None over the denser ladder and
  applies (None: 11 → 1, Marisol's); Default payment terms offers "No
  default" over the values in use and applies (11 → 1, Mission); Default
  estimate expiration offers "No default" · 7 · 14 · 30 days; Default tax
  rate applies (Tax exempt: 11 → 1, Civic Center Grill); the phases hold
  11 active / 3 inactive with one "All" view each. Headers in order:
  Client · Type · Industry · Labels · Locations · Bills to · Billing
  address · Default payment terms · Default estimate expiration · Default
  tax rate · Credit limit · Outstanding balance · Available invoice
  credit · Created at · Last modified — Client + Type pinned. Default sort
  Client name, ascending on both phases.

Never kill Daniel's Storybook; reuse the running one on :6006.
