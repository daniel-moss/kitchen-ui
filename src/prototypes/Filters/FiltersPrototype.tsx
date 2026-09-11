import { useState } from "react";

import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";

import { Page, Sidebar } from "./appShell";
import EstimatesList from "./EstimatesList";
import JobsPage from "./Filters";

import styles from "./Filters.module.scss";

// The prototype's outermost shell: the page switch, and the chrome both pages
// stand inside.
//
// It exists as its own file to break an import cycle (2026-09-11). The filter
// UI — the Filters menu, its option lists, the chips and the filter bar —
// lives in Filters.tsx alongside the Jobs page, and the Estimates page imports
// it from there. If Filters.tsx ALSO reached back for the Estimates page to
// render it, the two modules would import each other. Owning the switch here
// means Filters.tsx does not know the Estimates page exists.
//
// The SIDEBAR is rendered here, outside the switch, so it stays mounted when
// the page changes. That is what lets its Jobs stack animate closed when the
// user navigates out of it (Daniel, 2026-09-11): a remounted sidebar would
// simply appear collapsed, with nothing to transition from. Each page
// therefore renders only its work area on desktop.
//
// Mobile has no sidebar — each page brings its own shell and bottom bar.
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

  const workArea =
    page === "estimates" ? (
      <EstimatesList breakpoint={breakpoint} onNavigate={setPage} />
    ) : (
      <JobsPage breakpoint={breakpoint} onNavigate={setPage} />
    );

  return isDesktop ? (
    <div className={styles.desktop}>
      <Sidebar page={page} onNavigate={setPage} />
      {workArea}
    </div>
  ) : (
    workArea
  );
};

export default FiltersPrototype;
