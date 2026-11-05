import AvatarProduct from "../../../components/Avatar/AvatarProduct";
import EmptyState from "../../../components/EmptyState/EmptyState";
import MenuItem from "../../../components/Menu/MenuItem";
import SelectList from "../../../components/SelectList/SelectList";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { ProductItem } from "../../../data/db";
import { joinWithSeparator } from "../../../utils/textSeparator";
import { money } from "../../NewLaborRateForm/rateMath";
import { slot } from "../../shared/helpers";

import { ProductSelectListProps } from "./ProductSelectList.types";

// The "Products" SelectList (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "Product" → SelectList 3137-6480) — THE list a product is picked from,
// wherever one is added (a job's charges, an estimate, an invoice). The
// Labor rates list's twin (LaborRateSelectList).
//
//   Dialog on desktop / drawer on mobile, titled "Products", with a search
//   ("Product..."). Single-select; CONFIRMED products only, A → Z.
//   A row: AvatarProduct (its photo, else the icon; no status) · name · "manufacturer · part #"
//   on the left — each part "No Manufacturer" / "No Part #" when missing —
//   and the price on the right with "Cost: $…" under it.
//   Footer: "Add product" — "Only shown if a user has required permissions",
//   and it opens the "New product" form. It stays in every state: no
//   products at all (caption "No products", no search) and no match
//   (caption "No products match").
//
// Picking a row hands the product to the caller and closes the list. The
// caller decides what a pick does.

/** "Confirmed products only. Sorted by name from A to Z." */
export const pickableProducts = (products: ProductItem[]) =>
  products.filter((product) => product.isActive && product.status === "active").sort((a, b) => a.name.localeCompare(b.name));

/**
 * "Chemours · R404A-24", with "No Manufacturer" / "No Part #" for a missing
 * part — uppercase, like the ValueDisplay placeholders (Daniel, 2026-11-03).
 */
const captionOf = (product: ProductItem) =>
  joinWithSeparator(product.manufacturer || "No Manufacturer", product.partNumber || "No Part #");

export default function ProductSelectList({
  open,
  onClose,
  products,
  onSelect,
  selectedId,
  onAddProduct,
  breakpoint = "auto",
}: ProductSelectListProps) {
  const options = pickableProducts(products);
  const isEmpty = options.length === 0;

  // The form is a dialog of its own, so the list closes first.
  const footer =
    onAddProduct == null ? undefined : (
      <SelectListFooter variant="menuItem">
        <MenuItem
          label="Add product"
          slotLeft={slot("plus")}
          onClick={() => {
            onClose();
            onAddProduct();
          }}
        />
      </SelectListFooter>
    );

  return (
    <SelectList
      variant="dialog"
      breakpoint={breakpoint}
      open={open}
      onClose={onClose}
      title="Products"
      // No products at all: nothing to search (the node drops the header).
      searchable={!isEmpty}
      searchPlaceholder="Product..."
      state={isEmpty ? "empty" : "default"}
      emptyState={{ caption: "No products" }}
      noResultsState={<EmptyState caption="No products match" />}
      footer={footer}
    >
      <SelectListItemGroup>
        {options.map((product) => (
          <SelectListItem
            key={product.id}
            variant="object"
            // The product's photo when it has one (Daniel, 2026-11-03), else the icon.
            avatar={
              product.imageUrl ? <AvatarProduct size="xl" content="image" imageSrc={product.imageUrl} /> : <AvatarProduct size="xl" />
            }
            label={product.name}
            caption={captionOf(product)}
            // The search reads what the row shows: name, manufacturer, part #.
            searchText={joinWithSeparator(product.name, product.manufacturer, product.partNumber)}
            rightTitle={money(product.price)}
            rightCaption={`Cost: ${money(product.cost)}`}
            selected={product.id === selectedId}
            onClick={() => {
              onSelect(product);
              onClose();
            }}
          />
        ))}
      </SelectListItemGroup>
    </SelectList>
  );
}

export type { ProductSelectListProps } from "./ProductSelectList.types";
