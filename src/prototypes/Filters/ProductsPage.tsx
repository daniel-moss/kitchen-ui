import { Page } from "./appShell";
import { PRODUCT_NOUN } from "./listData";
import { PRODUCT_FILTERS } from "./productFilters";
import { TABLE_COLUMNS, sortProducts } from "./productsTable";
import { PRODUCT_ROWS, ProductRow, labelsOf, productStatusLabel, subtypeNameOf } from "./productsData";
import { PricebookListConfig, PricebookPage } from "./pricebookList";

// The PRODUCTS list — added 2026-09-16 (Daniel: "Build", against his "↳
// Products" canvas 15058-61566). The pricebook's PART type (production
// PriceBookItem, "Parts & Materials"), which the design renames "Products".
//
// FOLDED onto the shared `PricebookPage` later the same day — see
// pricebookList.tsx for everything the five pricebook lists do the same way.
// What is Products' own:
//   Table     production's Parts & Materials columns plus the four part-only
//             ones (MFG, MFG part #, Stock, Levels). See productsTable.tsx.
//   Filters   the menu node's ELEVEN rows — four object-specific plus seven
//             shared templates, with Status on the ACTIVE phase alone. See
//             productFilters.tsx.

// What the view bar's keyword search MATCHES: the row's readable text — the
// name, the subtype, the summary, the manufacturer and its part number, the
// label names, and (on active products) the status label — as a
// case-insensitive substring. Production's `filter_keywords` covers
// description, summary and label names; the extras are my choice, FLAGGED
// like every list's. The manufacturer pair earns its place: it is how a
// person looks a part up, and both have their own filters because typing
// "Kason" into the search should find the gasket either way.
const searchHaystack = (item: ProductRow) =>
  [
    item.name,
    subtypeNameOf(item) ?? "",
    item.summary,
    item.manufacturer,
    item.partNumber,
    ...labelsOf(item).map((label) => label.name),
    item.isActive ? productStatusLabel(item.status) : "",
  ]
    .join(" ")
    .toLowerCase();

const PRODUCTS_LIST: PricebookListConfig<ProductRow> = {
  page: "products",
  title: "Products",
  noun: PRODUCT_NOUN,
  rows: PRODUCT_ROWS,
  isActive: (item) => item.isActive,
  statusOf: (item) => item.status,
  rowKey: (item) => item.id,
  filters: PRODUCT_FILTERS,
  columns: TABLE_COLUMNS,
  sortRows: sortProducts,
  // Stock is the third featured attribute where Labor features its Rate: on
  // a parts list, "how many are left" is what a card would lead with.
  attributes: { active: ["status", "subtype", "stock"], inactive: ["subtype", "stock"] },
  search: searchHaystack,
};

export interface ProductsPageProps {
  breakpoint?: "auto" | "desktop" | "mobile";
  onNavigate: (next: Page) => void;
}

const ProductsPage = ({ breakpoint = "auto", onNavigate }: ProductsPageProps) => (
  <PricebookPage config={PRODUCTS_LIST} breakpoint={breakpoint} onNavigate={onNavigate} />
);

export default ProductsPage;
