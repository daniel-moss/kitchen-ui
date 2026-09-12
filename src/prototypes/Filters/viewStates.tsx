import { ReactNode } from "react";

import Button from "../../components/Button/Button";
import { Divider } from "../../components/Divider/Divider";
import EmptyState from "../../components/EmptyState/EmptyState";
import { noop } from "../../stories/helpers";

import { ObjectNoun, countOf } from "./listData";

import styles from "./Filters.module.scss";

// VIEW — SHARED BEHAVIOR. Daniel's Figma page 14031-20299 ("View ↳ Shared
// Behavior") holds the states a LIST shows whatever object it lists: the
// Hidden Data Bar (Partially Hidden Objects), No Objects Match, the edge case
// No Objects Exist, and Search's own empty states. This module is that page.
//
// Split out on 2026-09-11 (the re-organisation): the Jobs page
// and the Estimates page each carried their OWN copy — `NoJobsYet` next to
// `NoEstimatesYet`, two `NoSearchResults`, and a Hidden Data Bar the Estimates
// page simply did not have. They had already started to drift. One set now,
// taking the object's noun; the Estimates page gained the bar with the move.
//
// TWO deliberate limits on "shared", so this never becomes a component that
// knows every object:
//   - the NOUN is a parameter (`ObjectNoun`), never a lookup table in here;
//   - the LAYERS are explicit. `HiddenCounts.filters` is every list's; the
//     SCHEDULE HORIZON is the Jobs page's alone, so a page without one leaves
//     `horizon` out and no copy about it is ever built.
//
// NOT BUILT, and SETTLED: the page's "Failed To Load" edge case. Daniel,
// 2026-09-11 — "Failed to load may stay silent". The prototype has nothing
// that can fail to load (every row comes from a module-level constant), so
// the state would never fire. It belongs here when the real data does.

// (`ObjectNoun`, the two nouns and `countOf` live in listData.ts since
// 2026-09-11 — a filter option's count tag needs them too, and the filter UI
// should not have to import from the view states to get them.)

/**
 * The COUNTED layers of hiding, each measured against the one before it.
 *
 * A layer the page does not have is simply absent — that is what keeps these
 * components from knowing every object's layers. The locked view filter is
 * NEVER counted here (the Locked "Status" Filter frame 14192-61579: "the
 * objects hidden by the locked 'Status' filter does not count").
 */
export interface HiddenCounts {
  /** Hidden by the USER's applied filters, out of what the view shows. */
  filters: number;
  /**
   * Hidden by the View menu's Schedule horizon, out of what the filters show.
   * JOBS ONLY — its annotation says so in as many words ("Relevant to 'Jobs'
   * only"). A list without a horizon leaves this out.
   */
  horizon?: number;
}

/** How many the horizon hides, or 0 on a list that has no horizon. */
const horizonCount = (hidden: HiddenCounts) => hidden.horizon ?? 0;

// ---- No Objects Exist ------------------------------------------------------

// The "No Objects Exist" section (14192-55585) and the Locked "Status" Filter
// frames (14192-60794 / 14192-61579): the DS `EmptyState`, centered in the
// table area. Shown when the view has NOTHING to offer before the counted
// layers — no objects in the system, or a view whose locked Status filter
// matches none ("Once we build the 'View' functionality, this state won't
// exist. Until then, we treat it as if no objects exist"). The locked chip
// stays in the filter bar in that case.
//
// The node's content with the "[objects]" placeholders filled from the noun:
// the icon is "the object icon from the SidebarNav", title "No jobs", caption
// "There are no jobs here yet" (Daniel fixed the template's grammar in Figma,
// 2026-09-09), and the "Create job" primary action with the `plus` icon
// (REGULAR, like every state icon since 2026-09-10 — the Button's Icon
// default). Create goes nowhere in this prototype — no create flow — which
// Daniel OK'd.
export const NoObjectsExist = ({ noun }: { noun: ObjectNoun }) => (
  <div className={styles.noResults}>
    <EmptyState
      className={styles.tableEmptyState}
      icon={noun.icon}
      title={`No ${noun.many}`}
      caption={`There are no ${noun.many} here yet`}
      primaryAction={{ label: noun.createLabel, leftIcon: "plus", onClick: noop }}
    />
  </div>
);

// ---- No Objects Match ------------------------------------------------------

// The "No Objects Match" section, REBUILT 2026-09-09 on the DS `EmptyState`
// (Daniel: "I decided to use the existing EmptyState component there" — the
// section's custom bordered-card block from earlier the same day is gone),
// UPDATED 2026-09-10 to Daniel's copy/state pass: the layer's user-facing name
// is "schedule horizon" now — "view settings" is gone from every string (the
// code keeps `viewSettings` for the View-menu state object, which holds more
// than the horizon). Read off the nodes (14118-59272, 14189-54104, 14189-54588,
// 14189-55064 + mobile twins; "Max Width" pin 384):
//
//   icon    every state icon is REGULAR now (the solid weights are gone — and
//           regular became EmptyState's default, so no iconPack here):
//           `bars-filter` for the filters states, `calendar` (was `sliders`)
//           for the schedule-horizon-only state;
//   title   "No jobs matching the filters" / "No jobs within the schedule
//           horizon" (Daniel 2026-09-10: jobs don't "match" a horizon — they
//           fall inside or outside it);
//   caption the counts — "N jobs" strong, the words subtle: "N jobs hidden by
//           filters", "N jobs hidden by schedule horizon", or the combined
//           "N jobs hidden by filters + N by schedule horizon";
//   actions subtle/lg — "Clear filters", or "Reset filters" when the view has
//           locked filters ("Depends if the view has locked filters"), and
//           "Show settings" (opens the View menu). The combined state shows
//           BOTH, filters button left — which is what turned EmptyState's
//           secondary action subtle.
//
// Objects the LOCKED filter hides are not counted here either; a view whose
// locked filter alone leaves nothing shows NoObjectsExist instead.
interface NoObjectsMatchProps {
  noun: ObjectNoun;
  hidden: HiddenCounts;
  /** The filters button: "Reset filters" with locked filters, else "Clear filters". */
  viewHasLockedFilters?: boolean;
  onClearFilters: () => void;
  /** JOBS ONLY — the horizon layer's button. Unused on a list without one. */
  onShowViewMenu?: () => void;
}

export const NoObjectsMatch = ({
  noun,
  hidden,
  viewHasLockedFilters = false,
  onClearFilters,
  onShowViewMenu = noop,
}: NoObjectsMatchProps) => {
  const horizon = horizonCount(hidden);
  // The horizon-ONLY state has its own icon and title; as soon as the filters
  // hide anything the state is the filters one, schedule horizon or not.
  const byHorizonOnly = hidden.filters < 1 && horizon > 0;
  const filtersAction = {
    label: viewHasLockedFilters ? "Reset filters" : "Clear filters",
    onClick: onClearFilters,
  };
  const showAction = { label: "Show settings", onClick: onShowViewMenu };
  return (
    <div className={styles.noResults}>
      <EmptyState
        className={styles.tableEmptyState}
        icon={byHorizonOnly ? "calendar" : "bars-filter"}
        title={
          byHorizonOnly
            ? `No ${noun.many} within the schedule horizon`
            : `No ${noun.many} matching the filters`
        }
        caption={
          byHorizonOnly ? (
            <>
              <strong>{countOf(noun, horizon)}</strong> hidden by schedule horizon
            </>
          ) : horizon > 0 ? (
            <>
              <strong>{countOf(noun, hidden.filters)}</strong> hidden by filters + <strong>{horizon}</strong> by
              schedule horizon
            </>
          ) : (
            <>
              <strong>{countOf(noun, hidden.filters)}</strong> hidden by filters
            </>
          )
        }
        // Combined: filters button LEFT of Show settings (node 14189-55064) —
        // the secondary slot is the left one.
        secondaryAction={!byHorizonOnly && horizon > 0 ? filtersAction : undefined}
        primaryAction={byHorizonOnly || horizon > 0 ? showAction : filtersAction}
      />
    </div>
  );
};

// ---- No Search Results -----------------------------------------------------

// The "Search" section (14205-65621), UPDATED 2026-09-10 to Daniel's copy/state
// pass. Both states are the EmptyState with a REGULAR `search` icon (was solid)
// and the title "No jobs matching the search":
//
//   MATCHING SEARCH (frames 14238-36927 / 37395 / 14205-65622 + mobile twins)
//     — the search DOES match objects, but the filters and/or schedule horizon
//     hide them. The caption is a full sentence now — "N jobs match the search
//     but are hidden by filters + N by schedule horizon" (it replaced "N
//     matching jobs hidden by …"; Daniel's fix for the title saying "no jobs
//     match" while the caption counted matches) — and each part shows ONLY
//     when that layer hides matches. Only the Ns are strong here (the nodes
//     bold the bare number, not "N jobs" — unlike the No Match captions). The
//     actions follow the same per-layer rule: "Clear filters" (locked-view
//     label rule applies — its annotation's "Reset" is the settled "Reset
//     filters", per the bar's 2026-09-09 naming) and "Show settings". NO
//     "Clear search" here — the search field sits open in the bar with its own
//     clear.
//   NO MATCH (frames 14235-22441 / 22449) — nothing matches anywhere in the
//     view's world: caption "No jobs exist that match the search" (was "Try
//     another search"), one subtle "Clear search".
interface NoSearchResultsProps {
  noun: ObjectNoun;
  /** MATCHING objects hidden per layer — the search-aware counts. */
  hidden: HiddenCounts;
  viewHasLockedFilters?: boolean;
  onClearFilters: () => void;
  /** JOBS ONLY — the horizon layer's button. */
  onShowViewMenu?: () => void;
  onClearSearch: () => void;
}

export const NoSearchResults = ({
  noun,
  hidden,
  viewHasLockedFilters = false,
  onClearFilters,
  onShowViewMenu = noop,
  onClearSearch,
}: NoSearchResultsProps) => {
  const horizon = horizonCount(hidden);
  const byFilters = hidden.filters > 0;
  const byHorizon = horizon > 0;
  const filtersAction = {
    label: viewHasLockedFilters ? "Reset filters" : "Clear filters",
    onClick: onClearFilters,
  };
  const showAction = { label: "Show settings", onClick: onShowViewMenu };
  // The node's template is plural ("N [object]s match … are hidden"); the
  // singular is the same small grammar fix the copy takes everywhere else
  // ("1 job matches … is hidden").
  const matchPhrase = (count: number) =>
    count === 1 ? `${noun.one} matches the search but is` : `${noun.many} match the search but are`;
  return (
    <div className={styles.noResults}>
      <EmptyState
        className={styles.tableEmptyState}
        icon="search"
        title={`No ${noun.many} matching the search`}
        caption={
          byFilters && byHorizon ? (
            <>
              <strong>{hidden.filters}</strong> {matchPhrase(hidden.filters)} hidden by filters +{" "}
              <strong>{horizon}</strong> by schedule horizon
            </>
          ) : byFilters ? (
            <>
              <strong>{hidden.filters}</strong> {matchPhrase(hidden.filters)} hidden by filters
            </>
          ) : byHorizon ? (
            <>
              <strong>{horizon}</strong> {matchPhrase(horizon)} hidden by schedule horizon
            </>
          ) : (
            `No ${noun.many} exist that match the search`
          )
        }
        // Filters button LEFT of Show settings when both show — the No Match
        // family's arrangement, which the section's frames repeat.
        secondaryAction={byFilters && byHorizon ? filtersAction : undefined}
        primaryAction={
          byHorizon ? showAction : byFilters ? filtersAction : { label: "Clear search", onClick: onClearSearch }
        }
      />
    </div>
  );
};

// ---- the Hidden Data Bar ---------------------------------------------------

// The "Partially Hidden Objects" section (14189-49658, updated 2026-09-09; it
// superseded the states boards 14178-47650 / 14178-47306 and the first draft
// 14113-54698 / 14113-54705). The placement rule holds: after the table's
// scroll container, "fixed at the bottom of the list" — and the bar exists only
// while the table SHOWS something; with every row hidden the No Objects Match
// state takes over. Every state is the DS Divider (medium) over a 40px centered
// row of caption text (13/20, the numbers strong 500, the words subtle 400) and
// ghost/sm Buttons; no fill of its own.
//
// Objects the LOCKED status filter hides are NOT counted (the Locked "Status"
// Filter frame's annotation, 14192-61579: "the objects hidden by the locked
// 'Status' filter does not count. The default view with a single locked
// 'Status' filter doesn't have 'hidden object' bar") — so the bar measures the
// APPLIED filters and the schedule horizon only. The states, each with its
// node's annotation:
//
//   applied filters        "N jobs hidden by filters" + a button that "Depends
//                          if the view has locked filters" (14186-49625):
//                          "Clear filters" on a view without locked filters
//                          (14113-55510, "Removes all the applied filters"),
//                          "Reset filters" on a view WITH them (14186-48271,
//                          "Removes all the filters applied by the user" — the
//                          locked one stays);
//   schedule horizon only  "N jobs hidden by schedule horizon" + "Show
//                          settings" (14186-48783; the button "Opens the
//                          'View' menu". "Relevant to 'Jobs' only");
//   filters + horizon      DESKTOP (14186-49251): both groups side by side,
//                          16px apart — "N jobs hidden by filters" + its button
//                          and "+N by schedule horizon" + "Show settings".
//                          MOBILE (14186-49261): ONE compact line, no buttons —
//                          "N jobs hidden by filters + N by schedule horizon".
//
// "Reset filters" and "Clear filters" are the same write — the selection
// empties; the locked filter never lives in the selection, so it survives by
// construction. "Show settings" opens the View menu, wired through the shells.
//
// NAMING SETTLED (Daniel, 2026-09-09): "Reset filters" is intentional — it
// superseded the plain "Reset" he asked for earlier the same day. ("Show" grew
// to "Show settings" in the same update.) COPY RENAMED 2026-09-10: "view
// settings" became "schedule horizon" in every user-facing string, bar and
// empty states alike (the article rule Daniel settled the same day: "by +
// mechanism" takes no article — "hidden by filters" / "by schedule horizon" —
// while descriptive phrases keep "the" — "matching the filters", "within the
// schedule horizon").
interface HiddenDataBarProps {
  noun: ObjectNoun;
  hidden: HiddenCounts;
  /** Picks the filters button: "Reset filters" with locked filters, else "Clear filters". */
  viewHasLockedFilters?: boolean;
  /** The combined state collapses to the compact buttonless line on mobile. */
  mobile?: boolean;
  onClearFilters: () => void;
  /** JOBS ONLY — the horizon layer's "Show settings". */
  onShowViewMenu?: () => void;
}

export const HiddenDataBar = ({
  noun,
  hidden,
  viewHasLockedFilters = false,
  mobile = false,
  onClearFilters,
  onShowViewMenu = noop,
}: HiddenDataBarProps) => {
  const horizon = horizonCount(hidden);
  if (hidden.filters < 1 && horizon < 1) return null;

  const filtersGroup: ReactNode = hidden.filters > 0 && (
    <span className={styles.hiddenBarGroup}>
      <p className={styles.hiddenBarText}>
        <strong>{countOf(noun, hidden.filters)}</strong> hidden by filters
      </p>
      <Button variant="ghost" size="sm" onClick={onClearFilters}>
        {viewHasLockedFilters ? "Reset filters" : "Clear filters"}
      </Button>
    </span>
  );

  const showButton = (
    <Button variant="ghost" size="sm" onClick={onShowViewMenu}>
      Show settings
    </Button>
  );

  return (
    <div className={styles.hiddenBar}>
      <Divider contrast="medium" />
      <div className={styles.hiddenBarRow}>
        {hidden.filters > 0 && horizon > 0 ? (
          mobile ? (
            // The compact combined line — "no buttons" is its annotation.
            <p className={styles.hiddenBarText}>
              <strong>{countOf(noun, hidden.filters)}</strong> hidden by filters + <strong>{horizon}</strong> by
              schedule horizon
            </p>
          ) : (
            <>
              {filtersGroup}
              <span className={styles.hiddenBarGroup}>
                <p className={styles.hiddenBarText}>
                  <strong>+{horizon}</strong> by schedule horizon
                </p>
                {showButton}
              </span>
            </>
          )
        ) : hidden.filters > 0 ? (
          filtersGroup
        ) : (
          <span className={styles.hiddenBarGroup}>
            <p className={styles.hiddenBarText}>
              <strong>{countOf(noun, horizon)}</strong> hidden by schedule horizon
            </p>
            {showButton}
          </span>
        )}
      </div>
    </div>
  );
};
