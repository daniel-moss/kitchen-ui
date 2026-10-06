import { useEffect, useState } from "react";

import Toaster from "../components/Toast/Toaster";
import useIsDesktop, { Breakpoint } from "../hooks/useIsDesktop";

import { AppStoreProvider } from "./store/AppStore";
import { listOfRoute, Route } from "./routing/routes";
import { useRoute } from "./routing/useRoute";

import { Page, Sidebar } from "./shell/appShell";
import { NewJobProvider } from "./shell/newJob";
import { TaxRatesProvider } from "./shell/taxRates";
import JobDetailsPage from "./jobDetails/JobDetailsRoute";
import MenuPage from "./shell/MenuPage";
import BillsPage from "./BillsPage";
import ClientsPage from "./ClientsPage";
import CreditNotesPage from "./CreditNotesPage";
import DiscountsPage from "./DiscountsPage";
import EstimatesPage from "./EstimatesPage";
import InvoicesPage from "./InvoicesPage";
import JobsPage, { JOBS_VIEW_DEFAULT, JobsViewState } from "./JobsPage";
import LaborPage from "./LaborPage";
import OtherPage from "./OtherPage";
import POsPage from "./POsPage";
import ProductsPage from "./ProductsPage";
import SeriesPage from "./SeriesPage";
import TaxRatesPage from "./TaxRatesPage";
import VendorsPage from "./VendorsPage";

import styles from "./App.module.scss";

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
//
// WHERE the app is lives in the URL hash, not here (see routing/routes.ts).
// This component only turns a route into a page.
export interface AppProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** Where to open when the URL carries no hash. A hash always wins. */
  initialPage?: Page;
}

const App = ({ breakpoint = "auto", initialPage = "jobs" }: AppProps) => {
  const isDesktop = useIsDesktop(breakpoint);
  const initialRoute: Route = { kind: "list", page: initialPage };
  const { route, navigate: navigateToObject, navigateToPage } = useRoute(initialRoute);

  // Which LIST the current route belongs to. An object route resolves to the
  // list that holds it, so the sidebar and the bottom bar mark the right item
  // while you are looking at one job.
  const page = listOfRoute(route);

  // "menu" is a DESTINATION, so going there must not lose which list you came
  // from: the Menu page highlights `listPage`, and on desktop a "menu" route
  // resolves back to it, since the sidebar is there instead. The hash does not
  // carry it — it is a memory of where you were, not a place.
  const [listPage, setListPage] = useState<Page>(initialPage === "menu" ? "jobs" : initialPage);
  useEffect(() => {
    if (page !== "menu") setListPage(page);
  }, [page]);

  // Which VIEW the Jobs list was on, kept here for the same reason `listPage`
  // is: opening a job UNMOUNTS the list, so without somewhere outside to keep
  // it, Back always landed on "All" (Daniel, 2026-10-06 — open a job from
  // "Pending", come back to "Pending"). It is a memory of where you were, not
  // a place, so like `listPage` it stays out of the hash.
  //
  // The list's own filters, sort and search still reset on the same trip. Say
  // the word and they move up here too, the same way.
  const [jobsView, setJobsView] = useState<JobsViewState>(JOBS_VIEW_DEFAULT);

  const navigate = navigateToPage;
  const resolved = isDesktop && page === "menu" ? listPage : page;

  // An object route renders its DETAILS page. Only jobs have one so far; every
  // other object route still falls through to its list, which is why a link
  // like #/vendors/bayview opens the Vendors list rather than nothing.
  const objectArea =
    route.kind === "object" && route.object === "job" ? (
      <JobDetailsPage
        id={route.id}
        breakpoint={breakpoint}
        onNavigate={navigate}
        onOpenJob={(jobId) => navigateToObject({ kind: "object", object: "job", id: jobId })}
      />
    ) : null;

  const workArea =
    objectArea ??
    (resolved === "menu" ? (
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
      <JobsPage
        breakpoint={breakpoint}
        onNavigate={navigate}
        onOpenJob={(jobId) => navigateToObject({ kind: "object", object: "job", id: jobId })}
        viewState={jobsView}
        onViewStateChange={setJobsView}
      />
    ));

  // The app's ONE toast stack (2026-10-05). Until now nothing outside the Job
  // Details page mounted a Toaster, so every toast raised from a list, a form
  // or a panel went nowhere — including the "Job created" one, and the "Tax
  // rate created" toast whose "Preview" link opens the side panel.
  //
  // Toaster must be mounted ONCE, and the Job Details page still mounts its
  // own, so this one steps aside while that page is on screen; two stacks
  // would render every toast twice. It can become unconditional as soon as
  // that module stops bringing its own.
  const toaster = objectArea == null ? <Toaster breakpoint={breakpoint} /> : null;

  return isDesktop ? (
    <div className={styles.desktop}>
      <Sidebar page={resolved} onNavigate={navigate} />
      {workArea}
      {toaster}
    </div>
  ) : (
    <>
      {workArea}
      {toaster}
    </>
  );
};

// The store wraps the whole app, so a list and a details page always read the
// same jobs — an edit on one is visible on the other immediately.
//
// `NewJobProvider` holds the app's ONE "New job" form, so every entry point —
// the sidebar's Create menu, the Jobs list's "New" button, the mobile bottom
// bar's Create — opens the same instance (2026-09-28).
//
// `TaxRatesProvider` does the same for the "New tax rate" form AND the "Tax
// rate" side panel (2026-10-05). It sits INSIDE the store, which it reads and
// writes, and outside the app, because both overlays can be opened from any
// page.
export default function AppWithStore(props: AppProps) {
  return (
    <AppStoreProvider>
      <NewJobProvider breakpoint={props.breakpoint}>
        <TaxRatesProvider breakpoint={props.breakpoint}>
          <App {...props} />
        </TaxRatesProvider>
      </NewJobProvider>
    </AppStoreProvider>
  );
}
