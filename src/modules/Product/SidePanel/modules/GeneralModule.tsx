import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../../components/IconButton/IconButton";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../../components/ValueDisplay/ValueDisplayGroup";
import { ProductItem } from "../../../../data/db";
import { stockTypeOf, subtypeNameOf } from "../productData";

// The Product panel's "General" module (Figma 3167-22851, Overview 3167-22852).
// Six label–value pairs, in the node's order:
//
//   Name          always.
//   Subtype       "Only shown if a service company supports subtypes."
//   Manufacturer  wraps; "No Manufacturer" when empty (3167-27612).
//   MFG part #    wraps; "No MFG part #" (3167-27643).
//   Barcode       wraps; "No Barcode" (3167-27657).
//   Stock type    "Inventory" / "Non-inventory" (3167-32921) — only while the
//                 company has the inventory feature, like its form field.
//
// The empty values are ValueDisplay's own "No [Label]" placeholder. Status,
// Created by / at and Last modified are NOT here — they are the "Info" module.

interface GeneralModuleProps {
  product: ProductItem;
  onEdit: () => void;
  /** Hidden while the product is inactive, or without the edit permission. */
  canEdit?: boolean;
  /** The company has subtypes. False drops the Subtype row. */
  hasSubtypes?: boolean;
  /** The company has the inventory feature. False drops the Stock type row. */
  hasInventory?: boolean;
  /**
   * The company requires a subtype and the product has none — the Labor rate
   * panel's "Warning" state, shared pricebook behaviour.
   */
  missingSubtype?: boolean;
  isLoading?: boolean;
}

export default function GeneralModule({
  product,
  onEdit,
  canEdit = true,
  hasSubtypes = true,
  hasInventory = true,
  missingSubtype = false,
  isLoading = false,
}: GeneralModuleProps) {
  const warn = missingSubtype && !isLoading;

  return (
    <DisplayModule
      title="General"
      status={warn ? "warning" : "none"}
      banner={warn ? { children: "This product needs a subtype" } : undefined}
      // "Only shown if a user has required permissions" — and while loading
      // there is nothing to edit yet (the Loading frame has no button).
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit general" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Name" value={product.name} isLoading={isLoading} />
          {hasSubtypes && (
            <ValueDisplay label="Subtype" value={subtypeNameOf(product)} isWarning={warn} isLoading={isLoading} />
          )}
          <ValueDisplay label="Manufacturer" value={product.manufacturer || undefined} isLoading={isLoading} />
          <ValueDisplay label="MFG part #" value={product.partNumber || undefined} isLoading={isLoading} />
          <ValueDisplay label="Barcode" value={product.barcode || undefined} isLoading={isLoading} />
          {hasInventory && <ValueDisplay label="Stock type" value={stockTypeOf(product)} isLoading={isLoading} />}
        </ValueDisplayGroup>
      }
    />
  );
}
