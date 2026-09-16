import { Page } from "./appShell";
import { LABOR_FILTERS } from "./laborFilters";
import { TABLE_COLUMNS, sortLabor } from "./laborTable";
import { LABOR_ROWS, LaborRow, labelsOf, laborStatusLabel, subtypeNameOf } from "./laborData";
import { LABOR_NOUN } from "./listData";
import { PricebookListConfig, PricebookPage } from "./pricebookList";

// The LABOR list — added 2026-09-16 (Daniel: "add 'Labor' table and filters to
// the prototype", against his "↳ Labor" canvas 15044-66760, re-read after each
// of his three update rounds). The pricebook's SERVICE type (production
// PriceBookItem, type 1 "LABR") — the design renames it "Labor" and files it
// under the Pricebook sidebar stack.
//
// FOLDED onto the shared `PricebookPage` later the same day, when Other,
// Discounts and Tax rates arrived: the phases, the views, the locked Status
// chips, the title's sub-page selector, the View menu and the whole search /
// filter / sort pipeline are the same on all five pricebook lists, so they
// live there and this file is what genuinely differs. See pricebookList.tsx.
//
// What is Labor's own:
//   Table     production's Services columns per Daniel's rulings — no avatar
//             on the name, Status on every Active view and no Inactive one,
//             the DS "No value" cells. See laborTable.tsx.
//   Filters   the menu node's nine rows — three object-specific plus six
//             shared templates, with Status on the ACTIVE phase alone. See
//             laborFilters.tsx.

// What the view bar's keyword search MATCHES: the row's readable text — the
// name, the subtype, the summary, the label names, and (on active items) the
// status label — as a case-insensitive substring. Production's
// `filter_keywords` covers description, summary and label names; the extras
// are my choice, FLAGGED like every list's.
const searchHaystack = (item: LaborRow) =>
  [
    item.name,
    subtypeNameOf(item) ?? "",
    item.summary,
    ...labelsOf(item).map((label) => label.name),
    item.isActive ? laborStatusLabel(item.status) : "",
  ]
    .join(" ")
    .toLowerCase();

// A MODULE CONSTANT, not a value built per render: the shared page memoises
// its per-view maps on this object's identity, and the table is memoised on
// the props it hands down.
const LABOR_LIST: PricebookListConfig<LaborRow> = {
  page: "labor",
  title: "Labor",
  noun: LABOR_NOUN,
  rows: LABOR_ROWS,
  isActive: (item) => item.isActive,
  statusOf: (item) => item.status,
  rowKey: (item) => item.id,
  filters: LABOR_FILTERS,
  columns: TABLE_COLUMNS,
  sortRows: sortLabor,
  // The Inactive phase has no Status column to feature.
  attributes: { active: ["status", "subtype", "rate"], inactive: ["subtype", "rate"] },
  search: searchHaystack,
};

export interface LaborPageProps {
  breakpoint?: "auto" | "desktop" | "mobile";
  onNavigate: (next: Page) => void;
}

const LaborPage = ({ breakpoint = "auto", onNavigate }: LaborPageProps) => (
  <PricebookPage config={LABOR_LIST} breakpoint={breakpoint} onNavigate={onNavigate} />
);

export default LaborPage;
