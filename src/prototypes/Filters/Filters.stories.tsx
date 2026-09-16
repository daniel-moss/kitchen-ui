import type { Meta, StoryObj } from "@storybook/react";

import Filters, { FiltersProps } from "./FiltersPrototype";
import { PhoneViewport } from "../../stories/helpers";

const meta: Meta<FiltersProps> = {
  title: "Prototypes/Filters",
  argTypes: {
    breakpoint: { table: { disable: true } },
    initialPage: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<FiltersProps>;

/**
 * Desktop shell (Figma node 13889-19457). Concept 2 with no job counts: the tabs
 * are labels only. They stay the DS TabGroup's `default` kind — 36px pills, 2px
 * apart, the selected one on a soft `--gray-a3` fill. [Open · Closed] sits in
 * the TOP BAR, 16px after the "Jobs" title; the view bar below holds the status
 * tabs — [All · Pending · Scheduled · In progress · On hold · Completed] — plus
 * Search, Filters and View on the right.
 *
 * Every status tab applies a LOCKED Status filter, which shows as the first chip
 * in the filter bar. Its value can be opened to see which statuses are on, but
 * every option in that list is disabled: the tab owns the filter.
 */
export const Desktop: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    // PhoneViewport (not a bare 100vh div) so iPad standalone works: it strips
    // Storybook's body margins and publishes the safe-area vars the shell reads.
    // On a desktop browser it is a plain full-viewport block.
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" />
    </PhoneViewport>
  ),
};

/**
 * Mobile shell (Figma nodes 13889-19548 and 13897-21009). The top bar carries
 * the title and the [Open · Closed] pill tabs, and keeps the DESKTOP create
 * control — the solid "New" Button (Daniel, 2026-08-18). The view bar below
 * is the DS `TopBarView`: its view selector on the left — the tab's name and
 * a chevron, no icon and no count — opens the tabs as one flat inline list.
 *
 * The one count left is on the Filters button: how many filters are applied,
 * counting the tab's own Status filter — the component draws it as the ghost
 * Button's plain label. With none applied it is the plain square IconButton.
 * Tapping it opens the Filters `Menu` as a drawer (Figma node 13857-25343).
 */
export const Mobile: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" />
    </PhoneViewport>
  ),
};

/**
 * The ESTIMATES list (2026-09-11): the same shell opened on the Estimates
 * page — production's phases and views (Open: All · Pending · Sent ·
 * Approved; Closed: All · Won · Lost · Cancelled) over the production
 * All-Open column set. No filters yet — just the list with the View menu,
 * which has NO Schedule horizon row and NO Timeline view (both are jobs-only).
 * The desktop sidebar's "Estimates" / "Jobs" items switch pages either way;
 * this story just lands on Estimates directly.
 */
export const DesktopEstimates: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="estimates" />
    </PhoneViewport>
  ),
};

/**
 * The Estimates list in the mobile shell. The bottom bar has no Estimates
 * item (the design's bar is Home · Jobs · Create · Search · Menu), so no item
 * is active here and "Jobs" navigates back to the Jobs list.
 */
export const MobileEstimates: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="estimates" />
    </PhoneViewport>
  ),
};

/**
 * The INVOICES list (2026-09-14): the same shell opened on the Invoices page —
 * production's phases and views over the production column set, the working
 * View menu (like Estimates: NO Schedule horizon row and NO Timeline view),
 * and since the same day its THIRTEEN filters, read off Daniel's Invoices
 * Figma page (14300-52150): eleven shared templates — Due date built with
 * this registry — plus the list's own Status and Amount due. Every view but
 * the two Alls locks a Status filter, the other pages' rule. The sidebar's
 * Invoices stack navigates here.
 */
export const DesktopInvoices: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="invoices" />
    </PhoneViewport>
  ),
};

/**
 * The Invoices list in the mobile shell. Like Estimates, the bottom bar has no
 * Invoices item, so no item is active here and "Jobs" navigates back to the
 * Jobs list.
 */
export const MobileInvoices: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="invoices" />
    </PhoneViewport>
  ),
};

/**
 * The CREDIT NOTES list (2026-09-14): the same shell opened on the Credit
 * notes page — the views and filters read off Daniel's Credit Notes Figma
 * page (14759-68515) over the production column set. Views: Open holds
 * All / Pending (Pending locks Draft + Unsent), Closed holds All / Issued /
 * Voided. SEVEN filters — five shared templates plus the list's own Status
 * and Type (`shapes`, multi-select: Pre-payment / Post-payment / Mixed). The
 * sidebar's Invoices stack and the Invoices page's title selector both
 * navigate here.
 */
export const DesktopCreditNotes: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="creditNotes" />
    </PhoneViewport>
  ),
};

/**
 * The Credit notes list in the mobile shell. Like Estimates and Invoices, the
 * bottom bar has no item for it, so no item is active here and "Jobs"
 * navigates back to the Jobs list.
 */
export const MobileCreditNotes: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="creditNotes" />
    </PhoneViewport>
  ),
};

/**
 * The POs list (2026-09-15): the same shell opened on the Purchase orders
 * page — the buying side of the vendor relationship. Views: Open holds All /
 * Pending / Open / In transit / Delivered / Stocked, Closed holds All / Paid
 * / Cancelled (the Figma POs section 14817-88566 — production's nine tabs
 * one for one; a view lists POs by the badge status, and production's
 * relabeling holds: Delivered shows Unstocked, Stocked shows Unpaid).
 * FOURTEEN filters — five shared templates plus the list's own nine,
 * including the presence-only Associated trio (None / Has any), the
 * values-in-use Shipping and Payment terms lists, and the count-kind Items.
 * Status changed is on BOTH phases and replaces production's seven
 * per-status date columns. The sidebar's top-level "Purchase orders" item
 * navigates here; the page title says "POs".
 */
export const DesktopPOs: Story = {
  // Explicit: the auto-name splits the acronym ("Desktop P Os").
  name: "Desktop POs",
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="pos" />
    </PhoneViewport>
  ),
};

/**
 * The POs list in the mobile shell. Like the other non-Jobs lists, the
 * bottom bar has no item for it, so no item is active here and "Jobs"
 * navigates back to the Jobs list.
 */
export const MobilePOs: Story = {
  name: "Mobile POs",
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="pos" />
    </PhoneViewport>
  ),
};

/**
 * The BILLS list (2026-09-15): the same shell opened on the Bills page — the
 * accounts-payable side, the first list whose rows hang off VENDORS instead
 * of clients. Views: Open holds All / Draft / Outstanding / Overdue, Closed
 * holds All / Paid / Voided (the Figma Bill page 14817-83509; "Draft"
 * replaced production's "Pending" tab name when Unsent was ruled out). NINE
 * filters — seven shared templates plus the list's own Status and Billing
 * vendor — with two of Daniel's rulings built in: no Unsent status anywhere
 * (a bill cannot be sent), and Status changed — the column AND the filter —
 * on the CLOSED phase alone (a bill is born outstanding, so only Paid /
 * Voided ever carry a transition date). The sidebar's top-level "Bills"
 * item navigates here.
 */
export const DesktopBills: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="bills" />
    </PhoneViewport>
  ),
};

/**
 * The Bills list in the mobile shell. Like the other non-Jobs lists, the
 * bottom bar has no item for it, so no item is active here and "Jobs"
 * navigates back to the Jobs list.
 */
export const MobileBills: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="bills" />
    </PhoneViewport>
  ),
};

/**
 * The SERIES list (2026-09-14): the same shell opened on the Series page —
 * the views and filters read off Daniel's Series Figma page (14759-72314)
 * over the production column set (JobSeriesTableView: no ID column, nothing
 * pinned, the Recurrence rule as a sentence). The phase is DERIVED — a
 * series is closed when its end has passed — so each branch holds one "All"
 * view and nothing locks a Status filter. NINE filters (Recurrence is not
 * built — Daniel is deciding how it should work), with placeholder icons on
 * Series start, Series end, Created at and Open jobs. Open jobs is the
 * first COUNT filter — the amount machinery over a plain number. The
 * sidebar's Jobs stack and the Jobs page's title selector both navigate
 * here.
 */
export const DesktopSeries: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="series" />
    </PhoneViewport>
  ),
};

/**
 * The Series list in the mobile shell. The bottom bar's "Jobs" item
 * navigates back to the Jobs list; no item is active here.
 */
export const MobileSeries: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="series" />
    </PhoneViewport>
  ),
};

/**
 * The VENDORS list (2026-09-15): the same shell opened on the Vendors page —
 * the supplier DIRECTORY, the first list whose rows are not documents: no
 * status, nothing locked, and the Active / Inactive phase is the one
 * `isActive` flag (each branch holds one "All" view — the Figma "↳ Vendors"
 * page 14831-30339). The table is production's vendors view with the
 * standing rulings; its three NUMBER columns — Current POs, Commitments,
 * Payables — are derived live from the PO and Bill tables, with Commitments
 * on Daniel's five-status formula instead of production's. EIGHT filters —
 * Billing address (the address kind over the vendor's own billing fields),
 * Bills via (with its "Same vendor" absence row), Commitments, Current POs,
 * Payables, Payment terms, plus the Labels and Last modified templates. The
 * sidebar's top-level "Vendors" item navigates here.
 */
export const DesktopVendors: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="vendors" />
    </PhoneViewport>
  ),
};

/**
 * The Vendors list in the mobile shell. Like the other non-Jobs lists, the
 * bottom bar has no item for it, so no item is active here and "Jobs"
 * navigates back to the Jobs list.
 */
export const MobileVendors: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="vendors" />
    </PhoneViewport>
  ),
};

/**
 * The CLIENTS list (2026-09-16): the same shell opened on the Clients page —
 * the customer DIRECTORY, the second directory list after Vendors: no
 * status, nothing locked, and the Active / Inactive phase is the one
 * `isActive` flag (each branch holds one "All" view — the Figma "↳ Clients"
 * page 14947-35514). The table is production's eight columns extended with
 * the client-level properties production does not list — Industry, Billing
 * address, the three defaults, Outstanding balance (derived from invoices
 * the production endpoint's way), Available invoice credit and Created at.
 * FOURTEEN filters — eleven object-specific (Type, Industry, Bills to, the
 * money trio with the first ABSENT amount row "No credit limit", Locations,
 * the three defaults, Billing address) plus the Created at, Labels and Last
 * modified templates. The sidebar's top-level "Clients" item navigates here.
 */
export const DesktopClients: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="clients" />
    </PhoneViewport>
  ),
};

/**
 * The Clients list in the mobile shell. Like the other non-Jobs lists, the
 * bottom bar has no item for it, so no item is active here and "Jobs"
 * navigates back to the Jobs list.
 */
export const MobileClients: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="clients" />
    </PhoneViewport>
  ),
};

/**
 * The LABOR list (2026-09-16): the pricebook's service type (production
 * PriceBookItem, type 1), the first Pricebook page — the sidebar's Pricebook
 * stack navigates here, and the title lists the five pricebook types as
 * sub-pages (only Labor exists). Phases Active / Inactive over `is_active`;
 * the Active phase's views are All / Review / Confirmed over the two-state
 * status (production's boolean `confirmed`; the status is NAMED "Active"
 * while the tab stays "Confirmed" — Daniel's decision), and Review /
 * Confirmed carry a fixed Status chip with the status's circle-small dot in
 * the value slot, exactly as the frames draw them. NINE filters — seven
 * object-specific (Cost `coins` and Rate `money-bill` on the money kind, the
 * list's OWN Est. duration led by "No est. duration", the single-select
 * Status / Taxability / Unit type, the multi-select Subtype) plus the Labels
 * and Last modified templates — with Status on the Active phase alone.
 * Empty Subtype / Est. duration / Summary cells draw the DS "No value"
 * placeholder.
 */
export const DesktopLabor: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="labor" />
    </PhoneViewport>
  ),
};

/**
 * The Labor list in the mobile shell. Like the other non-Jobs lists, the
 * bottom bar has no item for it, so no item is active here and "Jobs"
 * navigates back to the Jobs list.
 */
export const MobileLabor: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="labor" />
    </PhoneViewport>
  ),
};

/**
 * The PRODUCTS list (2026-09-16): the pricebook's PART type (production
 * PriceBookItem, "Parts & Materials"), the second Pricebook page — the
 * sidebar's Pricebook stack and the Labor page's title selector both
 * navigate here. The same shape as Labor: phases Active / Inactive over
 * `is_active`, the Active phase's views All / Review / Confirmed over the
 * two-state status, and Review / Confirmed carrying a fixed Status chip.
 * ELEVEN filters — five object-specific (Inventory and Stock over the
 * inventory trio, Price on the money kind, MFG `industry-windows` and MFG
 * part # `hashtag` on the FREEFORM kind, each a single unlabelled input)
 * plus six shared templates, four of which — Cost, Status, Subtype,
 * Taxability — were promoted out of the Labor registry when this list
 * became their second reader. The Stock column draws the level's icon in
 * its own colour and the DS "No value" cell for an untracked product.
 */
export const DesktopProducts: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="products" />
    </PhoneViewport>
  ),
};

/**
 * The Products list in the mobile shell. Like the other non-Jobs lists, the
 * bottom bar has no item for it, so no item is active here and "Jobs"
 * navigates back to the Jobs list.
 */
export const MobileProducts: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="products" />
    </PhoneViewport>
  ),
};

/**
 * The OTHER list (2026-09-16): the pricebook's "other charge" type
 * (production PriceBookItem type 3, which production's nav calls
 * "Miscellaneous" and the design renames **Other**) — travel, permits,
 * rentals, disposal and subcontractors. The third Pricebook page, on the
 * shared pricebook shell: phases Active / Inactive, the Active phase's views
 * All / Review / Confirmed over the two-state status, and the fixed Status
 * chips on Review and Confirmed. SEVEN filters — Cost, Labels, Last
 * modified, Price, Status (Active only), Subtype and Taxability — every one
 * of them a shared template, which makes this the first pricebook list with
 * no filter of its own.
 */
export const DesktopOther: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="other" />
    </PhoneViewport>
  ),
};

/** The Other list in the mobile shell. */
export const MobileOther: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="other" />
    </PhoneViewport>
  ),
};

/**
 * The DISCOUNTS list (2026-09-16): production's discount type, whose one rule
 * is the SIGN — a discount's price is zero or negative, because it takes
 * money off the invoice, so its Price column reads "-$25.00". It shares its
 * table and its filters with the Other list (one production shape, one
 * identical menu) and differs in two ways: no Cost column, and its own data.
 * Three filters on it disagree with production and are built as the node
 * draws them — see the flags.
 */
export const DesktopDiscounts: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="discounts" />
    </PhoneViewport>
  ),
};

/** The Discounts list in the mobile shell. */
export const MobileDiscounts: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="discounts" />
    </PhoneViewport>
  ),
};

/**
 * The TAX RATES list (2026-09-16): production's tax type and the leanest of
 * the five — no cost, no taxability and no subtype, with one amount held as
 * a PERCENT that production caps at 100. Its four workspace rates are the
 * same records the Clients list reads for its "Default tax rate" filter.
 * FIVE filters, and the object-specific one — **Tax rate** — brought the
 * PERCENT kind: the fifth amount unit after duration, money and count, with
 * the node's nine rows (0% through 20%) and a Custom dialog whose field
 * carries a "%" suffix.
 */
export const DesktopTaxRates: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="desktop" initialPage="taxRates" />
    </PhoneViewport>
  ),
};

/** The Tax rates list in the mobile shell. */
export const MobileTaxRates: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <PhoneViewport>
      <Filters {...args} breakpoint="mobile" initialPage="taxRates" />
    </PhoneViewport>
  ),
};
