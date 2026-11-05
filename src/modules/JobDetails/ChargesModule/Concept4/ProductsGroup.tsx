import { PRODUCT_ITEMS } from "../../../../data/db";
import type { ProductItem } from "../../../../data/db";
import ProductSelectList from "../../../Product/ProductSelectList/ProductSelectList";
import { productAmount } from "../lineDisplay";
import ProductLineForm from "../LineForms/ProductLineForm";
import { noop } from "../../shared";

import CardGroup, { canDragCards } from "./CardGroup";
import type { ChargesGroupProps } from "./Concept4";
import ProductCard from "./ProductCard";
import useCardLines from "./useCardLines";

export default function ProductsGroup({ job, lines, setLines, hasSubtypes, isPublic, mobile }: ChargesGroupProps) {
  const cards = useCardLines<ProductItem>(lines, setLines, "product", mobile);
  const product = cards.item;

  return (
    <>
      <CardGroup
        {...cards.group}
        title="Products"
        addLabel="Add product"
        empty="No products"
        total={cards.lines.reduce((acc, charge) => acc + productAmount(charge.product!), 0)}
        isPublic={isPublic}
      >
        {cards.lines.map((charge) => {
          const item = PRODUCT_ITEMS.find((row) => row.id === charge.productId);
          return (
            <ProductCard
              key={charge.id}
              title={charge.title}
              line={charge.product!}
              photo={item?.imageUrl}
              hasSubtypes={hasSubtypes}
              isPublic={isPublic}
              draggable={canDragCards(cards.lines.length, isPublic)}
              onClick={() => item != null && cards.edit(item, charge)}
            />
          );
        })}
      </CardGroup>

      {/* A footer action ("Add product") only closes the list, as in the other concepts. */}
      <ProductSelectList {...cards.list} products={PRODUCT_ITEMS} onAddProduct={noop} />
      {product != null && (
        <ProductLineForm
          {...cards.formProps}
          job={job}
          product={product}
          line={cards.editing?.product}
          onSubmit={(line) => cards.commit(product.name, { product: line, productId: product.id })}
          hasSubtypes={hasSubtypes}
        />
      )}
      {cards.deletePrompt}
    </>
  );
}
