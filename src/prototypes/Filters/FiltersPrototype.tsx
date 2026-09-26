import { useState } from "react";

import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";

import { Page, Sidebar } from "./appShell";
import MenuPage from "./MenuPage";
import BillsPage from "./BillsPage";
import ClientsPage from "./ClientsPage";
import CreditNotesPage from "./CreditNotesPage";
import DiscountsPage from "./DiscountsPage";
import EstimatesPage from "./EstimatesPage";
import InvoicesPage from "./InvoicesPage";
import JobsPage from "./JobsPage";
import LaborPage from "./LaborPage";
import OtherPage from "./OtherPage";
import POsPage from "./POsPage";
import ProductsPage from "./ProductsPage";
import SeriesPage from "./SeriesPage";
import TaxRatesPage from "./TaxRatesPage";
import VendorsPage from "./VendorsPage";

import styles from "./Filters.module.scss";

// The prototype's outermost shell: the page switch, and the chrome both pages
// stand inside.
//
// It exists as its own file to break an import cycle (2026-09-11). The filter
// UI — the Filters menu, its option lists, the chips and the filter bar — used
// to live in the Jobs page, and the Estimates page imported it from there; if
// the Jobs page had ALSO reached back for the Estimates page to render it, the
// two modules would import each other. The UI moved out to `filterUI.tsx` in
// the same day's re-organisation, so that cycle can no longer form — but the
// switch stays here, because NEITHER page should know the other exists.
//
// The SIDEBAR is rendered here, outside the switch, so it stays mounted when
// the page changes. That is what lets its Jobs stack animate closed when the
// user navigates out of it (Daniel, 2026-09-11): a remounted sidebar would
// simply appear collapsed, with nothing to transition from. Each page
// therefore renders only its work area on desktop.
//
// Mobile has no sidebar — each page brings its own shell and bottom bar. The
// MENU page (2026-09-26) is the mobile stand-in for the sidebar: the bottom
// bar's "Menu" item navigates to it, and it navigates on to everything the bar
// has no room for.
export interface FiltersProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** The page the prototype opens on. The sidebar navigates between them. */
  initialPage?: Page;
}

const FiltersPrototype = ({ breakpoint = "auto", initialPage = "jobs" }: FiltersProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  // Each page keeps its own state inside its own component, so switching pages
  // resets it — FLAGGED: lifting that up here is a small change if the reset
  // bothers testing.
  const [page, setPage] = useState<Page>(initialPage);
  // "menu" is a DESTINATION, so going there must not lose which list you came
  // from: the Menu page highlights `listPage`, and the bottom bar's Jobs item
  // and every other page keep reading `page`. Desktop has a sidebar instead,
  // so a "menu" page resolves back to the list there.
  const [listPage, setListPage] = useState<Page>(initialPage === "menu" ? "jobs" : initialPage);
  const navigate = (next: Page) => {
    setPage(next);
    if (next !== "menu") setListPage(next);
  };
  const resolved = isDesktop && page === "menu" ? listPage : page;

  const workArea =
    resolved === "menu" ? (
      <MenuPage page={listPage} onNavigate={navigate} />
    ) : resolved === "estimates" ? (
      <EstimatesPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "invoices" ? (
      <InvoicesPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "creditNotes" ? (
      <CreditNotesPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "pos" ? (
      <POsPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "bills" ? (
      <BillsPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "vendors" ? (
      <VendorsPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "clients" ? (
      <ClientsPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "labor" ? (
      <LaborPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "products" ? (
      <ProductsPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "other" ? (
      <OtherPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "discounts" ? (
      <DiscountsPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "taxRates" ? (
      <TaxRatesPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : resolved === "series" ? (
      <SeriesPage breakpoint={breakpoint} onNavigate={navigate} />
    ) : (
      <JobsPage breakpoint={breakpoint} onNavigate={navigate} />
    );

  return isDesktop ? (
    <div className={styles.desktop}>
      <Sidebar page={resolved} onNavigate={navigate} />
      {workArea}
    </div>
  ) : (
    workArea
  );
};

export default FiltersPrototype;
