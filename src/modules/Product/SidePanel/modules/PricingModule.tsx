import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../../components/IconButton/IconButton";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../../components/ValueDisplay/ValueDisplayGroup";
import { ProductItem } from "../../../../data/db";
import { money } from "../../NewProductForm/productRules";
import { costStrategyOf, formatMarkup, priceStrategyOf, taxabilityOf } from "../productData";

// The Product panel's "Pricing" module (Figma 3167-22895):
//
//   Cost strategy   Manual / Min · Max · Avg vendor cost.
//   Cost            "$100.00" — typed, or written by the vendor-cost strategy.
//   Price strategy  Manual / Fixed markup / Percent markup.
//   Fixed markup    "$50.00" — only under Fixed markup (3167-22906).
//   Percent markup  "50.00%" — only under Percent markup (3167-22917).
//   Price           plain here even below the cost: "Price < Cost warning
//                   appears when editing only".
//   Taxability      only when the company uses taxes (the shared field rule).
//
// No "/hr" suffix anywhere — that is the hourly labor rate's.

interface PricingModuleProps {
  product: ProductItem;
  onEdit: () => void;
  /** Hidden while the product is inactive, or without the edit permission. */
  canEdit?: boolean;
  /** False drops the Taxability row — the company does not use taxes. */
  useTaxes?: boolean;
  isLoading?: boolean;
}

export default function PricingModule({ product, onEdit, canEdit = true, useTaxes = true, isLoading = false }: PricingModuleProps) {
  return (
    <DisplayModule
      title="Pricing"
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit pricing" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay label="Cost strategy" value={costStrategyOf(product)} isLoading={isLoading} />
          <ValueDisplay label="Cost" value={money(product.cost)} isLoading={isLoading} />
          <ValueDisplay label="Price strategy" value={priceStrategyOf(product)} isLoading={isLoading} />
          {product.priceStrategy === "fixedMarkup" && (
            <ValueDisplay label="Fixed markup" value={formatMarkup(product)} isLoading={isLoading} />
          )}
          {product.priceStrategy === "percentMarkup" && (
            <ValueDisplay label="Percent markup" value={formatMarkup(product)} isLoading={isLoading} />
          )}
          <ValueDisplay label="Price" value={money(product.price)} isLoading={isLoading} />
          {useTaxes && <ValueDisplay label="Taxability" value={taxabilityOf(product)} isLoading={isLoading} />}
        </ValueDisplayGroup>
      }
    />
  );
}
