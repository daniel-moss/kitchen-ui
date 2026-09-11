import { ESTIMATE_LABELS } from "../../data/db";
import { EstimateRow, clientOf, locationOf } from "./estimatesData";
import { FilterDef, FilterOption, addressFilter, buildFilters, dateFilter } from "./filterDefs";

// The ESTIMATES list's filter registry (Daniel, 2026-09-11: "let's only add
// Address, Location, Last modified, Status changed, Client, Labels and
// Service. Those are exactly the same as for the Jobs").
//
// They are DERIVED from the jobs registry rather than written a second time.
// Every one of them takes its label, icon, options, conditions, search
// placeholder, row shape and copy straight off the jobs def and replaces only
// what is genuinely different:
//
//   - `matches`, which reads an ESTIMATE instead of a job. That is the only
//     part of a `FilterDef` that knows the row type at all, which is why the
//     type is generic (see `FilterDef<TRow>`);
//   - Labels' OPTIONS, because estimates carry their own label table
//     (production `EstimateLabel` — see ESTIMATE_LABELS in the db).
//
// So "exactly the same as for the Jobs" is a fact of the code here, not
// something to keep in step by hand: change the jobs Location filter's rows or
// its search copy and the estimates one changes with it.
//
// The menu lists them alphabetically, which is the jobs menu's own order
// (node 14032-20321) with the filters estimates do not have taken out:
// Address, Client, Labels, Last modified, Location, Service, Status changed.

/** The jobs registry, built once — only its row-free halves are used here. */
const JOB_DEFS = buildFilters("", "open");

const jobDef = (id: string): FilterDef => {
  const def = JOB_DEFS.find((entry) => entry.id === id);
  if (def == null) throw new Error(`No jobs filter "${id}" to derive the estimates one from`);
  return def;
};

/**
 * Everything about a filter EXCEPT the two parts that belong to the row it
 * tests: its predicate, and the counts that would be counted over the wrong
 * list. What is left is pure chrome, identical whatever the list holds.
 */
const chromeOf = (def: FilterDef) => {
  const { matches, counts, ...chrome } = def;
  return chrome;
};

/**
 * A filter the estimates list borrows from the jobs list: the jobs def's
 * chrome, an estimate predicate, and — only where the data differs — a few
 * fields of its own.
 */
const borrowed = (
  id: string,
  matches: FilterDef<EstimateRow>["matches"],
  own: Partial<FilterDef<EstimateRow>> = {},
): FilterDef<EstimateRow> => ({ ...chromeOf(jobDef(id)), matches, ...own });

/**
 * "No labels" leads the list, then the estimate labels themselves — the jobs
 * Labels filter's own row order, over the estimates' table.
 */
const estimateLabelOptions: FilterOption[] = [
  { id: "none", label: "No labels" },
  ...ESTIMATE_LABELS.map((label) => ({ id: label.id, label: label.name })),
];

export function buildEstimateFilters(): FilterDef<EstimateRow>[] {
  return [
    // Every filled field has to match the estimate's LOCATION — the same
    // question the jobs filter asks, pointed at the estimate's location.
    borrowed("address", addressFilter(locationOf)),

    // An estimate has no client of its own: it belongs to a location, and the
    // location belongs to the client (`clientOf` walks that link).
    borrowed("client", (est, { ids }) => ids.includes(clientOf(est).id)),

    // Labels is the one filter whose OPTIONS differ — estimates have their own
    // label table. The matching rules are the jobs filter's, verbatim: "No
    // labels" is one more alternative under "any of", and under "all of" it can
    // only be satisfied on its own.
    borrowed(
      "labels",
      (est, { ids, match }) => {
        const wantsNone = ids.includes("none");
        const labelIds = ids.filter((id) => id !== "none");
        if (match === "any") {
          return (wantsNone && est.labelIds.length === 0) || labelIds.some((id) => est.labelIds.includes(id));
        }
        if (wantsNone) return labelIds.length === 0 && est.labelIds.length === 0;
        return labelIds.every((id) => est.labelIds.includes(id));
      },
      { options: estimateLabelOptions },
    ),

    // The two date filters read the estimate's own timestamps. `dateFilter`
    // brings the presets and the whole preset/custom/condition machinery; only
    // the field it reads is ours.
    borrowed("lastModified", dateFilter<EstimateRow>((est) => est.lastModifiedAt).matches),
    borrowed("location", (est, { ids }) => ids.includes(est.locationId)),
    // An estimate that is not for a pricebook service (EST-2205's build-out
    // consultation) has no `serviceId`, so no service ever matches it.
    borrowed("service", (est, { ids }) => est.serviceId != null && ids.includes(est.serviceId)),
    borrowed("statusChanged", dateFilter<EstimateRow>((est) => est.statusChangedAt).matches),
  ];
}
